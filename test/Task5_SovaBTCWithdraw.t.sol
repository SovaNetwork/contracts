// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SovaBTCSova.sol";
import "../src/lib/SovaBitcoin.sol";

/**
 * @title Task5_SovaBTCWithdraw
 * @notice Comprehensive tests for SovaBTCSova contract Bitcoin withdrawal functionality
 */
contract Task5_SovaBTCWithdrawTest is Test {
    
    SovaBTCSova public sovaBTCSova;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public lzEndpoint = address(0x999); // Mock LayerZero endpoint
    
    // Bitcoin constants
    uint64 public constant MIN_WITHDRAW = 10_000; // 0.0001 BTC
    uint64 public constant MAX_WITHDRAW = 100_000_000_000; // 1000 BTC
    uint64 public constant MAX_GAS_LIMIT = 50_000_000; // 0.5 BTC
    
    // Test values
    uint64 public constant WITHDRAW_AMOUNT = 100_000; // 0.001 BTC
    uint64 public constant GAS_LIMIT = 1_000; // 0.00001 BTC
    uint64 public constant BTC_BLOCK_HEIGHT = 800_000;
    string public constant DESTINATION = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
    
    bytes32 public constant MOCK_TXID = keccak256("mock_bitcoin_txid");
    
    /* ----------------------- EVENTS ----------------------- */
    
    event Withdraw(bytes32 indexed txid, address indexed user, uint256 amount, string destination);
    event PendingWithdrawalCreated(address indexed user, uint256 amount);
    event PendingWithdrawalFinalized(address indexed user, uint256 amount);
    event MinWithdrawAmountUpdated(uint64 oldAmount, uint64 newAmount);
    event MaxWithdrawAmountUpdated(uint64 oldAmount, uint64 newAmount);
    event MaxGasLimitAmountUpdated(uint64 oldAmount, uint64 newAmount);
    
    /* ----------------------- SETUP ----------------------- */
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy SovaBTCSova contract
        sovaBTCSova = new SovaBTCSova(lzEndpoint, owner);
        
        // Mock the Bitcoin precompile to return a txid for any call
        vm.mockCall(
            SovaBitcoin.BTC_PRECOMPILE,
            abi.encodePacked(SovaBitcoin.UBTC_SIGN_TX_BYTES),
            abi.encode(MOCK_TXID)
        );
        
        // Mint tokens to users for testing
        sovaBTCSova.adminMint(user1, 10_000_000); // 0.1 BTC
        sovaBTCSova.adminMint(user2, 5_000_000);  // 0.05 BTC
        
        vm.stopPrank();
    }
    
    /* ----------------------- BASIC FUNCTIONALITY TESTS ----------------------- */
    
    function test_Constructor() public {
        assertEq(sovaBTCSova.minWithdrawAmount(), MIN_WITHDRAW);
        assertEq(sovaBTCSova.maxWithdrawAmount(), MAX_WITHDRAW);
        assertEq(sovaBTCSova.maxGasLimitAmount(), MAX_GAS_LIMIT);
        assertEq(sovaBTCSova.owner(), owner);
        assertFalse(sovaBTCSova.withdrawalsPaused());
    }
    
    function test_WithdrawSuccess() public {
        vm.startPrank(user1);
        
        uint256 initialBalance = sovaBTCSova.balanceOf(user1);
        uint256 totalRequired = WITHDRAW_AMOUNT + GAS_LIMIT;
        
        // Expect events
        vm.expectEmit(true, true, false, true);
        emit PendingWithdrawalCreated(user1, totalRequired);
        
        vm.expectEmit(true, true, false, true);
        emit Withdraw(MOCK_TXID, user1, WITHDRAW_AMOUNT, DESTINATION);
        
        // Execute withdrawal
        sovaBTCSova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, BTC_BLOCK_HEIGHT, DESTINATION);
        
        // Check pending withdrawal state
        (uint256 pendingAmount, uint256 timestamp, bool exists) = sovaBTCSova.getPendingWithdrawal(user1);
        assertEq(pendingAmount, totalRequired);
        assertEq(timestamp, block.timestamp);
        assertTrue(exists);
        
        // Balance should remain unchanged until finalization
        assertEq(sovaBTCSova.balanceOf(user1), initialBalance);
        
        vm.stopPrank();
    }
    
    function test_FinalizeWithdrawal() public {
        vm.startPrank(user1);
        
        uint256 initialBalance = sovaBTCSova.balanceOf(user1);
        uint256 totalRequired = WITHDRAW_AMOUNT + GAS_LIMIT;
        
        // Create withdrawal
        sovaBTCSova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, BTC_BLOCK_HEIGHT, DESTINATION);
        
        // Finalize withdrawal
        vm.expectEmit(true, true, false, true);
        emit PendingWithdrawalFinalized(user1, totalRequired);
        
        sovaBTCSova.finalize();
        
        // Check state after finalization
        assertEq(sovaBTCSova.balanceOf(user1), initialBalance - totalRequired);
        
        (uint256 pendingAmount, , bool exists) = sovaBTCSova.getPendingWithdrawal(user1);
        assertEq(pendingAmount, 0);
        assertFalse(exists);
        
        vm.stopPrank();
    }
    
    /* ----------------------- VALIDATION TESTS ----------------------- */
    
    function test_WithdrawZeroAmountReverts() public {
        vm.startPrank(user1);
        
        vm.expectRevert(); // ZeroAmount error from parent contract
        sovaBTCSova.withdraw(0, GAS_LIMIT, BTC_BLOCK_HEIGHT, DESTINATION);
        
        vm.stopPrank();
    }
    
    function test_WithdrawZeroGasLimitReverts() public {
        vm.startPrank(user1);
        
        vm.expectRevert(SovaBTCSova.ZeroGasLimit.selector);
        sovaBTCSova.withdraw(WITHDRAW_AMOUNT, 0, BTC_BLOCK_HEIGHT, DESTINATION);
        
        vm.stopPrank();
    }
    
    function test_WithdrawGasLimitTooHighReverts() public {
        vm.startPrank(user1);
        
        vm.expectRevert(SovaBTCSova.GasLimitTooHigh.selector);
        sovaBTCSova.withdraw(WITHDRAW_AMOUNT, MAX_GAS_LIMIT + 1, BTC_BLOCK_HEIGHT, DESTINATION);
        
        vm.stopPrank();
    }
    
    function test_WithdrawEmptyDestinationReverts() public {
        vm.startPrank(user1);
        
        vm.expectRevert(SovaBTCSova.EmptyDestination.selector);
        sovaBTCSova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, BTC_BLOCK_HEIGHT, "");
        
        vm.stopPrank();
    }
    
    function test_WithdrawBelowMinimumReverts() public {
        vm.startPrank(user1);
        
        vm.expectRevert(SovaBTCSova.WithdrawBelowMinimum.selector);
        sovaBTCSova.withdraw(MIN_WITHDRAW - 1, GAS_LIMIT, BTC_BLOCK_HEIGHT, DESTINATION);
        
        vm.stopPrank();
    }
    
    function test_WithdrawAboveMaximumReverts() public {
        vm.startPrank(owner);
        
        // Mint enough tokens for max withdrawal test
        sovaBTCSova.adminMint(user1, MAX_WITHDRAW + GAS_LIMIT);
        
        vm.stopPrank();
        vm.startPrank(user1);
        
        vm.expectRevert(SovaBTCSova.WithdrawAboveMaximum.selector);
        sovaBTCSova.withdraw(MAX_WITHDRAW + 1, GAS_LIMIT, BTC_BLOCK_HEIGHT, DESTINATION);
        
        vm.stopPrank();
    }
    
    function test_WithdrawInsufficientBalanceReverts() public {
        vm.startPrank(user1);
        
        uint256 balance = sovaBTCSova.balanceOf(user1);
        
        vm.expectRevert(SovaBTCSova.InsufficientAmount.selector);
        sovaBTCSova.withdraw(uint64(balance), GAS_LIMIT, BTC_BLOCK_HEIGHT, DESTINATION);
        
        vm.stopPrank();
    }
    
    function test_WithdrawWithPendingReverts() public {
        vm.startPrank(user1);
        
        // Create first withdrawal
        sovaBTCSova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, BTC_BLOCK_HEIGHT, DESTINATION);
        
        // Try to create second withdrawal
        vm.expectRevert(SovaBTCSova.PendingWithdrawalExists.selector);
        sovaBTCSova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, BTC_BLOCK_HEIGHT, DESTINATION);
        
        vm.stopPrank();
    }
    
    /* ----------------------- PAUSE FUNCTIONALITY TESTS ----------------------- */
    
    function test_PauseWithdrawals() public {
        vm.startPrank(owner);
        
        assertFalse(sovaBTCSova.withdrawalsPaused());
        
        sovaBTCSova.pause();
        assertTrue(sovaBTCSova.withdrawalsPaused());
        
        vm.stopPrank();
    }
    
    function test_WithdrawWhenPausedReverts() public {
        vm.startPrank(owner);
        sovaBTCSova.pause();
        vm.stopPrank();
        
        vm.startPrank(user1);
        
        vm.expectRevert(); // Should revert with pause error
        sovaBTCSova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, BTC_BLOCK_HEIGHT, DESTINATION);
        
        vm.stopPrank();
    }
    
    function test_UnpauseWithdrawals() public {
        vm.startPrank(owner);
        
        sovaBTCSova.pause();
        assertTrue(sovaBTCSova.withdrawalsPaused());
        
        sovaBTCSova.unpause();
        assertFalse(sovaBTCSova.withdrawalsPaused());
        
        vm.stopPrank();
    }
    
    /* ----------------------- ADMIN FUNCTION TESTS ----------------------- */
    
    function test_SetMinWithdrawAmount() public {
        vm.startPrank(owner);
        
        uint64 newAmount = 20_000;
        
        vm.expectEmit(true, true, false, true);
        emit MinWithdrawAmountUpdated(MIN_WITHDRAW, newAmount);
        
        sovaBTCSova.setMinWithdrawAmount(newAmount);
        assertEq(sovaBTCSova.minWithdrawAmount(), newAmount);
        
        vm.stopPrank();
    }
    
    function test_SetMinWithdrawAmountInvalidReverts() public {
        vm.startPrank(owner);
        
        vm.expectRevert(SovaBTCSova.InvalidWithdrawLimits.selector);
        sovaBTCSova.setMinWithdrawAmount(MAX_WITHDRAW);
        
        vm.stopPrank();
    }
    
    function test_SetMaxWithdrawAmount() public {
        vm.startPrank(owner);
        
        uint64 newAmount = 200_000_000_000;
        
        vm.expectEmit(true, true, false, true);
        emit MaxWithdrawAmountUpdated(MAX_WITHDRAW, newAmount);
        
        sovaBTCSova.setMaxWithdrawAmount(newAmount);
        assertEq(sovaBTCSova.maxWithdrawAmount(), newAmount);
        
        vm.stopPrank();
    }
    
    function test_SetMaxWithdrawAmountInvalidReverts() public {
        vm.startPrank(owner);
        
        vm.expectRevert(SovaBTCSova.InvalidWithdrawLimits.selector);
        sovaBTCSova.setMaxWithdrawAmount(MIN_WITHDRAW);
        
        vm.stopPrank();
    }
    
    function test_SetMaxGasLimitAmount() public {
        vm.startPrank(owner);
        
        uint64 newAmount = 100_000_000;
        
        vm.expectEmit(true, true, false, true);
        emit MaxGasLimitAmountUpdated(MAX_GAS_LIMIT, newAmount);
        
        sovaBTCSova.setMaxGasLimitAmount(newAmount);
        assertEq(sovaBTCSova.maxGasLimitAmount(), newAmount);
        
        vm.stopPrank();
    }
    
    function test_SetMaxGasLimitAmountZeroReverts() public {
        vm.startPrank(owner);
        
        vm.expectRevert(); // ZeroAmount error from parent contract
        sovaBTCSova.setMaxGasLimitAmount(0);
        
        vm.stopPrank();
    }
    
    /* ----------------------- ACCESS CONTROL TESTS ----------------------- */
    
    function test_OnlyOwnerCanSetLimits() public {
        vm.startPrank(user1);
        
        vm.expectRevert(); // Should revert with Ownable error
        sovaBTCSova.setMinWithdrawAmount(20_000);
        
        vm.expectRevert(); // Should revert with Ownable error
        sovaBTCSova.setMaxWithdrawAmount(200_000_000_000);
        
        vm.expectRevert(); // Should revert with Ownable error
        sovaBTCSova.setMaxGasLimitAmount(100_000_000);
        
        vm.stopPrank();
    }
    
    function test_OnlyOwnerCanPause() public {
        vm.startPrank(user1);
        
        vm.expectRevert(); // Should revert with Ownable error
        sovaBTCSova.pause();
        
        vm.expectRevert(); // Should revert with Ownable error
        sovaBTCSova.unpause();
        
        vm.stopPrank();
    }
    
    /* ----------------------- TRANSFER RESTRICTION TESTS ----------------------- */
    
    function test_TransferWithPendingWithdrawalReverts() public {
        vm.startPrank(user1);
        
        // Create pending withdrawal
        sovaBTCSova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, BTC_BLOCK_HEIGHT, DESTINATION);
        
        // Try to transfer - should revert
        vm.expectRevert(SovaBTCSova.PendingWithdrawalExists.selector);
        sovaBTCSova.transfer(user2, 1000);
        
        vm.stopPrank();
    }
    
    function test_TransferFromWithPendingWithdrawalReverts() public {
        vm.startPrank(user1);
        
        // Approve user2 to spend
        sovaBTCSova.approve(user2, 1000);
        
        // Create pending withdrawal
        sovaBTCSova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, BTC_BLOCK_HEIGHT, DESTINATION);
        
        vm.stopPrank();
        vm.startPrank(user2);
        
        // Try to transferFrom - should revert
        vm.expectRevert(SovaBTCSova.PendingWithdrawalExists.selector);
        sovaBTCSova.transferFrom(user1, user2, 1000);
        
        vm.stopPrank();
    }
    
    function test_TransferAfterFinalizationWorks() public {
        vm.startPrank(user1);
        
        uint256 initialBalance = sovaBTCSova.balanceOf(user1);
        
        // Create and finalize withdrawal
        sovaBTCSova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, BTC_BLOCK_HEIGHT, DESTINATION);
        sovaBTCSova.finalize();
        
        // Transfer should work now
        sovaBTCSova.transfer(user2, 1000);
        assertEq(sovaBTCSova.balanceOf(user1), initialBalance - (WITHDRAW_AMOUNT + GAS_LIMIT) - 1000);
        assertEq(sovaBTCSova.balanceOf(user2), 5_000_000 + 1000);
        
        vm.stopPrank();
    }
    
    /* ----------------------- INTEGRATION TESTS ----------------------- */
    
    function test_MultipleUsersWithdrawals() public {
        // User1 withdrawal
        vm.startPrank(user1);
        sovaBTCSova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, BTC_BLOCK_HEIGHT, DESTINATION);
        vm.stopPrank();
        
        // User2 withdrawal (should work independently)
        vm.startPrank(user2);
        sovaBTCSova.withdraw(50_000, 500, BTC_BLOCK_HEIGHT, DESTINATION);
        vm.stopPrank();
        
        // Check both pending withdrawals exist
        (uint256 pending1, , bool exists1) = sovaBTCSova.getPendingWithdrawal(user1);
        (uint256 pending2, , bool exists2) = sovaBTCSova.getPendingWithdrawal(user2);
        
        assertTrue(exists1);
        assertTrue(exists2);
        assertEq(pending1, WITHDRAW_AMOUNT + GAS_LIMIT);
        assertEq(pending2, 50_000 + 500);
    }
    
    function test_FinalizeOtherUserWithdrawal() public {
        vm.startPrank(user1);
        sovaBTCSova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, BTC_BLOCK_HEIGHT, DESTINATION);
        vm.stopPrank();
        
        uint256 initialBalance = sovaBTCSova.balanceOf(user1);
        
        // User2 can finalize user1's withdrawal
        vm.startPrank(user2);
        sovaBTCSova.finalizeWithdrawal(user1);
        vm.stopPrank();
        
        // Check user1's balance decreased
        assertEq(sovaBTCSova.balanceOf(user1), initialBalance - (WITHDRAW_AMOUNT + GAS_LIMIT));
        
        // Check pending withdrawal is cleared
        (, , bool exists) = sovaBTCSova.getPendingWithdrawal(user1);
        assertFalse(exists);
    }
    
    /* ----------------------- EDGE CASE TESTS ----------------------- */
    
    function test_FinalizeNonExistentWithdrawal() public {
        vm.startPrank(user1);
        
        // Should not revert, just do nothing
        sovaBTCSova.finalize();
        sovaBTCSova.finalizeWithdrawal(user2);
        
        vm.stopPrank();
    }
    
    function test_GetPendingWithdrawalForNonExistentUser() public {
        (uint256 amount, uint256 timestamp, bool exists) = sovaBTCSova.getPendingWithdrawal(user1);
        
        assertEq(amount, 0);
        assertEq(timestamp, 0);
        assertFalse(exists);
    }
    
    function test_WithdrawExactBalance() public {
        vm.startPrank(user1);
        
        uint256 balance = sovaBTCSova.balanceOf(user1);
        uint64 withdrawAmount = uint64(balance - GAS_LIMIT);
        
        // Should work exactly
        sovaBTCSova.withdraw(withdrawAmount, GAS_LIMIT, BTC_BLOCK_HEIGHT, DESTINATION);
        
        vm.stopPrank();
    }
} 