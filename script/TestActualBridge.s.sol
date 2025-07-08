// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Script, console} from "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

contract TestActualBridge is Script {
    
    // Base Sepolia addresses - UPDATED 1/7/25
    address payable constant BASE_SOVA_OFT = payable(0xAD36450E98E3AEa8d79FBc6D55C47C85eBCbb807);
    
    // LayerZero EIDs
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    // Test amount - 1 sovaBTC (100000000 = 1 BTC in 8 decimals)
    uint256 constant BRIDGE_AMOUNT = 100000000; // 1 sovaBTC
    
    function run() external {
        // Load private key from environment
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(privateKey);
        
        console.log("=== TESTING ACTUAL BRIDGE TRANSACTION ===");
        console.log("User address:", user);
        console.log("Bridge amount:", BRIDGE_AMOUNT, "(1 sovaBTC)");
        console.log("");
        
        // Start broadcasting transactions
        vm.startBroadcast(privateKey);
        
        SovaBTCOFT oft = SovaBTCOFT(BASE_SOVA_OFT);
        
        // Check user balance before
        uint256 balanceBefore = oft.balanceOf(user);
        console.log("Balance before bridge:", balanceBefore);
        
        if (balanceBefore < BRIDGE_AMOUNT) {
            console.log("ERROR: Insufficient balance!");
            vm.stopBroadcast();
            return;
        }
        
        // Convert recipient address to bytes32
        bytes32 recipientBytes32 = bytes32(uint256(uint160(user)));
        console.log("Recipient (bytes32):", vm.toString(recipientBytes32));
        
        // Create proper LayerZero V2 options (format from enforced options)
        bytes memory options = hex"0003010011010000000000000000000000000007a120";
        
        // Create SendParam struct
        SendParam memory sendParam = SendParam({
            dstEid: OPTIMISM_SEPOLIA_EID,
            to: recipientBytes32,
            amountLD: BRIDGE_AMOUNT,
            minAmountLD: BRIDGE_AMOUNT,
            extraOptions: options, // Proper LayerZero V2 options
            composeMsg: hex"",   // Empty
            oftCmd: hex""        // Empty
        });
        
        // Test with a small fee amount for LayerZero V2
        uint256 feeAmount = 0.0005 ether; // 0.0005 ETH (small for LayerZero V2)
        
        console.log("");
        console.log("Testing bridge with fee:", feeAmount);
        
        // Check if user has enough ETH for fee
        if (user.balance < feeAmount) {
            console.log("ERROR: Insufficient ETH balance for fee:", feeAmount);
            console.log("User ETH balance:", user.balance);
            vm.stopBroadcast();
            return;
        }
        
        // Create MessagingFee struct
        MessagingFee memory messagingFee = MessagingFee({
            nativeFee: feeAmount,
            lzTokenFee: 0
        });
        
        console.log("Sending bridge transaction...");
        console.log("- Destination EID:", OPTIMISM_SEPOLIA_EID);
        console.log("- Amount:", BRIDGE_AMOUNT);
        console.log("- Native fee:", feeAmount);
        console.log("- User ETH balance:", user.balance);
        
        // Execute the bridge transaction
        oft.send{value: feeAmount}(
            sendParam,
            messagingFee,
            user // refund address
        );
        
        console.log("SUCCESS! Bridge transaction sent!");
        console.log("Fee used:", feeAmount);
        
        // Check balance after (should be reduced)
        uint256 balanceAfter = oft.balanceOf(user);
        console.log("Balance after bridge:", balanceAfter);
        console.log("Amount bridged:", balanceBefore - balanceAfter);
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== SUCCESS! BRIDGE TRANSACTION COMPLETED ===");
        console.log("1. Wait 2-5 minutes for cross-chain confirmation");
        console.log("2. Check balance on Optimism Sepolia OFT contract");  
        console.log("3. UI should work with 0.003 ETH fee amount");
        console.log("4. If transaction reverts, the issue is LayerZero configuration");
    }
} 