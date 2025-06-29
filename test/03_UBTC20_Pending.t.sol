// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SovaBTC.sol";
import "../src/UBTC20.sol";
import "./mocks/MockBTCPrecompile.sol";

/// @title UBTC20 Pending Transactions Tests
/// @notice Comprehensive coverage tests for UBTC20 abstract contract functionality
contract UBTC20PendingTest is Test {
    SovaBTC internal sova;
    MockBTCPrecompile internal precompile;

    address internal user = address(0xFEED);
    address internal spender = address(0xDEAD);
    address internal recipient = address(0xBEEF);

    uint64 internal constant DEPOSIT_AMOUNT = 55_000; // sats
    uint64 internal constant WITHDRAW_AMOUNT = 25_000; // sats

    function setUp() public {
        sova = new SovaBTC();
        precompile = new MockBTCPrecompile();
        precompile.reset();
        
        // Configure the mock to return the expected values for validation
        precompile.setMockValue(DEPOSIT_AMOUNT);
        precompile.setMockAddress("mockDepositAddress");
        
        vm.etch(address(0x999), address(precompile).code);

        // Mint some initial balance so transfers can be attempted
        sova.adminMint(user, 1_000_000);
        sova.adminMint(spender, 500_000);
    }

    // =============================================================================
    // Working Getter Functions Coverage
    // =============================================================================
    
    function test_PendingWithdrawalAmountOfInitial() public {
        // Initially should be 0
        assertEq(sova.pendingWithdrawalAmountOf(user), 0, "Initial pending withdrawal should be 0");
    }
    
    function test_PendingWithdrawalTimestampOf() public {
        // Initially should be 0
        assertEq(sova.pendingWithdrawalTimestampOf(user), 0, "Initial pending withdrawal timestamp should be 0");
        
        // Set up a withdrawal to create pending state
        vm.startPrank(user);
        uint256 timestampBefore = block.timestamp;
        sova.withdraw(WITHDRAW_AMOUNT, 100000, 800000, "bc1qexample");
        vm.stopPrank();
        
        // Should now have pending withdrawal timestamp
        uint256 pendingTimestamp = sova.pendingWithdrawalTimestampOf(user);
        assertGe(pendingTimestamp, timestampBefore, "Should have valid pending withdrawal timestamp");
    }
    
    function test_PendingDepositAmountOfInitial() public {
        // Initially should be 0 - this should work even without deposit functionality
        assertEq(sova.pendingDepositAmountOf(user), 0, "Initial pending deposit should be 0");
    }
    
    function test_PendingDepositTimestampOfInitial() public {
        // Initially should be 0 - this should work even without deposit functionality
        assertEq(sova.pendingDepositTimestampOf(user), 0, "Initial pending deposit timestamp should be 0");
    }

    // =============================================================================
    // Transfer Function Coverage with noPendingTransactions Modifier
    // =============================================================================
    
    function test_TransferSucceedsWithNoPendingTransactions() public {
        // Transfer should work normally when no pending transactions
        vm.startPrank(user);
        bool result = sova.transfer(recipient, 10000);
        assertTrue(result, "Transfer should succeed with no pending transactions");
        assertEq(sova.balanceOf(recipient), 10000, "Recipient should receive tokens");
        vm.stopPrank();
    }
    
    function test_TransferFailsWithPendingWithdrawal() public {
        // Create pending withdrawal
        vm.startPrank(user);
        sova.withdraw(WITHDRAW_AMOUNT, 100000, 800000, "bc1qexample");
        
        // Transfer should fail due to pending withdrawal
        vm.expectRevert(UBTC20.PendingTransactionExists.selector);
        sova.transfer(recipient, 10000);
        vm.stopPrank();
    }

    // =============================================================================
    // TransferFrom Function Coverage with noPendingTransactions Modifier
    // =============================================================================
    
    function test_TransferFromSucceedsWithNoPendingTransactions() public {
        // Set up allowance
        vm.startPrank(user);
        sova.approve(spender, 50000);
        vm.stopPrank();
        
        // TransferFrom should work normally when no pending transactions
        vm.startPrank(spender);
        bool result = sova.transferFrom(user, recipient, 10000);
        assertTrue(result, "TransferFrom should succeed with no pending transactions");
        assertEq(sova.balanceOf(recipient), 10000, "Recipient should receive tokens");
        vm.stopPrank();
    }
    
    function test_TransferFromFailsWithPendingWithdrawal() public {
        // Set up allowance
        vm.startPrank(user);
        sova.approve(spender, 50000);
        sova.withdraw(WITHDRAW_AMOUNT, 100000, 800000, "bc1qexample");
        vm.stopPrank();
        
        // TransferFrom should fail due to pending withdrawal
        vm.startPrank(spender);
        vm.expectRevert(UBTC20.PendingTransactionExists.selector);
        sova.transferFrom(user, recipient, 10000);
        vm.stopPrank();
    }

    // =============================================================================
    // Finalization Logic Coverage (Withdrawal-based)
    // =============================================================================
    
    function test_FinalizePendingWithdrawal() public {
        uint256 initialBalance = sova.balanceOf(user);
        
        // Create pending withdrawal
        vm.startPrank(user);
        sova.withdraw(WITHDRAW_AMOUNT, 100000, 800000, "bc1qexample");
        vm.stopPrank();
        
        // Verify pending state
        assertTrue(sova.pendingWithdrawalAmountOf(user) > 0, "Should have pending withdrawal");
        
        // Finalize should process the withdrawal
        sova.finalize(user);
        
        // Verify finalization
        assertEq(sova.pendingWithdrawalAmountOf(user), 0, "Pending withdrawal should be cleared");
        assertLt(sova.balanceOf(user), initialBalance, "Balance should decrease after withdrawal finalization");
    }
    
    function test_FinalizeWithNoPendingTransactions() public {
        // Finalize should work even when no pending transactions
        uint256 initialBalance = sova.balanceOf(user);
        
        sova.finalize(user);
        
        // Balance should remain unchanged
        assertEq(sova.balanceOf(user), initialBalance, "Balance should remain unchanged");
        assertEq(sova.pendingDepositAmountOf(user), 0, "No pending deposit");
        assertEq(sova.pendingWithdrawalAmountOf(user), 0, "No pending withdrawal");
    }

    // =============================================================================
    // Transfer Success After Finalization
    // =============================================================================
    
    function test_TransferSucceedsAfterFinalizingWithdrawal() public {
        // Create pending withdrawal
        vm.startPrank(user);
        sova.withdraw(WITHDRAW_AMOUNT, 100000, 800000, "bc1qexample");
        
        // Transfer should fail during pending state
        vm.expectRevert(UBTC20.PendingTransactionExists.selector);
        sova.transfer(recipient, 10000);
        vm.stopPrank();
        
        // Finalize the withdrawal
        sova.finalize(user);
        
        // Transfer should now succeed
        vm.startPrank(user);
        bool result = sova.transfer(recipient, 10000);
        assertTrue(result, "Transfer should succeed after finalization");
        assertEq(sova.balanceOf(recipient), 10000, "Recipient should receive tokens");
        vm.stopPrank();
    }
    
    function test_TransferFromSucceedsAfterFinalizingWithdrawal() public {
        // Set up allowance
        vm.startPrank(user);
        sova.approve(spender, 50000);
        sova.withdraw(WITHDRAW_AMOUNT, 100000, 800000, "bc1qexample");
        vm.stopPrank();
        
        // TransferFrom should fail during pending state
        vm.startPrank(spender);
        vm.expectRevert(UBTC20.PendingTransactionExists.selector);
        sova.transferFrom(user, recipient, 10000);
        vm.stopPrank();
        
        // Finalize the withdrawal
        sova.finalize(user);
        
        // TransferFrom should now succeed
        vm.startPrank(spender);
        bool result = sova.transferFrom(user, recipient, 10000);
        assertTrue(result, "TransferFrom should succeed after finalization");
        assertEq(sova.balanceOf(recipient), 10000, "Recipient should receive tokens");
        vm.stopPrank();
    }

    // =============================================================================
    // Edge Cases and Additional Coverage
    // =============================================================================
    
    function test_MultipleUsersIndependentPendingStates() public {
        address user2 = address(0xCAFE);
        sova.adminMint(user2, 500_000);
        
        // User1 creates pending withdrawal
        vm.startPrank(user);
        sova.withdraw(WITHDRAW_AMOUNT, 100000, 800000, "bc1qexample");
        vm.stopPrank();
        
        // User2 should be able to transfer normally
        vm.startPrank(user2);
        bool result = sova.transfer(recipient, 5000);
        assertTrue(result, "User2 should be able to transfer when User1 has pending transaction");
        vm.stopPrank();
        
        // User1 should still be blocked
        vm.startPrank(user);
        vm.expectRevert(UBTC20.PendingTransactionExists.selector);
        sova.transfer(recipient, 1000);
        vm.stopPrank();
    }
    
    function test_PendingStatesPersistAcrossBlocks() public {
        // Create pending withdrawal
        vm.startPrank(user);
        sova.withdraw(WITHDRAW_AMOUNT, 100000, 800000, "bc1qexample");
        vm.stopPrank();
        
        // Mine several blocks
        vm.roll(block.number + 100);
        vm.warp(block.timestamp + 1000);
        
        // Pending state should still exist
        assertTrue(sova.pendingWithdrawalAmountOf(user) > 0, "Pending withdrawal should persist across blocks");
        
        // Transfer should still be blocked
        vm.startPrank(user);
        vm.expectRevert(UBTC20.PendingTransactionExists.selector);
        sova.transfer(recipient, 1000);
        vm.stopPrank();
    }
    
    // =============================================================================
    // Additional Coverage Tests for UBTC20 Specific Functions
    // =============================================================================
    
    function test_PendingWithdrawalAmountOfAfterWithdraw() public {
        uint256 initialPending = sova.pendingWithdrawalAmountOf(user);
        assertEq(initialPending, 0, "Should start with no pending withdrawal");
        
        vm.startPrank(user);
        sova.withdraw(WITHDRAW_AMOUNT, 100000, 800000, "bc1qexample");
        vm.stopPrank();
        
        uint256 finalPending = sova.pendingWithdrawalAmountOf(user);
        assertGt(finalPending, 0, "Should have pending withdrawal after withdraw");
        assertEq(finalPending, WITHDRAW_AMOUNT + 100000, "Pending amount should equal amount + gas");
    }
    
    function test_FinalizeFunctionPublicAccess() public {
        // Test that finalize is publicly accessible
        vm.startPrank(user);
        sova.withdraw(WITHDRAW_AMOUNT, 100000, 800000, "bc1qexample");
        vm.stopPrank();
        
        // Anyone should be able to call finalize for any user
        vm.startPrank(spender);
        sova.finalize(user);
        vm.stopPrank();
        
        assertEq(sova.pendingWithdrawalAmountOf(user), 0, "Pending withdrawal should be cleared");
    }
    
    function test_NoPendingTransactionsModifierBothConditions() public {
        // Test that the modifier checks both deposit AND withdrawal conditions
        // Even though we can't create deposits, we can test the logic path
        
        vm.startPrank(user);
        
        // First, ensure no pending transactions - transfer should work
        bool result1 = sova.transfer(recipient, 1000);
        assertTrue(result1, "Transfer should work with no pending transactions");
        
        // Create pending withdrawal
        sova.withdraw(WITHDRAW_AMOUNT, 100000, 800000, "bc1qexample");
        
        // Now transfer should fail due to pending withdrawal
        vm.expectRevert(UBTC20.PendingTransactionExists.selector);
        sova.transfer(recipient, 1000);
        
        vm.stopPrank();
    }
} 