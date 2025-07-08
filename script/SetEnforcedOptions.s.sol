// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";
import {EnforcedOptionParam} from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OAppOptionsType3.sol";
import {OptionsBuilder} from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";

/**
 * @title SetEnforcedOptions
 * @notice Configure enforced options for LayerZero OFT contracts
 * @dev Required for proper LayerZero V2 operation
 */
contract SetEnforcedOptions is Script {
    using OptionsBuilder for bytes;
    
    // LayerZero Endpoint IDs
    uint32 constant BASE_SEPOLIA_EID = 40245;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    // FRONTEND-CONFIGURED OFT CONTRACT ADDRESSES
    address constant BASE_SEPOLIA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    address constant OPTIMISM_SEPOLIA_OFT = 0x1b7227A7A6BcAe6c64907b1B51dD0801C3E8ba30;
    
    // Message type (standard OFT send message type)
    uint16 constant SEND_MESSAGE_TYPE = 1;
    
    function run() external {
        console.log("Setting enforced options for LayerZero OFT contracts...");
        
        // Setup enforced options for Base Sepolia OFT
        setupEnforcedOptions(
            BASE_SEPOLIA_OFT,
            OPTIMISM_SEPOLIA_EID,
            "Base Sepolia",
            "Optimism Sepolia"
        );
    }
    
    function setupOptimismSepolia() external {
        console.log("Setting enforced options for Optimism Sepolia OFT...");
        
        // Setup enforced options for Optimism Sepolia OFT
        setupEnforcedOptions(
            OPTIMISM_SEPOLIA_OFT,
            BASE_SEPOLIA_EID,
            "Optimism Sepolia", 
            "Base Sepolia"
        );
    }
    
    function setupEnforcedOptions(
        address oftAddress,
        uint32 dstEid,
        string memory sourceName,
        string memory destName
    ) internal {
        console.log("=== Setting enforced options for %s -> %s ===", sourceName, destName);
        console.log("OFT Address:", oftAddress);
        console.log("Destination EID:", dstEid);
        
        // Create enforced options with adequate gas for cross-chain execution
        // This ensures sufficient gas for lzReceive on destination chain
        bytes memory options = OptionsBuilder.newOptions()
            .addExecutorLzReceiveOption(200000, 0); // 200k gas should be sufficient for OFT transfers
        
        EnforcedOptionParam[] memory enforcedOptions = new EnforcedOptionParam[](1);
        enforcedOptions[0] = EnforcedOptionParam({
            eid: dstEid,
            msgType: SEND_MESSAGE_TYPE,
            options: options
        });
        
        vm.startBroadcast();
        
        SovaBTCOFT oft = SovaBTCOFT(oftAddress);
        oft.setEnforcedOptions(enforcedOptions);
        
        vm.stopBroadcast();
        
        console.log("[SUCCESS] Enforced options set successfully!");
        console.log("   - Destination EID:", dstEid);
        console.log("   - Gas limit: 200,000");
        console.log("   - Message type:", SEND_MESSAGE_TYPE);
    }
    
    function verifyEnforcedOptions(address oftAddress, uint32 dstEid) external view {
        console.log("=== Verifying enforced options ===");
        
        SovaBTCOFT oft = SovaBTCOFT(oftAddress);
        
        // Try to get enforced options (this will revert if not supported by the contract)
        try oft.enforcedOptions(dstEid, SEND_MESSAGE_TYPE) returns (bytes memory options) {
            console.log("[SUCCESS] Enforced options exist");
            console.log("   Options length:", options.length);
            console.log("   Options data:", vm.toString(options));
        } catch {
            console.log("[ERROR] No enforced options found or contract doesn't support enforcedOptions()");
        }
    }
} 