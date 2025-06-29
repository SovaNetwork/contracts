// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SovaBTC.sol";
import "../src/lib/SovaBitcoin.sol";
import "./mocks/MockBTCPrecompile.sol";

/**
 * @title SovaBTC Perfect Coverage Tests
 * @notice Targeted tests to achieve 100% coverage for SovaBTC.sol
 * @dev Focuses on the missing precompile failure branch in withdraw function
 */
contract SovaBTCPerfectCoverageTest is Test {
    SovaBTC internal sova;
    MockBTCPrecompile internal precompile;

    address internal owner = makeAddr("owner");
    address internal user = makeAddr("user");

    uint64 internal constant DEPOSIT_AMOUNT = 50_000; // sats
    uint64 internal constant WITHDRAW_AMOUNT = 30_000; // sats
    uint64 internal constant GAS_LIMIT = 10_000; // sats

    // Event definitions matching SovaBTC.sol
    event Withdraw(bytes32 txid, uint256 amount);

    function setUp() public {
        // Deploy contracts
        vm.startPrank(owner);
        sova = new SovaBTC();
        precompile = new MockBTCPrecompile();
        vm.stopPrank();

        // Setup precompile at the expected address
        vm.etch(SovaBitcoin.BTC_PRECOMPILE, address(precompile).code);

        // Give user some tokens for withdrawal testing
        vm.startPrank(owner);
        sova.adminMint(user, 1e8); // 1 BTC worth of tokens
        vm.stopPrank();
    }

    /**
     * @notice Test the missing precompile failure branch in withdraw function
     * @dev This covers the exact gap: `if (!success) revert SovaBitcoin.PrecompileCallFailed();`
     */
    function test_WithdrawPrecompileFailure() public {
        // Configure the mock precompile to fail on the next call (at the etched address)
        MockBTCPrecompile(SovaBitcoin.BTC_PRECOMPILE).setPrecompileFails(true);

        // Verify user has sufficient balance
        uint256 userBalance = sova.balanceOf(user);
        assertGt(userBalance, WITHDRAW_AMOUNT + GAS_LIMIT, "User should have sufficient balance");

        // Verify no pending withdrawal exists
        uint256 pendingAmount = sova.pendingWithdrawalAmountOf(user);
        assertEq(pendingAmount, 0, "Should not have pending withdrawal initially");

        // Attempt withdrawal - this should trigger the precompile failure path
        vm.startPrank(user);
        
        // The call should revert with PrecompileCallFailed
        vm.expectRevert(SovaBitcoin.PrecompileCallFailed.selector);
        sova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, 850000, "bc1qtest12345");

        vm.stopPrank();

        // Verify the failure was handled correctly
        // The pending withdrawal should have been set but then reverted
        pendingAmount = sova.pendingWithdrawalAmountOf(user);
        assertEq(pendingAmount, 0, "Pending withdrawal should remain 0 after revert");

        // Verify user balance is unchanged
        assertEq(sova.balanceOf(user), userBalance, "User balance should remain unchanged after failed withdrawal");
    }

    /**
     * @notice Test that a successful withdrawal still works after fixing the precompile
     * @dev This ensures our test doesn't break the normal flow
     */
    function test_WithdrawSuccessAfterPrecompileFixed() public {
        // First, trigger the failure path (for coverage)
        MockBTCPrecompile(SovaBitcoin.BTC_PRECOMPILE).setPrecompileFails(true);
        
        vm.startPrank(user);
        vm.expectRevert(SovaBitcoin.PrecompileCallFailed.selector);
        sova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, 850000, "bc1qtest12345");
        vm.stopPrank();

        // Now fix the precompile and verify normal operation works
        MockBTCPrecompile(SovaBitcoin.BTC_PRECOMPILE).setPrecompileFails(false);
        
        // The MockBTCPrecompile returns a hardcoded txid for UBTC_SIGN_TX_BYTES
        bytes32 expectedTxid = bytes32(uint256(0xabc123));

        uint256 userBalanceBefore = sova.balanceOf(user);

        // This should succeed
        vm.startPrank(user);
        vm.expectEmit(true, true, true, true);
        emit Withdraw(expectedTxid, WITHDRAW_AMOUNT);
        
        sova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, 850000, "bc1qtest12345");
        vm.stopPrank();

        // Verify withdrawal was processed
        uint256 pendingAmount = sova.pendingWithdrawalAmountOf(user);
        assertEq(pendingAmount, WITHDRAW_AMOUNT + GAS_LIMIT, "Should have pending withdrawal");
        assertEq(sova.balanceOf(user), userBalanceBefore, "Balance should remain same until finalization");
    }

    /**
     * @notice Test edge case: precompile failure with maximum values
     * @dev This ensures our failure path works with edge case parameters
     */
    function test_WithdrawPrecompileFailureEdgeCase() public {
        // Setup maximum withdrawal scenario
        uint64 maxGasLimit = 50_000_000; // Max gas limit from contract
        uint64 largeWithdrawAmount = 10_000_000; // 0.1 BTC

        // Configure precompile to fail
        MockBTCPrecompile(SovaBitcoin.BTC_PRECOMPILE).setPrecompileFails(true);

        vm.startPrank(user);
        
        // Should fail with PrecompileCallFailed, not with other validation errors
        vm.expectRevert(SovaBitcoin.PrecompileCallFailed.selector);
        sova.withdraw(largeWithdrawAmount, maxGasLimit, 850000, "bc1qtest567890abcdef");

        vm.stopPrank();

        // Verify state consistency
        uint256 pendingAmount = sova.pendingWithdrawalAmountOf(user);
        assertEq(pendingAmount, 0, "Should not have pending withdrawal after failure");
    }

    /**
     * @notice Test that the precompile failure branch is specifically covered
     * @dev This test specifically focuses on the exact line that was missing coverage
     */
    function test_ExactPrecompileFailureBranchCoverage() public {
        // This test is designed to hit exactly line 202 in SovaBTC.sol:
        // if (!success) revert SovaBitcoin.PrecompileCallFailed();

        // Setup the failure condition
        MockBTCPrecompile(SovaBitcoin.BTC_PRECOMPILE).setPrecompileFails(true);

        uint256 balanceBefore = sova.balanceOf(user);

        vm.startPrank(user);
        
        // This call will:
        // 1. Pass all validation checks
        // 2. Set pending withdrawal 
        // 3. Call the precompile (which will return success=false)
        // 4. Hit the exact line: if (!success) revert SovaBitcoin.PrecompileCallFailed();
        vm.expectRevert(SovaBitcoin.PrecompileCallFailed.selector);
        sova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, 850000, "bc1qvalidaddress123");
        
        vm.stopPrank();

        // Verify the exact behavior expected from this branch
        assertEq(sova.balanceOf(user), balanceBefore, "Balance should be unchanged after precompile failure");
        
        uint256 amount = sova.pendingWithdrawalAmountOf(user);
        assertEq(amount, 0, "Pending withdrawal should be 0 after revert");
    }

    /**
     * @notice Helper test to ensure our mock precompile is working correctly
     */
    function test_MockPrecompileConfiguration() public {
        // Test that our mock can be configured to fail
        MockBTCPrecompile(SovaBitcoin.BTC_PRECOMPILE).setPrecompileFails(true);
        
        bytes memory testData = abi.encode(
            SovaBitcoin.UBTC_SIGN_TX_BYTES, 
            user, 
            WITHDRAW_AMOUNT, 
            GAS_LIMIT, 
            850000, 
            "bc1qtest"
        );

        (bool success,) = SovaBitcoin.BTC_PRECOMPILE.call(testData);
        assertFalse(success, "Precompile should fail when configured to fail");

        // Test that it can be fixed
        MockBTCPrecompile(SovaBitcoin.BTC_PRECOMPILE).setPrecompileFails(false);
        MockBTCPrecompile(SovaBitcoin.BTC_PRECOMPILE).setMockValue(12345);
        
        (success,) = SovaBitcoin.BTC_PRECOMPILE.call(testData);
        assertTrue(success, "Precompile should succeed when configured to succeed");
    }
} 