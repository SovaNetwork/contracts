// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {SovaBTCOFT} from "../src/SovaBTCOFT.sol";

/**
 * @title ConfigurePeers
 * @notice Configures LayerZero peer relationships between SovaBTC OFT contracts
 * @dev Must be run on each network after all OFT contracts are deployed
 */
contract ConfigurePeers is Script {
    // ============ Network Configurations ============
    
    struct NetworkConfig {
        uint32 layerZeroEid;
        address oftContract;
        string name;
    }

    // ============ Deployment Addresses ============
    // NOTE: Update these addresses after deploying OFT contracts to each network
    
    mapping(uint256 => NetworkConfig) public networkConfigs;

    constructor() {
        // Ethereum Sepolia Configuration
        networkConfigs[11155111] = NetworkConfig({
            layerZeroEid: 40161,
            oftContract: 0x1101036be784E8A879729B0932BE751EA4302010,
            name: "Ethereum Sepolia"
        });

        // Optimism Sepolia Configuration  
        networkConfigs[11155420] = NetworkConfig({
            layerZeroEid: 40232,
            oftContract: 0xb34227F992e4Ec3AA8D6937Eb2C9Ed92e2650aCD,
            name: "Optimism Sepolia"
        });

        // Base Sepolia Configuration
        networkConfigs[84532] = NetworkConfig({
            layerZeroEid: 40245,
            oftContract: 0x80c0eE2cB545b9E9c739B5fDa17578b1f0340004,
            name: "Base Sepolia"
        });

        // Arbitrum Sepolia Configuration
        networkConfigs[421614] = NetworkConfig({
            layerZeroEid: 40231,
            oftContract: address(0), // UPDATE: Add deployed OFT contract address
            name: "Arbitrum Sepolia"
        });
    }

    // ============ Main Configuration Function ============

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        
        vm.startBroadcast(deployerKey);

        console.log("=== Configuring LayerZero OFT Peers ===");
        console.log("Deployer:", deployer);
        console.log("Current Chain ID:", block.chainid);
        console.log("Current Network:", networkConfigs[block.chainid].name);
        console.log("");

        // Get current network configuration
        NetworkConfig memory currentNetwork = networkConfigs[block.chainid];
        require(currentNetwork.oftContract != address(0), "OFT contract address not configured for current network");

        SovaBTCOFT currentOFT = SovaBTCOFT(currentNetwork.oftContract);
        console.log("Current OFT Contract:", currentNetwork.oftContract);
        console.log("Current LayerZero EID:", currentNetwork.layerZeroEid);
        console.log("");

        // Configure peers for all other networks
        configurePeersForAllNetworks(currentOFT, currentNetwork);

        vm.stopBroadcast();

        console.log("=== Peer Configuration Complete ===");
        outputPeerStatus(currentNetwork);
    }

    // ============ Peer Configuration Functions ============

    function configurePeersForAllNetworks(
        SovaBTCOFT currentOFT, 
        NetworkConfig memory currentNetwork
    ) internal {
        console.log("Configuring peers for all networks...");
        
        // Configure peer for each other network
        if (block.chainid != 11155111 && networkConfigs[11155111].oftContract != address(0)) {
            configurePeer(currentOFT, networkConfigs[11155111], "Ethereum Sepolia");
        }
        
        if (block.chainid != 11155420 && networkConfigs[11155420].oftContract != address(0)) {
            configurePeer(currentOFT, networkConfigs[11155420], "Optimism Sepolia");
        }
        
        if (block.chainid != 84532 && networkConfigs[84532].oftContract != address(0)) {
            configurePeer(currentOFT, networkConfigs[84532], "Base Sepolia");
        }
        
        if (block.chainid != 421614 && networkConfigs[421614].oftContract != address(0)) {
            configurePeer(currentOFT, networkConfigs[421614], "Arbitrum Sepolia");
        }

        console.log("");
    }

    function configurePeer(
        SovaBTCOFT currentOFT,
        NetworkConfig memory targetNetwork,
        string memory targetName
    ) internal {
        console.log("Setting peer for %s (EID: %s)...", targetName, targetNetwork.layerZeroEid);
        
        // Convert address to bytes32 for LayerZero
        bytes32 peerAddress = addressToBytes32(targetNetwork.oftContract);
        
        // Set the peer relationship
        currentOFT.setPeer(targetNetwork.layerZeroEid, peerAddress);
        
        console.log("SUCCESS: Successfully set peer: %s -> %s", targetName, targetNetwork.oftContract);
    }

    // ============ Utility Functions ============

    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }

    function bytes32ToAddress(bytes32 _bytes) internal pure returns (address) {
        return address(uint160(uint256(_bytes)));
    }

    // ============ Status and Verification Functions ============

    function outputPeerStatus(NetworkConfig memory currentNetwork) internal view {
        console.log("");
        console.log("=== Peer Configuration Summary ===");
        console.log("Network: %s", currentNetwork.name);
        console.log("LayerZero EID: %s", currentNetwork.layerZeroEid);
        console.log("OFT Contract: %s", currentNetwork.oftContract);
        console.log("");
        
        console.log("Configured peers:");
        if (block.chainid != 11155111 && networkConfigs[11155111].oftContract != address(0)) {
            console.log("- Ethereum Sepolia (EID: 40161): %s", networkConfigs[11155111].oftContract);
        }
        if (block.chainid != 11155420 && networkConfigs[11155420].oftContract != address(0)) {
            console.log("- Optimism Sepolia (EID: 40232): %s", networkConfigs[11155420].oftContract);
        }
        if (block.chainid != 84532 && networkConfigs[84532].oftContract != address(0)) {
            console.log("- Base Sepolia (EID: 40245): %s", networkConfigs[84532].oftContract);
        }
        if (block.chainid != 421614 && networkConfigs[421614].oftContract != address(0)) {
            console.log("- Arbitrum Sepolia (EID: 40231): %s", networkConfigs[421614].oftContract);
        }
        console.log("");
        
        console.log("=== Next Steps ===");
        console.log("1. Run this script on ALL other networks");
        console.log("2. Verify peer relationships with verifyPeers script");
        console.log("3. Test cross-chain transfers");
        console.log("4. Update frontend with bridge interface");
    }

    // ============ Advanced Configuration Functions ============

    /**
     * @notice Configure a single peer relationship (for manual setup)
     * @param targetEid Target LayerZero endpoint ID
     * @param targetContract Target OFT contract address
     */
    function configureSinglePeer(uint32 targetEid, address targetContract) external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        NetworkConfig memory currentNetwork = networkConfigs[block.chainid];
        require(currentNetwork.oftContract != address(0), "Current network OFT not configured");

        SovaBTCOFT currentOFT = SovaBTCOFT(currentNetwork.oftContract);
        bytes32 peerAddress = addressToBytes32(targetContract);
        
        currentOFT.setPeer(targetEid, peerAddress);
        
        console.log("Set peer: EID %s -> %s", targetEid, targetContract);
        
        vm.stopBroadcast();
    }

    /**
     * @notice Remove a peer relationship
     * @param targetEid Target LayerZero endpoint ID to remove
     */
    function removePeer(uint32 targetEid) external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        NetworkConfig memory currentNetwork = networkConfigs[block.chainid];
        require(currentNetwork.oftContract != address(0), "Current network OFT not configured");

        SovaBTCOFT currentOFT = SovaBTCOFT(currentNetwork.oftContract);
        
        // Set peer to zero address to remove
        currentOFT.setPeer(targetEid, bytes32(0));
        
        console.log("Removed peer for EID: %s", targetEid);
        
        vm.stopBroadcast();
    }

    // ============ Verification Functions ============

    /**
     * @notice Verify all peer relationships are correctly configured
     */
    function verifyPeers() external view {
        NetworkConfig memory currentNetwork = networkConfigs[block.chainid];
        require(currentNetwork.oftContract != address(0), "Current network OFT not configured");

        SovaBTCOFT currentOFT = SovaBTCOFT(currentNetwork.oftContract);
        
        console.log("=== Verifying Peer Relationships ===");
        console.log("Current Network: %s (EID: %s)", currentNetwork.name, currentNetwork.layerZeroEid);
        console.log("");

        // Check each peer
        _verifyPeerRelationship(currentOFT, 40161, networkConfigs[11155111], "Ethereum Sepolia");
        _verifyPeerRelationship(currentOFT, 40232, networkConfigs[11155420], "Optimism Sepolia");
        _verifyPeerRelationship(currentOFT, 40245, networkConfigs[84532], "Base Sepolia");
        _verifyPeerRelationship(currentOFT, 40231, networkConfigs[421614], "Arbitrum Sepolia");
    }

    function _verifyPeerRelationship(
        SovaBTCOFT currentOFT,
        uint32 targetEid,
        NetworkConfig memory targetNetwork,
        string memory targetName
    ) internal view {
        if (targetNetwork.layerZeroEid == targetEid && targetNetwork.oftContract != address(0)) {
            bytes32 configuredPeer = currentOFT.peers(targetEid);
            address expectedPeer = targetNetwork.oftContract;
            
            if (configuredPeer == addressToBytes32(expectedPeer)) {
                console.log("SUCCESS: %s: Correctly configured", targetName);
            } else {
                console.log("ERROR: %s: Misconfigured (expected: %s, got: %s)", 
                    targetName, expectedPeer, bytes32ToAddress(configuredPeer));
            }
        }
    }

    // ============ Batch Configuration Functions ============

    /**
     * @notice Update contract addresses in batch (after deployment)
     */
    function updateContractAddresses(
        address ethSepoliaOFT,
        address opSepoliaOFT, 
        address baseSepoliaOFT,
        address arbSepoliaOFT
    ) external {
        console.log("Updating contract addresses...");
        
        if (ethSepoliaOFT != address(0)) {
            networkConfigs[11155111].oftContract = ethSepoliaOFT;
            console.log("Updated Ethereum Sepolia OFT: %s", ethSepoliaOFT);
        }
        
        if (opSepoliaOFT != address(0)) {
            networkConfigs[11155420].oftContract = opSepoliaOFT;
            console.log("Updated Optimism Sepolia OFT: %s", opSepoliaOFT);
        }
        
        if (baseSepoliaOFT != address(0)) {
            networkConfigs[84532].oftContract = baseSepoliaOFT;
            console.log("Updated Base Sepolia OFT: %s", baseSepoliaOFT);
        }
        
        if (arbSepoliaOFT != address(0)) {
            networkConfigs[421614].oftContract = arbSepoliaOFT;
            console.log("Updated Arbitrum Sepolia OFT: %s", arbSepoliaOFT);
        }
    }
} 