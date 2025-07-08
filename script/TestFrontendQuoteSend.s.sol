// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

/**
 * @title TestFrontendQuoteSend
 * @notice Test quoteSend with exact frontend parameters
 */
contract TestFrontendQuoteSend is Script {
    
    address constant BASE_SEPOLIA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    function run() external view {
        console.log("Testing quoteSend with exact frontend parameters...");
        
        SovaBTCOFT oft = SovaBTCOFT(BASE_SEPOLIA_OFT);
        
        // Frontend recipient: 0x6182051f545E673b54119800126d8802E3Da034b
        // Frontend converts to bytes32: `0x${recipient.slice(2).padStart(64, '0')}`
        address recipient = 0x6182051f545E673b54119800126d8802E3Da034b;
        bytes32 recipientBytes32 = bytes32(uint256(uint160(recipient)));
        
        console.log("Recipient address:", recipient);
        console.log("Recipient as bytes32:");
        console.logBytes32(recipientBytes32);
        
        // Test the exact frontend parameters
        console.log("=== Frontend-style quoteSend ===");
        
        try oft.quoteSend(
            SendParam({
                dstEid: OPTIMISM_SEPOLIA_EID,
                to: recipientBytes32,
                amountLD: 100000000, // 1 sovaBTC (8 decimals) 
                minAmountLD: 100000000, // Frontend uses same for min (no slippage)
                extraOptions: hex"", // Frontend passes '0x' which is empty bytes
                composeMsg: hex"", // Frontend passes '0x' 
                oftCmd: hex"" // Frontend passes '0x'
            }),
            false // payInLzToken = false (pay in native)
        ) returns (MessagingFee memory fee) {
            console.log("SUCCESS: Frontend-style quoteSend worked!");
            console.log("Native fee:", fee.nativeFee);
            console.log("LZ token fee:", fee.lzTokenFee);
        } catch Error(string memory reason) {
            console.log("ERROR (frontend style):", reason);
        } catch (bytes memory lowLevelData) {
            console.log("ERROR (frontend style - low level):");
            console.log("Error data length:", lowLevelData.length);
            if (lowLevelData.length >= 4) {
                bytes4 selector = bytes4(lowLevelData);
                console.logBytes4(selector);
            }
            console.logBytes(lowLevelData);
        }
        
        // Test with different EID to see if it's EID-specific
        console.log("=== Test with Base Sepolia EID (should fail differently) ===");
        
        try oft.quoteSend(
            SendParam({
                dstEid: 40245, // Base Sepolia EID (should be invalid for cross-chain)
                to: recipientBytes32,
                amountLD: 100000000,
                minAmountLD: 100000000,
                extraOptions: hex"",
                composeMsg: hex"",
                oftCmd: hex""
            }),
            false
        ) returns (MessagingFee memory fee) {
            console.log("UNEXPECTED SUCCESS: Same EID worked");
            console.log("Native fee:", fee.nativeFee);
        } catch Error(string memory reason) {
            console.log("ERROR (same EID):", reason);
        } catch (bytes memory lowLevelData) {
            console.log("ERROR (same EID - low level):");
            if (lowLevelData.length >= 4) {
                bytes4 selector = bytes4(lowLevelData);
                console.logBytes4(selector);
            }
        }
    }
} 