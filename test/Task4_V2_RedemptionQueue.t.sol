// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RedemptionQueue.sol";
import "../src/TokenWhitelist.sol";
import "../src/SovaBTCWrapper.sol";
import "../src/CustodyManager.sol";
import "./mocks/MockSovaBTC.sol";
import "./mocks/MockERC20BTC.sol";

/**
 * @title Task4RedemptionQueueTest
 * @notice Tests for Task 4: Redemption Queue System
 * @dev Demonstrates queued redemption with configurable delays and immediate SovaBTC burning
 */
contract Task4V2RedemptionQueueTest is Test {
    RedemptionQueue public redemptionQueue;
    TokenWhitelist public tokenWhitelist;
    SovaBTCWrapper public wrapper;
    MockSovaBTC public sovaBTC;

    MockERC20BTC public wbtc; // 8 decimals
    MockERC20BTC public usdc; // 6 decimals
    MockERC20BTC public weth; // 18 decimals

    address public admin = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public custodian = address(0x4);
    address public nonCustodian = address(0x5);

    uint256 constant DEFAULT_REDEMPTION_DELAY = 10 days;
    uint256 constant MIN_DEPOSIT_SATS = 10_000; // 0.0001 BTC

    // Events to test
    event RedemptionQueued(
        address indexed user, address indexed token, uint256 sovaAmount, uint256 underlyingAmount, uint256 requestTime
    );

    event RedemptionCompleted(
        address indexed user,
        address indexed token,
        uint256 sovaAmount,
        uint256 underlyingAmount,
        address indexed custodian
    );

    function setUp() public {
        vm.startPrank(admin);

        // Deploy MockSovaBTC
        sovaBTC = new MockSovaBTC();

        // Deploy TokenWhitelist
        tokenWhitelist = new TokenWhitelist();

        // Deploy RedemptionQueue with default 10-day delay
        redemptionQueue = new RedemptionQueue(address(sovaBTC), address(tokenWhitelist), DEFAULT_REDEMPTION_DELAY);

        // Deploy CustodyManager and SovaBTCWrapper
        CustodyManager custodyManager = new CustodyManager(admin);
        wrapper =
            new SovaBTCWrapper(address(sovaBTC), address(tokenWhitelist), address(custodyManager), MIN_DEPOSIT_SATS);

        // Set wrapper as redemption queue in wrapper contract
        wrapper.setRedemptionQueue(address(redemptionQueue));

        // Deploy test tokens
        wbtc = new MockERC20BTC("Wrapped Bitcoin", "WBTC", 8);
        usdc = new MockERC20BTC("USD Coin", "USDC", 6);
        weth = new MockERC20BTC("Wrapped Ether", "WETH", 18);

        // Add tokens to whitelist
        tokenWhitelist.addAllowedToken(address(wbtc));
        tokenWhitelist.addAllowedToken(address(usdc));
        tokenWhitelist.addAllowedToken(address(weth));

        // Set wrapper as minter for sovaBTC
        sovaBTC.setMinter(address(wrapper), true);

        // Set RedemptionQueue as burner for sovaBTC
        sovaBTC.setBurner(address(redemptionQueue), true);

        // Set custodian authorization
        redemptionQueue.setCustodian(custodian, true);

        // Fund users with tokens
        wbtc.mint(user1, 10 * 1e8); // 10 WBTC
        usdc.mint(user1, 10_000 * 1e6); // 10,000 USDC
        weth.mint(user1, 1000 * 1e18); // 1000 WETH

        // Give users some SovaBTC by depositing tokens
        vm.stopPrank();

        // User1 deposits to get SovaBTC
        vm.startPrank(user1);
        wbtc.approve(address(wrapper), 5 * 1e8); // 5 WBTC
        wrapper.deposit(address(wbtc), 5 * 1e8);
        vm.stopPrank();

        vm.startPrank(admin);
        vm.stopPrank();
    }

    // ============ Basic Setup Tests ============

    function test_RedemptionQueue_BasicSetup() public {
        assertEq(address(redemptionQueue.sovaBTC()), address(sovaBTC));
        assertEq(address(redemptionQueue.tokenWhitelist()), address(tokenWhitelist));
        assertEq(redemptionQueue.redemptionDelay(), DEFAULT_REDEMPTION_DELAY);
        assertEq(redemptionQueue.DEFAULT_REDEMPTION_DELAY(), 10 days);
        assertEq(redemptionQueue.MIN_REDEMPTION_DELAY(), 1 hours);
        assertEq(redemptionQueue.MAX_REDEMPTION_DELAY(), 30 days);
    }

    function test_RedemptionQueue_CustodianSetup() public {
        assertTrue(redemptionQueue.custodians(custodian));
        assertFalse(redemptionQueue.custodians(nonCustodian));
    }

    function test_RedemptionQueue_InitialBalances() public {
        // User1 should have SovaBTC from deposit
        assertEq(sovaBTC.balanceOf(user1), 5 * 1e8); // 5 BTC worth

        // RedemptionQueue should have WBTC reserves from wrapper deposit
        assertEq(wbtc.balanceOf(address(redemptionQueue)), 5 * 1e8);
    }

    // ============ Redemption Request Tests ============

    function test_QueueRedemption_BasicFlow() public {
        uint256 redeemAmount = 1 * 1e8; // 1 BTC
        uint256 initialSovaBalance = sovaBTC.balanceOf(user1);

        vm.startPrank(user1);

        // First approve the RedemptionQueue to burn SovaBTC
        sovaBTC.approve(address(redemptionQueue), redeemAmount);

        // Expect RedemptionQueued event
        vm.expectEmit(true, true, true, true);
        emit RedemptionQueued(user1, address(wbtc), redeemAmount, redeemAmount, block.timestamp);

        // Queue redemption directly through RedemptionQueue
        redemptionQueue.redeem(address(wbtc), redeemAmount);

        vm.stopPrank();

        // Verify SovaBTC was burned immediately
        assertEq(sovaBTC.balanceOf(user1), initialSovaBalance - redeemAmount);

        // Verify redemption request was created
        RedemptionQueue.RedemptionRequest memory request = redemptionQueue.getRedemptionRequest(user1);
        assertEq(request.user, user1);
        assertEq(request.token, address(wbtc));
        assertEq(request.sovaAmount, redeemAmount);
        assertEq(request.underlyingAmount, redeemAmount); // 1:1 for 8-decimal tokens
        assertEq(request.requestTime, block.timestamp);
        assertFalse(request.fulfilled);
    }

    function test_QueueRedemption_DecimalConversion() public {
        uint256 sovaAmount = 1 * 1e8; // 1 BTC in satoshis

        vm.startPrank(user1);

        // For USDC (6 decimals): 1 BTC = 1 * 1e6 USDC
        usdc.approve(address(wrapper), 1000 * 1e6);
        wrapper.deposit(address(usdc), 1000 * 1e6); // Deposit USDC to get SovaBTC

        sovaBTC.approve(address(redemptionQueue), sovaAmount);
        redemptionQueue.redeem(address(usdc), sovaAmount);

        vm.stopPrank();

        RedemptionQueue.RedemptionRequest memory request = redemptionQueue.getRedemptionRequest(user1);

        // Should convert 1 BTC (1e8 satoshis) to 1e6 USDC units
        assertEq(request.underlyingAmount, 1 * 1e6);
    }

    function test_QueueRedemption_InsufficientReserve() public {
        uint256 excessiveAmount = 10 * 1e8; // More than available reserves

        vm.startPrank(user1);

        // Give user more SovaBTC
        vm.stopPrank();
        vm.prank(address(wrapper));
        sovaBTC.adminMint(user1, excessiveAmount);
        vm.startPrank(user1);

        sovaBTC.approve(address(redemptionQueue), excessiveAmount);

        vm.expectRevert(
            abi.encodeWithSelector(
                RedemptionQueue.InsufficientReserve.selector, excessiveAmount, wbtc.balanceOf(address(redemptionQueue))
            )
        );
        redemptionQueue.redeem(address(wbtc), excessiveAmount);

        vm.stopPrank();
    }

    function test_QueueRedemption_ExistingPendingRedemption() public {
        uint256 redeemAmount = 1 * 1e8;

        vm.startPrank(user1);

        // First redemption
        sovaBTC.approve(address(redemptionQueue), redeemAmount);
        redemptionQueue.redeem(address(wbtc), redeemAmount);

        // Second redemption should fail
        sovaBTC.approve(address(redemptionQueue), redeemAmount);
        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.ExistingPendingRedemption.selector, user1));
        redemptionQueue.redeem(address(wbtc), redeemAmount);

        vm.stopPrank();
    }

    // ============ Redemption Fulfillment Tests ============

    function test_FulfillRedemption_SuccessAfterDelay() public {
        uint256 redeemAmount = 1 * 1e8;

        // Queue redemption
        vm.startPrank(user1);
        sovaBTC.approve(address(redemptionQueue), redeemAmount);
        redemptionQueue.redeem(address(wbtc), redeemAmount);
        vm.stopPrank();

        // Try to fulfill before delay - should fail
        vm.prank(custodian);
        vm.expectRevert(
            abi.encodeWithSelector(
                RedemptionQueue.RedemptionNotReady.selector, block.timestamp, block.timestamp + DEFAULT_REDEMPTION_DELAY
            )
        );
        redemptionQueue.fulfillRedemption(user1);

        // Fast forward time
        vm.warp(block.timestamp + DEFAULT_REDEMPTION_DELAY + 1);

        uint256 initialTokenBalance = wbtc.balanceOf(user1);

        // Now fulfill should work
        vm.prank(custodian);

        vm.expectEmit(true, true, true, true);
        emit RedemptionCompleted(user1, address(wbtc), redeemAmount, redeemAmount, custodian);

        redemptionQueue.fulfillRedemption(user1);

        // Verify token transfer
        assertEq(wbtc.balanceOf(user1), initialTokenBalance + redeemAmount);

        // Verify request marked as fulfilled
        RedemptionQueue.RedemptionRequest memory request = redemptionQueue.getRedemptionRequest(user1);
        assertTrue(request.fulfilled);
    }

    function test_FulfillRedemption_OnlyAuthorizedCustodian() public {
        uint256 redeemAmount = 1 * 1e8;

        // Queue redemption
        vm.startPrank(user1);
        sovaBTC.approve(address(redemptionQueue), redeemAmount);
        redemptionQueue.redeem(address(wbtc), redeemAmount);
        vm.stopPrank();

        // Fast forward time
        vm.warp(block.timestamp + DEFAULT_REDEMPTION_DELAY + 1);

        // Non-custodian should fail
        vm.prank(nonCustodian);
        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.UnauthorizedCustodian.selector, nonCustodian));
        redemptionQueue.fulfillRedemption(user1);

        // Admin should work (admin is also authorized)
        vm.prank(admin);
        redemptionQueue.fulfillRedemption(user1);
    }

    function test_FulfillRedemption_AlreadyFulfilled() public {
        uint256 redeemAmount = 1 * 1e8;

        // Queue and fulfill redemption
        vm.startPrank(user1);
        sovaBTC.approve(address(redemptionQueue), redeemAmount);
        redemptionQueue.redeem(address(wbtc), redeemAmount);
        vm.stopPrank();

        vm.warp(block.timestamp + DEFAULT_REDEMPTION_DELAY + 1);

        vm.prank(custodian);
        redemptionQueue.fulfillRedemption(user1);

        // Try to fulfill again
        vm.prank(custodian);
        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.RedemptionAlreadyFulfilled.selector, user1));
        redemptionQueue.fulfillRedemption(user1);
    }

    // ============ Batch Fulfillment Tests ============

    function test_BatchFulfillRedemptions_Success() public {
        uint256 redeemAmount = 1 * 1e8;

        // Give user2 some SovaBTC
        vm.prank(address(wrapper));
        sovaBTC.adminMint(user2, 2 * 1e8);

        // Queue redemptions for both users
        vm.startPrank(user1);
        sovaBTC.approve(address(redemptionQueue), redeemAmount);
        redemptionQueue.redeem(address(wbtc), redeemAmount);
        vm.stopPrank();

        vm.startPrank(user2);
        sovaBTC.approve(address(redemptionQueue), redeemAmount);
        redemptionQueue.redeem(address(wbtc), redeemAmount);
        vm.stopPrank();

        // Fast forward time
        vm.warp(block.timestamp + DEFAULT_REDEMPTION_DELAY + 1);

        // Batch fulfill
        address[] memory users = new address[](2);
        users[0] = user1;
        users[1] = user2;

        vm.prank(custodian);
        redemptionQueue.batchFulfillRedemptions(users);

        // Verify both redemptions were fulfilled
        assertTrue(redemptionQueue.getRedemptionRequest(user1).fulfilled);
        assertTrue(redemptionQueue.getRedemptionRequest(user2).fulfilled);
    }

    // ============ View Function Tests ============

    function test_ViewFunctions_RedemptionStatus() public {
        uint256 redeemAmount = 1 * 1e8;

        // Initially no redemption
        assertFalse(redemptionQueue.isRedemptionReady(user1));
        assertEq(redemptionQueue.getRedemptionReadyTime(user1), 0);

        // Queue redemption
        vm.startPrank(user1);
        sovaBTC.approve(address(redemptionQueue), redeemAmount);
        redemptionQueue.redeem(address(wbtc), redeemAmount);
        vm.stopPrank();

        // Should not be ready yet
        assertFalse(redemptionQueue.isRedemptionReady(user1));
        assertEq(redemptionQueue.getRedemptionReadyTime(user1), block.timestamp + DEFAULT_REDEMPTION_DELAY);

        // Fast forward time
        vm.warp(block.timestamp + DEFAULT_REDEMPTION_DELAY + 1);

        // Should be ready now
        assertTrue(redemptionQueue.isRedemptionReady(user1));
    }

    function test_ViewFunctions_AvailableReserve() public {
        assertEq(redemptionQueue.getAvailableReserve(address(wbtc)), 5 * 1e8);
        assertEq(redemptionQueue.getAvailableReserve(address(usdc)), 0);
    }

    // ============ Admin Function Tests ============

    function test_SetRedemptionDelay_Success() public {
        uint256 newDelay = 5 days;

        vm.prank(admin);
        vm.expectEmit(true, true, false, false);
        emit RedemptionQueue.RedemptionDelayUpdated(DEFAULT_REDEMPTION_DELAY, newDelay);
        redemptionQueue.setRedemptionDelay(newDelay);

        assertEq(redemptionQueue.redemptionDelay(), newDelay);
    }

    function test_SetRedemptionDelay_InvalidDelay() public {
        vm.prank(admin);

        // Too short
        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.InvalidRedemptionDelay.selector, 30 minutes));
        redemptionQueue.setRedemptionDelay(30 minutes);

        vm.prank(admin);
        // Too long
        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.InvalidRedemptionDelay.selector, 60 days));
        redemptionQueue.setRedemptionDelay(60 days);
    }

    function test_SetCustodian_Success() public {
        address newCustodian = address(0x99);

        vm.prank(admin);
        vm.expectEmit(true, false, false, true);
        emit RedemptionQueue.CustodianUpdated(newCustodian, true);
        redemptionQueue.setCustodian(newCustodian, true);

        assertTrue(redemptionQueue.custodians(newCustodian));

        // Revoke
        vm.prank(admin);
        redemptionQueue.setCustodian(newCustodian, false);
        assertFalse(redemptionQueue.custodians(newCustodian));
    }

    // ============ Emergency Function Tests ============

    function test_EmergencyWithdraw_Success() public {
        uint256 withdrawAmount = 1 * 1e8;
        address emergencyAddress = address(0x99);

        vm.prank(admin);
        vm.expectEmit(true, false, true, true);
        emit RedemptionQueue.EmergencyWithdrawal(address(wbtc), withdrawAmount, emergencyAddress);
        redemptionQueue.emergencyWithdraw(address(wbtc), withdrawAmount, emergencyAddress);

        assertEq(wbtc.balanceOf(emergencyAddress), withdrawAmount);
    }

    // ============ Pause Functionality Tests ============

    function test_Pause_StopsRedemptions() public {
        vm.prank(admin);
        redemptionQueue.pause();

        vm.startPrank(user1);
        sovaBTC.approve(address(redemptionQueue), 1 * 1e8);

        vm.expectRevert(RedemptionQueue.ContractPaused.selector);
        redemptionQueue.redeem(address(wbtc), 1 * 1e8);

        vm.stopPrank();
    }

    // ============ Error Condition Tests ============

    function test_Errors_ZeroAmount() public {
        vm.startPrank(user1);

        vm.expectRevert(RedemptionQueue.ZeroAmount.selector);
        redemptionQueue.redeem(address(wbtc), 0);

        vm.stopPrank();
    }

    function test_Errors_TokenNotAllowed() public {
        address randomToken = address(0x99);

        vm.startPrank(user1);

        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.TokenNotAllowed.selector, randomToken));
        redemptionQueue.redeem(randomToken, 1 * 1e8);

        vm.stopPrank();
    }

    function test_Errors_NoRedemptionRequest() public {
        vm.prank(custodian);
        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.NoRedemptionRequest.selector, user2));
        redemptionQueue.fulfillRedemption(user2);
    }

    // ============ Integration with SovaBTCWrapper Tests ============

    function test_WrapperIntegration_DepositAndRedeem() public {
        // Test complete flow: deposit -> queue redemption -> fulfill
        uint256 depositAmount = 2 * 1e8;
        uint256 redeemAmount = 1 * 1e8;

        // Deposit through wrapper
        vm.startPrank(user2);
        wbtc.mint(user2, depositAmount);
        wbtc.approve(address(wrapper), depositAmount);
        wrapper.deposit(address(wbtc), depositAmount);

        // Verify SovaBTC minted and tokens transferred to redemption queue
        assertEq(sovaBTC.balanceOf(user2), depositAmount);
        assertEq(wbtc.balanceOf(address(redemptionQueue)), 7 * 1e8); // Previous 5 + new 2

        // Queue redemption through redemption queue directly
        sovaBTC.approve(address(redemptionQueue), redeemAmount);
        redemptionQueue.redeem(address(wbtc), redeemAmount);

        vm.stopPrank();

        // Fast forward and fulfill
        vm.warp(block.timestamp + DEFAULT_REDEMPTION_DELAY + 1);

        vm.prank(custodian);
        redemptionQueue.fulfillRedemption(user2);

        // Verify final balances
        assertEq(sovaBTC.balanceOf(user2), depositAmount - redeemAmount);
        assertEq(wbtc.balanceOf(user2), redeemAmount);
    }
}
