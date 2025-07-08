// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";
import {ILayerZeroEndpointV2} from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";

/**
 * @title CheckLayerZeroConfig
 * @notice Check LayerZero endpoint configuration for our OFT contracts
 */
contract CheckLayerZeroConfig is Script {
    
    // FRONTEND-CONFIGURED OFT CONTRACT ADDRESSES
    address constant BASE_SEPOLIA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    address constant OPTIMISM_SEPOLIA_OFT = 0x1b7227A7A6BcAe6c64907b1B51dD0801C3E8ba30;
    
    // LayerZero Endpoint IDs
    uint32 constant BASE_SEPOLIA_EID = 40245;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    function run() external view {
        uint256 chainId = block.chainid;
        
        console.log("=== LayerZero Configuration Check ===");
        console.log("Chain ID:", chainId);
        
        if (chainId == 84532) {
            // Base Sepolia
            checkConfiguration(
                BASE_SEPOLIA_OFT,
                OPTIMISM_SEPOLIA_EID,
                "Base Sepolia",
                "Optimism Sepolia"
            );
        } else if (chainId == 11155420) {
            // Optimism Sepolia
            checkConfiguration(
                OPTIMISM_SEPOLIA_OFT,
                BASE_SEPOLIA_EID,
                "Optimism Sepolia", 
                "Base Sepolia"
            );
        } else {
            console.log("Unsupported chain");
        }
    }
    
    function checkConfiguration(
        address oftAddress,
        uint32 dstEid,
        string memory sourceName,
        string memory destName
    ) internal view {
        console.log("");
        console.log("=== Configuration for %s ===", sourceName);
        console.log("OFT Address:", oftAddress);
        
        SovaBTCOFT oft = SovaBTCOFT(oftAddress);
        ILayerZeroEndpointV2 endpoint = ILayerZeroEndpointV2(oft.endpoint());
        
        console.log("Endpoint Address:", address(endpoint));
        
        // Check peer configuration
        bytes32 peer = oft.peers(dstEid);
        console.log("Peer for %s (EID %s):", destName, dstEid);
        console.log("  Configured peer:", vm.toString(peer));
        console.log("  Is peer set:", peer != bytes32(0));
        
        // Check send library
        try endpoint.getSendLibrary(oftAddress, dstEid) returns (address sendLib) {
            console.log("Send Library:", sendLib);
            console.log("Send Library set:", sendLib != address(0));
        } catch {
            console.log("Could not get send library - might be using defaults");
        }
        
        // Check receive library  
        try endpoint.getReceiveLibrary(oftAddress, dstEid) returns (address receiveLib, bool isDefault) {
            console.log("Receive Library:", receiveLib);
            console.log("Receive Library set:", receiveLib != address(0));
            console.log("Using default:", isDefault);
        } catch {
            console.log("Could not get receive library - might be using defaults");
        }
        
        // Check if there are any specific configs needed
        console.log("");
        console.log("=== Attempting simple quote test ===");
        
        try this.testQuote(oftAddress, dstEid) {
            console.log("Quote test: SUCCESS");
        } catch (bytes memory err) {
            console.log("Quote test: FAILED");
            console.log("Error length:", err.length);
            if (err.length >= 4) {
                bytes4 errorSig = bytes4(err);
                console.log("Error signature:", vm.toString(errorSig));
            }
        }
    }
    
    function testQuote(address oftAddress, uint32 dstEid) external view {
        SovaBTCOFT oft = SovaBTCOFT(oftAddress);
        
        SendParam memory sendParam = SendParam({
            dstEid: dstEid,
            to: bytes32(uint256(uint160(address(this)))),
            amountLD: 1000000, // 0.01 sovaBTC (8 decimals)
            minAmountLD: 1000000,
            extraOptions: "",
            composeMsg: "",
            oftCmd: ""
        });
        
        // This should revert with the specific error we're seeing
        oft.quoteSend(sendParam, false);
    }
} 