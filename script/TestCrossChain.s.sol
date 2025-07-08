// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {SovaBTCOFT} from "../src/SovaBTCOFT.sol";
import { SendParam, MessagingFee, MessagingReceipt, OFTReceipt } from "@layerzerolabs/oft-evm/contracts/interfaces/IOFT.sol";

/**
 * @title TestCrossChain
 * @notice Test script for LayerZero OFT cross-chain transfers
 * @dev Tests token transfers between different networks
 */
contract TestCrossChain is Script {
    // ============ Test Configuration ============
    
    struct NetworkConfig {
        uint32 layerZeroEid;
        address oftContract;
        string name;
    }

    mapping(uint256 => NetworkConfig) public networkConfigs;

    constructor() {
        // Network configurations (ACTIVE DEPLOYED ADDRESSES - MATCHES FRONTEND)
        networkConfigs[11155111] = NetworkConfig({
            layerZeroEid: 40161,
            oftContract: 0xf059C386BA88DA3C3919eDe0E6209B66C4D3DeE1, // DEPLOYED AND CROSS-CHAIN ENABLED
            name: "Ethereum Sepolia"
        });

        networkConfigs[11155420] = NetworkConfig({
            layerZeroEid: 40232,
            oftContract: 0x00626Ed5FE6Bf77Ae13BEa79e304CF6A5554903b, // DEPLOYED AND CROSS-CHAIN ENABLED
            name: "Optimism Sepolia"
        });

        networkConfigs[84532] = NetworkConfig({
            layerZeroEid: 40245,
            oftContract: 0x802Ea91b5aAf53D067b0bB72bAD4Cc714e1855Be, // DEPLOYED AND CROSS-CHAIN ENABLED
            name: "Base Sepolia"
        });

        networkConfigs[421614] = NetworkConfig({
            layerZeroEid: 40231,
            oftContract: address(0), // Not deployed yet
            name: "Arbitrum Sepolia"
        });
    }

    // ============ Main Test Function ============

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        
        vm.startBroadcast(deployerKey);

        console.log("=== Testing LayerZero OFT Cross-Chain Transfers ===");
        console.log("Deployer:", deployer);
        console.log("Current Chain ID:", block.chainid);
        console.log("Current Network:", networkConfigs[block.chainid].name);
        console.log("");

        // Get current network configuration
        NetworkConfig memory currentNetwork = networkConfigs[block.chainid];
        require(currentNetwork.oftContract != address(0), "OFT contract address not configured for current network");

        SovaBTCOFT currentOFT = SovaBTCOFT(currentNetwork.oftContract);
        
        // Test transfers to all other networks
        testTransfersToAllNetworks(currentOFT, currentNetwork, deployer);

        vm.stopBroadcast();

        console.log("=== Cross-Chain Test Complete ===");
    }

    // ============ Test Functions ============

    function testTransfersToAllNetworks(
        SovaBTCOFT currentOFT,
        NetworkConfig memory currentNetwork,
        address deployer
    ) internal {
        console.log("Testing transfers from %s to all other networks...", currentNetwork.name);
        console.log("");

        // Test amount (0.001 BTC = 100,000 satoshis)
        uint256 testAmount = 100_000;

        // Check current balance
        uint256 currentBalance = currentOFT.balanceOf(deployer);
        console.log("Current balance: %s sovaBTC", formatAmount(currentBalance));
        
        if (currentBalance < testAmount) {
            console.log("ERROR: Insufficient balance for testing. Need at least %s sovaBTC", formatAmount(testAmount));
            return;
        }

        // Test transfer to each other network
        if (block.chainid != 11155111 && networkConfigs[11155111].oftContract != address(0)) {
            testCrossChainTransfer(currentOFT, networkConfigs[11155111], testAmount, deployer);
        }
        
        if (block.chainid != 11155420 && networkConfigs[11155420].oftContract != address(0)) {
            testCrossChainTransfer(currentOFT, networkConfigs[11155420], testAmount, deployer);
        }
        
        if (block.chainid != 84532 && networkConfigs[84532].oftContract != address(0)) {
            testCrossChainTransfer(currentOFT, networkConfigs[84532], testAmount, deployer);
        }
        
        if (block.chainid != 421614 && networkConfigs[421614].oftContract != address(0)) {
            testCrossChainTransfer(currentOFT, networkConfigs[421614], testAmount, deployer);
        }
    }

    function testCrossChainTransfer(
        SovaBTCOFT currentOFT,
        NetworkConfig memory targetNetwork,
        uint256 amount,
        address recipient
    ) internal {
        console.log("Testing transfer to %s (EID: %s)...", targetNetwork.name, targetNetwork.layerZeroEid);

        // Quote the fee for the transfer
        SendParam memory sendParam = SendParam({
            dstEid: targetNetwork.layerZeroEid,
            to: addressToBytes32(recipient),
            amountLD: amount,
            minAmountLD: amount,
            extraOptions: "",
            composeMsg: "",
            oftCmd: ""
        });

        MessagingFee memory fee = currentOFT.quoteSend(sendParam, false);
        console.log("Quote fee: %s wei", fee.nativeFee);

        // Check if we have enough ETH for fees
        if (recipient.balance < fee.nativeFee) {
            console.log("ERROR: Insufficient ETH for fees. Need %s wei, have %s wei", 
                fee.nativeFee, recipient.balance);
            return;
        }

        // Execute the transfer
        console.log("Sending %s sovaBTC to %s...", formatAmount(amount), targetNetwork.name);
        
        try currentOFT.send{value: fee.nativeFee}(sendParam, fee, payable(recipient)) returns 
            (MessagingReceipt memory msgReceipt, OFTReceipt memory oftReceipt) {
            
            console.log("SUCCESS: Transfer initiated successfully!");
            console.log("   Message GUID: %s", bytes32ToString(msgReceipt.guid));
            console.log("   Amount sent: %s sovaBTC", formatAmount(oftReceipt.amountSentLD));
            console.log("   Expected receive: %s sovaBTC", formatAmount(oftReceipt.amountReceivedLD));
            console.log("   Fee paid: %s wei", msgReceipt.fee.nativeFee);
            console.log("");

        } catch Error(string memory reason) {
            console.log("ERROR: Transfer failed: %s", reason);
            console.log("");
        } catch {
            console.log("ERROR: Transfer failed: Unknown error");
            console.log("");
        }
    }

    // ============ Utility Functions ============

    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }

    function formatAmount(uint256 amount) internal pure returns (string memory) {
        // Format amount with 8 decimal places (satoshis)
        if (amount == 0) return "0";
        
        uint256 integer = amount / 1e8;
        uint256 decimal = amount % 1e8;
        
        if (decimal == 0) {
            return string(abi.encodePacked(uint2str(integer)));
        } else {
            return string(abi.encodePacked(uint2str(integer), ".", uint2str(decimal)));
        }
    }

    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        
        return string(bstr);
    }

    function bytes32ToString(bytes32 _bytes32) internal pure returns (string memory) {
        bytes memory bytesArray = new bytes(32);
        for (uint256 i = 0; i < 32; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }

    // ============ Manual Test Functions ============

    /**
     * @notice Test transfer to a specific network
     * @param targetEid Target LayerZero endpoint ID
     * @param amount Amount to transfer
     * @param recipient Recipient address
     */
    function testTransferToNetwork(
        uint32 targetEid,
        uint256 amount,
        address recipient
    ) external {
        // Validate target EID is one of our configured networks
        bool validTargetEid = false;
        for (uint256 i = 0; i < 4; i++) {
            uint256[] memory chainIds = new uint256[](4);
            chainIds[0] = 11155111; // Ethereum Sepolia
            chainIds[1] = 11155420; // Optimism Sepolia
            chainIds[2] = 84532;    // Base Sepolia
            chainIds[3] = 421614;   // Arbitrum Sepolia
            
            if (networkConfigs[chainIds[i]].layerZeroEid == targetEid) {
                validTargetEid = true;
                break;
            }
        }
        
        // Skip test if target EID is not valid
        if (!validTargetEid) {
            console.log("Skipping test - invalid target EID: %s", targetEid);
            return;
        }

        // Validate amount bounds (between 0.001 and 10 BTC)
        if (amount < 100_000 || amount > 1_000_000_000) {
            console.log("Skipping test - amount out of bounds: %s", amount);
            return;
        }

        // Validate recipient address
        if (recipient == address(0)) {
            console.log("Skipping test - invalid recipient address");
            return;
        }

        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        NetworkConfig memory currentNetwork = networkConfigs[block.chainid];
        require(currentNetwork.oftContract != address(0), "Current network OFT not configured");

        // Skip if trying to send to the same network
        if (currentNetwork.layerZeroEid == targetEid) {
            console.log("Skipping test - cannot send to same network");
            vm.stopBroadcast();
            return;
        }

        SovaBTCOFT currentOFT = SovaBTCOFT(currentNetwork.oftContract);
        
        console.log("Testing manual transfer:");
        console.log("From: %s (EID: %s)", currentNetwork.name, currentNetwork.layerZeroEid);
        console.log("To EID: %s", targetEid);
        console.log("Amount: %s sovaBTC", formatAmount(amount));
        console.log("Recipient: %s", recipient);
        console.log("");

        // Create send parameters
        SendParam memory sendParam = SendParam({
            dstEid: targetEid,
            to: addressToBytes32(recipient),
            amountLD: amount,
            minAmountLD: amount,
            extraOptions: "",
            composeMsg: "",
            oftCmd: ""
        });

        // Quote and execute
        MessagingFee memory fee = currentOFT.quoteSend(sendParam, false);
        console.log("Required fee: %s wei", fee.nativeFee);

        (MessagingReceipt memory msgReceipt, OFTReceipt memory oftReceipt) = 
            currentOFT.send{value: fee.nativeFee}(sendParam, fee, payable(recipient));

        console.log("SUCCESS: Transfer completed!");
        console.log("Message GUID: %s", bytes32ToString(msgReceipt.guid));
        console.log("Amount sent: %s sovaBTC", formatAmount(oftReceipt.amountSentLD));

        vm.stopBroadcast();
    }

    /**
     * @notice Check balance on current network
     * @param account Address to check
     */
    function checkBalance(address account) external view {
        NetworkConfig memory currentNetwork = networkConfigs[block.chainid];
        require(currentNetwork.oftContract != address(0), "Current network OFT not configured");

        SovaBTCOFT currentOFT = SovaBTCOFT(currentNetwork.oftContract);
        uint256 balance = currentOFT.balanceOf(account);
        
        console.log("=== Balance Check ===");
        console.log("Network: %s", currentNetwork.name);
        console.log("Account: %s", account);
        console.log("Balance: %s sovaBTC", formatAmount(balance));
    }

    /**
     * @notice Get quote for cross-chain transfer
     * @param targetEid Target endpoint ID
     * @param amount Amount to transfer
     */
    function getQuote(uint32 targetEid, uint256 amount) external view {
        NetworkConfig memory currentNetwork = networkConfigs[block.chainid];
        require(currentNetwork.oftContract != address(0), "Current network OFT not configured");

        SovaBTCOFT currentOFT = SovaBTCOFT(currentNetwork.oftContract);
        
        SendParam memory sendParam = SendParam({
            dstEid: targetEid,
            to: addressToBytes32(msg.sender),
            amountLD: amount,
            minAmountLD: amount,
            extraOptions: "",
            composeMsg: "",
            oftCmd: ""
        });

        MessagingFee memory fee = currentOFT.quoteSend(sendParam, false);
        
        console.log("=== Transfer Quote ===");
        console.log("From: %s (EID: %s)", currentNetwork.name, currentNetwork.layerZeroEid);
        console.log("To EID: %s", targetEid);
        console.log("Amount: %s sovaBTC", formatAmount(amount));
        console.log("Native fee: %s wei", fee.nativeFee);
        console.log("LZ token fee: %s", fee.lzTokenFee);
    }
} 