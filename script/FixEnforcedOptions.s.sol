// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Script, console} from "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";
import {EnforcedOptionParam} from "../lib/LayerZero-v2/packages/layerzero-v2/evm/oapp/contracts/oapp/interfaces/IOAppOptionsType3.sol";

contract FixEnforcedOptions is Script {
    
    // Base Sepolia addresses
    address constant BASE_SOVA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    
    // LayerZero EIDs
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    function run() external {
        // Load private key from environment (contract owner)
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        
        console.log("=== FIXING LAYERZERO ENFORCED OPTIONS ===");
        console.log("");
        
        vm.startBroadcast(privateKey);
        
        SovaBTCOFT oft = SovaBTCOFT(BASE_SOVA_OFT);
        
        // Check current enforced options
        uint16 SEND_MSG_TYPE = 1;
        bytes memory currentOptions = oft.enforcedOptions(OPTIMISM_SEPOLIA_EID, SEND_MSG_TYPE);
        console.log("Current enforced options length:", currentOptions.length);
        console.log("Current enforced options:", vm.toString(currentOptions));
        console.log("");
        
        // Clear enforced options (set to empty)
        console.log("Clearing invalid enforced options...");
        
        // Create array with one EnforcedOptionParam with empty options
        EnforcedOptionParam[] memory enforcedOptionsArray = new EnforcedOptionParam[](1);
        enforcedOptionsArray[0] = EnforcedOptionParam({
            eid: OPTIMISM_SEPOLIA_EID,
            msgType: SEND_MSG_TYPE,
            options: hex"" // Empty options
        });
        
        try oft.setEnforcedOptions(enforcedOptionsArray) {
            console.log("SUCCESS: Enforced options cleared!");
        } catch Error(string memory reason) {
            console.log("Failed to clear options:", reason);
            vm.stopBroadcast();
            return;
        }
        
        // Verify they are cleared
        bytes memory newOptions = oft.enforcedOptions(OPTIMISM_SEPOLIA_EID, SEND_MSG_TYPE);
        console.log("New enforced options length:", newOptions.length);
        
        if (newOptions.length == 0) {
            console.log("[OK] Enforced options successfully cleared!");
        } else {
            console.log("[ERROR] Enforced options not cleared properly");
        }
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== WHAT THIS FIXES ===");
        console.log("1. Removes the invalid gas amount (17) that was causing failures");
        console.log("2. Allows bridge to work with default LayerZero options");
        console.log("3. No more LZ_ULN_InvalidWorkerOptions error");
        console.log("");
        console.log("=== NEXT STEPS ===");
        console.log("1. Test bridge transaction again - it should work now!");
        console.log("2. If successful, you can optionally set proper enforced options later");
        console.log("3. For now, the bridge will use LayerZero's default worker configuration");
    }
} 