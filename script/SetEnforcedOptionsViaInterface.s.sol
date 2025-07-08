// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

// Minimal interface based on LayerZero OFT tests
struct EnforcedOptionParam {
    uint32 eid;
    uint16 msgType;
    bytes options;
}

interface IOFTWithEnforcedOptions {
    function setEnforcedOptions(EnforcedOptionParam[] calldata _enforcedOptions) external;
    function enforcedOptions(uint32 eid, uint16 msgType) external view returns (bytes memory);
}

/**
 * @title SetEnforcedOptionsViaInterface
 * @notice Set enforced options using proper interface definition
 */
contract SetEnforcedOptionsViaInterface is Script {
    
    address constant BASE_SEPOLIA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    address constant OPTIMISM_SEPOLIA_OFT = 0x1b7227A7A6BcAe6c64907b1B51dD0801C3E8ba30;
    
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    uint32 constant BASE_SEPOLIA_EID = 40245;
    
    uint16 constant SEND_MESSAGE_TYPE = 1;
    
    function run() external {
        console.log("Setting enforced options via interface...");
        
        // Create enforced options - standard 100k gas for lzReceive
        bytes memory standardOptions = hex"00030100110100000000000000000000000186a0";
        
        console.log("Setting enforced options for Base Sepolia OFT...");
        console.log("Options:");
        console.logBytes(standardOptions);
        
        vm.startBroadcast();
        
        IOFTWithEnforcedOptions baseSepolia = IOFTWithEnforcedOptions(BASE_SEPOLIA_OFT);
        
        // Create array with one enforced option
        EnforcedOptionParam[] memory enforcedOptions = new EnforcedOptionParam[](1);
        enforcedOptions[0] = EnforcedOptionParam({
            eid: OPTIMISM_SEPOLIA_EID,
            msgType: SEND_MESSAGE_TYPE,
            options: standardOptions
        });
        
        try baseSepolia.setEnforcedOptions(enforcedOptions) {
            console.log("SUCCESS: Enforced options set on Base Sepolia!");
            
            // Verify the options were set
            try baseSepolia.enforcedOptions(OPTIMISM_SEPOLIA_EID, SEND_MESSAGE_TYPE) returns (bytes memory setOptions) {
                console.log("Verified - enforced options length:", setOptions.length);
                if (setOptions.length > 0) {
                    console.log("*** ENFORCED OPTIONS ARE NOW SET! ***");
                    console.log("The bridge should now work!");
                }
            } catch {
                console.log("Could not verify enforced options");
            }
            
        } catch Error(string memory reason) {
            console.log("ERROR setting enforced options:", reason);
        } catch (bytes memory lowLevelData) {
            console.log("ERROR setting enforced options (low level):");
            if (lowLevelData.length >= 4) {
                bytes4 selector = bytes4(lowLevelData);
                console.logBytes4(selector);
            }
        }
        
        vm.stopBroadcast();
    }
    
    function setupOptimismSepolia() external {
        console.log("Setting enforced options for Optimism Sepolia OFT...");
        
        bytes memory standardOptions = hex"00030100110100000000000000000000000186a0";
        
        vm.startBroadcast();
        
        IOFTWithEnforcedOptions optimismSepolia = IOFTWithEnforcedOptions(OPTIMISM_SEPOLIA_OFT);
        
        EnforcedOptionParam[] memory enforcedOptions = new EnforcedOptionParam[](1);
        enforcedOptions[0] = EnforcedOptionParam({
            eid: BASE_SEPOLIA_EID,
            msgType: SEND_MESSAGE_TYPE,
            options: standardOptions
        });
        
        try optimismSepolia.setEnforcedOptions(enforcedOptions) {
            console.log("SUCCESS: Enforced options set on Optimism Sepolia!");
        } catch Error(string memory reason) {
            console.log("ERROR:", reason);
        }
        
        vm.stopBroadcast();
    }
} 