// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

/**
 * @title TestQuoteSend
 * @notice Simple test to isolate the quoteSend error
 */
contract TestQuoteSend is Script {
    
    address constant BASE_SEPOLIA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    function run() external view {
        console.log("Testing quoteSend on Base Sepolia OFT...");
        console.log("OFT Address:", BASE_SEPOLIA_OFT);
        console.log("Destination EID:", OPTIMISM_SEPOLIA_EID);
        
        SovaBTCOFT oft = SovaBTCOFT(BASE_SEPOLIA_OFT);
        
        // Test 1: Check basic contract state
        console.log("=== Basic Contract Info ===");
        console.log("Token name:", oft.name());
        console.log("Token symbol:", oft.symbol());
        console.log("Decimals:", oft.decimals());
        
        // Test 2: Check peer configuration
        console.log("=== Peer Configuration ===");
        bytes32 peer = oft.peers(OPTIMISM_SEPOLIA_EID);
        console.logBytes32(peer);
        console.log("Is peer set:", peer != bytes32(0));
        
        // Test 3: Try simple quoteSend
        console.log("=== Testing quoteSend ===");
        
        // Create a simple SendParam
        bytes32 recipient = bytes32(uint256(uint160(0x6182051f545E673b54119800126d8802E3Da034b)));
        
        // Try with minimal parameters first
        try oft.quoteSend(
            SendParam({
                dstEid: OPTIMISM_SEPOLIA_EID,
                to: recipient,
                amountLD: 100000000, // 1 sovaBTC (8 decimals)
                minAmountLD: 100000000,
                extraOptions: "",
                composeMsg: "",
                oftCmd: ""
            }),
            false // payInLzToken
        ) returns (MessagingFee memory fee) {
            console.log("SUCCESS: quoteSend worked!");
            console.log("Native fee:", fee.nativeFee);
            console.log("LZ token fee:", fee.lzTokenFee);
        } catch Error(string memory reason) {
            console.log("ERROR (revert reason):", reason);
        } catch (bytes memory lowLevelData) {
            console.log("ERROR (low level):");
            console.log("Error data length:", lowLevelData.length);
            if (lowLevelData.length >= 4) {
                bytes4 selector = bytes4(lowLevelData);
                console.logBytes4(selector);
            }
            console.logBytes(lowLevelData);
        }
    }
} 