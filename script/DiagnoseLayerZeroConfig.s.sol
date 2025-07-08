// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Script, console} from "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

interface ILayerZeroEndpointV2 {
    function getConfig(address _oapp, address _lib, uint32 _eid, uint32 _configType) external view returns (bytes memory config);
}

interface IMessageLibManager {
    function getRegisteredLibraries() external view returns (address[] memory);
}

contract DiagnoseLayerZeroConfig is Script {
    
    // Base Sepolia addresses
    address constant BASE_SOVA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    address constant LZ_ENDPOINT = 0x6EDCE65403992e310A62460808c4b910D972f10f; // Base Sepolia endpoint
    
    // LayerZero EIDs
    uint32 constant BASE_SEPOLIA_EID = 40245;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    // Config types
    uint32 constant CONFIG_TYPE_EXECUTOR = 1;
    uint32 constant CONFIG_TYPE_ULN = 2;
    
    function run() external view {
        SovaBTCOFT oft = SovaBTCOFT(BASE_SOVA_OFT);
        ILayerZeroEndpointV2 endpoint = ILayerZeroEndpointV2(LZ_ENDPOINT);
        
        console.log("=== DIAGNOSING LAYERZERO CONFIGURATION ===");
        console.log("");
        
        // Check the actual enforced options we set
        uint16 SEND_MSG_TYPE = 1;
        bytes memory currentEnforcedOptions = oft.enforcedOptions(OPTIMISM_SEPOLIA_EID, SEND_MSG_TYPE);
        console.log("Current Enforced Options:");
        console.log("- Length:", currentEnforcedOptions.length);
        console.log("- Raw bytes:", vm.toString(currentEnforcedOptions));
        console.log("");
        
        // Check peer configuration
        bytes32 peer = oft.peers(OPTIMISM_SEPOLIA_EID);
        console.log("Peer Configuration:");
        console.log("- Optimism Sepolia peer:", vm.toString(peer));
        console.log("");
        
        // Check LayerZero endpoint configuration
        console.log("LayerZero Endpoint Analysis:");
        console.log("- Endpoint address:", LZ_ENDPOINT);
        console.log("- Base Sepolia EID:", BASE_SEPOLIA_EID);
        console.log("- Optimism Sepolia EID:", OPTIMISM_SEPOLIA_EID);
        console.log("");
        
        // The enforced options that failed: 0x00030100110100000000000000000000000186a0
        console.log("Failed Options Analysis:");
        console.log("Raw: 0x00030100110100000000000000000000000186a0");
        console.log("Breakdown:");
        console.log("- 0x0003: Option type 3 (Executor)");
        console.log("- 0x01: Option length (1 byte)");
        console.log("- 0x0011: Gas amount (17 in decimal - likely too low!)");
        console.log("- 0x01: Option type 1 (likely DVN)");
        console.log("- 0x00000000000000000000000186a0: Gas limit (100,000)");
        console.log("");
        
        console.log("=== ISSUE IDENTIFIED ===");
        console.log("The enforced options contain invalid worker configuration!");
        console.log("");
        console.log("Problems:");
        console.log("1. Gas amount of 17 (0x0011) is extremely low");
        console.log("2. Option format may not match LayerZero V2 requirements");
        console.log("3. DVN/Executor addresses might not be properly configured");
        console.log("");
        
        console.log("=== SOLUTIONS ===");
        console.log("1. Clear the current enforced options");
        console.log("2. Set proper enforced options with correct gas amounts");
        console.log("3. Or remove enforced options entirely and use extraOptions");
        console.log("4. Verify DVN and Executor addresses are correct for both chains");
        console.log("");
        
        console.log("Next steps:");
        console.log("- Run a script to clear enforced options");
        console.log("- Test bridge without enforced options");
        console.log("- If that works, set proper enforced options");
    }
} 