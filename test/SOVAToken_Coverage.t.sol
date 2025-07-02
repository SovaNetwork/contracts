// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/staking/SOVAToken.sol";

/**
 * @title SOVATokenCoverageTest
 * @notice Comprehensive test suite to achieve 100% coverage for SOVAToken contract
 */
contract SOVATokenCoverageTest is Test {
    SOVAToken public sovaToken;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public minter = address(0x4);
    
    // Events to test
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    
    function setUp() public {
        vm.startPrank(owner);
        // Deploy with initial supply to test constructor branches
        sovaToken = new SOVAToken("SOVA Token", "SOVA", owner, 10_000_000 * 1e18);
        vm.stopPrank();
    }

    // ============ Constructor Tests ============

    function test_Constructor_WithInitialSupply() public {
        vm.startPrank(owner);
        uint256 initialSupply = 5_000_000 * 1e18;
        
        SOVAToken token = new SOVAToken("Test SOVA", "TSOVA", owner, initialSupply);
        
        assertEq(token.name(), "Test SOVA");
        assertEq(token.symbol(), "TSOVA");
        assertEq(token.totalSupply(), initialSupply);
        assertEq(token.balanceOf(owner), initialSupply);
        assertTrue(token.isMinter(owner));
        
        vm.stopPrank();
    }

    function test_Constructor_ZeroInitialSupply() public {
        vm.startPrank(owner);
        
        SOVAToken token = new SOVAToken("Zero SOVA", "ZSOVA", owner, 0);
        
        assertEq(token.totalSupply(), 0);
        assertEq(token.balanceOf(owner), 0);
        assertTrue(token.isMinter(owner));
        
        vm.stopPrank();
    }

    function test_Constructor_MaxInitialSupply() public {
        vm.startPrank(owner);
        uint256 maxSupply = 100_000_000 * 1e18;
        
        SOVAToken token = new SOVAToken("Max SOVA", "MSOVA", owner, maxSupply);
        
        assertEq(token.totalSupply(), maxSupply);
        assertEq(token.balanceOf(owner), maxSupply);
        
        vm.stopPrank();
    }

    function test_Constructor_ExceedsMaxSupply() public {
        vm.startPrank(owner);
        uint256 excessiveSupply = 100_000_001 * 1e18; // 1 token over max
        
        vm.expectRevert(SOVAToken.ExceedsMaxSupply.selector);
        new SOVAToken("Excessive SOVA", "ESOVA", owner, excessiveSupply);
        
        vm.stopPrank();
    }

    // ============ Minting Tests ============

    function test_Mint_Success() public {
        uint256 mintAmount = 1_000_000 * 1e18;
        uint256 initialSupply = sovaToken.totalSupply();
        
        vm.prank(owner);
        sovaToken.mint(user1, mintAmount);
        
        assertEq(sovaToken.balanceOf(user1), mintAmount);
        assertEq(sovaToken.totalSupply(), initialSupply + mintAmount);
    }

    function test_Mint_OnlyMinter() public {
        vm.prank(user1);
        vm.expectRevert(SOVAToken.UnauthorizedMinter.selector);
        sovaToken.mint(user1, 1000 * 1e18);
    }

    function test_Mint_ExceedsMaxSupply() public {
        uint256 remainingSupply = sovaToken.remainingSupply();
        
        vm.prank(owner);
        vm.expectRevert(SOVAToken.ExceedsMaxSupply.selector);
        sovaToken.mint(user1, remainingSupply + 1);
    }

    function test_Mint_ExactRemainingSupply() public {
        uint256 remainingSupply = sovaToken.remainingSupply();
        
        vm.prank(owner);
        sovaToken.mint(user1, remainingSupply);
        
        assertEq(sovaToken.totalSupply(), sovaToken.MAX_SUPPLY());
        assertEq(sovaToken.remainingSupply(), 0);
    }

    // ============ Batch Minting Tests ============

    function test_BatchMint_Success() public {
        address[] memory recipients = new address[](3);
        uint256[] memory amounts = new uint256[](3);
        
        recipients[0] = user1;
        recipients[1] = user2;
        recipients[2] = minter;
        
        amounts[0] = 1000 * 1e18;
        amounts[1] = 2000 * 1e18;
        amounts[2] = 3000 * 1e18;
        
        uint256 initialSupply = sovaToken.totalSupply();
        
        vm.prank(owner);
        sovaToken.batchMint(recipients, amounts);
        
        assertEq(sovaToken.balanceOf(user1), amounts[0]);
        assertEq(sovaToken.balanceOf(user2), amounts[1]);
        assertEq(sovaToken.balanceOf(minter), amounts[2]);
        assertEq(sovaToken.totalSupply(), initialSupply + amounts[0] + amounts[1] + amounts[2]);
    }

    function test_BatchMint_ArrayLengthMismatch() public {
        address[] memory recipients = new address[](2);
        uint256[] memory amounts = new uint256[](3);
        
        recipients[0] = user1;
        recipients[1] = user2;
        amounts[0] = 1000 * 1e18;
        amounts[1] = 2000 * 1e18;
        amounts[2] = 3000 * 1e18;
        
        vm.prank(owner);
        vm.expectRevert("Array length mismatch");
        sovaToken.batchMint(recipients, amounts);
    }

    function test_BatchMint_ExceedsMaxSupply() public {
        address[] memory recipients = new address[](2);
        uint256[] memory amounts = new uint256[](2);
        
        recipients[0] = user1;
        recipients[1] = user2;
        
        uint256 remainingSupply = sovaToken.remainingSupply();
        amounts[0] = remainingSupply / 2;
        amounts[1] = remainingSupply / 2 + 1; // This will exceed max supply
        
        vm.prank(owner);
        vm.expectRevert(SOVAToken.ExceedsMaxSupply.selector);
        sovaToken.batchMint(recipients, amounts);
    }

    function test_BatchMint_WithZeroAddressAndAmount() public {
        address[] memory recipients = new address[](4);
        uint256[] memory amounts = new uint256[](4);
        
        recipients[0] = user1;
        recipients[1] = address(0); // Zero address
        recipients[2] = user2;
        recipients[3] = minter;
        
        amounts[0] = 1000 * 1e18;
        amounts[1] = 2000 * 1e18; // Will be skipped due to zero address
        amounts[2] = 0; // Zero amount
        amounts[3] = 3000 * 1e18;
        
        uint256 initialSupply = sovaToken.totalSupply();
        
        vm.prank(owner);
        sovaToken.batchMint(recipients, amounts);
        
        assertEq(sovaToken.balanceOf(user1), amounts[0]);
        assertEq(sovaToken.balanceOf(address(0)), 0); // Should remain 0
        assertEq(sovaToken.balanceOf(user2), 0); // Zero amount not minted
        assertEq(sovaToken.balanceOf(minter), amounts[3]);
        // Total supply should only increase by amounts[0] + amounts[3]
        assertEq(sovaToken.totalSupply(), initialSupply + amounts[0] + amounts[3]);
    }

    function test_BatchMint_OnlyMinter() public {
        address[] memory recipients = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        
        recipients[0] = user1;
        amounts[0] = 1000 * 1e18;
        
        vm.prank(user1);
        vm.expectRevert(SOVAToken.UnauthorizedMinter.selector);
        sovaToken.batchMint(recipients, amounts);
    }

    function test_BatchMint_EmptyArrays() public {
        address[] memory recipients = new address[](0);
        uint256[] memory amounts = new uint256[](0);
        
        uint256 initialSupply = sovaToken.totalSupply();
        
        vm.prank(owner);
        sovaToken.batchMint(recipients, amounts);
        
        // Nothing should change
        assertEq(sovaToken.totalSupply(), initialSupply);
    }

    // ============ Minter Management Tests ============

    function test_AddMinter_Success() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit MinterAdded(minter);
        sovaToken.addMinter(minter);
        
        assertTrue(sovaToken.isMinter(minter));
    }

    function test_AddMinter_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(SOVAToken.ZeroAddress.selector);
        sovaToken.addMinter(address(0));
    }

    function test_AddMinter_AlreadyMinter() public {
        // Add minter first
        vm.prank(owner);
        sovaToken.addMinter(minter);
        
        // Try to add again - should not emit event but not revert
        vm.prank(owner);
        vm.recordLogs();
        sovaToken.addMinter(minter);
        
        Vm.Log[] memory logs = vm.getRecordedLogs();
        assertEq(logs.length, 0); // No event should be emitted
        assertTrue(sovaToken.isMinter(minter)); // Still a minter
    }

    function test_AddMinter_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        sovaToken.addMinter(minter);
    }

    function test_RemoveMinter_Success() public {
        // First add minter
        vm.prank(owner);
        sovaToken.addMinter(minter);
        
        // Then remove
        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit MinterRemoved(minter);
        sovaToken.removeMinter(minter);
        
        assertFalse(sovaToken.isMinter(minter));
    }

    function test_RemoveMinter_NotMinter() public {
        // Try to remove someone who isn't a minter
        vm.prank(owner);
        vm.recordLogs();
        sovaToken.removeMinter(minter);
        
        Vm.Log[] memory logs = vm.getRecordedLogs();
        assertEq(logs.length, 0); // No event should be emitted
        assertFalse(sovaToken.isMinter(minter)); // Still not a minter
    }

    function test_RemoveMinter_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        sovaToken.removeMinter(minter);
    }

    // ============ View Functions Tests ============

    function test_IsMinter() public {
        assertFalse(sovaToken.isMinter(user1));
        assertTrue(sovaToken.isMinter(owner));
        
        vm.prank(owner);
        sovaToken.addMinter(minter);
        assertTrue(sovaToken.isMinter(minter));
    }

    function test_RemainingSupply() public {
        uint256 currentSupply = sovaToken.totalSupply();
        uint256 maxSupply = sovaToken.MAX_SUPPLY();
        uint256 expectedRemaining = maxSupply - currentSupply;
        
        assertEq(sovaToken.remainingSupply(), expectedRemaining);
        
        // Mint some tokens
        vm.prank(owner);
        sovaToken.mint(user1, 1_000_000 * 1e18);
        
        assertEq(sovaToken.remainingSupply(), expectedRemaining - 1_000_000 * 1e18);
    }

    function test_CanMint() public {
        uint256 remainingSupply = sovaToken.remainingSupply();
        
        assertTrue(sovaToken.canMint(remainingSupply));
        assertTrue(sovaToken.canMint(remainingSupply - 1));
        assertFalse(sovaToken.canMint(remainingSupply + 1));
        
        // Test edge case
        assertTrue(sovaToken.canMint(0));
    }

    function test_CanMint_WhenAtMaxSupply() public {
        // Mint to max supply
        uint256 remainingSupply = sovaToken.remainingSupply();
        vm.prank(owner);
        sovaToken.mint(user1, remainingSupply);
        
        assertFalse(sovaToken.canMint(1));
        assertTrue(sovaToken.canMint(0));
    }

    // ============ ERC20Burnable Tests ============

    function test_Burn_Success() public {
        uint256 mintAmount = 1000 * 1e18;
        uint256 burnAmount = 500 * 1e18;
        
        // First mint some tokens
        vm.prank(owner);
        sovaToken.mint(user1, mintAmount);
        
        // Then burn some
        vm.prank(user1);
        sovaToken.burn(burnAmount);
        
        assertEq(sovaToken.balanceOf(user1), mintAmount - burnAmount);
        assertEq(sovaToken.totalSupply(), sovaToken.totalSupply());
    }

    function test_BurnFrom_Success() public {
        uint256 mintAmount = 1000 * 1e18;
        uint256 burnAmount = 500 * 1e18;
        
        // Mint tokens to user1
        vm.prank(owner);
        sovaToken.mint(user1, mintAmount);
        
        // User1 approves user2 to burn tokens
        vm.prank(user1);
        sovaToken.approve(user2, burnAmount);
        
        // User2 burns from user1's balance
        vm.prank(user2);
        sovaToken.burnFrom(user1, burnAmount);
        
        assertEq(sovaToken.balanceOf(user1), mintAmount - burnAmount);
        assertEq(sovaToken.allowance(user1, user2), 0);
    }

    // ============ Constants and Max Values Tests ============

    function test_Constants() public {
        assertEq(sovaToken.MAX_SUPPLY(), 100_000_000 * 1e18);
        assertEq(sovaToken.decimals(), 18);
    }

    // ============ Integration Tests ============

    function test_FullLifecycle() public {
        // 1. Add a new minter
        vm.prank(owner);
        sovaToken.addMinter(minter);
        
        // 2. New minter mints tokens
        uint256 mintAmount = 5_000_000 * 1e18;
        vm.prank(minter);
        sovaToken.mint(user1, mintAmount);
        
        // 3. User1 transfers to user2
        uint256 transferAmount = 1_000_000 * 1e18;
        vm.prank(user1);
        sovaToken.transfer(user2, transferAmount);
        
        // 4. User2 burns some tokens
        uint256 burnAmount = 250_000 * 1e18;
        vm.prank(user2);
        sovaToken.burn(burnAmount);
        
        // 5. Owner removes minter
        vm.prank(owner);
        sovaToken.removeMinter(minter);
        
        // 6. Verify final state
        assertEq(sovaToken.balanceOf(user1), mintAmount - transferAmount);
        assertEq(sovaToken.balanceOf(user2), transferAmount - burnAmount);
        assertFalse(sovaToken.isMinter(minter));
        
        // 7. Removed minter can't mint anymore
        vm.prank(minter);
        vm.expectRevert(SOVAToken.UnauthorizedMinter.selector);
        sovaToken.mint(user1, 1000 * 1e18);
    }

    function test_BatchMintToMaxSupply() public {
        uint256 remainingSupply = sovaToken.remainingSupply();
        
        address[] memory recipients = new address[](3);
        uint256[] memory amounts = new uint256[](3);
        
        recipients[0] = user1;
        recipients[1] = user2;
        recipients[2] = minter;
        
        // Distribute remaining supply exactly
        amounts[0] = remainingSupply / 3;
        amounts[1] = remainingSupply / 3;
        amounts[2] = remainingSupply - amounts[0] - amounts[1]; // Remainder
        
        vm.prank(owner);
        sovaToken.batchMint(recipients, amounts);
        
        assertEq(sovaToken.totalSupply(), sovaToken.MAX_SUPPLY());
        assertEq(sovaToken.remainingSupply(), 0);
        assertFalse(sovaToken.canMint(1));
    }

    function test_OwnershipFunctionality() public {
        // Test owner can transfer ownership
        vm.prank(owner);
        sovaToken.transferOwnership(user1);
        
        // Old owner can't add minters anymore
        vm.prank(owner);
        vm.expectRevert();
        sovaToken.addMinter(minter);
        
        // New owner can add minters
        vm.prank(user1);
        sovaToken.addMinter(minter);
        assertTrue(sovaToken.isMinter(minter));
    }
} 