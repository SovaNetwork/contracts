// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RedemptionQueue.sol";
import "../src/TokenWhitelist.sol";
import "./mocks/MockSovaBTC.sol";
import "./mocks/MockERC20BTC.sol";

/**
 * @title Task4SimpleRedemptionQueueTest
 * @notice Simple tests for Task 4: Redemption Queue System core functionality
 * @dev Tests redemption queue without wrapper dependencies
 */
contract Task4SimpleRedemptionQueueTest is Test {
    RedemptionQueue public redemptionQueue;
    TokenWhitelist public tokenWhitelist;
    MockSovaBTC public sovaBTC;
    MockERC20BTC public wbtc;

    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public custodian = address(0x3);

    uint256 constant DEFAULT_REDEMPTION_DELAY = 10 days;

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
        vm.startPrank(owner);

        // Deploy contracts
        sovaBTC = new MockSovaBTC();
        tokenWhitelist = new TokenWhitelist();
        redemptionQueue = new RedemptionQueue(address(sovaBTC), address(tokenWhitelist), DEFAULT_REDEMPTION_DELAY);

        // Deploy test token
        wbtc = new MockERC20BTC("Wrapped Bitcoin", "WBTC", 8);

        // Setup whitelist
        tokenWhitelist.addAllowedToken(address(wbtc));

        // Set custodian
        redemptionQueue.setCustodian(custodian, true);

        // Set redemption queue as burner so it can burn tokens for redemptions
        sovaBTC.setBurner(address(redemptionQueue), true);

        // Give user1 some SovaBTC (owner is still a minter)
        sovaBTC.adminMint(user1, 10 * 1e8); // 10 BTC worth

        // Give redemption queue some WBTC reserves
        wbtc.mint(address(redemptionQueue), 5 * 1e8); // 5 WBTC reserves

        vm.stopPrank();
    }

    // ============ Core Functionality Tests ============

    function test_BasicSetup() public {
        assertEq(address(redemptionQueue.sovaBTC()), address(sovaBTC));
        assertEq(address(redemptionQueue.tokenWhitelist()), address(tokenWhitelist));
        assertEq(redemptionQueue.redemptionDelay(), DEFAULT_REDEMPTION_DELAY);
        assertTrue(redemptionQueue.custodians(custodian));
        assertEq(sovaBTC.balanceOf(user1), 10 * 1e8);
        assertEq(wbtc.balanceOf(address(redemptionQueue)), 5 * 1e8);
    }

    function test_QueueRedemption_Success() public {
        uint256 redeemAmount = 1 * 1e8; // 1 BTC
        uint256 initialSovaBalance = sovaBTC.balanceOf(user1);

        vm.startPrank(user1);

        // Approve redemption queue to burn SovaBTC
        sovaBTC.approve(address(redemptionQueue), redeemAmount);

        // Expect event
        vm.expectEmit(true, true, true, true);
        emit RedemptionQueued(user1, address(wbtc), redeemAmount, redeemAmount, block.timestamp);

        // Queue redemption
        redemptionQueue.redeem(address(wbtc), redeemAmount);

        vm.stopPrank();

        // Verify SovaBTC was burned immediately
        assertEq(sovaBTC.balanceOf(user1), initialSovaBalance - redeemAmount);

        // Verify redemption request
        RedemptionQueue.RedemptionRequest memory request = redemptionQueue.getRedemptionRequest(user1);
        assertEq(request.user, user1);
        assertEq(request.token, address(wbtc));
        assertEq(request.sovaAmount, redeemAmount);
        assertEq(request.underlyingAmount, redeemAmount);
        assertEq(request.requestTime, block.timestamp);
        assertFalse(request.fulfilled);
    }

    function test_FulfillRedemption_SuccessAfterDelay() public {
        uint256 redeemAmount = 1 * 1e8;

        // Queue redemption
        vm.startPrank(user1);
        sovaBTC.approve(address(redemptionQueue), redeemAmount);
        redemptionQueue.redeem(address(wbtc), redeemAmount);
        vm.stopPrank();

        // Try to fulfill immediately - should fail
        vm.prank(custodian);
        vm.expectRevert(
            abi.encodeWithSelector(
                RedemptionQueue.RedemptionNotReady.selector, block.timestamp, block.timestamp + DEFAULT_REDEMPTION_DELAY
            )
        );
        redemptionQueue.fulfillRedemption(user1);

        // Fast forward time
        vm.warp(block.timestamp + DEFAULT_REDEMPTION_DELAY + 1);

        uint256 initialWbtcBalance = wbtc.balanceOf(user1);

        // Now fulfill should work
        vm.prank(custodian);
        vm.expectEmit(true, true, true, true);
        emit RedemptionCompleted(user1, address(wbtc), redeemAmount, redeemAmount, custodian);

        redemptionQueue.fulfillRedemption(user1);

        // Verify token transfer
        assertEq(wbtc.balanceOf(user1), initialWbtcBalance + redeemAmount);

        // Verify request marked as fulfilled
        assertTrue(redemptionQueue.getRedemptionRequest(user1).fulfilled);
    }

    function test_InsufficientReserve() public {
        uint256 excessiveAmount = 10 * 1e8; // More than 5 WBTC reserves

        vm.startPrank(user1);
        sovaBTC.approve(address(redemptionQueue), excessiveAmount);

        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.InsufficientReserve.selector, excessiveAmount, 5 * 1e8));
        redemptionQueue.redeem(address(wbtc), excessiveAmount);

        vm.stopPrank();
    }

    function test_OnlyAuthorizedCustodian() public {
        uint256 redeemAmount = 1 * 1e8;

        // Queue redemption
        vm.startPrank(user1);
        sovaBTC.approve(address(redemptionQueue), redeemAmount);
        redemptionQueue.redeem(address(wbtc), redeemAmount);
        vm.stopPrank();

        // Fast forward time
        vm.warp(block.timestamp + DEFAULT_REDEMPTION_DELAY + 1);

        // Non-custodian should fail
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.UnauthorizedCustodian.selector, user1));
        redemptionQueue.fulfillRedemption(user1);

        // Owner should work
        vm.prank(owner);
        redemptionQueue.fulfillRedemption(user1);
    }

    function test_ViewFunctions() public {
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

    function test_AdminFunctions() public {
        // Test delay update
        vm.prank(owner);
        redemptionQueue.setRedemptionDelay(5 days);
        assertEq(redemptionQueue.redemptionDelay(), 5 days);

        // Test custodian management
        address newCustodian = address(0x99);
        vm.prank(owner);
        redemptionQueue.setCustodian(newCustodian, true);
        assertTrue(redemptionQueue.custodians(newCustodian));

        // Test reserve check
        assertEq(redemptionQueue.getAvailableReserve(address(wbtc)), 5 * 1e8);
    }

    function test_ErrorConditions() public {
        vm.startPrank(user1);

        // Zero amount
        vm.expectRevert(RedemptionQueue.ZeroAmount.selector);
        redemptionQueue.redeem(address(wbtc), 0);

        // Token not allowed
        MockERC20BTC randomToken = new MockERC20BTC("Random", "RND", 8);
        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.TokenNotAllowed.selector, address(randomToken)));
        redemptionQueue.redeem(address(randomToken), 1 * 1e8);

        vm.stopPrank();
    }

    function test_PauseFunctionality() public {
        // Pause contract
        vm.prank(owner);
        redemptionQueue.pause();

        // Redemption should fail
        vm.startPrank(user1);
        sovaBTC.approve(address(redemptionQueue), 1 * 1e8);
        vm.expectRevert(RedemptionQueue.ContractPaused.selector);
        redemptionQueue.redeem(address(wbtc), 1 * 1e8);
        vm.stopPrank();

        // Unpause
        vm.prank(owner);
        redemptionQueue.unpause();

        // Should work again
        vm.startPrank(user1);
        redemptionQueue.redeem(address(wbtc), 1 * 1e8);
        vm.stopPrank();
    }
}
