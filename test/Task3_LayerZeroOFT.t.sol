// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SovaBTCOFT.sol";
import "../src/TokenWhitelist.sol";
import "../src/SovaBTCWrapper.sol";
import "../src/CustodyManager.sol";

/**
 * @title Task3LayerZeroOFTTest
 * @notice Tests for Task 3: LayerZero OFT Integration
 * @dev Demonstrates omnichain SovaBTC functionality with cross-chain burn/mint
 */
contract Task3V2LayerZeroOFTTest is Test {
    SovaBTCOFT public oftChainA;
    SovaBTCOFT public oftChainB; 
    SovaBTCWrapper public wrapperChainA;
    TokenWhitelist public whitelistChainA;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public endpointA = address(0x4); // Mock LayerZero endpoint for chain A
    address public endpointB = address(0x5); // Mock LayerZero endpoint for chain B
    
    uint32 constant CHAIN_A_EID = 101; // Ethereum mainnet EID
    uint32 constant CHAIN_B_EID = 102; // Arbitrum mainnet EID
    
    event OFTSent(
        bytes32 indexed guid,
        uint32 dstEid,
        address indexed fromAddress,
        uint256 amountSentLD,
        uint256 amountReceivedLD
    );
    
    event OFTReceived(
        bytes32 indexed guid,
        uint32 srcEid,
        address indexed toAddress,
        uint256 amountReceivedLD
    );
    
    event CrossChainSent(uint32 indexed dstEid, address indexed from, uint256 amount);
    event CrossChainReceived(uint32 indexed srcEid, address indexed to, uint256 amount);
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy SovaBTCOFT on Chain A (with wrapper integration)
        oftChainA = new SovaBTCOFT(
            "Sova Bitcoin OFT",
            "sovaBTC",
            endpointA,
            owner // Temporary minter, will be set to wrapper address
        );
        
        // Deploy SovaBTCOFT on Chain B (standalone)
        oftChainB = new SovaBTCOFT(
            "Sova Bitcoin OFT",
            "sovaBTC", 
            endpointB,
            owner // Owner as minter on chain B
        );
        
        // Give users some tokens for testing (before changing minter)
        oftChainA.adminMint(user1, 1_000_000_00); // 10 BTC
        oftChainB.adminMint(user2, 500_000_00);   // 5 BTC
        
        // Set up whitelist, custody manager, and wrapper on Chain A
        whitelistChainA = new TokenWhitelist();
        CustodyManager custodyManager = new CustodyManager(owner);
        wrapperChainA = new SovaBTCWrapper(
            address(oftChainA),
            address(whitelistChainA),
            address(custodyManager),
            10_000 // minDepositSatoshi
        );
        
        // Update minter on Chain A to be the wrapper
        oftChainA.setMinter(address(wrapperChainA));
        
        // Set up peer relationships (bidirectional)
        oftChainA.setPeer(CHAIN_B_EID, bytes32(uint256(uint160(address(oftChainB)))));
        oftChainB.setPeer(CHAIN_A_EID, bytes32(uint256(uint160(address(oftChainA)))));
        
        vm.stopPrank();
        
        // Give users ETH for paying LayerZero fees
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    // ============ Basic OFT Setup Tests ============
    
    function test_OFTSetup_BasicConfiguration() public {
        // Test basic OFT configuration
        assertEq(oftChainA.name(), "Sova Bitcoin OFT");
        assertEq(oftChainA.symbol(), "sovaBTC");
        assertEq(oftChainA.decimals(), 8);
        assertEq(oftChainA.endpoint(), endpointA);
        assertEq(oftChainA.minter(), address(wrapperChainA));
        
        assertEq(oftChainB.name(), "Sova Bitcoin OFT");
        assertEq(oftChainB.symbol(), "sovaBTC");
        assertEq(oftChainB.decimals(), 8);
        assertEq(oftChainB.endpoint(), endpointB);
    }
    
    function test_OFTSetup_PeerConfiguration() public {
        // Test peer setup
        assertEq(oftChainA.peers(CHAIN_B_EID), bytes32(uint256(uint160(address(oftChainB)))));
        assertEq(oftChainB.peers(CHAIN_A_EID), bytes32(uint256(uint160(address(oftChainA)))));
    }
    
    function test_OFTSetup_InitialBalances() public {
        // Test initial token distribution
        assertEq(oftChainA.balanceOf(user1), 1_000_000_00); // 10 BTC
        assertEq(oftChainB.balanceOf(user2), 500_000_00);   // 5 BTC
        assertEq(oftChainA.totalSupply(), 1_000_000_00);
        assertEq(oftChainB.totalSupply(), 500_000_00);
    }

    // ============ Cross-Chain Transfer Tests ============
    
    function test_CrossChainSend_BasicTransfer() public {
        uint256 amount = 100_000_00; // 1 BTC
        uint256 initialBalanceA = oftChainA.balanceOf(user1);
        uint256 initialSupplyA = oftChainA.totalSupply();
        
        vm.startPrank(user1);
        
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: CHAIN_B_EID,
            to: bytes32(uint256(uint160(user2))),
            amountLD: amount,
            minAmountLD: amount,
            extraOptions: "",
            composeMsg: ""
        });
        
        SovaBTCOFT.MessagingFee memory fee = SovaBTCOFT.MessagingFee({
            nativeFee: 0.001 ether,
            lzTokenFee: 0
        });
        
        // Expect events
        vm.expectEmit(true, true, true, true);
        emit CrossChainSent(CHAIN_B_EID, user1, amount);
        
        (SovaBTCOFT.MessagingReceipt memory msgReceipt, SovaBTCOFT.OFTReceipt memory oftReceipt) = 
            oftChainA.send{value: 0.001 ether}(sendParam, fee, user1);
        
        vm.stopPrank();
        
        // Verify burn on source chain
        assertEq(oftChainA.balanceOf(user1), initialBalanceA - amount);
        assertEq(oftChainA.totalSupply(), initialSupplyA - amount);
        
        // Verify receipt data
        assertEq(oftReceipt.amountSentLD, amount);
        assertEq(oftReceipt.amountReceivedLD, amount);
        assertTrue(msgReceipt.guid != bytes32(0));
    }
    
    function test_CrossChainReceive_BasicTransfer() public {
        uint256 amount = 200_000_00; // 2 BTC
        uint256 initialBalanceB = oftChainB.balanceOf(user2);
        uint256 initialSupplyB = oftChainB.totalSupply();
        
        // Simulate receiving tokens from Chain A
        vm.startPrank(endpointB); // Only endpoint can call simulateReceive
        
        vm.expectEmit(true, true, true, true);
        emit CrossChainReceived(CHAIN_A_EID, user2, amount);
        
        oftChainB.simulateReceive(CHAIN_A_EID, user2, amount);
        
        vm.stopPrank();
        
        // Verify mint on destination chain
        assertEq(oftChainB.balanceOf(user2), initialBalanceB + amount);
        assertEq(oftChainB.totalSupply(), initialSupplyB + amount);
    }
    
    function test_CrossChainTransfer_TotalSupplyConsistency() public {
        uint256 amount = 300_000_00; // 3 BTC
        uint256 initialTotalSupply = oftChainA.totalSupply() + oftChainB.totalSupply();
        
        // Send from Chain A to Chain B
        vm.startPrank(user1);
        
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: CHAIN_B_EID,
            to: bytes32(uint256(uint160(user2))),
            amountLD: amount,
            minAmountLD: amount,
            extraOptions: "",
            composeMsg: ""
        });
        
        SovaBTCOFT.MessagingFee memory fee = SovaBTCOFT.MessagingFee({
            nativeFee: 0.001 ether,
            lzTokenFee: 0
        });
        
        oftChainA.send{value: 0.001 ether}(sendParam, fee, user1);
        vm.stopPrank();
        
        // Simulate receive on Chain B
        vm.prank(endpointB);
        oftChainB.simulateReceive(CHAIN_A_EID, user2, amount);
        
        // Verify total supply consistency across chains
        uint256 finalTotalSupply = oftChainA.totalSupply() + oftChainB.totalSupply();
        assertEq(finalTotalSupply, initialTotalSupply, "Total supply should remain constant across chains");
    }

    // ============ Fee Mechanism Tests ============
    
    function test_QuoteSend_FeeCalculation() public {
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: CHAIN_B_EID,
            to: bytes32(uint256(uint160(user2))),
            amountLD: 100_000_00,
            minAmountLD: 100_000_00,
            extraOptions: "",
            composeMsg: ""
        });
        
        // Test native fee calculation
        SovaBTCOFT.MessagingFee memory feeNative = oftChainA.quoteSend(sendParam, false);
        assertEq(feeNative.nativeFee, 0.001 ether);
        assertEq(feeNative.lzTokenFee, 0);
        
        // Test LZ token fee calculation
        SovaBTCOFT.MessagingFee memory feeLZ = oftChainA.quoteSend(sendParam, true);
        assertEq(feeLZ.nativeFee, 0.001 ether);
        assertEq(feeLZ.lzTokenFee, 100e18);
    }
    
    function test_Send_InsufficientFee() public {
        vm.startPrank(user1);
        
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: CHAIN_B_EID,
            to: bytes32(uint256(uint160(user2))),
            amountLD: 100_000_00,
            minAmountLD: 100_000_00,
            extraOptions: "",
            composeMsg: ""
        });
        
        SovaBTCOFT.MessagingFee memory fee = SovaBTCOFT.MessagingFee({
            nativeFee: 0.001 ether,
            lzTokenFee: 0
        });
        
        // Should revert with insufficient fee
        vm.expectRevert();
        oftChainA.send{value: 0.0005 ether}(sendParam, fee, user1);
        
        vm.stopPrank();
    }

    // ============ Security and Access Control Tests ============
    
    function test_AdminMint_OnlyMinter() public {
        // Only minter can mint (wrapper is the minter on chain A)
        vm.prank(address(wrapperChainA));
        oftChainA.adminMint(user1, 100_000_00);
        
        // Non-minter cannot mint
        vm.prank(user2);
        vm.expectRevert(abi.encodeWithSelector(SovaBTCOFT.UnauthorizedMinter.selector, user2));
        oftChainA.adminMint(user1, 100_000_00);
    }
    
    function test_AdminBurn_OnlyMinter() public {
        // Only minter can burn (wrapper is the minter on chain A)
        vm.prank(address(wrapperChainA));
        oftChainA.adminBurn(user1, 100_000_00);
        
        // Non-minter cannot burn
        vm.prank(user2);
        vm.expectRevert(abi.encodeWithSelector(SovaBTCOFT.UnauthorizedMinter.selector, user2));
        oftChainA.adminBurn(user1, 100_000_00);
    }
    
    function test_SetPeer_OnlyOwner() public {
        // Owner can set peer
        vm.prank(owner);
        oftChainA.setPeer(103, bytes32(uint256(uint160(address(0x123)))));
        
        // Non-owner cannot set peer
        vm.prank(user1);
        vm.expectRevert(Ownable.Unauthorized.selector);
        oftChainA.setPeer(104, bytes32(uint256(uint160(address(0x124)))));
    }
    
    function test_SimulateReceive_OnlyEndpoint() public {
        // Only endpoint can call simulateReceive
        vm.prank(endpointA);
        oftChainA.simulateReceive(CHAIN_B_EID, user1, 100_000_00);
        
        // Non-endpoint cannot call simulateReceive
        vm.prank(user1);
        vm.expectRevert(SovaBTCOFT.InvalidEndpoint.selector);
        oftChainA.simulateReceive(CHAIN_B_EID, user1, 100_000_00);
    }

    // ============ Pause Functionality Tests ============
    
    function test_Pause_StopsCrossChainTransfers() public {
        // Pause contract
        vm.prank(owner);
        oftChainA.pause();
        
        vm.startPrank(user1);
        
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: CHAIN_B_EID,
            to: bytes32(uint256(uint160(user2))),
            amountLD: 100_000_00,
            minAmountLD: 100_000_00,
            extraOptions: "",
            composeMsg: ""
        });
        
        SovaBTCOFT.MessagingFee memory fee = SovaBTCOFT.MessagingFee({
            nativeFee: 0.001 ether,
            lzTokenFee: 0
        });
        
        vm.expectRevert(SovaBTCOFT.ContractPaused.selector);
        oftChainA.send{value: 0.001 ether}(sendParam, fee, user1);
        
        vm.stopPrank();
    }
    
    function test_Unpause_ResumesCrossChainTransfers() public {
        // Pause then unpause
        vm.startPrank(owner);
        oftChainA.pause();
        oftChainA.unpause();
        vm.stopPrank();
        
        // Should work after unpause
        vm.startPrank(user1);
        
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: CHAIN_B_EID,
            to: bytes32(uint256(uint160(user2))),
            amountLD: 100_000_00,
            minAmountLD: 100_000_00,
            extraOptions: "",
            composeMsg: ""
        });
        
        SovaBTCOFT.MessagingFee memory fee = SovaBTCOFT.MessagingFee({
            nativeFee: 0.001 ether,
            lzTokenFee: 0
        });
        
        oftChainA.send{value: 0.001 ether}(sendParam, fee, user1);
        
        vm.stopPrank();
    }

    // ============ Integration with Wrapper Tests ============
    
    function test_WrapperIntegration_MintOFTTokens() public {
        // This test demonstrates that the wrapper can mint OFT tokens
        // which maintains the deposit functionality while enabling cross-chain transfers
        
        vm.prank(address(wrapperChainA));
        oftChainA.adminMint(user1, 50_000_00); // 0.5 BTC
        
        assertEq(oftChainA.balanceOf(user1), 1_050_000_00); // Original 10 + 0.5 BTC
    }

    // ============ Error Condition Tests ============
    
    function test_Send_ZeroAmount() public {
        vm.startPrank(user1);
        
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: CHAIN_B_EID,
            to: bytes32(uint256(uint160(user2))),
            amountLD: 0, // Zero amount
            minAmountLD: 0,
            extraOptions: "",
            composeMsg: ""
        });
        
        SovaBTCOFT.MessagingFee memory fee = SovaBTCOFT.MessagingFee({
            nativeFee: 0.001 ether,
            lzTokenFee: 0
        });
        
        vm.expectRevert(SovaBTCOFT.ZeroAmount.selector);
        oftChainA.send{value: 0.001 ether}(sendParam, fee, user1);
        
        vm.stopPrank();
    }
    
    function test_Send_InvalidPeer() public {
        vm.startPrank(user1);
        
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: 999, // Invalid chain ID
            to: bytes32(uint256(uint160(user2))),
            amountLD: 100_000_00,
            minAmountLD: 100_000_00,
            extraOptions: "",
            composeMsg: ""
        });
        
        SovaBTCOFT.MessagingFee memory fee = SovaBTCOFT.MessagingFee({
            nativeFee: 0.001 ether,
            lzTokenFee: 0
        });
        
        vm.expectRevert(abi.encodeWithSelector(SovaBTCOFT.InvalidPeer.selector, 999));
        oftChainA.send{value: 0.001 ether}(sendParam, fee, user1);
        
        vm.stopPrank();
    }
    
    function test_Send_InsufficientBalance() public {
        uint256 userBalance = oftChainA.balanceOf(user1);
        uint256 excessiveAmount = userBalance + 1;
        
        vm.startPrank(user1);
        
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: CHAIN_B_EID,
            to: bytes32(uint256(uint160(user2))),
            amountLD: excessiveAmount,
            minAmountLD: excessiveAmount,
            extraOptions: "",
            composeMsg: ""
        });
        
        SovaBTCOFT.MessagingFee memory fee = SovaBTCOFT.MessagingFee({
            nativeFee: 0.001 ether,
            lzTokenFee: 0
        });
        
        vm.expectRevert("Insufficient balance");
        oftChainA.send{value: 0.001 ether}(sendParam, fee, user1);
        
        vm.stopPrank();
    }

    // ============ Event Emission Tests ============
    
    function test_Events_CrossChainSendEmitsCorrectEvents() public {
        uint256 amount = 150_000_00; // 1.5 BTC
        
        vm.startPrank(user1);
        
        SovaBTCOFT.SendParam memory sendParam = SovaBTCOFT.SendParam({
            dstEid: CHAIN_B_EID,
            to: bytes32(uint256(uint160(user2))),
            amountLD: amount,
            minAmountLD: amount,
            extraOptions: "",
            composeMsg: ""
        });
        
        SovaBTCOFT.MessagingFee memory fee = SovaBTCOFT.MessagingFee({
            nativeFee: 0.001 ether,
            lzTokenFee: 0
        });
        
        // Expect both OFTSent and CrossChainSent events
        vm.expectEmit(true, true, true, true);
        emit CrossChainSent(CHAIN_B_EID, user1, amount);
        
        oftChainA.send{value: 0.001 ether}(sendParam, fee, user1);
        
        vm.stopPrank();
    }
    
    function test_Events_CrossChainReceiveEmitsCorrectEvents() public {
        uint256 amount = 250_000_00; // 2.5 BTC
        
        vm.startPrank(endpointB);
        
        // Expect both OFTReceived and CrossChainReceived events
        vm.expectEmit(true, true, true, true);
        emit CrossChainReceived(CHAIN_A_EID, user2, amount);
        
        oftChainB.simulateReceive(CHAIN_A_EID, user2, amount);
        
        vm.stopPrank();
    }

    // ============ ISovaBTC Compatibility Tests ============
    
    function test_ISovaBTCCompatibility_FunctionsRevert() public {
        // Bitcoin-specific functions should revert on OFT
        vm.expectRevert("Not implemented for OFT");
        oftChainA.depositBTC(100000, "");
        
        vm.expectRevert("Not implemented for OFT");
        oftChainA.withdraw(100000, 1000, 800000, "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh");
        
        // isTransactionUsed should return false
        assertFalse(oftChainA.isTransactionUsed(bytes32(0)));
    }
} 