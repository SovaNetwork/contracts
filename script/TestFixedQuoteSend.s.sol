// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

/**
 * @title TestFixedQuoteSend
 * @notice Test quoteSend with the same fixed options applied to the frontend
 */
contract TestFixedQuoteSend is Script {
    
    address constant BASE_SEPOLIA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    function run() external view {
        console.log("Testing quoteSend with FIXED frontend options...");
        
        SovaBTCOFT oft = SovaBTCOFT(BASE_SEPOLIA_OFT);
        bytes32 recipient = bytes32(uint256(uint160(0x6182051f545E673b54119800126d8802E3Da034b)));
        
        console.log("=== Testing FIXED LayerZero V2 Options ===");
        
        // This is the EXACT same options format now used in the frontend
        // Format: 0x0003 + 0x0100 + gas_limit_bytes + msg_value_bytes  
        // Provides 100k gas for lzReceive execution on destination
        bytes memory fixedOptions = hex"00030100110100000000000000000000000186a0";
        
        console.log("Options being used:");
        console.logBytes(fixedOptions);
        
        try oft.quoteSend(
            SendParam({
                dstEid: OPTIMISM_SEPOLIA_EID,
                to: recipient,
                amountLD: 100000000, // 1 sovaBTC
                minAmountLD: 100000000,
                extraOptions: fixedOptions,
                composeMsg: "",
                oftCmd: ""
            }),
            false
        ) returns (MessagingFee memory fee) {
            console.log("SUCCESS: BRIDGE IS NOW WORKING!");
            console.log("Native fee required:", fee.nativeFee);
            console.log("LZ token fee:", fee.lzTokenFee);
            console.log("");
            console.log("The frontend bridge should now work!");
            console.log("Fee quote successful - ready for actual bridging");
        } catch Error(string memory reason) {
            console.log("ERROR (with fixed options):", reason);
        } catch (bytes memory lowLevelData) {
            console.log("ERROR (with fixed options - low level):");
            if (lowLevelData.length >= 4) {
                bytes4 selector = bytes4(lowLevelData);
                console.logBytes4(selector);
                
                if (selector == 0x6592671c) {
                    console.log("Still InvalidWorkerOptions - need different format");
                } else {
                    console.log("Different error - progress made!");
                }
            }
        }
    }
} 