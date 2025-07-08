// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Script, console} from "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";
import {EnforcedOptionParam} from "../lib/LayerZero-v2/packages/layerzero-v2/evm/oapp/contracts/oapp/interfaces/IOAppOptionsType3.sol";
import {OptionsBuilder} from "../lib/LayerZero-v2/packages/layerzero-v2/evm/oapp/contracts/oapp/libs/OptionsBuilder.sol";

contract SetCorrectEnforcedOptions is Script {
    
    // Base Sepolia addresses
    address constant BASE_SOVA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    
    // LayerZero EIDs
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    function run() external {
        // Load private key from environment (contract owner)
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        
        console.log("=== SETTING CORRECT LAYERZERO ENFORCED OPTIONS ===");
        console.log("");
        
        vm.startBroadcast(privateKey);
        
        SovaBTCOFT oft = SovaBTCOFT(BASE_SOVA_OFT);
        
        // Check current enforced options
        uint16 SEND_MSG_TYPE = 1;
        bytes memory currentOptions = oft.enforcedOptions(OPTIMISM_SEPOLIA_EID, SEND_MSG_TYPE);
        console.log("Current enforced options length:", currentOptions.length);
        console.log("Current enforced options:", vm.toString(currentOptions));
        console.log("");
        
        // Create proper enforced options using OptionsBuilder
        console.log("Creating proper enforced options...");
        
        // Build proper Type 3 options with adequate gas limit
        bytes memory properOptions = OptionsBuilder.newOptions().addExecutorLzReceiveOption(
            200000, // Gas limit: 200,000 (much higher than the invalid 17!)
            0       // Native drop: 0
        );
        
        console.log("New enforced options:");
        console.log("- Length:", properOptions.length);
        console.log("- Raw bytes:", vm.toString(properOptions));
        console.log("- Gas limit: 200,000 (vs previous invalid 17)");
        console.log("");
        
        // Create array with proper enforced options
        EnforcedOptionParam[] memory enforcedOptionsArray = new EnforcedOptionParam[](1);
        enforcedOptionsArray[0] = EnforcedOptionParam({
            eid: OPTIMISM_SEPOLIA_EID,
            msgType: SEND_MSG_TYPE,
            options: properOptions
        });
        
        // Set the proper enforced options
        try oft.setEnforcedOptions(enforcedOptionsArray) {
            console.log("SUCCESS: Proper enforced options set!");
        } catch Error(string memory reason) {
            console.log("Failed to set options:", reason);
            vm.stopBroadcast();
            return;
        }
        
        // Verify the new options are set
        bytes memory newOptions = oft.enforcedOptions(OPTIMISM_SEPOLIA_EID, SEND_MSG_TYPE);
        console.log("Verification:");
        console.log("- New options length:", newOptions.length);
        console.log("- New options:", vm.toString(newOptions));
        
        if (keccak256(newOptions) == keccak256(properOptions)) {
            console.log("[OK] Enforced options successfully updated!");
        } else {
            console.log("[ERROR] Enforced options not set correctly");
        }
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== WHAT THIS FIXES ===");
        console.log("1. Replaces invalid gas amount (17) with proper 200,000");
        console.log("2. Uses correct LayerZero V2 Type 3 options format");
        console.log("3. Should eliminate LZ_ULN_InvalidWorkerOptions error");
        console.log("");
        console.log("=== NEXT STEPS ===");
        console.log("1. Test bridge transaction again - it should work now!");
        console.log("2. The bridge will use proper gas limits for cross-chain execution");
        console.log("3. LayerZero will accept the worker options");
    }
} 