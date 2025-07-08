// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

/**
 * @title TestQuoteSendWithWorkerOptions
 * @notice Test quoteSend with properly formatted worker options (minimum 2 bytes)
 */
contract TestQuoteSendWithWorkerOptions is Script {
    
    address constant BASE_SEPOLIA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    function run() external view {
        console.log("Testing quoteSend with properly formatted worker options...");
        
        SovaBTCOFT oft = SovaBTCOFT(BASE_SEPOLIA_OFT);
        bytes32 recipient = bytes32(uint256(uint160(0x6182051f545E673b54119800126d8802E3Da034b)));
        
        console.log("=== Test 1: Minimal valid worker options (2 bytes) ===");
        
        // Create minimal worker options that meet the 2-byte requirement
        // Format: [workerId][additional_byte] - minimum 2 bytes
        bytes memory minimalWorkerOptions = hex"0100"; // workerId=1, minimal options
        
        try oft.quoteSend(
            SendParam({
                dstEid: OPTIMISM_SEPOLIA_EID,
                to: recipient,
                amountLD: 100000000, // 1 sovaBTC
                minAmountLD: 100000000,
                extraOptions: minimalWorkerOptions,
                composeMsg: "",
                oftCmd: ""
            }),
            false
        ) returns (MessagingFee memory fee) {
            console.log("SUCCESS: Minimal worker options worked!");
            console.log("Native fee:", fee.nativeFee);
            console.log("LZ token fee:", fee.lzTokenFee);
        } catch Error(string memory reason) {
            console.log("ERROR (minimal worker options):", reason);
        } catch (bytes memory lowLevelData) {
            console.log("ERROR (minimal worker options - low level):");
            if (lowLevelData.length >= 4) {
                bytes4 selector = bytes4(lowLevelData);
                console.logBytes4(selector);
            }
        }
        
        console.log("=== Test 2: Standard executor options ===");
        
        // Standard LayerZero executor options format
        // This follows the LayerZero V2 options format for lzReceive
        bytes memory standardOptions = hex"00030100110100000000000000000000000186a0"; // ~100k gas for lzReceive
        
        try oft.quoteSend(
            SendParam({
                dstEid: OPTIMISM_SEPOLIA_EID,
                to: recipient,
                amountLD: 100000000,
                minAmountLD: 100000000,
                extraOptions: standardOptions,
                composeMsg: "",
                oftCmd: ""
            }),
            false
        ) returns (MessagingFee memory fee) {
            console.log("SUCCESS: Standard executor options worked!");
            console.log("Native fee:", fee.nativeFee);
            console.log("LZ token fee:", fee.lzTokenFee);
        } catch Error(string memory reason) {
            console.log("ERROR (standard options):", reason);
        } catch (bytes memory lowLevelData) {
            console.log("ERROR (standard options - low level):");
            if (lowLevelData.length >= 4) {
                bytes4 selector = bytes4(lowLevelData);
                console.logBytes4(selector);
            }
        }
        
        console.log("=== Test 3: Compare with empty options (should fail) ===");
        
        // This should fail with the worker options error we've been seeing
        try oft.quoteSend(
            SendParam({
                dstEid: OPTIMISM_SEPOLIA_EID,
                to: recipient,
                amountLD: 100000000,
                minAmountLD: 100000000,
                extraOptions: "", // Empty - should cause InvalidWorkerOptions
                composeMsg: "",
                oftCmd: ""
            }),
            false
        ) returns (MessagingFee memory fee) {
            console.log("UNEXPECTED: Empty options worked");
        } catch Error(string memory reason) {
            console.log("EXPECTED ERROR (empty options):", reason);
        } catch (bytes memory lowLevelData) {
            console.log("EXPECTED ERROR (empty options - should be 0x6592671c):");
            if (lowLevelData.length >= 4) {
                bytes4 selector = bytes4(lowLevelData);
                console.logBytes4(selector);
                if (selector == 0x6592671c) {
                    console.log("CONFIRMED: This is LZ_ULN_InvalidWorkerOptions!");
                }
            }
        }
    }
} 