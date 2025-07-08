// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Script, console} from "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

contract DebugFailedTx is Script {
    
    // Base Sepolia addresses
    address constant BASE_SOVA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    address constant USER_ADDRESS = 0x6182051f545E673b54119800126d8802E3Da034b;
    
    // LayerZero EIDs
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    function run() external view {
        SovaBTCOFT oft = SovaBTCOFT(BASE_SOVA_OFT);
        
        console.log("=== DEBUGGING FAILED BRIDGE TRANSACTION ===");
        console.log("");
        
        // Analyze the exact parameters that were sent
        uint256 bridgeAmount = 25000000; // 0.25 BTC
        uint256 fee = 0.01 ether; // Fee that was paid
        
        console.log("Failed Transaction Parameters:");
        console.log("- Amount:", bridgeAmount);
        console.log("- Fee paid:", fee);
        console.log("- Destination EID:", OPTIMISM_SEPOLIA_EID);
        console.log("- User:", USER_ADDRESS);
        console.log("");
        
        // Check address format conversion
        bytes32 recipientBytes32 = bytes32(uint256(uint160(USER_ADDRESS)));
        console.log("Address Conversion Check:");
        console.log("- Original address:", USER_ADDRESS);
        console.log("- As bytes32:", vm.toString(recipientBytes32));
        console.log("");
        
        // Try to simulate quoteSend to see if it would work
        console.log("Testing QuoteSend:");
        
        // Create SendParam struct like the frontend does
        bytes memory extraOptions = hex""; // Empty options
        bytes memory composeMsg = hex""; // Empty compose
        bytes memory oftCmd = hex""; // Empty oft command
        
        // Test with minimal parameters
        console.log("- Testing with empty extraOptions (relying on enforced options)");
        console.log("- Recipient bytes32:", vm.toString(recipientBytes32));
        
        // Check if peer exists for destination
        bytes32 peer = oft.peers(OPTIMISM_SEPOLIA_EID);
        console.log("- Destination peer:", vm.toString(peer));
        
        if (peer == bytes32(0)) {
            console.log("ERROR: No peer configured for destination!");
        } else {
            console.log("- Peer configuration: OK");
        }
        
        // Check enforced options for the SEND message type
        uint16 SEND_MSG_TYPE = 1;
        bytes memory enforcedOpts = oft.enforcedOptions(OPTIMISM_SEPOLIA_EID, SEND_MSG_TYPE);
        console.log("- Enforced options length:", enforcedOpts.length);
        
        if (enforcedOpts.length == 0) {
            console.log("WARNING: No enforced options - this could cause the failure!");
        }
        
        console.log("");
        console.log("=== LIKELY CAUSES ===");
        console.log("1. LayerZero V2 compatibility issue with quoteSend function");
        console.log("2. Insufficient native fee (0.01 ETH might not be enough)");
        console.log("3. Invalid message options formatting");
        console.log("4. LayerZero endpoint configuration issue on destination");
        console.log("");
        
        console.log("RECOMMENDATION:");
        console.log("- Try increasing the native fee to 0.02-0.05 ETH");
        console.log("- Verify LayerZero DVN and Executor settings are identical on both chains");
        console.log("- Test with Optimism Sepolia -> Base Sepolia direction first");
    }
} 