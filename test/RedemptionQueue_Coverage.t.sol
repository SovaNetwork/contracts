// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RedemptionQueue.sol";
import "../src/TokenWhitelist.sol";
import "../src/CustodyManager.sol";
import "./mocks/MockSovaBTC.sol";
import "./mocks/MockERC20BTC.sol";

/**
 * @title TestRedemptionQueueExtended
 * @notice Extended contract to test internal functions directly for 100% coverage
 */
contract TestRedemptionQueueExtended is RedemptionQueue {
    constructor(address _sovaBTC, address _tokenWhitelist, uint256 _redemptionDelay)
        RedemptionQueue(_sovaBTC, _tokenWhitelist, _redemptionDelay)
    {}

    /**
     * @notice Public wrapper to test the internal _calculateUnderlyingAmount function
     */
    function testCalculateUnderlyingAmount(uint256 sovaAmount, uint8 tokenDecimals) public pure returns (uint256) {
        return _calculateUnderlyingAmount(sovaAmount, tokenDecimals);
    }
}

/**
 * @title RedemptionQueueCoverageTest
 * @notice Comprehensive test suite to achieve 100% coverage for RedemptionQueue contract
 */
contract RedemptionQueueCoverageTest is Test {
    RedemptionQueue public redemptionQueue;
    TestRedemptionQueueExtended public testQueue;
    TokenWhitelist public whitelist;
    CustodyManager public custodyManager;
    MockSovaBTC public sovaBTC;
    MockERC20BTC public wbtc;
    MockERC20BTC public usdc;

    address public admin = address(0x1);
    address public custodian = address(0x2);
    address public user1 = address(0x3);
    address public user2 = address(0x4);

    bytes32 public constant CUSTODIAN_ROLE = keccak256("CUSTODIAN_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    bytes32 public constant CUSTODY_ADMIN_ROLE = keccak256("CUSTODY_ADMIN_ROLE");

    function setUp() public {
        vm.startPrank(admin);

        // Deploy components
        sovaBTC = new MockSovaBTC();
        whitelist = new TokenWhitelist();
        custodyManager = new CustodyManager(admin);

        // Deploy RedemptionQueue
        redemptionQueue = new RedemptionQueue(address(sovaBTC), address(whitelist), 10 days);

        // Deploy test extended queue
        testQueue = new TestRedemptionQueueExtended(address(sovaBTC), address(whitelist), 10 days);

        // Deploy tokens
        wbtc = new MockERC20BTC("Wrapped Bitcoin", "WBTC", 8);
        usdc = new MockERC20BTC("USD Coin", "USDC", 6);

        // Setup whitelist
        whitelist.addAllowedToken(address(wbtc));
        whitelist.addAllowedToken(address(usdc));

        // Setup redemption queue
        redemptionQueue.setCustodian(custodian, true);
        testQueue.setCustodian(custodian, true);

        // Setup SovaBTC minter/burner roles - admin deployed MockSovaBTC so admin is owner
        sovaBTC.setMinter(address(redemptionQueue), true);
        sovaBTC.setBurner(address(redemptionQueue), true);
        sovaBTC.setMinter(address(testQueue), true);
        sovaBTC.setBurner(address(testQueue), true);

        vm.stopPrank();

        // Fund redemption queue with tokens
        deal(address(wbtc), address(redemptionQueue), 100 * 10 ** 8); // 100 WBTC
        deal(address(usdc), address(redemptionQueue), 100000 * 10 ** 6); // 100k USDC
        deal(address(wbtc), address(testQueue), 100 * 10 ** 8); // 100 WBTC
        deal(address(usdc), address(testQueue), 100000 * 10 ** 6); // 100k USDC

        // Fund users with SovaBTC using proper minting
        sovaBTC.testMint(user1, 10 * 10 ** 8); // 10 SovaBTC
        sovaBTC.testMint(user2, 10 * 10 ** 8); // 10 SovaBTC
    }

    // ============ Constructor Tests ============

    function test_Constructor_Success() public {
        assertEq(address(redemptionQueue.sovaBTC()), address(sovaBTC));
        assertEq(address(redemptionQueue.tokenWhitelist()), address(whitelist));
        assertEq(redemptionQueue.redemptionDelay(), 10 days);
        assertFalse(redemptionQueue.isPaused());
    }

    function test_Constructor_ZeroSovaBTC() public {
        vm.expectRevert(RedemptionQueue.ZeroAddress.selector);
        new RedemptionQueue(address(0), address(whitelist), 10 days);
    }

    function test_Constructor_ZeroWhitelist() public {
        vm.expectRevert(RedemptionQueue.ZeroAddress.selector);
        new RedemptionQueue(address(sovaBTC), address(0), 10 days);
    }

    function test_Constructor_InvalidDelay() public {
        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.InvalidRedemptionDelay.selector, 30 minutes));
        new RedemptionQueue(
            address(sovaBTC),
            address(whitelist),
            30 minutes // Too short
        );
    }

    // ============ Redeem Function Tests ============

    function test_Redeem_Success() public {
        uint256 sovaBalanceBefore = sovaBTC.balanceOf(user1);

        vm.prank(user1);
        redemptionQueue.redeem(address(wbtc), 1000000);

        // Check SovaBTC was burned
        assertEq(sovaBTC.balanceOf(user1), sovaBalanceBefore - 1000000);

        // Check redemption request was created
        RedemptionQueue.RedemptionRequest memory request = redemptionQueue.getRedemptionRequest(user1);
        assertEq(request.user, user1);
        assertEq(request.token, address(wbtc));
        assertEq(request.sovaAmount, 1000000);
        assertEq(request.underlyingAmount, 1000000); // 8 decimal token
        assertTrue(request.requestTime > 0);
        assertFalse(request.fulfilled);
    }

    function test_Redeem_ZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert(RedemptionQueue.ZeroAmount.selector);
        redemptionQueue.redeem(address(wbtc), 0);
    }

    function test_Redeem_TokenNotAllowed() public {
        MockERC20BTC unknownToken = new MockERC20BTC("Unknown", "UNK", 18);

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.TokenNotAllowed.selector, address(unknownToken)));
        redemptionQueue.redeem(address(unknownToken), 1000000);
    }

    function test_Redeem_ExistingPendingRedemption() public {
        vm.prank(user1);
        redemptionQueue.redeem(address(wbtc), 1000000);

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.ExistingPendingRedemption.selector, user1));
        redemptionQueue.redeem(address(wbtc), 500000);
    }

    function test_Redeem_InsufficientReserve() public {
        // Simulate draining reserves by setting token balance to zero
        address tokenAddress = address(wbtc);
        address queueAddress = address(redemptionQueue);

        // MockERC20BTC balances mapping is at slot 4 (after name, symbol, _decimals, totalSupply)
        // For mappings: keccak256(abi.encode(key, baseSlot))
        bytes32 balanceSlot = keccak256(abi.encode(queueAddress, uint256(4)));
        vm.store(tokenAddress, balanceSlot, bytes32(uint256(0)));

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.InsufficientReserve.selector, 1000000, 0));
        redemptionQueue.redeem(address(wbtc), 1000000);
    }

    function test_Redeem_DecimalConversion_6Decimals() public {
        vm.prank(user1);
        redemptionQueue.redeem(address(usdc), 1000000); // 0.01 BTC in SovaBTC

        RedemptionQueue.RedemptionRequest memory request = redemptionQueue.getRedemptionRequest(user1);
        assertEq(request.sovaAmount, 1000000);
        assertEq(request.underlyingAmount, 10000); // 100x less for 6 decimal token
    }

    function test_Redeem_DecimalConversion_18Decimals() public {
        // Create 18 decimal token
        MockERC20BTC token18 = new MockERC20BTC("Token18", "TK18", 18);
        deal(address(token18), address(redemptionQueue), 1000 ether);

        vm.prank(admin);
        whitelist.addAllowedToken(address(token18));

        vm.prank(user1);
        redemptionQueue.redeem(address(token18), 1000000); // 0.01 BTC in SovaBTC

        RedemptionQueue.RedemptionRequest memory request = redemptionQueue.getRedemptionRequest(user1);
        assertEq(request.sovaAmount, 1000000);
        assertEq(request.underlyingAmount, 10000000000000000); // 10^10 more for 18 decimal token
    }

    // ============ Fulfill Redemption Tests ============

    function test_FulfillRedemption_Success() public {
        vm.prank(user1);
        redemptionQueue.redeem(address(wbtc), 1000000);

        vm.warp(block.timestamp + 11 days);

        uint256 userBalanceBefore = wbtc.balanceOf(user1);

        vm.prank(custodian);
        redemptionQueue.fulfillRedemption(user1);

        // Check tokens transferred to user
        assertEq(wbtc.balanceOf(user1), userBalanceBefore + 1000000);

        // Check redemption marked as fulfilled
        RedemptionQueue.RedemptionRequest memory request = redemptionQueue.getRedemptionRequest(user1);
        assertTrue(request.fulfilled);
    }

    function test_FulfillRedemption_NoRequest() public {
        vm.prank(custodian);
        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.NoRedemptionRequest.selector, user1));
        redemptionQueue.fulfillRedemption(user1);
    }

    function test_FulfillRedemption_AlreadyFulfilled() public {
        vm.prank(user1);
        redemptionQueue.redeem(address(wbtc), 1000000);

        vm.warp(block.timestamp + 11 days);

        vm.prank(custodian);
        redemptionQueue.fulfillRedemption(user1);

        vm.prank(custodian);
        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.RedemptionAlreadyFulfilled.selector, user1));
        redemptionQueue.fulfillRedemption(user1);
    }

    function test_FulfillRedemption_NotReady() public {
        vm.prank(user1);
        redemptionQueue.redeem(address(wbtc), 1000000);

        // Don't wait for delay

        vm.prank(custodian);
        vm.expectRevert(); // Complex error with timestamps, just check it reverts
        redemptionQueue.fulfillRedemption(user1);
    }

    function test_FulfillRedemption_InsufficientBalance() public {
        vm.prank(user1);
        redemptionQueue.redeem(address(wbtc), 1000000);

        // Simulate draining reserves by reducing the token balance to zero
        // Use vm.store to directly manipulate the balance slot in the token
        address tokenAddress = address(wbtc);
        address queueAddress = address(redemptionQueue);

        // MockERC20BTC balances mapping is at slot 4 (after name, symbol, _decimals, totalSupply)
        // For mappings: keccak256(abi.encode(key, baseSlot))
        bytes32 balanceSlot = keccak256(abi.encode(queueAddress, uint256(4)));
        vm.store(tokenAddress, balanceSlot, bytes32(uint256(0)));

        vm.warp(block.timestamp + 11 days);

        vm.prank(custodian);
        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.InsufficientReserve.selector, 1000000, 0));
        redemptionQueue.fulfillRedemption(user1);
    }

    // ============ Batch Fulfill Tests ============

    function test_BatchFulfillRedemptions_Success() public {
        // Create multiple redemptions
        vm.prank(user1);
        redemptionQueue.redeem(address(wbtc), 1000000);

        vm.prank(user2);
        redemptionQueue.redeem(address(usdc), 500000);

        vm.warp(block.timestamp + 11 days);

        address[] memory users = new address[](2);
        users[0] = user1;
        users[1] = user2;

        vm.prank(custodian);
        redemptionQueue.batchFulfillRedemptions(users);

        // Check both fulfilled
        assertTrue(redemptionQueue.getRedemptionRequest(user1).fulfilled);
        assertTrue(redemptionQueue.getRedemptionRequest(user2).fulfilled);
    }

    function test_BatchFulfillRedemptions_EmptyArray() public {
        address[] memory users = new address[](0);

        vm.prank(custodian);
        redemptionQueue.batchFulfillRedemptions(users);
        // Should not revert with empty array
    }

    // ============ View Function Tests ============

    function test_GetRedemptionRequest_NoRequest() public {
        RedemptionQueue.RedemptionRequest memory request = redemptionQueue.getRedemptionRequest(user1);
        assertEq(request.user, address(0));
        assertEq(request.token, address(0));
        assertEq(request.sovaAmount, 0);
    }

    function test_IsRedemptionReady_NoRequest() public {
        assertFalse(redemptionQueue.isRedemptionReady(user1));
    }

    function test_IsRedemptionReady_NotReady() public {
        vm.prank(user1);
        redemptionQueue.redeem(address(wbtc), 1000000);

        assertFalse(redemptionQueue.isRedemptionReady(user1));
    }

    function test_IsRedemptionReady_Ready() public {
        vm.prank(user1);
        redemptionQueue.redeem(address(wbtc), 1000000);

        vm.warp(block.timestamp + 11 days);

        assertTrue(redemptionQueue.isRedemptionReady(user1));
    }

    function test_GetRedemptionReadyTime_NoRequest() public {
        assertEq(redemptionQueue.getRedemptionReadyTime(user1), 0);
    }

    function test_GetRedemptionReadyTime_WithRequest() public {
        vm.prank(user1);
        redemptionQueue.redeem(address(wbtc), 1000000);

        RedemptionQueue.RedemptionRequest memory request = redemptionQueue.getRedemptionRequest(user1);
        uint256 expectedTime = request.requestTime + redemptionQueue.redemptionDelay();

        assertEq(redemptionQueue.getRedemptionReadyTime(user1), expectedTime);
    }

    function test_GetAvailableReserve() public {
        uint256 reserve = redemptionQueue.getAvailableReserve(address(wbtc));
        assertEq(reserve, wbtc.balanceOf(address(redemptionQueue)));
    }

    // ============ Admin Function Tests ============

    function test_SetRedemptionDelay_Success() public {
        vm.prank(admin);
        redemptionQueue.setRedemptionDelay(7 days);

        assertEq(redemptionQueue.redemptionDelay(), 7 days);
    }

    function test_SetRedemptionDelay_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        redemptionQueue.setRedemptionDelay(7 days);
    }

    function test_SetRedemptionDelay_ZeroDelay() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.InvalidRedemptionDelay.selector, 0));
        redemptionQueue.setRedemptionDelay(0);
    }

    function test_SetCustodian_Success() public {
        address newCustodian = address(0x999);

        vm.prank(admin);
        redemptionQueue.setCustodian(newCustodian, true);

        assertTrue(redemptionQueue.custodians(newCustodian));
    }

    function test_SetCustodian_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        redemptionQueue.setCustodian(address(0x999), true);
    }

    function test_SetCustodian_ZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(RedemptionQueue.ZeroAddress.selector);
        redemptionQueue.setCustodian(address(0), true);
    }

    // ============ Emergency Function Tests ============

    function test_EmergencyWithdraw_Success() public {
        uint256 amount = wbtc.balanceOf(address(redemptionQueue)) / 2;

        vm.prank(admin);
        redemptionQueue.emergencyWithdraw(address(wbtc), amount, admin);

        assertEq(wbtc.balanceOf(admin), amount);
    }

    function test_EmergencyWithdraw_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        redemptionQueue.emergencyWithdraw(address(wbtc), 1000, user1);
    }

    function test_EmergencyWithdraw_ZeroToken() public {
        vm.prank(admin);
        vm.expectRevert(RedemptionQueue.ZeroAddress.selector);
        redemptionQueue.emergencyWithdraw(address(0), 1000, admin);
    }

    function test_EmergencyWithdraw_ZeroTo() public {
        vm.prank(admin);
        vm.expectRevert(RedemptionQueue.ZeroAddress.selector);
        redemptionQueue.emergencyWithdraw(address(wbtc), 1000, address(0));
    }

    function test_EmergencyWithdraw_ZeroAmount() public {
        vm.prank(admin);
        vm.expectRevert(RedemptionQueue.ZeroAmount.selector);
        redemptionQueue.emergencyWithdraw(address(wbtc), 0, admin);
    }

    // ============ Pause Function Tests ============

    function test_Pause_Success() public {
        vm.prank(admin);
        redemptionQueue.pause();

        assertTrue(redemptionQueue.isPaused());
    }

    function test_Pause_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        redemptionQueue.pause();
    }

    function test_Pause_AlreadyPaused() public {
        vm.prank(admin);
        redemptionQueue.pause();

        vm.prank(admin);
        vm.expectRevert(RedemptionQueue.ContractPaused.selector);
        redemptionQueue.pause();
    }

    function test_Unpause_Success() public {
        vm.prank(admin);
        redemptionQueue.pause();

        vm.prank(admin);
        redemptionQueue.unpause();

        assertFalse(redemptionQueue.isPaused());
    }

    function test_Unpause_OnlyOwner() public {
        vm.prank(admin);
        redemptionQueue.pause();

        vm.prank(user1);
        vm.expectRevert();
        redemptionQueue.unpause();
    }

    function test_Unpause_NotPaused() public {
        vm.prank(admin);
        vm.expectRevert("Contract not paused");
        redemptionQueue.unpause();
    }

    // ============ Internal Function Coverage ============

    function test_CalculateUnderlyingAmount_Coverage() public {
        // This tests the internal _calculateUnderlyingAmount function through redeem

        // Test with different decimal tokens
        vm.prank(user1);
        redemptionQueue.redeem(address(wbtc), 1000000); // 8 decimals

        vm.prank(user2);
        redemptionQueue.redeem(address(usdc), 1000000); // 6 decimals

        RedemptionQueue.RedemptionRequest memory request1 = redemptionQueue.getRedemptionRequest(user1);
        RedemptionQueue.RedemptionRequest memory request2 = redemptionQueue.getRedemptionRequest(user2);

        // WBTC: 8 decimals, so 1:1 ratio
        assertEq(request1.underlyingAmount, 1000000);

        // USDC: 6 decimals, so divide by 100
        assertEq(request2.underlyingAmount, 10000);
    }

    // ============ Missing Function Coverage Tests ============

    function test_Internal_CalculateUnderlyingAmount_Direct() public {
        // Test the internal function directly using our extended contract

        // Test 8 decimals (1:1)
        uint256 result8 = testQueue.testCalculateUnderlyingAmount(1000000, 8);
        assertEq(result8, 1000000);

        // Test 6 decimals (divide by 100)
        uint256 result6 = testQueue.testCalculateUnderlyingAmount(1000000, 6);
        assertEq(result6, 10000);

        // Test 18 decimals (multiply by 10^10)
        uint256 result18 = testQueue.testCalculateUnderlyingAmount(1000000, 18);
        assertEq(result18, 10000000000000000);

        // Test edge case with 0 decimals
        uint256 result0 = testQueue.testCalculateUnderlyingAmount(100000000, 0); // Use 1 BTC = 10^8 satoshis
        assertEq(result0, 1); // Divided by 10^8, so 10^8 / 10^8 = 1

        // Test edge case with very high decimals
        uint256 result30 = testQueue.testCalculateUnderlyingAmount(1, 30);
        assertEq(result30, 10 ** 22); // Multiplied by 10^22
    }

    function test_OnlyCustodian_Success() public {
        // First create a redemption
        vm.prank(user1);
        redemptionQueue.redeem(address(wbtc), 1000000);

        // Wait for delay
        vm.warp(block.timestamp + 11 days);

        // This should work - custodian can fulfill redemption
        vm.prank(custodian);
        redemptionQueue.fulfillRedemption(user1);
    }

    function test_OnlyCustodian_Revert() public {
        vm.prank(user1);
        redemptionQueue.redeem(address(wbtc), 1000000);

        vm.warp(block.timestamp + 11 days);

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.UnauthorizedCustodian.selector, user1));
        redemptionQueue.fulfillRedemption(user1);
    }

    function test_WhenNotPaused_Success() public {
        // Should work when not paused
        vm.prank(user1);
        redemptionQueue.redeem(address(wbtc), 1000000);

        assertEq(redemptionQueue.getRedemptionRequest(user1).sovaAmount, 1000000);
    }

    function test_WhenNotPaused_Revert() public {
        vm.prank(admin);
        redemptionQueue.pause();

        vm.prank(user1);
        vm.expectRevert(RedemptionQueue.ContractPaused.selector);
        redemptionQueue.redeem(address(wbtc), 1000000);
    }

    // ============ Coverage for Missing Branches ============

    function test_RedeemWithDifferentUsers() public {
        // Test multiple users with different scenarios
        vm.prank(user1);
        redemptionQueue.redeem(address(wbtc), 2000000);

        vm.prank(user2);
        redemptionQueue.redeem(address(usdc), 1500000);

        // Both should succeed
        assertTrue(redemptionQueue.getRedemptionRequest(user1).requestTime > 0);
        assertTrue(redemptionQueue.getRedemptionRequest(user2).requestTime > 0);
    }

    function test_MultipleRedemptionsFulfillment() public {
        // Create redemptions
        vm.prank(user1);
        redemptionQueue.redeem(address(wbtc), 1000000);

        vm.prank(user2);
        redemptionQueue.redeem(address(usdc), 500000);

        vm.warp(block.timestamp + 11 days);

        // Fulfill individually
        vm.prank(custodian);
        redemptionQueue.fulfillRedemption(user1);

        vm.prank(custodian);
        redemptionQueue.fulfillRedemption(user2);

        assertTrue(redemptionQueue.getRedemptionRequest(user1).fulfilled);
        assertTrue(redemptionQueue.getRedemptionRequest(user2).fulfilled);
    }

    function test_EdgeCaseAmounts() public {
        // Test with minimum amounts
        vm.prank(user1);
        redemptionQueue.redeem(address(wbtc), 1);

        assertEq(redemptionQueue.getRedemptionRequest(user1).sovaAmount, 1);
    }

    function test_IsPausedFunction() public {
        assertFalse(redemptionQueue.isPaused());

        vm.prank(admin);
        redemptionQueue.pause();

        assertTrue(redemptionQueue.isPaused());

        vm.prank(admin);
        redemptionQueue.unpause();

        assertFalse(redemptionQueue.isPaused());
    }

    // ============ Integration Tests ============

    function test_FullRedemptionFlow() public {
        // Complete flow: redeem -> wait -> fulfill
        uint256 redeemAmount = 2000000;

        // Initial balances
        uint256 sovaBalanceBefore = sovaBTC.balanceOf(user1);
        uint256 wbtcBalanceBefore = wbtc.balanceOf(user1);

        // Create redemption
        vm.prank(user1);
        redemptionQueue.redeem(address(wbtc), redeemAmount);

        // Check SovaBTC burned immediately
        assertEq(sovaBTC.balanceOf(user1), sovaBalanceBefore - redeemAmount);

        // Check redemption not ready yet
        assertFalse(redemptionQueue.isRedemptionReady(user1));

        // Wait for delay
        vm.warp(block.timestamp + 11 days);

        // Check redemption now ready
        assertTrue(redemptionQueue.isRedemptionReady(user1));

        // Fulfill redemption
        vm.prank(custodian);
        redemptionQueue.fulfillRedemption(user1);

        // Check WBTC received
        assertEq(wbtc.balanceOf(user1), wbtcBalanceBefore + redeemAmount);

        // Check redemption marked as fulfilled
        assertTrue(redemptionQueue.getRedemptionRequest(user1).fulfilled);
    }

    function test_MultiTokenRedemptions() public {
        // Test redemptions with different tokens
        vm.prank(user1);
        redemptionQueue.redeem(address(wbtc), 1000000);

        vm.prank(user2);
        redemptionQueue.redeem(address(usdc), 1000000);

        vm.warp(block.timestamp + 11 days);

        // Fulfill both
        vm.prank(custodian);
        redemptionQueue.fulfillRedemption(user1);

        vm.prank(custodian);
        redemptionQueue.fulfillRedemption(user2);

        // Check different amounts based on decimals
        assertEq(wbtc.balanceOf(user1), 1000000); // 1:1 for 8 decimals
        assertEq(usdc.balanceOf(user2), 10000); // 1:100 for 6 decimals
    }
}
