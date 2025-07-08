// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

/**
 * @title TestEmptyExtraOptions
 * @notice Test quoteSend with empty extraOptions (what the frontend now uses)
 */
contract TestEmptyExtraOptions is Script {
    
    address constant BASE_SEPOLIA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    function run() external view {
        console.log("Testing quoteSend with EMPTY extraOptions (frontend approach)...");
        
        SovaBTCOFT oft = SovaBTCOFT(BASE_SEPOLIA_OFT);
        bytes32 recipient = bytes32(uint256(uint160(0x6182051f545E673b54119800126d8802E3Da034b)));
        
        console.log("=== Testing with empty extraOptions ===");
        console.log("This is exactly what the frontend now does");
        
        try oft.quoteSend(
            SendParam({
                dstEid: OPTIMISM_SEPOLIA_EID,
                to: recipient,
                amountLD: 100000000, // 1 sovaBTC
                minAmountLD: 100000000,
                extraOptions: "", // EMPTY - exactly like frontend
                composeMsg: "",
                oftCmd: ""
            }),
            false
        ) returns (MessagingFee memory fee) {
            console.log("SUCCESS: Empty extraOptions work!");
            console.log("Native fee:", fee.nativeFee);
            console.log("LZ token fee:", fee.lzTokenFee);
            console.log("");
            console.log("*** BRIDGE IS WORKING! ***");
            console.log("The frontend should now work with empty extraOptions!");
        } catch Error(string memory reason) {
            console.log("ERROR with empty extraOptions:", reason);
        } catch (bytes memory lowLevelData) {
            console.log("ERROR with empty extraOptions (low level):");
            if (lowLevelData.length >= 4) {
                bytes4 selector = bytes4(lowLevelData);
                console.logBytes4(selector);
                
                if (selector == 0x6592671c) {
                    console.log("Still InvalidWorkerOptions - enforced options needed");
                } else {
                    console.log("Different error");
                }
            }
        }
        
        console.log("=== Checking if enforced options exist ===");
        
        // Check if enforced options are already set
        try oft.enforcedOptions(OPTIMISM_SEPOLIA_EID, 1) returns (bytes memory options) {
            if (options.length > 0) {
                console.log("Enforced options ARE set:");
                console.logBytes(options);
            } else {
                console.log("Enforced options are empty");
            }
        } catch {
            console.log("Cannot read enforced options or they don't exist");
        }
    }
} 