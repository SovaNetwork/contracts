// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

/**
 * @title ConfigureFreshOFTPeers
 * @notice Configure LayerZero peer relationships for fresh protocol deployment
 * @dev Run this script after deploying on both networks to establish cross-chain connections
 */
contract ConfigureFreshOFTPeers is Script {
    
    // LayerZero V2 Endpoint IDs
    uint32 constant ETHEREUM_SEPOLIA_EID = 40161;
    uint32 constant BASE_SEPOLIA_EID = 40245;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    // Network configuration struct
    struct NetworkConfig {
        uint256 chainId;
        uint32 layerZeroEid;
        address oftAddress;
        string name;
    }
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 currentChainId = block.chainid;
        
        console.log("=== Configuring Fresh OFT Peers ===");
        console.log("Deployer:", deployer);
        console.log("Current Chain ID:", currentChainId);
        
        // Get deployed contract addresses from environment or user input
        address baseOFT = getEnvAddress("BASE_SEPOLIA_OFT_ADDRESS");
        address optimismOFT = getEnvAddress("OPTIMISM_SEPOLIA_OFT_ADDRESS");
        
        // If addresses not in environment, prompt for manual input
        if (baseOFT == address(0) || optimismOFT == address(0)) {
            console.log("");
            console.log("=== CONTRACT ADDRESSES REQUIRED ===");
            console.log("Please set environment variables:");
            console.log("export BASE_SEPOLIA_OFT_ADDRESS=<your_base_oft_address>");
            console.log("export OPTIMISM_SEPOLIA_OFT_ADDRESS=<your_optimism_oft_address>");
            console.log("");
            console.log("Or edit this script with the deployed addresses directly.");
            revert("Contract addresses not configured");
        }
        
        // Network configurations
        NetworkConfig[] memory networks = new NetworkConfig[](2);
        
        networks[0] = NetworkConfig({
            chainId: 84532,
            layerZeroEid: BASE_SEPOLIA_EID,
            oftAddress: baseOFT,
            name: "Base Sepolia"
        });
        
        networks[1] = NetworkConfig({
            chainId: 11155420,
            layerZeroEid: OPTIMISM_SEPOLIA_EID,
            oftAddress: optimismOFT,
            name: "Optimism Sepolia"
        });
        
        // Find current network
        NetworkConfig memory currentNetwork;
        bool found = false;
        
        for (uint256 i = 0; i < networks.length; i++) {
            if (networks[i].chainId == currentChainId) {
                currentNetwork = networks[i];
                found = true;
                break;
            }
        }
        
        require(found, "Current network not supported");
        
        console.log("Current Network:", currentNetwork.name);
        console.log("Current OFT Address:", currentNetwork.oftAddress);
        
        vm.startBroadcast(deployerPrivateKey);
        
        SovaBTCOFT currentOFT = SovaBTCOFT(currentNetwork.oftAddress);
        
        // Verify we're the owner
        require(currentOFT.owner() == deployer, "Not the owner of OFT contract");
        
        console.log("");
        console.log("=== Setting Up Peer Relationships ===");
        
        // Configure peers for all other networks
        for (uint256 i = 0; i < networks.length; i++) {
            NetworkConfig memory peerNetwork = networks[i];
            
            // Skip current network
            if (peerNetwork.chainId == currentChainId) {
                continue;
            }
            
            console.log("Configuring peer:", peerNetwork.name);
            console.log("  Peer EID:", peerNetwork.layerZeroEid);
            console.log("  Peer Address:", peerNetwork.oftAddress);
            
            // Convert address to bytes32 for LayerZero
            bytes32 peerBytes32 = bytes32(uint256(uint160(peerNetwork.oftAddress)));
            
            // Set peer
            try currentOFT.setPeer(peerNetwork.layerZeroEid, peerBytes32) {
                console.log("Peer set successfully");
            } catch Error(string memory reason) {
                console.log("Failed to set peer:", reason);
            } catch {
                console.log("Failed to set peer: Unknown error");
            }
        }
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== Verification ===");
        console.log("Network:", currentNetwork.name);
        console.log("OFT Address:", currentNetwork.oftAddress);
        console.log("Peers configured for cross-chain transfers");
        
        console.log("");
        console.log("=== Next Steps ===");
        console.log("1. Run this script on all networks");
        console.log("2. Test cross-chain transfers");
        console.log("3. Update frontend configuration");
        console.log("4. Begin protocol operations");
    }
    
    /**
     * @notice Get address from environment variable
     * @param envVar Environment variable name
     * @return address Address from environment or zero address if not set
     */
    function getEnvAddress(string memory envVar) internal view returns (address) {
        try vm.envAddress(envVar) returns (address addr) {
            return addr;
        } catch {
            return address(0);
        }
    }
    
    /**
     * @notice Helper function to convert address to bytes32
     * @param addr Address to convert
     * @return bytes32 representation
     */
    function addressToBytes32(address addr) public pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }
} 