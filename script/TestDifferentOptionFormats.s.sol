// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Script, console} from "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";
import {EnforcedOptionParam} from "../lib/LayerZero-v2/packages/layerzero-v2/evm/oapp/contracts/oapp/interfaces/IOAppOptionsType3.sol";

contract TestDifferentOptionFormats is Script {
    
    // Base Sepolia addresses
    address constant BASE_SOVA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    
    // LayerZero EIDs
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    function run() external {
        // Load private key from environment (contract owner)
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        
        console.log("=== TESTING DIFFERENT LAYERZERO OPTION FORMATS ===");
        console.log("");
        
        vm.startBroadcast(privateKey);
        
        SovaBTCOFT oft = SovaBTCOFT(BASE_SOVA_OFT);
        uint16 SEND_MSG_TYPE = 1;
        
        // Current options that are failing
        bytes memory currentOptions = oft.enforcedOptions(OPTIMISM_SEPOLIA_EID, SEND_MSG_TYPE);
        console.log("Current options (failing with error 3):");
        console.log("- Raw:", vm.toString(currentOptions));
        console.log("");
        
        // Try completely removing enforced options to test with defaults
        console.log("EXPERIMENT 1: Remove enforced options completely");
        console.log("This will test if the bridge works with LayerZero defaults");
        
        // Set enforced options to a minimal valid format
        // Just Type 3 marker with no actual options
        bytes memory minimalOptions = hex"0003";
        
        EnforcedOptionParam[] memory enforcedOptionsArray = new EnforcedOptionParam[](1);
        enforcedOptionsArray[0] = EnforcedOptionParam({
            eid: OPTIMISM_SEPOLIA_EID,
            msgType: SEND_MSG_TYPE,
            options: minimalOptions
        });
        
        try oft.setEnforcedOptions(enforcedOptionsArray) {
            console.log("SUCCESS: Minimal options set");
            console.log("New options:", vm.toString(minimalOptions));
        } catch Error(string memory reason) {
            console.log("Failed to set minimal options:", reason);
            
            // If that fails, try a different approach - simple executor option
            console.log("");
            console.log("EXPERIMENT 2: Simplified executor option");
            
            // Different format - simplified executor option
            bytes memory simpleOptions = hex"000301000000";
            
            enforcedOptionsArray[0].options = simpleOptions;
            
            try oft.setEnforcedOptions(enforcedOptionsArray) {
                console.log("SUCCESS: Simple options set");
                console.log("New options:", vm.toString(simpleOptions));
            } catch Error(string memory reason2) {
                console.log("Failed to set simple options:", reason2);
            }
        }
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== ANALYSIS ===");
        console.log("The LayerZero V2 options format is very specific.");
        console.log("Error code 3 suggests the worker configuration doesn't match");
        console.log("what the LayerZero endpoint expects for this testnet.");
        console.log("");
        console.log("=== RECOMMENDATION ===");
        console.log("Test the bridge now with minimal/no enforced options.");
        console.log("If it works, the issue was overly complex enforced options.");
        console.log("If it still fails, the issue is deeper in the LayerZero config.");
    }
} 