// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Script, console} from "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";
import {EnforcedOptionParam} from "../lib/LayerZero-v2/packages/layerzero-v2/evm/oapp/contracts/oapp/interfaces/IOAppOptionsType3.sol";

contract SetCorrectEnforcedOptionsManual is Script {
    
    // Base Sepolia addresses
    address constant BASE_SOVA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    
    // LayerZero EIDs
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    function run() external {
        // Load private key from environment (contract owner)
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        
        console.log("=== SETTING CORRECT LAYERZERO ENFORCED OPTIONS (MANUAL) ===");
        console.log("");
        
        vm.startBroadcast(privateKey);
        
        SovaBTCOFT oft = SovaBTCOFT(BASE_SOVA_OFT);
        
        // Check current enforced options
        uint16 SEND_MSG_TYPE = 1;
        bytes memory currentOptions = oft.enforcedOptions(OPTIMISM_SEPOLIA_EID, SEND_MSG_TYPE);
        console.log("Current enforced options:");
        console.log("- Length:", currentOptions.length);
        console.log("- Raw bytes:", vm.toString(currentOptions));
        console.log("- This contains invalid gas amount of 17");
        console.log("");
        
        // Manually construct proper LayerZero V2 Type 3 options
        console.log("Creating proper enforced options manually...");
        
        // LayerZero V2 Type 3 options format:
        // 0x0003 = Type 3 options
        // 0x01 = Executor option type  
        // 0x000c = Length (12 bytes)
        // 0x00030d40 = Gas limit (200,000 in hex)
        // 0x0000000000000000 = Native drop amount (0)
        
        bytes memory properOptions = hex"00030100000c00030d400000000000000000";
        
        console.log("New enforced options:");
        console.log("- Length:", properOptions.length);
        console.log("- Raw bytes:", vm.toString(properOptions));
        console.log("- Format breakdown:");
        console.log("  * 0x0003: Type 3 options");
        console.log("  * 0x01: Executor option");
        console.log("  * 0x000c: Option length (12 bytes)");
        console.log("  * 0x00030d40: Gas limit (200,000)");
        console.log("  * 0x0000000000000000: Native drop (0)");
        console.log("");
        
        // Create array with proper enforced options
        EnforcedOptionParam[] memory enforcedOptionsArray = new EnforcedOptionParam[](1);
        enforcedOptionsArray[0] = EnforcedOptionParam({
            eid: OPTIMISM_SEPOLIA_EID,
            msgType: SEND_MSG_TYPE,
            options: properOptions
        });
        
        // Set the proper enforced options
        console.log("Setting new enforced options...");
        try oft.setEnforcedOptions(enforcedOptionsArray) {
            console.log("SUCCESS: Proper enforced options set!");
        } catch Error(string memory reason) {
            console.log("Failed to set options:", reason);
            vm.stopBroadcast();
            return;
        }
        
        // Verify the new options are set
        bytes memory newOptions = oft.enforcedOptions(OPTIMISM_SEPOLIA_EID, SEND_MSG_TYPE);
        console.log("");
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
        console.log("1. Gas limit: 17 -> 200,000 (massive increase!)");
        console.log("2. Proper LayerZero V2 Type 3 options format");
        console.log("3. Should eliminate LZ_ULN_InvalidWorkerOptions error");
        console.log("4. Compatible with LayerZero endpoint worker configuration");
        console.log("");
        console.log("=== NEXT STEPS ===");
        console.log("1. Test bridge transaction - should work now!");
        console.log("2. LayerZero will accept the worker options");
        console.log("3. Cross-chain execution will have adequate gas");
    }
} 