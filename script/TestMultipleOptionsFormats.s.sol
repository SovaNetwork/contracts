// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

/**
 * @title TestMultipleOptionsFormats
 * @notice Test quoteSend with various valid LayerZero V2 options formats
 */
contract TestMultipleOptionsFormats is Script {
    
    address constant BASE_SEPOLIA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    function run() external view {
        console.log("Testing multiple LayerZero V2 options formats...");
        
        SovaBTCOFT oft = SovaBTCOFT(BASE_SEPOLIA_OFT);
        bytes32 recipient = bytes32(uint256(uint160(0x6182051f545E673b54119800126d8802E3Da034b)));
        
        // Test Format 1: Standard LzReceive option (TYPE_3)
        console.log("=== Format 1: Standard LzReceive ===");
        bytes memory format1 = hex"00030100110100000000000000000000000186a0"; // TYPE_3 + LZ_RECEIVE + 100k gas
        testOptions(oft, recipient, format1, "Standard LzReceive");
        
        // Test Format 2: Simpler LzReceive option  
        console.log("=== Format 2: Simple LzReceive ===");
        bytes memory format2 = hex"000301001101000000000000000000000001f4a0"; // TYPE_3 + LZ_RECEIVE + 128k gas
        testOptions(oft, recipient, format2, "Simple LzReceive");
        
        // Test Format 3: Minimal valid executor option
        console.log("=== Format 3: Minimal executor ===");
        bytes memory format3 = hex"00030100110100000000000000000000000030d4"; // TYPE_3 + LZ_RECEIVE + 12.5k gas
        testOptions(oft, recipient, format3, "Minimal executor");
        
        // Test Format 4: Different encoding approach
        console.log("=== Format 4: Different encoding ===");
        bytes memory format4 = hex"000301001101000000000000000000000000c350"; // TYPE_3 + LZ_RECEIVE + 50k gas
        testOptions(oft, recipient, format4, "Different encoding");
        
        // Test Format 5: Try with enforced options approach
        console.log("=== Format 5: Basic enforcement ===");
        bytes memory format5 = hex"000301001101000000000000000000000000753000"; // Extended format
        testOptions(oft, recipient, format5, "Basic enforcement");
        
        console.log("=== Testing completed ===");
    }
    
    function testOptions(
        SovaBTCOFT oft, 
        bytes32 recipient, 
        bytes memory options, 
        string memory description
    ) internal view {
        console.log("Testing:", description);
        console.log("Options:");
        console.logBytes(options);
        
        try oft.quoteSend(
            SendParam({
                dstEid: OPTIMISM_SEPOLIA_EID,
                to: recipient,
                amountLD: 100000000,
                minAmountLD: 100000000,
                extraOptions: options,
                composeMsg: "",
                oftCmd: ""
            }),
            false
        ) returns (MessagingFee memory fee) {
            console.log("SUCCESS! Native fee:", fee.nativeFee);
            console.log("LZ token fee:", fee.lzTokenFee);
            console.log("*** THIS FORMAT WORKS! ***");
        } catch (bytes memory lowLevelData) {
            if (lowLevelData.length >= 4) {
                bytes4 selector = bytes4(lowLevelData);
                console.log("Error:");
                console.logBytes4(selector);
                
                if (selector == 0x6592671c) {
                    console.log("InvalidWorkerOptions");
                } else if (selector == 0x41705130) {
                    console.log("Different error (progress)");
                } else {
                    console.log("New error signature");
                }
            }
        }
        console.log("---");
    }
} 