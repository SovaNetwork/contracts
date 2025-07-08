// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

/**
 * @title SetEnforcedOptionsSimple
 * @notice Set enforced options for LayerZero OFT (without problematic imports)
 */
contract SetEnforcedOptionsSimple is Script {
    
    // LayerZero Endpoint IDs
    uint32 constant BASE_SEPOLIA_EID = 40245;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    // FRONTEND-CONFIGURED OFT CONTRACT ADDRESSES
    address constant BASE_SEPOLIA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    address constant OPTIMISM_SEPOLIA_OFT = 0x1b7227A7A6BcAe6c64907b1B51dD0801C3E8ba30;
    
    // Message type (standard OFT send message type)
    uint16 constant SEND_MESSAGE_TYPE = 1;
    
    function run() external {
        console.log("Setting enforced options for LayerZero OFT contracts...");
        
        // Setup enforced options for Base Sepolia OFT
        setupEnforcedOptions(
            BASE_SEPOLIA_OFT,
            OPTIMISM_SEPOLIA_EID,
            "Base Sepolia",
            "Optimism Sepolia"
        );
    }
    
    function setupOptimismSepolia() external {
        console.log("Setting enforced options for Optimism Sepolia OFT...");
        
        // Setup enforced options for Optimism Sepolia OFT
        setupEnforcedOptions(
            OPTIMISM_SEPOLIA_OFT,
            BASE_SEPOLIA_EID,
            "Optimism Sepolia", 
            "Base Sepolia"
        );
    }
    
    function setupEnforcedOptions(
        address oftAddress,
        uint32 dstEid,
        string memory sourceName,
        string memory destName
    ) internal {
        console.log("=== Setting enforced options for %s -> %s ===", sourceName, destName);
        console.log("OFT Address:", oftAddress);
        console.log("Destination EID:", dstEid);
        
        vm.startBroadcast();
        
        // Call setEnforcedOptions using low-level call to avoid import issues
        // This creates enforced options with 200k gas for lzReceive
        bytes memory enforcedOptionsData = abi.encodeWithSignature(
            "setEnforcedOptions((uint32,uint16,bytes)[])",
            _createEnforcedOptionsArray(dstEid)
        );
        
        (bool success, ) = oftAddress.call(enforcedOptionsData);
        
        vm.stopBroadcast();
        
        if (success) {
            console.log("[SUCCESS] Enforced options set successfully!");
            console.log("   - Destination EID:", dstEid);
            console.log("   - Gas limit: 200,000");
            console.log("   - Message type:", SEND_MESSAGE_TYPE);
        } else {
            console.log("[ERROR] Failed to set enforced options");
        }
    }
    
    function _createEnforcedOptionsArray(uint32 dstEid) internal pure returns (bytes memory) {
        // Create enforced options with adequate gas for cross-chain execution
        // Format: TYPE_3 (0x0003) + LZ_RECEIVE (0x01) + gas_limit + msg_value
        bytes memory options = hex"00030100110100000000000000000000000186a0"; // 100k gas for lzReceive
        
        // EnforcedOptionParam struct: (uint32 eid, uint16 msgType, bytes options)
        return abi.encode(
            _createSingleParam(dstEid, SEND_MESSAGE_TYPE, options)
        );
    }
    
    function _createSingleParam(
        uint32 eid, 
        uint16 msgType, 
        bytes memory options
    ) internal pure returns (bytes memory) {
        // Create single EnforcedOptionParam
        return abi.encode(eid, msgType, options);
    }
} 