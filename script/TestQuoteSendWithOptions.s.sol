// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

/**
 * @title TestQuoteSendWithOptions
 * @notice Test quoteSend with proper execution options
 */
contract TestQuoteSendWithOptions is Script {
    
    address constant BASE_SEPOLIA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    function run() external view {
        console.log("Testing quoteSend with execution options...");
        
        SovaBTCOFT oft = SovaBTCOFT(BASE_SEPOLIA_OFT);
        bytes32 recipient = bytes32(uint256(uint160(0x6182051f545E673b54119800126d8802E3Da034b)));
        
        // Try different approaches to provide execution options
        console.log("=== Test 1: Basic execution options ===");
        
        // Create basic execution options (gas for lzReceive)
        // Format: [option_type][gas_limit][msg_value]
        // Option type 1 = LZ_RECEIVE option
        // 0x00030100 = option type 1, followed by gas limit
        bytes memory basicOptions = hex"0003010011010000000000000000000000030d40"; // ~200k gas
        
        try oft.quoteSend(
            SendParam({
                dstEid: OPTIMISM_SEPOLIA_EID,
                to: recipient,
                amountLD: 100000000, // 1 sovaBTC (8 decimals)
                minAmountLD: 100000000,
                extraOptions: basicOptions,
                composeMsg: "",
                oftCmd: ""
            }),
            false // payInLzToken
        ) returns (MessagingFee memory fee) {
            console.log("SUCCESS: quoteSend with basic options worked!");
            console.log("Native fee:", fee.nativeFee);
            console.log("LZ token fee:", fee.lzTokenFee);
        } catch Error(string memory reason) {
            console.log("ERROR (basic options):", reason);
        } catch (bytes memory lowLevelData) {
            console.log("ERROR (basic options - low level):");
            console.log("Error data length:", lowLevelData.length);
            if (lowLevelData.length >= 4) {
                bytes4 selector = bytes4(lowLevelData);
                console.logBytes4(selector);
            }
        }
        
        console.log("=== Test 2: Minimal execution options ===");
        
        // Try even simpler options
        bytes memory minimalOptions = hex"000301001101000000000000000000000001f4a0"; // ~128k gas
        
        try oft.quoteSend(
            SendParam({
                dstEid: OPTIMISM_SEPOLIA_EID,
                to: recipient,
                amountLD: 100000000,
                minAmountLD: 100000000,
                extraOptions: minimalOptions,
                composeMsg: "",
                oftCmd: ""
            }),
            false
        ) returns (MessagingFee memory fee) {
            console.log("SUCCESS: quoteSend with minimal options worked!");
            console.log("Native fee:", fee.nativeFee);
        } catch Error(string memory reason) {
            console.log("ERROR (minimal options):", reason);
        } catch (bytes memory lowLevelData) {
            console.log("ERROR (minimal options - low level):");
            if (lowLevelData.length >= 4) {
                bytes4 selector = bytes4(lowLevelData);
                console.logBytes4(selector);
            }
        }
        
        console.log("=== Test 3: Try with different amount ===");
        
        // Try with a different amount
        try oft.quoteSend(
            SendParam({
                dstEid: OPTIMISM_SEPOLIA_EID,
                to: recipient,
                amountLD: 10000000, // 0.1 sovaBTC
                minAmountLD: 10000000,
                extraOptions: basicOptions,
                composeMsg: "",
                oftCmd: ""
            }),
            false
        ) returns (MessagingFee memory fee) {
            console.log("SUCCESS: quoteSend with smaller amount worked!");
            console.log("Native fee:", fee.nativeFee);
        } catch Error(string memory reason) {
            console.log("ERROR (smaller amount):", reason);
        } catch (bytes memory lowLevelData) {
            console.log("ERROR (smaller amount - low level):");
            if (lowLevelData.length >= 4) {
                bytes4 selector = bytes4(lowLevelData);
                console.logBytes4(selector);
            }
        }
    }
} 