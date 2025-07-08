// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";
import {ILayerZeroEndpointV2} from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import {SetConfigParam} from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/IMessageLibManager.sol";
import {UlnConfig} from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/UlnBase.sol";
import {ExecutorConfig} from "@layerzerolabs/lz-evm-messagelib-v2/contracts/SendLibBase.sol";

/**
 * @title SetupLayerZeroDVN
 * @notice Configure DVN and Executor for LayerZero testnet bridging
 */
contract SetupLayerZeroDVN is Script {
    
    uint32 constant EXECUTOR_CONFIG_TYPE = 1;
    uint32 constant ULN_CONFIG_TYPE = 2;
    
    // FRONTEND-CONFIGURED OFT CONTRACT ADDRESSES
    address constant BASE_SEPOLIA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    address constant OPTIMISM_SEPOLIA_OFT = 0x1b7227A7A6BcAe6c64907b1B51dD0801C3E8ba30;
    
    // LayerZero Endpoint IDs
    uint32 constant BASE_SEPOLIA_EID = 40245;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    // LayerZero Testnet DVN and Executor addresses (common across testnets)
    address constant LAYERZERO_LABS_DVN = 0x88B27057A9e00c5F05DDa29241027afF63f9e6e0; // LayerZero Labs DVN
    address constant LAYERZERO_EXECUTOR = 0x4208D6E27538189bB48E603D6123A94b8Abe0A0b; // LayerZero Executor
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 chainId = block.chainid;
        
        console.log("=== Setting up LayerZero DVN Configuration ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", chainId);
        
        vm.startBroadcast(deployerPrivateKey);
        
        if (chainId == 84532) {
            // Base Sepolia - configure for Optimism Sepolia
            setupConfiguration(
                BASE_SEPOLIA_OFT,
                OPTIMISM_SEPOLIA_EID,
                "Base Sepolia",
                "Optimism Sepolia"
            );
        } else if (chainId == 11155420) {
            // Optimism Sepolia - configure for Base Sepolia
            setupConfiguration(
                OPTIMISM_SEPOLIA_OFT,
                BASE_SEPOLIA_EID,
                "Optimism Sepolia",
                "Base Sepolia"
            );
        } else {
            revert("Unsupported chain ID");
        }
        
        vm.stopBroadcast();
        
        console.log("=== DVN Configuration Complete ===");
    }
    
    function setupConfiguration(
        address oftAddress,
        uint32 dstEid,
        string memory sourceName,
        string memory destName
    ) internal {
        console.log("");
        console.log("Setting up %s -> %s configuration", sourceName, destName);
        console.log("OFT Address:", oftAddress);
        console.log("Destination EID:", dstEid);
        
        SovaBTCOFT oft = SovaBTCOFT(oftAddress);
        ILayerZeroEndpointV2 endpoint = ILayerZeroEndpointV2(oft.endpoint());
        
        // Get the send library address
        address sendLib = endpoint.getSendLibrary(oftAddress, dstEid);
        console.log("Send Library:", sendLib);
        
        // Create ULN Config for DVN
        address[] memory requiredDVNs = new address[](1);
        requiredDVNs[0] = LAYERZERO_LABS_DVN;
        
        UlnConfig memory ulnConfig = UlnConfig({
            confirmations: 1, // Minimum confirmations for testnet
            requiredDVNCount: 1, // Use 1 DVN for testnet
            optionalDVNCount: 0, // No optional DVNs
            optionalDVNThreshold: 0, // Not needed
            requiredDVNs: requiredDVNs, // LayerZero Labs DVN
            optionalDVNs: new address[](0) // No optional DVNs
        });
        
        // Create Executor Config
        ExecutorConfig memory execConfig = ExecutorConfig({
            maxMessageSize: 10000, // Max message size
            executor: LAYERZERO_EXECUTOR // LayerZero Executor
        });
        
        // Encode configurations
        bytes memory encodedUln = abi.encode(ulnConfig);
        bytes memory encodedExec = abi.encode(execConfig);
        
        // Create SetConfigParam array
        SetConfigParam[] memory params = new SetConfigParam[](2);
        params[0] = SetConfigParam(dstEid, EXECUTOR_CONFIG_TYPE, encodedExec);
        params[1] = SetConfigParam(dstEid, ULN_CONFIG_TYPE, encodedUln);
        
        // Set the configuration
        try endpoint.setConfig(oftAddress, sendLib, params) {
            console.log("SUCCESS: DVN and Executor configuration set");
            console.log("  DVN:", LAYERZERO_LABS_DVN);
            console.log("  Executor:", LAYERZERO_EXECUTOR);
            console.log("  Confirmations: 1");
        } catch Error(string memory reason) {
            console.log("FAILED to set config:", reason);
        } catch {
            console.log("FAILED to set config: Unknown error");
        }
    }
} 