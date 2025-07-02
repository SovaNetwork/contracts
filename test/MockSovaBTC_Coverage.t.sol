// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "./mocks/MockSovaBTC.sol";

/**
 * @title MockSovaBTCCoverageTest  
 * @notice Comprehensive test suite to achieve 100% coverage for MockSovaBTC contract
 */
contract MockSovaBTCCoverageTest is Test {
    MockSovaBTC public mockSovaBTC;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public minter = address(0x4);
    address public burner = address(0x5);
    
    function setUp() public {
        vm.startPrank(owner);
        mockSovaBTC = new MockSovaBTC();
        vm.stopPrank();
    }

    // ============ Basic ERC20 Function Tests ============

    function test_BasicERC20Functions() public {
        assertEq(mockSovaBTC.name(), "Mock Sova Bitcoin");
        assertEq(mockSovaBTC.symbol(), "mockSovaBTC");
        assertEq(mockSovaBTC.decimals(), 8);
        assertEq(mockSovaBTC.totalSupply(), 0);
        assertEq(mockSovaBTC.balanceOf(user1), 0);
        assertEq(mockSovaBTC.allowance(user1, user2), 0);
    }

    // ============ Minter/Burner Role Management ============

    function test_SetMinter_Success() public {
        vm.prank(owner);
        mockSovaBTC.setMinter(minter, true);
        assertTrue(mockSovaBTC.minters(minter));
        
        vm.prank(owner);
        mockSovaBTC.setMinter(minter, false);
        assertFalse(mockSovaBTC.minters(minter));
    }

    function test_SetMinter_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert("Not owner");
        mockSovaBTC.setMinter(minter, true);
    }

    function test_SetBurner_Success() public {
        vm.prank(owner);
        mockSovaBTC.setBurner(burner, true);
        assertTrue(mockSovaBTC.burners(burner));
        
        vm.prank(owner);
        mockSovaBTC.setBurner(burner, false);
        assertFalse(mockSovaBTC.burners(burner));
    }

    function test_SetBurner_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert("Not owner");
        mockSovaBTC.setBurner(burner, true);
    }

    // ============ Admin Mint/Burn Functions ============

    function test_AdminMint_Success() public {
        uint256 amount = 1000e8;
        
        vm.prank(owner); // Owner is a minter by default
        mockSovaBTC.adminMint(user1, amount);
        
        assertEq(mockSovaBTC.balanceOf(user1), amount);
        assertEq(mockSovaBTC.totalSupply(), amount);
    }

    function test_AdminMint_OnlyMinter() public {
        vm.prank(user1);
        vm.expectRevert("Not authorized minter");
        mockSovaBTC.adminMint(user1, 1000e8);
    }

    function test_AdminMint_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("ERC20: mint to zero address");
        mockSovaBTC.adminMint(address(0), 1000e8);
    }

    function test_AdminBurn_Success() public {
        uint256 amount = 1000e8;
        
        // First mint tokens
        vm.prank(owner);
        mockSovaBTC.adminMint(user1, amount);
        
        // Then burn them
        vm.prank(owner); // Owner is a burner by default
        mockSovaBTC.adminBurn(user1, amount);
        
        assertEq(mockSovaBTC.balanceOf(user1), 0);
        assertEq(mockSovaBTC.totalSupply(), 0);
    }

    function test_AdminBurn_OnlyBurner() public {
        vm.prank(user1);
        vm.expectRevert("Not authorized burner");
        mockSovaBTC.adminBurn(user1, 1000e8);
    }

    function test_AdminBurn_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("ERC20: burn from zero address");
        mockSovaBTC.adminBurn(address(0), 1000e8);
    }

    function test_AdminBurn_InsufficientBalance() public {
        vm.prank(owner);
        vm.expectRevert("ERC20: burn amount exceeds balance");
        mockSovaBTC.adminBurn(user1, 1000e8); // User1 has no tokens
    }

    // ============ Transfer Functions ============

    function test_Transfer_Success() public {
        uint256 amount = 1000e8;
        
        // Mint tokens first
        vm.prank(owner);
        mockSovaBTC.adminMint(user1, amount);
        
        // Transfer tokens
        vm.prank(user1);
        bool success = mockSovaBTC.transfer(user2, amount / 2);
        
        assertTrue(success);
        assertEq(mockSovaBTC.balanceOf(user1), amount / 2);
        assertEq(mockSovaBTC.balanceOf(user2), amount / 2);
    }

    function test_Transfer_FromZeroAddress() public {
        // This will be caught by the internal _transfer function
        vm.prank(address(0));
        vm.expectRevert("ERC20: transfer from zero address");
        mockSovaBTC.transfer(user1, 1000e8);
    }

    function test_Transfer_ToZeroAddress() public {
        uint256 amount = 1000e8;
        
        vm.prank(owner);
        mockSovaBTC.adminMint(user1, amount);
        
        vm.prank(user1);
        vm.expectRevert("ERC20: transfer to zero address");
        mockSovaBTC.transfer(address(0), amount);
    }

    function test_Transfer_InsufficientBalance() public {
        vm.prank(user1);
        vm.expectRevert("ERC20: transfer amount exceeds balance");
        mockSovaBTC.transfer(user2, 1000e8); // User1 has no tokens
    }

    // ============ Approval Functions ============

    function test_Approve_Success() public {
        uint256 amount = 1000e8;
        
        vm.prank(user1);
        bool success = mockSovaBTC.approve(user2, amount);
        
        assertTrue(success);
        assertEq(mockSovaBTC.allowance(user1, user2), amount);
    }

    function test_Approve_ZeroAddressOwner() public {
        vm.prank(address(0));
        vm.expectRevert("ERC20: approve from zero address");
        mockSovaBTC.approve(user1, 1000e8);
    }

    function test_Approve_ZeroAddressSpender() public {
        vm.prank(user1);
        vm.expectRevert("ERC20: approve to zero address");
        mockSovaBTC.approve(address(0), 1000e8);
    }

    // ============ TransferFrom Functions ============

    function test_TransferFrom_Success() public {
        uint256 amount = 1000e8;
        uint256 transferAmount = amount / 2;
        
        // Mint tokens to user1
        vm.prank(owner);
        mockSovaBTC.adminMint(user1, amount);
        
        // User1 approves user2 to spend tokens
        vm.prank(user1);
        mockSovaBTC.approve(user2, transferAmount);
        
        // User2 transfers from user1 to user2
        vm.prank(user2);
        bool success = mockSovaBTC.transferFrom(user1, user2, transferAmount);
        
        assertTrue(success);
        assertEq(mockSovaBTC.balanceOf(user1), amount - transferAmount);
        assertEq(mockSovaBTC.balanceOf(user2), transferAmount);
        assertEq(mockSovaBTC.allowance(user1, user2), 0);
    }

    function test_TransferFrom_InsufficientAllowance() public {
        uint256 amount = 1000e8;
        
        // Mint tokens to user1
        vm.prank(owner);
        mockSovaBTC.adminMint(user1, amount);
        
        // User2 tries to transfer without approval
        vm.prank(user2);
        vm.expectRevert("ERC20: insufficient allowance");
        mockSovaBTC.transferFrom(user1, user2, amount);
    }

    function test_TransferFrom_ExactAllowance() public {
        uint256 amount = 1000e8;
        
        // Mint tokens to user1
        vm.prank(owner);
        mockSovaBTC.adminMint(user1, amount);
        
        // User1 approves exact amount
        vm.prank(user1);
        mockSovaBTC.approve(user2, amount);
        
        // User2 transfers exact amount
        vm.prank(user2);
        bool success = mockSovaBTC.transferFrom(user1, user2, amount);
        
        assertTrue(success);
        assertEq(mockSovaBTC.allowance(user1, user2), 0);
    }

    // ============ Ownership Transfer ============

    function test_TransferOwnership_Success() public {
        vm.prank(owner);
        mockSovaBTC.transferOwnership(user1);
        
        assertEq(mockSovaBTC.owner(), user1);
    }

    function test_TransferOwnership_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert("Not owner");
        mockSovaBTC.transferOwnership(user2);
    }

    // ============ ISovaBTC Interface Functions ============

    function test_DepositBTC_Stub() public {
        // Test the stub function doesn't revert
        bytes memory signedTx = hex"deadbeef";
        mockSovaBTC.depositBTC(100000, signedTx);
        // Should execute without error
    }

    function test_IsTransactionUsed_Stub() public {
        bytes32 txid = keccak256("test");
        bool result = mockSovaBTC.isTransactionUsed(txid);
        assertFalse(result); // Always returns false
    }

    function test_IsPaused_Stub() public {
        bool result = mockSovaBTC.isPaused();
        assertFalse(result); // Always returns false
    }

    function test_Withdraw_Stub() public {
        // Test the stub function doesn't revert
        mockSovaBTC.withdraw(100000, 1000, 800000, "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh");
        // Should execute without error
    }

    function test_SetMinDepositAmount_Stub() public {
        // Test the stub function doesn't revert
        mockSovaBTC.setMinDepositAmount(10000);
        // Should execute without error
    }

    function test_SetMaxDepositAmount_Stub() public {
        // Test the stub function doesn't revert
        mockSovaBTC.setMaxDepositAmount(1000000000);
        // Should execute without error
    }

    function test_SetMaxGasLimitAmount_Stub() public {
        // Test the stub function doesn't revert
        mockSovaBTC.setMaxGasLimitAmount(50000000);
        // Should execute without error
    }

    function test_Pause_Stub() public {
        // Test the stub function doesn't revert
        mockSovaBTC.pause();
        // Should execute without error
    }

    function test_Unpause_Stub() public {
        // Test the stub function doesn't revert
        mockSovaBTC.unpause();
        // Should execute without error
    }

    // ============ Edge Cases and Complex Scenarios ============

    function test_MultipleUsersInteractions() public {
        uint256 amount = 1000e8;
        
        // Setup: Owner mints to user1
        vm.prank(owner);
        mockSovaBTC.adminMint(user1, amount);
        
        // User1 approves user2 for partial amount
        vm.prank(user1);
        mockSovaBTC.approve(user2, amount / 4);
        
        // User2 transfers from user1 to themselves
        vm.prank(user2);
        mockSovaBTC.transferFrom(user1, user2, amount / 4);
        
        // User2 transfers to user1 (circular)
        vm.prank(user2);
        mockSovaBTC.transfer(user1, amount / 8);
        
        // Verify final balances
        assertEq(mockSovaBTC.balanceOf(user1), amount - amount / 4 + amount / 8);
        assertEq(mockSovaBTC.balanceOf(user2), amount / 4 - amount / 8);
        assertEq(mockSovaBTC.allowance(user1, user2), 0);
    }

    function test_MinterBurnerRoleChanges() public {
        uint256 amount = 1000e8;
        
        // Set user1 as minter
        vm.prank(owner);
        mockSovaBTC.setMinter(user1, true);
        
        // User1 mints tokens
        vm.prank(user1);
        mockSovaBTC.adminMint(user2, amount);
        
        // Remove user1's minter role
        vm.prank(owner);
        mockSovaBTC.setMinter(user1, false);
        
        // User1 can no longer mint
        vm.prank(user1);
        vm.expectRevert("Not authorized minter");
        mockSovaBTC.adminMint(user2, amount);
        
        // Set user1 as burner
        vm.prank(owner);
        mockSovaBTC.setBurner(user1, true);
        
        // User1 can burn tokens
        vm.prank(user1);
        mockSovaBTC.adminBurn(user2, amount);
        
        assertEq(mockSovaBTC.balanceOf(user2), 0);
    }

    function test_OwnershipTransferAffectsRoles() public {
        address newOwner = address(0x99);
        uint256 amount = 1000e8;
        
        // Transfer ownership
        vm.prank(owner);
        mockSovaBTC.transferOwnership(newOwner);
        
        // Old owner can't manage roles anymore
        vm.prank(owner);
        vm.expectRevert("Not owner");
        mockSovaBTC.setMinter(user1, true);
        
        // New owner can manage roles
        vm.prank(newOwner);
        mockSovaBTC.setMinter(user1, true);
        
        // New owner needs to be granted minter role to mint (ownership transfer doesn't automatically grant minter role)
        vm.prank(newOwner);
        mockSovaBTC.setMinter(newOwner, true);
        
        // Now new owner can mint
        vm.prank(newOwner);
        mockSovaBTC.adminMint(user1, amount);
        
        assertEq(mockSovaBTC.balanceOf(user1), amount);
    }

    function test_ZeroAmountOperations() public {
        uint256 amount = 1000e8;
        
        // Mint some tokens first
        vm.prank(owner);
        mockSovaBTC.adminMint(user1, amount);
        
        // Zero amount transfer should work
        vm.prank(user1);
        bool success = mockSovaBTC.transfer(user2, 0);
        assertTrue(success);
        
        // Zero amount approval should work
        vm.prank(user1);
        success = mockSovaBTC.approve(user2, 0);
        assertTrue(success);
        
        // Zero amount transferFrom should work
        vm.prank(user2);
        success = mockSovaBTC.transferFrom(user1, user2, 0);
        assertTrue(success);
        
        // Zero amount mint should work
        vm.prank(owner);
        mockSovaBTC.adminMint(user1, 0);
        
        // Zero amount burn should work  
        vm.prank(owner);
        mockSovaBTC.adminBurn(user1, 0);
        
        // Balances should remain unchanged
        assertEq(mockSovaBTC.balanceOf(user1), amount);
        assertEq(mockSovaBTC.balanceOf(user2), 0);
    }
} 