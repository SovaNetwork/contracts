// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/SovaBTCOFT.sol";
import "../src/interfaces/ISovaBTC.sol";
import { SendParam, MessagingFee, MessagingReceipt, OFTReceipt } from "@layerzerolabs/oft-evm/contracts/interfaces/IOFT.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SovaBTCOFT Coverage Test
 * @notice Comprehensive test suite for SovaBTCOFT LayerZero OFT contract
 */
contract SovaBTCOFTCoverageTest is Test {
    SovaBTCOFT public oft;
    address public owner;
    address public user1;
    address public user2;
    address public minter1;
    address public minter2;
    address public mockEndpoint;
    
    // Events to test
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event AdminMinted(address indexed to, uint256 amount);
    event AdminBurned(address indexed from, uint256 amount);
    event ContractPausedByOwner(address indexed account);
    event ContractUnpausedByOwner(address indexed account);
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        minter1 = makeAddr("minter1");
        minter2 = makeAddr("minter2");
        mockEndpoint = makeAddr("mockEndpoint");
        
        // Deploy SovaBTCOFT
        oft = new SovaBTCOFT(
            "Sova Bitcoin",
            "sovaBTC",
            mockEndpoint,
            owner
        );
        
        // Give users some ETH for gas
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(minter1, 10 ether);
        vm.deal(minter2, 10 ether);
    }
    
    // ============ Constructor Tests ============
    
    function test_Constructor_Success() public {
        assertEq(oft.name(), "Sova Bitcoin");
        assertEq(oft.symbol(), "sovaBTC");
        assertEq(oft.decimals(), 8);
        assertEq(oft.owner(), owner);
        assertEq(oft.minDepositAmount(), 10_000);
        assertEq(oft.maxDepositAmount(), 100_000_000_000);
        assertEq(oft.maxGasLimitAmount(), 50_000_000);
        assertFalse(oft.isPaused());
        assertTrue(oft.minters(owner)); // Deployer is initial minter
    }
    
    function test_Constructor_InitialMinter() public {
        assertTrue(oft.minters(owner));
        assertTrue(oft.isMinter(owner));
    }
    
    // ============ Minter Management Tests ============
    
    function test_AddMinter_Success() public {
        vm.expectEmit(true, false, false, false);
        emit MinterAdded(minter1);
        
        oft.addMinter(minter1);
        
        assertTrue(oft.minters(minter1));
        assertTrue(oft.isMinter(minter1));
    }
    
    function test_AddMinter_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        oft.addMinter(minter1);
    }
    
    function test_AddMinter_ZeroAddress() public {
        vm.expectRevert(SovaBTCOFT.ZeroAddress.selector);
        oft.addMinter(address(0));
    }
    
    function test_RemoveMinter_Success() public {
        oft.addMinter(minter1);
        assertTrue(oft.isMinter(minter1));
        
        vm.expectEmit(true, false, false, false);
        emit MinterRemoved(minter1);
        
        oft.removeMinter(minter1);
        
        assertFalse(oft.minters(minter1));
        assertFalse(oft.isMinter(minter1));
    }
    
    function test_RemoveMinter_OnlyOwner() public {
        oft.addMinter(minter1);
        
        vm.prank(user1);
        vm.expectRevert();
        oft.removeMinter(minter1);
    }
    
    function test_IsMinter_Multiple() public {
        oft.addMinter(minter1);
        oft.addMinter(minter2);
        
        assertTrue(oft.isMinter(owner));
        assertTrue(oft.isMinter(minter1));
        assertTrue(oft.isMinter(minter2));
        assertFalse(oft.isMinter(user1));
    }
    
    // ============ ISovaBTC Interface Tests ============
    
    function test_AdminMint_Success() public {
        uint256 amount = 1000_000; // 0.01 BTC
        
        vm.expectEmit(true, false, false, true);
        emit AdminMinted(user1, amount);
        
        oft.adminMint(user1, amount);
        
        assertEq(oft.balanceOf(user1), amount);
        assertEq(oft.totalSupply(), amount);
    }
    
    function test_AdminMint_OnlyMinter() public {
        vm.prank(user1);
        vm.expectRevert(SovaBTCOFT.UnauthorizedMinter.selector);
        oft.adminMint(user1, 1000_000);
    }
    
    function test_AdminMint_ZeroAmount() public {
        vm.expectRevert(SovaBTCOFT.ZeroAmount.selector);
        oft.adminMint(user1, 0);
    }
    
    function test_AdminMint_WhenPaused() public {
        oft.pause();
        
        vm.expectRevert(SovaBTCOFT.ContractPaused.selector);
        oft.adminMint(user1, 1000_000);
    }
    
    function test_AdminMint_MultipleMintersCanMint() public {
        oft.addMinter(minter1);
        oft.addMinter(minter2);
        
        vm.prank(minter1);
        oft.adminMint(user1, 1000_000);
        
        vm.prank(minter2);
        oft.adminMint(user2, 2000_000);
        
        assertEq(oft.balanceOf(user1), 1000_000);
        assertEq(oft.balanceOf(user2), 2000_000);
        assertEq(oft.totalSupply(), 3000_000);
    }
    
    function test_AdminBurn_Success() public {
        uint256 amount = 1000_000;
        oft.adminMint(user1, amount);
        
        vm.expectEmit(true, false, false, true);
        emit AdminBurned(user1, amount);
        
        oft.adminBurn(user1, amount);
        
        assertEq(oft.balanceOf(user1), 0);
        assertEq(oft.totalSupply(), 0);
    }
    
    function test_AdminBurn_OnlyMinter() public {
        oft.adminMint(user1, 1000_000);
        
        vm.prank(user1);
        vm.expectRevert(SovaBTCOFT.UnauthorizedMinter.selector);
        oft.adminBurn(user1, 1000_000);
    }
    
    function test_AdminBurn_ZeroAmount() public {
        vm.expectRevert(SovaBTCOFT.ZeroAmount.selector);
        oft.adminBurn(user1, 0);
    }
    
    function test_AdminBurn_WhenPaused() public {
        oft.adminMint(user1, 1000_000);
        oft.pause();
        
        vm.expectRevert(SovaBTCOFT.ContractPaused.selector);
        oft.adminBurn(user1, 1000_000);
    }
    
    function test_AdminBurn_InsufficientBalance() public {
        oft.adminMint(user1, 1000_000);
        
        vm.expectRevert();
        oft.adminBurn(user1, 2000_000);
    }
    
    // ============ Pause/Unpause Tests ============
    
    function test_Pause_Success() public {
        assertFalse(oft.isPaused());
        
        vm.expectEmit(true, false, false, false);
        emit ContractPausedByOwner(owner);
        
        oft.pause();
        
        assertTrue(oft.isPaused());
    }
    
    function test_Pause_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        oft.pause();
    }
    
    function test_Pause_AlreadyPaused() public {
        oft.pause();
        
        vm.expectRevert(SovaBTCOFT.ContractPaused.selector);
        oft.pause();
    }
    
    function test_Unpause_Success() public {
        oft.pause();
        assertTrue(oft.isPaused());
        
        vm.expectEmit(true, false, false, false);
        emit ContractUnpausedByOwner(owner);
        
        oft.unpause();
        
        assertFalse(oft.isPaused());
    }
    
    function test_Unpause_OnlyOwner() public {
        oft.pause();
        
        vm.prank(user1);
        vm.expectRevert();
        oft.unpause();
    }
    
    function test_Unpause_NotPaused() public {
        vm.expectRevert("Contract not paused");
        oft.unpause();
    }
    
    // ============ Configuration Tests ============
    
    function test_SetMinDepositAmount() public {
        oft.setMinDepositAmount(20_000);
        assertEq(oft.minDepositAmount(), 20_000);
    }
    
    function test_SetMinDepositAmount_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        oft.setMinDepositAmount(20_000);
    }
    
    function test_SetMaxDepositAmount() public {
        oft.setMaxDepositAmount(200_000_000_000);
        assertEq(oft.maxDepositAmount(), 200_000_000_000);
    }
    
    function test_SetMaxDepositAmount_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        oft.setMaxDepositAmount(200_000_000_000);
    }
    
    function test_SetMaxGasLimitAmount() public {
        oft.setMaxGasLimitAmount(100_000_000);
        assertEq(oft.maxGasLimitAmount(), 100_000_000);
    }
    
    function test_SetMaxGasLimitAmount_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        oft.setMaxGasLimitAmount(100_000_000);
    }
    
    // ============ Bitcoin Function Tests (Should Revert) ============
    
    function test_DepositBTC_NotSupported() public {
        vm.expectRevert("SovaBTCOFT: Bitcoin deposits not supported on OFT contract");
        oft.depositBTC(1000_000, "");
    }
    
    function test_Withdraw_NotSupported() public {
        vm.expectRevert("SovaBTCOFT: Bitcoin withdrawals not supported on OFT contract");
        oft.withdraw(1000_000, 1000, 50_000, "bc1qtest");
    }
    
    function test_IsTransactionUsed_AlwaysFalse() public {
        assertFalse(oft.isTransactionUsed(bytes32(0)));
        assertFalse(oft.isTransactionUsed(keccak256("test")));
    }
    
    // ============ ERC20 Functionality Tests ============
    
    function test_Transfer_Success() public {
        uint256 amount = 1000_000;
        oft.adminMint(user1, amount);
        
        vm.prank(user1);
        bool success = oft.transfer(user2, amount / 2);
        
        assertTrue(success);
        assertEq(oft.balanceOf(user1), amount / 2);
        assertEq(oft.balanceOf(user2), amount / 2);
    }
    
    function test_Transfer_WhenPaused() public {
        uint256 amount = 1000_000;
        oft.adminMint(user1, amount);
        oft.pause();
        
        vm.prank(user1);
        vm.expectRevert(SovaBTCOFT.ContractPaused.selector);
        oft.transfer(user2, amount / 2);
    }
    
    function test_Approve_Success() public {
        uint256 amount = 1000_000;
        oft.adminMint(user1, amount);
        
        vm.prank(user1);
        bool success = oft.approve(user2, amount);
        
        assertTrue(success);
        assertEq(oft.allowance(user1, user2), amount);
    }
    
    function test_TransferFrom_Success() public {
        uint256 amount = 1000_000;
        oft.adminMint(user1, amount);
        
        vm.prank(user1);
        oft.approve(user2, amount);
        
        vm.prank(user2);
        bool success = oft.transferFrom(user1, user2, amount / 2);
        
        assertTrue(success);
        assertEq(oft.balanceOf(user1), amount / 2);
        assertEq(oft.balanceOf(user2), amount / 2);
        assertEq(oft.allowance(user1, user2), amount / 2);
    }
    
    function test_TransferFrom_WhenPaused() public {
        uint256 amount = 1000_000;
        oft.adminMint(user1, amount);
        
        vm.prank(user1);
        oft.approve(user2, amount);
        
        oft.pause();
        
        vm.prank(user2);
        vm.expectRevert(SovaBTCOFT.ContractPaused.selector);
        oft.transferFrom(user1, user2, amount / 2);
    }
    
    // ============ Decimal Tests ============
    
    function test_Decimals_Returns8() public {
        assertEq(oft.decimals(), 8);
    }
    
    function test_Decimals_BtcCompatible() public {
        // Test that amounts work correctly with 8 decimals
        uint256 oneBTC = 1e8;
        uint256 oneSatoshi = 1;
        
        oft.adminMint(user1, oneBTC);
        assertEq(oft.balanceOf(user1), oneBTC);
        
        oft.adminMint(user2, oneSatoshi);
        assertEq(oft.balanceOf(user2), oneSatoshi);
        
        assertEq(oft.totalSupply(), oneBTC + oneSatoshi);
    }
    
    // ============ Edge Cases and Error Conditions ============
    
    function test_MultipleOperations_Sequence() public {
        // Test sequence of operations
        oft.addMinter(minter1);
        
        vm.prank(minter1);
        oft.adminMint(user1, 5000_000);
        
        vm.prank(user1);
        oft.transfer(user2, 2000_000);
        
        vm.prank(minter1);
        oft.adminBurn(user1, 1000_000);
        
        assertEq(oft.balanceOf(user1), 2000_000);
        assertEq(oft.balanceOf(user2), 2000_000);
        assertEq(oft.totalSupply(), 4000_000);
    }
    
    function test_PauseUnpause_Sequence() public {
        oft.adminMint(user1, 1000_000);
        
        // Normal operations work
        vm.prank(user1);
        oft.transfer(user2, 500_000);
        
        // Pause
        oft.pause();
        
        // Operations fail when paused
        vm.prank(user1);
        vm.expectRevert(SovaBTCOFT.ContractPaused.selector);
        oft.transfer(user2, 100_000);
        
        vm.expectRevert(SovaBTCOFT.ContractPaused.selector);
        oft.adminMint(user1, 100_000);
        
        // Unpause
        oft.unpause();
        
        // Operations work again
        vm.prank(user1);
        oft.transfer(user2, 100_000);
        
        oft.adminMint(user1, 100_000);
        
        assertEq(oft.balanceOf(user1), 500_000);
        assertEq(oft.balanceOf(user2), 600_000);
    }
    
    function test_MinterManagement_Sequence() public {
        // Add multiple minters
        oft.addMinter(minter1);
        oft.addMinter(minter2);
        
        assertTrue(oft.isMinter(minter1));
        assertTrue(oft.isMinter(minter2));
        
        // Remove one minter
        oft.removeMinter(minter1);
        assertFalse(oft.isMinter(minter1));
        assertTrue(oft.isMinter(minter2));
        
        // Removed minter cannot mint
        vm.prank(minter1);
        vm.expectRevert(SovaBTCOFT.UnauthorizedMinter.selector);
        oft.adminMint(user1, 1000_000);
        
        // Active minter can still mint
        vm.prank(minter2);
        oft.adminMint(user1, 1000_000);
        
        assertEq(oft.balanceOf(user1), 1000_000);
    }
    
    function test_LargeAmounts() public {
        // Test with large amounts (close to max BTC supply)
        uint256 largeAmount = 21_000_000 * 1e8; // 21M BTC
        
        oft.adminMint(user1, largeAmount);
        assertEq(oft.balanceOf(user1), largeAmount);
        
        vm.prank(user1);
        oft.transfer(user2, largeAmount / 2);
        
        assertEq(oft.balanceOf(user1), largeAmount / 2);
        assertEq(oft.balanceOf(user2), largeAmount / 2);
    }
    
    function test_SmallAmounts() public {
        // Test with smallest amount (1 satoshi)
        uint256 oneSatoshi = 1;
        
        oft.adminMint(user1, oneSatoshi);
        assertEq(oft.balanceOf(user1), oneSatoshi);
        
        vm.prank(user1);
        oft.transfer(user2, oneSatoshi);
        
        assertEq(oft.balanceOf(user1), 0);
        assertEq(oft.balanceOf(user2), oneSatoshi);
    }
    
    // ============ Access Control Edge Cases ============
    
    function test_OnlyOwner_Functions() public {
        address notOwner = makeAddr("notOwner");
        
        vm.startPrank(notOwner);
        
        vm.expectRevert();
        oft.addMinter(minter1);
        
        vm.expectRevert();
        oft.removeMinter(owner);
        
        vm.expectRevert();
        oft.pause();
        
        vm.expectRevert();
        oft.setMinDepositAmount(1000);
        
        vm.expectRevert();
        oft.setMaxDepositAmount(1000);
        
        vm.expectRevert();
        oft.setMaxGasLimitAmount(1000);
        
        vm.stopPrank();
    }
    
    function test_OnlyMinter_Functions() public {
        address notMinter = makeAddr("notMinter");
        
        vm.startPrank(notMinter);
        
        vm.expectRevert(SovaBTCOFT.UnauthorizedMinter.selector);
        oft.adminMint(user1, 1000_000);
        
        vm.expectRevert(SovaBTCOFT.UnauthorizedMinter.selector);
        oft.adminBurn(user1, 1000_000);
        
        vm.stopPrank();
    }
    
    // ============ Integration Tests ============
    
    function test_FullWorkflow() public {
        // 1. Add minter
        oft.addMinter(minter1);
        
        // 2. Mint tokens
        vm.prank(minter1);
        oft.adminMint(user1, 10_000_000); // 0.1 BTC
        
        // 3. User transfers
        vm.prank(user1);
        oft.transfer(user2, 3_000_000); // 0.03 BTC
        
        // 4. Approve and transferFrom
        vm.prank(user1);
        oft.approve(user2, 5_000_000);
        
        vm.prank(user2);
        oft.transferFrom(user1, user2, 2_000_000); // 0.02 BTC
        
        // 5. Burn tokens
        vm.prank(minter1);
        oft.adminBurn(user1, 5_000_000); // 0.05 BTC
        
        // 6. Check final balances
        assertEq(oft.balanceOf(user1), 0);
        assertEq(oft.balanceOf(user2), 5_000_000);
        assertEq(oft.totalSupply(), 5_000_000);
        assertEq(oft.allowance(user1, user2), 3_000_000);
    }
    
    function test_EmergencyPauseScenario() public {
        // Normal operation
        oft.addMinter(minter1);
        vm.prank(minter1);
        oft.adminMint(user1, 10_000_000);
        
        // Emergency pause
        oft.pause();
        
        // All operations should fail
        vm.expectRevert(SovaBTCOFT.ContractPaused.selector);
        vm.prank(minter1);
        oft.adminMint(user2, 1_000_000);
        
        vm.expectRevert(SovaBTCOFT.ContractPaused.selector);
        vm.prank(minter1);
        oft.adminBurn(user1, 1_000_000);
        
        vm.expectRevert(SovaBTCOFT.ContractPaused.selector);
        vm.prank(user1);
        oft.transfer(user2, 1_000_000);
        
        // Unpause and resume
        oft.unpause();
        
        vm.prank(user1);
        oft.transfer(user2, 1_000_000);
        
        assertEq(oft.balanceOf(user1), 9_000_000);
        assertEq(oft.balanceOf(user2), 1_000_000);
    }
} 