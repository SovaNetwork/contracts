// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

/**
 * @title ConfigureNewOFTPeers
 * @notice Configure LayerZero peer relationships for the newly deployed real OFT contracts
 * @dev Run this script on each network after deploying all OFT contracts
 */
contract ConfigureNewOFTPeers is Script {
    
    // LayerZero V2 Endpoint IDs
    uint32 constant ETHEREUM_SEPOLIA_EID = 40161;
    uint32 constant BASE_SEPOLIA_EID = 40245;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    // TODO: Update these addresses after deployment
    // These will be updated with the actual deployed addresses
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
        
        console.log("=== Configuring LayerZero OFT Peers ===");
        console.log("Deployer:", deployer);
        console.log("Current Chain ID:", currentChainId);
        
        // Network configurations - UPDATE THESE ADDRESSES AFTER DEPLOYMENT
        NetworkConfig[] memory networks = new NetworkConfig[](3);
        
        networks[0] = NetworkConfig({
            chainId: 11155111,
            layerZeroEid: ETHEREUM_SEPOLIA_EID,
            oftAddress: address(0), // UPDATE WITH DEPLOYED ADDRESS
            name: "Ethereum Sepolia"
        });
        
        networks[1] = NetworkConfig({
            chainId: 84532,
            layerZeroEid: BASE_SEPOLIA_EID,
            oftAddress: address(0), // UPDATE WITH DEPLOYED ADDRESS
            name: "Base Sepolia"
        });
        
        networks[2] = NetworkConfig({
            chainId: 11155420,
            layerZeroEid: OPTIMISM_SEPOLIA_EID,
            oftAddress: address(0), // UPDATE WITH DEPLOYED ADDRESS
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
        
        require(found, "Current network not configured");
        require(currentNetwork.oftAddress != address(0), "Current network OFT address not set");
        
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
            
            // Skip if peer address not set
            if (peerNetwork.oftAddress == address(0)) {
                console.log("Skipping", peerNetwork.name, "- address not set");
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
        console.log("=== Configuration Complete ===");
        console.log("Network:", currentNetwork.name);
        console.log("OFT Address:", currentNetwork.oftAddress);
        
        console.log("");
        console.log("=== Next Steps ===");
        console.log("1. Run this script on all other networks");
        console.log("2. Test cross-chain transfers");
        console.log("3. Add wrapper contracts as minters");
        console.log("4. Update wrapper contracts to use new OFT");
    }
    
    /**
     * @notice Helper function to convert address to bytes32
     * @param addr Address to convert
     * @return bytes32 representation
     */
    function addressToBytes32(address addr) public pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }
    
    /**
     * @notice Helper function to convert bytes32 to address
     * @param b bytes32 to convert
     * @return address representation
     */
    function bytes32ToAddress(bytes32 b) public pure returns (address) {
        return address(uint160(uint256(b)));
    }
} 