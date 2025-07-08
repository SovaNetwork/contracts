// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

/**
 * @title SetEnforcedOptionsDirectly
 * @notice Set enforced options directly without complex struct encoding
 */
contract SetEnforcedOptionsDirectly is Script {
    
    // FRONTEND-CONFIGURED OFT CONTRACT ADDRESSES
    address constant BASE_SEPOLIA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    address constant OPTIMISM_SEPOLIA_OFT = 0x1b7227A7A6BcAe6c64907b1B51dD0801C3E8ba30;
    
    // LayerZero Endpoint IDs
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    uint32 constant BASE_SEPOLIA_EID = 40245;
    
    // Message type (standard OFT send message type)
    uint16 constant SEND_MESSAGE_TYPE = 1;
    
    function run() external {
        console.log("Setting enforced options for Base Sepolia OFT...");
        console.log("OFT Address:", BASE_SEPOLIA_OFT);
        console.log("Destination EID (Optimism Sepolia):", OPTIMISM_SEPOLIA_EID);
        
        vm.startBroadcast();
        
        // Create the enforced options bytes
        // This is standard LayerZero V2 execution options for 100k gas
        bytes memory enforcedOptions = hex"00030100110100000000000000000000000186a0";
        
        console.log("Enforced options being set:");
        console.logBytes(enforcedOptions);
        
        // Call setEnforcedOptions directly using assembly to avoid struct encoding issues
        bytes memory callData = abi.encodeWithSignature(
            "setEnforcedOptions((uint32,uint16,bytes)[])",
            _createEnforcedOptionsArray(OPTIMISM_SEPOLIA_EID, SEND_MESSAGE_TYPE, enforcedOptions)
        );
        
        (bool success, bytes memory returnData) = BASE_SEPOLIA_OFT.call(callData);
        
        vm.stopBroadcast();
        
        if (success) {
            console.log("SUCCESS: Enforced options set on Base Sepolia OFT!");
            console.log("Now quoteSend should work with extraOptions");
        } else {
            console.log("ERROR: Failed to set enforced options");
            if (returnData.length > 0) {
                console.log("Error data:");
                console.logBytes(returnData);
            }
        }
    }
    
    function runOptimismSepolia() external {
        console.log("Setting enforced options for Optimism Sepolia OFT...");
        console.log("OFT Address:", OPTIMISM_SEPOLIA_OFT);
        console.log("Destination EID (Base Sepolia):", BASE_SEPOLIA_EID);
        
        vm.startBroadcast();
        
        bytes memory enforcedOptions = hex"00030100110100000000000000000000000186a0";
        
        bytes memory callData = abi.encodeWithSignature(
            "setEnforcedOptions((uint32,uint16,bytes)[])",
            _createEnforcedOptionsArray(BASE_SEPOLIA_EID, SEND_MESSAGE_TYPE, enforcedOptions)
        );
        
        (bool success, bytes memory returnData) = OPTIMISM_SEPOLIA_OFT.call(callData);
        
        vm.stopBroadcast();
        
        if (success) {
            console.log("SUCCESS: Enforced options set on Optimism Sepolia OFT!");
        } else {
            console.log("ERROR: Failed to set enforced options");
            if (returnData.length > 0) {
                console.logBytes(returnData);
            }
        }
    }
    
    function _createEnforcedOptionsArray(
        uint32 eid,
        uint16 msgType,
        bytes memory options
    ) internal pure returns (bytes memory) {
        // Create properly formatted array for setEnforcedOptions
        // Array with one EnforcedOptionParam struct
        bytes memory result = new bytes(0x80);
        
        assembly {
            // Array length (1)
            mstore(add(result, 0x20), 1)
            
            // Offset to first element (0x20 from start of data)
            mstore(add(result, 0x40), 0x20)
            
            // First element - eid
            mstore(add(result, 0x60), eid)
            
            // First element - msgType  
            mstore(add(result, 0x80), msgType)
            
            // First element - options offset (0x60 from element start)
            mstore(add(result, 0xa0), 0x60)
            
            // Options length
            let optionsLen := mload(options)
            mstore(add(result, 0xc0), optionsLen)
            
            // Copy options data
            let src := add(options, 0x20)
            let dst := add(result, 0xe0)
            for { let i := 0 } lt(i, optionsLen) { i := add(i, 0x20) } {
                mstore(add(dst, i), mload(add(src, i)))
            }
            
            // Update result length
            mstore(result, add(0xc0, optionsLen))
        }
        
        return result;
    }
} 