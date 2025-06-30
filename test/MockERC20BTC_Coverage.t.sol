// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "./mocks/MockERC20BTC.sol";

/// @title MockERC20BTC Coverage Tests
/// @notice Tests to achieve 100% coverage for MockERC20BTC contract
contract MockERC20BTCCoverageTest is Test {
    MockERC20BTC public token;

    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public spender = makeAddr("spender");

    function setUp() public {
        token = new MockERC20BTC("Test Token", "TEST", 18);
    }

    // =============================================================================
    // Function Coverage - allowance() function
    // =============================================================================

    function test_AllowanceFunctionCoverage() public {
        // Test allowance function which is never called in other tests
        uint256 allowanceAmount = token.allowance(user1, spender);
        assertEq(allowanceAmount, 0, "Initial allowance should be 0");

        // Set an allowance
        vm.startPrank(user1);
        token.approve(spender, 1000);
        vm.stopPrank();

        // Check allowance again
        allowanceAmount = token.allowance(user1, spender);
        assertEq(allowanceAmount, 1000, "Allowance should be 1000 after approval");

        // Check different user pair
        allowanceAmount = token.allowance(user2, spender);
        assertEq(allowanceAmount, 0, "Different user pair should have 0 allowance");
    }

    // =============================================================================
    // Branch Coverage - transfer() insufficient balance
    // =============================================================================

    function test_TransferInsufficientBalanceBranch() public {
        // User1 has no tokens, try to transfer - should hit the false branch of the require
        vm.startPrank(user1);

        vm.expectRevert("Insufficient balance");
        token.transfer(user2, 100);

        vm.stopPrank();

        // Verify balances unchanged
        assertEq(token.balanceOf(user1), 0, "User1 balance should remain 0");
        assertEq(token.balanceOf(user2), 0, "User2 balance should remain 0");
    }

    function test_TransferExactlyInsufficientBalance() public {
        // Give user1 some tokens but try to transfer more
        token.mint(user1, 50);

        vm.startPrank(user1);

        // Try to transfer more than balance
        vm.expectRevert("Insufficient balance");
        token.transfer(user2, 51);

        vm.stopPrank();

        // Verify balances unchanged
        assertEq(token.balanceOf(user1), 50, "User1 balance should remain 50");
        assertEq(token.balanceOf(user2), 0, "User2 balance should remain 0");
    }

    // =============================================================================
    // Branch Coverage - transferFrom() insufficient balance and allowance
    // =============================================================================

    function test_TransferFromInsufficientBalanceBranch() public {
        // User1 has no tokens, give spender approval, but transferFrom should fail on balance check
        vm.startPrank(user1);
        token.approve(spender, 100);
        vm.stopPrank();

        vm.startPrank(spender);

        vm.expectRevert("Insufficient balance");
        token.transferFrom(user1, user2, 50);

        vm.stopPrank();

        // Verify state unchanged
        assertEq(token.balanceOf(user1), 0, "User1 balance should remain 0");
        assertEq(token.balanceOf(user2), 0, "User2 balance should remain 0");
        assertEq(token.allowance(user1, spender), 100, "Allowance should remain 100");
    }

    function test_TransferFromInsufficientAllowanceBranch() public {
        // User1 has tokens but spender has insufficient allowance
        token.mint(user1, 100);

        vm.startPrank(user1);
        token.approve(spender, 30); // Only approve 30
        vm.stopPrank();

        vm.startPrank(spender);

        // Try to transfer more than allowed
        vm.expectRevert("Insufficient allowance");
        token.transferFrom(user1, user2, 50);

        vm.stopPrank();

        // Verify state unchanged
        assertEq(token.balanceOf(user1), 100, "User1 balance should remain 100");
        assertEq(token.balanceOf(user2), 0, "User2 balance should remain 0");
        assertEq(token.allowance(user1, spender), 30, "Allowance should remain 30");
    }

    function test_TransferFromZeroAllowance() public {
        // User1 has tokens but spender has no allowance
        token.mint(user1, 100);

        vm.startPrank(spender);

        // Try to transfer without any allowance
        vm.expectRevert("Insufficient allowance");
        token.transferFrom(user1, user2, 1);

        vm.stopPrank();

        // Verify state unchanged
        assertEq(token.balanceOf(user1), 100, "User1 balance should remain 100");
        assertEq(token.balanceOf(user2), 0, "User2 balance should remain 0");
        assertEq(token.allowance(user1, spender), 0, "Allowance should remain 0");
    }

    // =============================================================================
    // Edge Case Coverage - Boundary conditions
    // =============================================================================

    function test_TransferFromExactBalance() public {
        // Test transferFrom with exact balance amount
        token.mint(user1, 100);

        vm.startPrank(user1);
        token.approve(spender, 100);
        vm.stopPrank();

        vm.startPrank(spender);

        // Try to transfer exact balance amount
        vm.expectRevert("Insufficient balance");
        token.transferFrom(user1, user2, 101); // One more than balance

        vm.stopPrank();
    }

    function test_TransferFromExactAllowance() public {
        // Test transferFrom with exact allowance amount but insufficient balance
        token.mint(user1, 50);

        vm.startPrank(user1);
        token.approve(spender, 100); // More allowance than balance
        vm.stopPrank();

        vm.startPrank(spender);

        // Try to transfer exact allowance amount but more than balance
        vm.expectRevert("Insufficient balance");
        token.transferFrom(user1, user2, 100);

        vm.stopPrank();
    }

    // =============================================================================
    // Comprehensive Success Cases for Complete Coverage
    // =============================================================================

    function test_AllFunctionsSuccessPath() public {
        // Test all functions in success paths to ensure complete coverage

        // 1. Constructor coverage (already covered in setUp)
        assertEq(token.name(), "Test Token", "Name should be set correctly");
        assertEq(token.symbol(), "TEST", "Symbol should be set correctly");
        assertEq(token.decimals(), 18, "Decimals should be set correctly");
        assertEq(token.totalSupply(), 0, "Initial total supply should be 0");

        // 2. Mint function
        token.mint(user1, 1000);
        assertEq(token.balanceOf(user1), 1000, "Balance should be 1000 after mint");
        assertEq(token.totalSupply(), 1000, "Total supply should be 1000 after mint");

        // 3. Approve function
        vm.startPrank(user1);
        bool success = token.approve(spender, 500);
        assertTrue(success, "Approve should return true");
        vm.stopPrank();

        // 4. Allowance function
        assertEq(token.allowance(user1, spender), 500, "Allowance should be 500");

        // 5. Transfer function (success path)
        vm.startPrank(user1);
        success = token.transfer(user2, 300);
        assertTrue(success, "Transfer should return true");
        vm.stopPrank();

        assertEq(token.balanceOf(user1), 700, "User1 balance should be 700");
        assertEq(token.balanceOf(user2), 300, "User2 balance should be 300");

        // 6. TransferFrom function (success path)
        vm.startPrank(spender);
        success = token.transferFrom(user1, user2, 200);
        assertTrue(success, "TransferFrom should return true");
        vm.stopPrank();

        assertEq(token.balanceOf(user1), 500, "User1 balance should be 500");
        assertEq(token.balanceOf(user2), 500, "User2 balance should be 500");
        assertEq(token.allowance(user1, spender), 300, "Allowance should be reduced to 300");
    }
}
