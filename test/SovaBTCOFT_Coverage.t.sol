// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SovaBTCOFT.sol";

/**
 * @title SovaBTCOFTCoverageTest
 * @notice Comprehensive test suite to achieve 100% coverage for SovaBTCOFT contract
 */
contract SovaBTCOFTCoverageTest is Test {
    SovaBTCOFT public sovaBTCOFT;
    
    address public owner = address(0x1);
    address public minter = address(0x2);
    address public endpoint = address(0x3);
    address public user1 = address(0x4);
    address public user2 = address(0x5);
    
    function setUp() public {
        vm.startPrank(owner);
        sovaBTCOFT = new SovaBTCOFT(
            "SovaBTC OFT",
            "SOVAOFT",
            endpoint,
            minter
        );
        vm.stopPrank();
    }

    // ============ Constructor Tests ============

    function test_Constructor_Success() public {
        assertEq(sovaBTCOFT.name(), "SovaBTC OFT");
        assertEq(sovaBTCOFT.symbol(), "SOVAOFT");
        assertEq(sovaBTCOFT.decimals(), 8);
        assertEq(sovaBTCOFT.endpoint(), endpoint);
        assertEq(sovaBTCOFT.minter(), minter);
        assertEq(sovaBTCOFT.minDepositAmount(), 10_000);
        assertEq(sovaBTCOFT.maxDepositAmount(), 100_000_000_000);
        assertEq(sovaBTCOFT.maxGasLimitAmount(), 50_000_000);
        assertFalse(sovaBTCOFT.isPaused());
    }

    function test_Constructor_ZeroEndpoint() public {
        vm.expectRevert(SovaBTCOFT.ZeroAddress.selector);
        new SovaBTCOFT("Test", "TEST", address(0), minter);
    }

    function test_Constructor_ZeroMinter() public {
        vm.expectRevert(SovaBTCOFT.ZeroAddress.selector);
        new SovaBTCOFT("Test", "TEST", endpoint, address(0));
    }

    // ============ Quote Send Tests ============

    function test_QuoteSend_PayInNative() public {
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: 1,
            to: bytes32(uint256(uint160(user1))),
            amountLD: 1000000,
            minAmountLD: 1000000,
            extraOptions: "",
            composeMsg: ""
        });
        
        SovaBTCOFT.MessagingFee memory fee = sovaBTCOFT.quoteSend(sendParam, false);
        assertEq(fee.nativeFee, 0.001 ether);
        assertEq(fee.lzTokenFee, 0);
    }

    function test_QuoteSend_PayInLzToken() public {
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: 1,
            to: bytes32(uint256(uint160(user1))),
            amountLD: 1000000,
            minAmountLD: 1000000,
            extraOptions: "",
            composeMsg: ""
        });
        
        // This covers line 162: return fee statement
        SovaBTCOFT.MessagingFee memory fee = sovaBTCOFT.quoteSend(sendParam, true);
        assertEq(fee.nativeFee, 0.001 ether);
        assertEq(fee.lzTokenFee, 100e18);
        
        // Force explicit usage of the return value to ensure line 162 coverage
        assertTrue(fee.nativeFee > 0);
        assertTrue(fee.lzTokenFee > 0);
    }

    // ============ Send Function Tests ============

    function test_Send_ZeroAmount() public {
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: 1,
            to: bytes32(uint256(uint160(user1))),
            amountLD: 0,
            minAmountLD: 0,
            extraOptions: "",
            composeMsg: ""
        });
        
        SovaBTCOFT.MessagingFee memory fee = SovaBTCOFT.MessagingFee({
            nativeFee: 0.001 ether,
            lzTokenFee: 0
        });
        
        vm.expectRevert(SovaBTCOFT.ZeroAmount.selector);
        sovaBTCOFT.send{value: 0.001 ether}(sendParam, fee, user1);
    }

    function test_Send_InvalidPeer() public {
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: 999, // Invalid peer
            to: bytes32(uint256(uint160(user1))),
            amountLD: 1000000,
            minAmountLD: 1000000,
            extraOptions: "",
            composeMsg: ""
        });
        
        SovaBTCOFT.MessagingFee memory fee = SovaBTCOFT.MessagingFee({
            nativeFee: 0.001 ether,
            lzTokenFee: 0
        });
        
        vm.expectRevert(abi.encodeWithSelector(SovaBTCOFT.InvalidPeer.selector, 999));
        sovaBTCOFT.send{value: 0.001 ether}(sendParam, fee, user1);
    }

    function test_Send_InsufficientFee() public {
        // Set up peer first
        vm.prank(owner);
        sovaBTCOFT.setPeer(1, bytes32(uint256(uint160(address(0x123)))));
        
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: 1,
            to: bytes32(uint256(uint160(user1))),
            amountLD: 1000000,
            minAmountLD: 1000000,
            extraOptions: "",
            composeMsg: ""
        });
        
        SovaBTCOFT.MessagingFee memory fee = SovaBTCOFT.MessagingFee({
            nativeFee: 0.001 ether,
            lzTokenFee: 0
        });
        
        vm.expectRevert("Insufficient fee");
        sovaBTCOFT.send{value: 0.0005 ether}(sendParam, fee, user1);
    }

    function test_Send_InsufficientBalance() public {
        // Set up peer first
        vm.prank(owner);
        sovaBTCOFT.setPeer(1, bytes32(uint256(uint160(address(0x123)))));
        
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: 1,
            to: bytes32(uint256(uint160(user1))),
            amountLD: 1000000,
            minAmountLD: 1000000,
            extraOptions: "",
            composeMsg: ""
        });
        
        SovaBTCOFT.MessagingFee memory fee = SovaBTCOFT.MessagingFee({
            nativeFee: 0.001 ether,
            lzTokenFee: 0
        });
        
        vm.expectRevert("Insufficient balance");
        sovaBTCOFT.send{value: 0.001 ether}(sendParam, fee, user1);
    }

    function test_Send_Success_WithExcessFee() public {
        // Set up peer first
        vm.prank(owner);
        sovaBTCOFT.setPeer(1, bytes32(uint256(uint160(address(0x123)))));
        
        // Mint tokens to user1
        vm.prank(minter);
        sovaBTCOFT.adminMint(user1, 2000000);
        
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: 1,
            to: bytes32(uint256(uint160(user2))),
            amountLD: 1000000,
            minAmountLD: 1000000,
            extraOptions: "",
            composeMsg: ""
        });
        
        SovaBTCOFT.MessagingFee memory fee = SovaBTCOFT.MessagingFee({
            nativeFee: 0.001 ether,
            lzTokenFee: 0
        });
        
        uint256 initialBalance = user1.balance;
        vm.deal(user1, 2 ether);
        
        vm.prank(user1);
        // Send with excess fee to cover line 212: payable(_refundAddress).transfer(msg.value - _fee.nativeFee);
        (SovaBTCOFT.MessagingReceipt memory msgReceipt, SovaBTCOFT.OFTReceipt memory oftReceipt) = 
            sovaBTCOFT.send{value: 0.002 ether}(sendParam, fee, user1);
        
        // Check refund was processed
        assertEq(user1.balance, 2 ether - 0.001 ether);
        
        // Check receipts
        assertEq(oftReceipt.amountSentLD, 1000000);
        assertEq(oftReceipt.amountReceivedLD, 1000000);
        assertTrue(msgReceipt.guid != bytes32(0));
        
        // Check tokens were burned
        assertEq(sovaBTCOFT.balanceOf(user1), 1000000);
    }

    function test_Send_Success_ExactFee() public {
        // Set up peer first
        vm.prank(owner);
        sovaBTCOFT.setPeer(1, bytes32(uint256(uint160(address(0x123)))));
        
        // Mint tokens to user1
        vm.prank(minter);
        sovaBTCOFT.adminMint(user1, 2000000);
        
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: 1,
            to: bytes32(uint256(uint160(user2))),
            amountLD: 1000000,
            minAmountLD: 1000000,
            extraOptions: "",
            composeMsg: ""
        });
        
        SovaBTCOFT.MessagingFee memory fee = SovaBTCOFT.MessagingFee({
            nativeFee: 0.001 ether,
            lzTokenFee: 0
        });
        
        vm.deal(user1, 1 ether);
        
        vm.prank(user1);
        sovaBTCOFT.send{value: 0.001 ether}(sendParam, fee, user1);
        
        // Check exact fee was used, no refund
        assertEq(user1.balance, 1 ether - 0.001 ether);
        assertEq(sovaBTCOFT.balanceOf(user1), 1000000);
    }

    function test_Send_WhenPaused() public {
        // Pause contract
        vm.prank(owner);
        sovaBTCOFT.pause();
        
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: 1,
            to: bytes32(uint256(uint160(user1))),
            amountLD: 1000000,
            minAmountLD: 1000000,
            extraOptions: "",
            composeMsg: ""
        });
        
        SovaBTCOFT.MessagingFee memory fee = SovaBTCOFT.MessagingFee({
            nativeFee: 0.001 ether,
            lzTokenFee: 0
        });
        
        vm.expectRevert(SovaBTCOFT.ContractPaused.selector);
        sovaBTCOFT.send{value: 0.001 ether}(sendParam, fee, user1);
    }

    // ============ Simulate Receive Tests ============

    function test_SimulateReceive_ZeroAmount() public {
        vm.prank(endpoint);
        vm.expectRevert(SovaBTCOFT.ZeroAmount.selector);
        sovaBTCOFT.simulateReceive(1, user1, 0);
    }

    function test_SimulateReceive_ZeroAddress() public {
        vm.prank(endpoint);
        vm.expectRevert(SovaBTCOFT.ZeroAddress.selector);
        sovaBTCOFT.simulateReceive(1, address(0), 1000000);
    }

    function test_SimulateReceive_OnlyEndpoint() public {
        vm.prank(user1);
        vm.expectRevert(SovaBTCOFT.InvalidEndpoint.selector);
        sovaBTCOFT.simulateReceive(1, user1, 1000000);
    }

    function test_SimulateReceive_Success() public {
        vm.prank(endpoint);
        sovaBTCOFT.simulateReceive(1, user1, 1000000);
        
        assertEq(sovaBTCOFT.balanceOf(user1), 1000000);
    }

    function test_SimulateReceive_WhenPaused() public {
        vm.prank(owner);
        sovaBTCOFT.pause();
        
        vm.prank(endpoint);
        vm.expectRevert(SovaBTCOFT.ContractPaused.selector);
        sovaBTCOFT.simulateReceive(1, user1, 1000000);
    }

    // ============ Admin Function Tests ============

    function test_SetPeer_Success() public {
        bytes32 peer = bytes32(uint256(uint160(address(0x123))));
        
        vm.prank(owner);
        sovaBTCOFT.setPeer(1, peer);
        
        assertEq(sovaBTCOFT.peers(1), peer);
    }

    function test_SetPeer_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        sovaBTCOFT.setPeer(1, bytes32(uint256(uint160(address(0x123)))));
    }

    function test_SetMinter_Success() public {
        address newMinter = address(0x999);
        
        vm.prank(owner);
        sovaBTCOFT.setMinter(newMinter);
        
        assertEq(sovaBTCOFT.minter(), newMinter);
    }

    function test_SetMinter_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(SovaBTCOFT.ZeroAddress.selector);
        sovaBTCOFT.setMinter(address(0));
    }

    function test_SetMinter_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        sovaBTCOFT.setMinter(address(0x999));
    }

    function test_AdminMint_Success() public {
        vm.prank(minter);
        sovaBTCOFT.adminMint(user1, 1000000);
        
        assertEq(sovaBTCOFT.balanceOf(user1), 1000000);
    }

    function test_AdminMint_ZeroAmount() public {
        vm.prank(minter);
        vm.expectRevert(SovaBTCOFT.ZeroAmount.selector);
        sovaBTCOFT.adminMint(user1, 0);
    }

    function test_AdminMint_OnlyMinter() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(SovaBTCOFT.UnauthorizedMinter.selector, user1));
        sovaBTCOFT.adminMint(user1, 1000000);
    }

    function test_AdminBurn_Success() public {
        // First mint some tokens
        vm.prank(minter);
        sovaBTCOFT.adminMint(user1, 1000000);
        
        vm.prank(minter);
        sovaBTCOFT.adminBurn(user1, 500000);
        
        assertEq(sovaBTCOFT.balanceOf(user1), 500000);
    }

    function test_AdminBurn_ZeroAmount() public {
        vm.prank(minter);
        vm.expectRevert(SovaBTCOFT.ZeroAmount.selector);
        sovaBTCOFT.adminBurn(user1, 0);
    }

    function test_AdminBurn_OnlyMinter() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(SovaBTCOFT.UnauthorizedMinter.selector, user1));
        sovaBTCOFT.adminBurn(user1, 1000000);
    }

    function test_Pause_Success() public {
        vm.prank(owner);
        sovaBTCOFT.pause();
        
        assertTrue(sovaBTCOFT.isPaused());
    }

    function test_Pause_AlreadyPaused() public {
        vm.prank(owner);
        sovaBTCOFT.pause();
        
        // This covers line 288: if (_paused) revert ContractPaused();
        vm.prank(owner);
        vm.expectRevert(SovaBTCOFT.ContractPaused.selector);
        sovaBTCOFT.pause();
    }

    function test_Pause_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        sovaBTCOFT.pause();
    }

    function test_Unpause_Success() public {
        vm.startPrank(owner);
        sovaBTCOFT.pause();
        sovaBTCOFT.unpause();
        vm.stopPrank();
        
        assertFalse(sovaBTCOFT.isPaused());
    }

    function test_Unpause_NotPaused() public {
        vm.prank(owner);
        vm.expectRevert("Contract not paused");
        sovaBTCOFT.unpause();
    }

    function test_Unpause_OnlyOwner() public {
        vm.prank(owner);
        sovaBTCOFT.pause();
        
        vm.prank(user1);
        vm.expectRevert();
        sovaBTCOFT.unpause();
    }

    // ============ ISovaBTC Compatibility Tests ============

    function test_IsPaused() public {
        assertFalse(sovaBTCOFT.isPaused());
        
        vm.prank(owner);
        sovaBTCOFT.pause();
        
        assertTrue(sovaBTCOFT.isPaused());
    }

    function test_SetMinDepositAmount_Success() public {
        // This covers lines 308-309
        vm.prank(owner);
        sovaBTCOFT.setMinDepositAmount(50000);
        
        assertEq(sovaBTCOFT.minDepositAmount(), 50000);
    }

    function test_SetMinDepositAmount_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        sovaBTCOFT.setMinDepositAmount(50000);
    }

    function test_SetMaxDepositAmount_Success() public {
        // This covers lines 312-313
        vm.prank(owner);
        sovaBTCOFT.setMaxDepositAmount(200_000_000_000);
        
        assertEq(sovaBTCOFT.maxDepositAmount(), 200_000_000_000);
    }

    function test_SetMaxDepositAmount_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        sovaBTCOFT.setMaxDepositAmount(200_000_000_000);
    }

    function test_SetMaxGasLimitAmount_Success() public {
        // This covers lines 316-317
        vm.prank(owner);
        sovaBTCOFT.setMaxGasLimitAmount(100_000_000);
        
        assertEq(sovaBTCOFT.maxGasLimitAmount(), 100_000_000);
    }

    function test_SetMaxGasLimitAmount_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        sovaBTCOFT.setMaxGasLimitAmount(100_000_000);
    }

    function test_DepositBTC_NotImplemented() public {
        vm.expectRevert("Not implemented for OFT");
        sovaBTCOFT.depositBTC(1000000, "");
    }

    function test_Withdraw_NotImplemented() public {
        vm.expectRevert("Not implemented for OFT");
        sovaBTCOFT.withdraw(1000000, 50000, 800000, "bc1test123");
    }

    function test_IsTransactionUsed_ReturnsFalse() public {
        bool result = sovaBTCOFT.isTransactionUsed(bytes32(uint256(123)));
        assertFalse(result);
    }

    // ============ Additional Coverage for Missing Lines ============

    function test_QuoteSend_ReturnStatement_Coverage() public {
        // This test specifically targets line 162: return fee statement
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: 1,
            to: bytes32(uint256(uint160(user1))),
            amountLD: 1000000,
            minAmountLD: 1000000,
            extraOptions: "",
            composeMsg: ""
        });
        
        // Call both branches to ensure the return statement is hit
        SovaBTCOFT.MessagingFee memory fee1 = sovaBTCOFT.quoteSend(sendParam, false);
        SovaBTCOFT.MessagingFee memory fee2 = sovaBTCOFT.quoteSend(sendParam, true);
        
        // Verify both returns worked
        assertNotEq(fee1.lzTokenFee, fee2.lzTokenFee);
        assertEq(fee1.nativeFee, fee2.nativeFee);
        
        // Multiple assertions to force usage of return values
        assertEq(fee1.lzTokenFee, 0);
        assertEq(fee2.lzTokenFee, 100e18);
        assertEq(fee1.nativeFee, 0.001 ether);
        assertEq(fee2.nativeFee, 0.001 ether);
        
        // Try different parameters to hit different code paths
        sendParam.amountLD = 5000000;
        SovaBTCOFT.MessagingFee memory fee3 = sovaBTCOFT.quoteSend(sendParam, false);
        assertEq(fee3.lzTokenFee, 0);
        
        // Test with empty options
        sendParam.extraOptions = "";
        sendParam.composeMsg = "";
        SovaBTCOFT.MessagingFee memory fee4 = sovaBTCOFT.quoteSend(sendParam, true);
        assertEq(fee4.lzTokenFee, 100e18);
        
        // Force multiple return statement executions
        for (uint i = 0; i < 3; i++) {
            sendParam.amountLD = 1000000 + i;
            SovaBTCOFT.MessagingFee memory feeLoop = sovaBTCOFT.quoteSend(sendParam, i % 2 == 0);
            assertTrue(feeLoop.nativeFee > 0);
        }
    }

    // ============ Additional Line Coverage Tests ============

    function test_QuoteSend_ForceReturnStatementExecution() public {
        // This test forces execution of the return statement multiple times
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: 1,
            to: bytes32(uint256(uint160(user1))),
            amountLD: 1000000,
            minAmountLD: 1000000,
            extraOptions: "",
            composeMsg: ""
        });
        
        // Multiple sequential calls to force return statement execution
        SovaBTCOFT.MessagingFee memory result;
        
        // Call 1
        result = sovaBTCOFT.quoteSend(sendParam, false);
        require(result.nativeFee > 0, "Fee should be positive");
        
        // Call 2  
        result = sovaBTCOFT.quoteSend(sendParam, true);
        require(result.lzTokenFee > 0, "LZ token fee should be positive");
        
        // Call 3 with different params
        sendParam.dstEid = 2;
        result = sovaBTCOFT.quoteSend(sendParam, false);
        require(result.nativeFee > 0, "Fee should be positive for dst 2");
        
        // Call 4 with different amount
        sendParam.amountLD = 2000000;
        result = sovaBTCOFT.quoteSend(sendParam, true);
        require(result.nativeFee > 0, "Fee should be positive for amount 2M");
    }

    // ============ Integration Tests ============

    function test_FullCrossChainFlow() public {
        // Set up peer
        vm.prank(owner);
        sovaBTCOFT.setPeer(1, bytes32(uint256(uint160(address(0x123)))));
        
        // Mint initial tokens
        vm.prank(minter);
        sovaBTCOFT.adminMint(user1, 5000000);
        
        // User1 sends cross-chain
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: 1,
            to: bytes32(uint256(uint160(user2))),
            amountLD: 2000000,
            minAmountLD: 2000000,
            extraOptions: "",
            composeMsg: ""
        });
        
        SovaBTCOFT.MessagingFee memory fee = SovaBTCOFT.MessagingFee({
            nativeFee: 0.001 ether,
            lzTokenFee: 0
        });
        
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        sovaBTCOFT.send{value: 0.001 ether}(sendParam, fee, user1);
        
        // Check source chain burn
        assertEq(sovaBTCOFT.balanceOf(user1), 3000000);
        
        // Simulate receive on destination
        vm.prank(endpoint);
        sovaBTCOFT.simulateReceive(1, user2, 2000000);
        
        // Check destination chain mint
        assertEq(sovaBTCOFT.balanceOf(user2), 2000000);
    }

    function test_AdminOperations() public {
        // Test minter change
        address newMinter = address(0x777);
        vm.prank(owner);
        sovaBTCOFT.setMinter(newMinter);
        
        // Test with new minter
        vm.prank(newMinter);
        sovaBTCOFT.adminMint(user1, 1000000);
        assertEq(sovaBTCOFT.balanceOf(user1), 1000000);
        
        // Test limit changes
        vm.startPrank(owner);
        sovaBTCOFT.setMinDepositAmount(20000);
        sovaBTCOFT.setMaxDepositAmount(500_000_000_000);
        sovaBTCOFT.setMaxGasLimitAmount(75_000_000);
        vm.stopPrank();
        
        assertEq(sovaBTCOFT.minDepositAmount(), 20000);
        assertEq(sovaBTCOFT.maxDepositAmount(), 500_000_000_000);
        assertEq(sovaBTCOFT.maxGasLimitAmount(), 75_000_000);
    }

    function test_PauseWorkflow() public {
        // Mint some tokens
        vm.prank(minter);
        sovaBTCOFT.adminMint(user1, 1000000);
        
        // Set up peer
        vm.prank(owner);
        sovaBTCOFT.setPeer(1, bytes32(uint256(uint160(address(0x123)))));
        
        // Pause contract
        vm.prank(owner);
        sovaBTCOFT.pause();
        
        // Test that operations are blocked
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: 1,
            to: bytes32(uint256(uint160(user2))),
            amountLD: 500000,
            minAmountLD: 500000,
            extraOptions: "",
            composeMsg: ""
        });
        
        SovaBTCOFT.MessagingFee memory fee = SovaBTCOFT.MessagingFee({
            nativeFee: 0.001 ether,
            lzTokenFee: 0
        });
        
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        vm.expectRevert(SovaBTCOFT.ContractPaused.selector);
        sovaBTCOFT.send{value: 0.001 ether}(sendParam, fee, user1);
        
        vm.prank(endpoint);
        vm.expectRevert(SovaBTCOFT.ContractPaused.selector);
        sovaBTCOFT.simulateReceive(1, user2, 500000);
        
        // Unpause and test operations work again
        vm.prank(owner);
        sovaBTCOFT.unpause();
        
        vm.prank(user1);
        sovaBTCOFT.send{value: 0.001 ether}(sendParam, fee, user1);
        assertEq(sovaBTCOFT.balanceOf(user1), 500000);
    }
} 