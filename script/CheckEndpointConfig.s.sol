// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

/**
 * @title CheckEndpointConfig
 * @notice Check the current LayerZero endpoint configuration
 */
contract CheckEndpointConfig is Script {
    
    address constant BASE_SEPOLIA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    function run() external view {
        console.log("Checking LayerZero endpoint configuration...");
        
        SovaBTCOFT oft = SovaBTCOFT(BASE_SEPOLIA_OFT);
        address endpointAddr = address(oft.endpoint());
        
        console.log("OFT Address:", BASE_SEPOLIA_OFT);
        console.log("Endpoint Address:");
        console.logAddress(endpointAddr);
        
        // Try to check what send library is being used
        console.log("=== Send Library Configuration ===");
        
        // The endpoint should have a getSendLibrary function
        // Let's try to call it using low-level calls
        (bool success, bytes memory data) = endpointAddr.staticcall(
            abi.encodeWithSignature("getSendLibrary(address,uint32)", BASE_SEPOLIA_OFT, OPTIMISM_SEPOLIA_EID)
        );
        
        if (success && data.length >= 32) {
            address sendLib = abi.decode(data, (address));
            console.log("Send Library for Optimism Sepolia:");
            console.logAddress(sendLib);
            
            if (sendLib == address(0)) {
                console.log("ERROR: Send library is address(0) - not supported!");
            }
        } else {
            console.log("ERROR: Could not get send library");
        }
        
        // Check receive library  
        console.log("=== Receive Library Configuration ===");
        (bool success2, bytes memory data2) = endpointAddr.staticcall(
            abi.encodeWithSignature("getReceiveLibrary(address,uint32)", BASE_SEPOLIA_OFT, OPTIMISM_SEPOLIA_EID)
        );
        
        if (success2 && data2.length >= 32) {
            address receiveLib = abi.decode(data2, (address));
            console.log("Receive Library for Optimism Sepolia:");
            console.logAddress(receiveLib);
            
            if (receiveLib == address(0)) {
                console.log("ERROR: Receive library is address(0) - not supported!");
            }
        } else {
            console.log("ERROR: Could not get receive library");
        }
        
        // Check if there's a default send library for this EID
        console.log("=== Default Library Configuration ===");
        (bool success3, bytes memory data3) = endpointAddr.staticcall(
            abi.encodeWithSignature("defaultSendLibrary(uint32)", OPTIMISM_SEPOLIA_EID)
        );
        
        if (success3 && data3.length >= 32) {
            address defaultSendLib = abi.decode(data3, (address));
            console.log("Default Send Library for Optimism Sepolia:");
            console.logAddress(defaultSendLib);
            
            if (defaultSendLib == address(0)) {
                console.log("ERROR: Default send library is address(0) - EID not supported!");
            }
        } else {
            console.log("ERROR: Could not get default send library");
        }
    }
} 