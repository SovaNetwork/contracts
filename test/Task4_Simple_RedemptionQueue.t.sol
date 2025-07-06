// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RedemptionQueue.sol";
import "../src/TokenWhitelist.sol";
import "./mocks/MockSovaBTC.sol";
import "./mocks/MockERC20BTC.sol";

/**
 * @title Task4SimpleRedemptionQueueTest
 * @notice Simple tests for Task 4: Multi-Redemption Queue System core functionality
 * @dev Tests redemption queue with multiple concurrent redemptions per user
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
        uint256 indexed redemptionId,
        address indexed user, 
        address indexed token, 
        uint256 sovaAmount, 
        uint256 underlyingAmount, 
        uint256 requestTime
    );

    event RedemptionCompleted(
        uint256 indexed redemptionId,
        address indexed user,
        address indexed token,
        uint256 sovaAmount,
        uint256 underlyingAmount,
        address custodian
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
        assertEq(redemptionQueue.getRedemptionCount(), 0);
        assertEq(redemptionQueue.nextRedemptionId(), 1);
    }

    function test_QueueRedemption_Success() public {
        uint256 redeemAmount = 1 * 1e8; // 1 BTC
        uint256 initialSovaBalance = sovaBTC.balanceOf(user1);

        vm.startPrank(user1);

        // Approve redemption queue to burn SovaBTC
        sovaBTC.approve(address(redemptionQueue), redeemAmount);

        // Expect event with redemption ID 1
        vm.expectEmit(true, true, true, true);
        emit RedemptionQueued(1, user1, address(wbtc), redeemAmount, redeemAmount, block.timestamp);

        // Queue redemption - should return redemption ID 1
        uint256 redemptionId = redemptionQueue.redeem(address(wbtc), redeemAmount);
        assertEq(redemptionId, 1);

        vm.stopPrank();

        // Verify SovaBTC was burned immediately
        assertEq(sovaBTC.balanceOf(user1), initialSovaBalance - redeemAmount);

        // Verify redemption request
        RedemptionQueue.RedemptionRequest memory request = redemptionQueue.getRedemptionRequest(redemptionId);
        assertEq(request.id, redemptionId);
        assertEq(request.user, user1);
        assertEq(request.token, address(wbtc));
        assertEq(request.sovaAmount, redeemAmount);
        assertEq(request.underlyingAmount, redeemAmount);
        assertEq(request.requestTime, block.timestamp);
        assertFalse(request.fulfilled);

        // Verify user redemption tracking
        uint256[] memory userRedemptions = redemptionQueue.getUserRedemptions(user1);
        assertEq(userRedemptions.length, 1);
        assertEq(userRedemptions[0], redemptionId);

        // Verify counters
        assertEq(redemptionQueue.getRedemptionCount(), 1);
        assertEq(redemptionQueue.getUserRedemptionCount(user1), 1);
        assertEq(redemptionQueue.nextRedemptionId(), 2);
    }

    function test_MultipleRedemptions_SameUser() public {
        uint256 redeemAmount1 = 1 * 1e8; // 1 BTC
        uint256 redeemAmount2 = 2 * 1e8; // 2 BTC
        uint256 initialSovaBalance = sovaBTC.balanceOf(user1);

        vm.startPrank(user1);

        // Approve for both redemptions
        sovaBTC.approve(address(redemptionQueue), redeemAmount1 + redeemAmount2);

        // First redemption
        uint256 redemptionId1 = redemptionQueue.redeem(address(wbtc), redeemAmount1);
        assertEq(redemptionId1, 1);

        // Second redemption (this would have failed in old system)
        uint256 redemptionId2 = redemptionQueue.redeem(address(wbtc), redeemAmount2);
        assertEq(redemptionId2, 2);

        vm.stopPrank();

        // Verify both redemptions exist
        assertEq(redemptionQueue.getRedemptionCount(), 2);
        assertEq(redemptionQueue.getUserRedemptionCount(user1), 2);

        // Verify user has both redemption IDs
        uint256[] memory userRedemptions = redemptionQueue.getUserRedemptions(user1);
        assertEq(userRedemptions.length, 2);
        assertEq(userRedemptions[0], redemptionId1);
        assertEq(userRedemptions[1], redemptionId2);

        // Verify all SovaBTC was burned
        assertEq(sovaBTC.balanceOf(user1), initialSovaBalance - (redeemAmount1 + redeemAmount2));

        // Verify pending redemptions
        RedemptionQueue.RedemptionRequest[] memory pendingRedemptions = redemptionQueue.getPendingRedemptions(user1);
        assertEq(pendingRedemptions.length, 2);
        assertEq(pendingRedemptions[0].id, redemptionId1);
        assertEq(pendingRedemptions[1].id, redemptionId2);
    }

    function test_FulfillRedemption_SuccessAfterDelay() public {
        uint256 redeemAmount = 1 * 1e8;

        // Queue redemption
        vm.startPrank(user1);
        sovaBTC.approve(address(redemptionQueue), redeemAmount);
        uint256 redemptionId = redemptionQueue.redeem(address(wbtc), redeemAmount);
        vm.stopPrank();

        // Try to fulfill immediately - should fail
        vm.prank(custodian);
        vm.expectRevert(
            abi.encodeWithSelector(
                RedemptionQueue.RedemptionNotReady.selector, block.timestamp, block.timestamp + DEFAULT_REDEMPTION_DELAY
            )
        );
        redemptionQueue.fulfillRedemption(redemptionId);

        // Fast forward time
        vm.warp(block.timestamp + DEFAULT_REDEMPTION_DELAY + 1);

        uint256 initialWbtcBalance = wbtc.balanceOf(user1);

        // Now fulfill should work
        vm.prank(custodian);
        vm.expectEmit(true, true, true, true);
        emit RedemptionCompleted(redemptionId, user1, address(wbtc), redeemAmount, redeemAmount, custodian);

        redemptionQueue.fulfillRedemption(redemptionId);

        // Verify token transfer
        assertEq(wbtc.balanceOf(user1), initialWbtcBalance + redeemAmount);

        // Verify request marked as fulfilled
        assertTrue(redemptionQueue.getRedemptionRequest(redemptionId).fulfilled);

        // Verify pending redemptions updated
        RedemptionQueue.RedemptionRequest[] memory pendingRedemptions = redemptionQueue.getPendingRedemptions(user1);
        assertEq(pendingRedemptions.length, 0);
    }

    function test_FulfillMultipleRedemptions() public {
        uint256 redeemAmount1 = 1 * 1e8;
        uint256 redeemAmount2 = 1 * 1e8;

        // Queue two redemptions
        vm.startPrank(user1);
        sovaBTC.approve(address(redemptionQueue), redeemAmount1 + redeemAmount2);
        uint256 redemptionId1 = redemptionQueue.redeem(address(wbtc), redeemAmount1);
        uint256 redemptionId2 = redemptionQueue.redeem(address(wbtc), redeemAmount2);
        vm.stopPrank();

        // Fast forward time
        vm.warp(block.timestamp + DEFAULT_REDEMPTION_DELAY + 1);

        uint256 initialWbtcBalance = wbtc.balanceOf(user1);

        // Fulfill first redemption
        vm.prank(custodian);
        redemptionQueue.fulfillRedemption(redemptionId1);

        // Verify partial fulfillment
        assertEq(wbtc.balanceOf(user1), initialWbtcBalance + redeemAmount1);
        assertTrue(redemptionQueue.getRedemptionRequest(redemptionId1).fulfilled);
        assertFalse(redemptionQueue.getRedemptionRequest(redemptionId2).fulfilled);

        // Check pending redemptions
        RedemptionQueue.RedemptionRequest[] memory pendingRedemptions = redemptionQueue.getPendingRedemptions(user1);
        assertEq(pendingRedemptions.length, 1);
        assertEq(pendingRedemptions[0].id, redemptionId2);

        // Fulfill second redemption
        vm.prank(custodian);
        redemptionQueue.fulfillRedemption(redemptionId2);

        // Verify full fulfillment
        assertEq(wbtc.balanceOf(user1), initialWbtcBalance + redeemAmount1 + redeemAmount2);
        assertTrue(redemptionQueue.getRedemptionRequest(redemptionId2).fulfilled);

        // No pending redemptions
        pendingRedemptions = redemptionQueue.getPendingRedemptions(user1);
        assertEq(pendingRedemptions.length, 0);
    }

    function test_BatchFulfillRedemptions() public {
        uint256 redeemAmount = 1 * 1e8;

        // Queue three redemptions
        vm.startPrank(user1);
        sovaBTC.approve(address(redemptionQueue), redeemAmount * 3);
        uint256 redemptionId1 = redemptionQueue.redeem(address(wbtc), redeemAmount);
        uint256 redemptionId2 = redemptionQueue.redeem(address(wbtc), redeemAmount);
        uint256 redemptionId3 = redemptionQueue.redeem(address(wbtc), redeemAmount);
        vm.stopPrank();

        // Fast forward time
        vm.warp(block.timestamp + DEFAULT_REDEMPTION_DELAY + 1);

        uint256 initialWbtcBalance = wbtc.balanceOf(user1);

        // Batch fulfill all three
        uint256[] memory redemptionIds = new uint256[](3);
        redemptionIds[0] = redemptionId1;
        redemptionIds[1] = redemptionId2;
        redemptionIds[2] = redemptionId3;

        vm.prank(custodian);
        redemptionQueue.batchFulfillRedemptions(redemptionIds);

        // Verify all fulfilled
        assertEq(wbtc.balanceOf(user1), initialWbtcBalance + (redeemAmount * 3));
        assertTrue(redemptionQueue.getRedemptionRequest(redemptionId1).fulfilled);
        assertTrue(redemptionQueue.getRedemptionRequest(redemptionId2).fulfilled);
        assertTrue(redemptionQueue.getRedemptionRequest(redemptionId3).fulfilled);

        // No pending redemptions
        RedemptionQueue.RedemptionRequest[] memory pendingRedemptions = redemptionQueue.getPendingRedemptions(user1);
        assertEq(pendingRedemptions.length, 0);
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
        uint256 redemptionId = redemptionQueue.redeem(address(wbtc), redeemAmount);
        vm.stopPrank();

        // Fast forward time
        vm.warp(block.timestamp + DEFAULT_REDEMPTION_DELAY + 1);

        // Non-custodian should fail
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.UnauthorizedCustodian.selector, user1));
        redemptionQueue.fulfillRedemption(redemptionId);

        // Owner should work
        vm.prank(owner);
        redemptionQueue.fulfillRedemption(redemptionId);
    }

    function test_ViewFunctions() public {
        uint256 redeemAmount = 1 * 1e8;

        // Queue redemption
        vm.startPrank(user1);
        sovaBTC.approve(address(redemptionQueue), redeemAmount);
        uint256 redemptionId = redemptionQueue.redeem(address(wbtc), redeemAmount);
        vm.stopPrank();

        // Should not be ready yet
        assertFalse(redemptionQueue.isRedemptionReady(redemptionId));
        assertEq(redemptionQueue.getRedemptionReadyTime(redemptionId), block.timestamp + DEFAULT_REDEMPTION_DELAY);

        // Fast forward time
        vm.warp(block.timestamp + DEFAULT_REDEMPTION_DELAY + 1);

        // Should be ready now
        assertTrue(redemptionQueue.isRedemptionReady(redemptionId));

        // Test user redemption details
        RedemptionQueue.RedemptionRequest[] memory userRedemptionDetails = redemptionQueue.getUserRedemptionDetails(user1);
        assertEq(userRedemptionDetails.length, 1);
        assertEq(userRedemptionDetails[0].id, redemptionId);
        assertEq(userRedemptionDetails[0].user, user1);
        assertEq(userRedemptionDetails[0].sovaAmount, redeemAmount);
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

        // Invalid redemption ID
        vm.prank(custodian);
        vm.expectRevert(abi.encodeWithSelector(RedemptionQueue.InvalidRedemptionId.selector, 999));
        redemptionQueue.fulfillRedemption(999);
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
        uint256 redemptionId = redemptionQueue.redeem(address(wbtc), 1 * 1e8);
        assertEq(redemptionId, 1);
        vm.stopPrank();
    }
}
