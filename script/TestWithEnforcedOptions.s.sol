// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

/**
 * @title TestWithEnforcedOptions
 * @notice Test quoteSend with various extraOptions now that enforced options are set
 */
contract TestWithEnforcedOptions is Script {
    
    address constant BASE_SEPOLIA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    function run() external view {
        console.log("Testing quoteSend with enforced options now set...");
        
        SovaBTCOFT oft = SovaBTCOFT(BASE_SEPOLIA_OFT);
        bytes32 recipient = bytes32(uint256(uint160(0x6182051f545E673b54119800126d8802E3Da034b)));
        
        // First confirm enforced options are set
        console.log("=== Checking enforced options ===");
        try oft.enforcedOptions(OPTIMISM_SEPOLIA_EID, 1) returns (bytes memory enforcedOpts) {
            console.log("Enforced options:");
            console.logBytes(enforcedOpts);
        } catch {
            console.log("No enforced options found");
            return;
        }
        
        // Test 1: Empty extraOptions (current frontend approach)
        console.log("=== Test 1: Empty extraOptions ===");
        testQuoteSend(oft, recipient, "", "Empty options");
        
        // Test 2: Same format as enforced options
        console.log("=== Test 2: Matching enforced options format ===");
        bytes memory matchingOptions = hex"00030100110100000000000000000000000186a0";
        testQuoteSend(oft, recipient, matchingOptions, "Matching enforced");
        
        // Test 3: Different but valid LayerZero options
        console.log("=== Test 3: Different valid options ===");
        bytes memory differentOptions = hex"000301001101000000000000000000000000c350"; // 50k gas
        testQuoteSend(oft, recipient, differentOptions, "Different valid");
        
        // Test 4: Minimal valid options
        console.log("=== Test 4: Minimal options ===");
        bytes memory minimalOptions = hex"000301001101000000000000000000000000753000"; // Very minimal
        testQuoteSend(oft, recipient, minimalOptions, "Minimal");
    }
    
    function testQuoteSend(
        SovaBTCOFT oft,
        bytes32 recipient,
        bytes memory extraOptions,
        string memory description
    ) internal view {
        console.log("Testing:", description);
        
        try oft.quoteSend(
            SendParam({
                dstEid: OPTIMISM_SEPOLIA_EID,
                to: recipient,
                amountLD: 100000000,
                minAmountLD: 100000000,
                extraOptions: extraOptions,
                composeMsg: "",
                oftCmd: ""
            }),
            false
        ) returns (MessagingFee memory fee) {
            console.log("SUCCESS! Native fee:", fee.nativeFee);
            console.log("LZ token fee:", fee.lzTokenFee);
            console.log("*** THIS WORKS! ***");
        } catch (bytes memory lowLevelData) {
            if (lowLevelData.length >= 4) {
                bytes4 selector = bytes4(lowLevelData);
                console.log("Error:");
                console.logBytes4(selector);
                
                if (selector == 0x6592671c) {
                    console.log("Still InvalidWorkerOptions");
                } else {
                    console.log("Different error - progress!");
                }
            }
        }
        console.log("---");
    }
} 