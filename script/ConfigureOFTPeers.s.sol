// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

/**
 * @title ConfigureOFTPeers
 * @notice Script to configure LayerZero OFT peer relationships
 * @dev Run this script on each network after deployment to enable cross-chain transfers
 */
contract ConfigureOFTPeers is Script {
    
    // ============ LayerZero V2 Endpoint IDs ============
    
    uint32 constant ETHEREUM_SEPOLIA_EID = 40161;
    uint32 constant BASE_SEPOLIA_EID = 40245;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    uint32 constant ARBITRUM_SEPOLIA_EID = 40231;
    
    // ============ Contract Addresses (Update after deployment) ============
    
    mapping(uint256 => address) public oftAddresses;
    
    function setUp() public {
        // TODO: Update these addresses after deployment on each network
        oftAddresses[11155111] = 0x0000000000000000000000000000000000000000; // Ethereum Sepolia
        oftAddresses[84532] = 0x0000000000000000000000000000000000000000;   // Base Sepolia
        oftAddresses[11155420] = 0x0000000000000000000000000000000000000000; // Optimism Sepolia
        oftAddresses[421614] = 0x0000000000000000000000000000000000000000;  // Arbitrum Sepolia
    }
    
    function run() public {
        uint256 currentChainId = block.chainid;
        address currentOFT = oftAddresses[currentChainId];
        
        require(currentOFT != address(0), "OFT address not set for current chain");
        
        vm.startBroadcast();
        
        SovaBTCOFT oft = SovaBTCOFT(currentOFT);
        
        console.log("Configuring peers for chain:", currentChainId);
        console.log("OFT address:", currentOFT);
        
        // Configure peers for all other networks
        if (currentChainId == 11155111) {
            // Ethereum Sepolia - configure peers to Base, Optimism, Arbitrum
            configureEthereumSepoliaPeers(oft);
        } else if (currentChainId == 84532) {
            // Base Sepolia - configure peers to Ethereum, Optimism, Arbitrum
            configureBaseSepoliaPeers(oft);
        } else if (currentChainId == 11155420) {
            // Optimism Sepolia - configure peers to Ethereum, Base, Arbitrum
            configureOptimismSepoliaPeers(oft);
        } else if (currentChainId == 421614) {
            // Arbitrum Sepolia - configure peers to Ethereum, Base, Optimism
            configureArbitrumSepoliaPeers(oft);
        } else {
            revert("Unsupported chain ID");
        }
        
        vm.stopBroadcast();
        
        console.log("Peer configuration complete");
    }
    
    function configureEthereumSepoliaPeers(SovaBTCOFT oft) internal {
        console.log("Configuring Ethereum Sepolia peers...");
        
        // Set Base Sepolia peer
        oft.setPeer(BASE_SEPOLIA_EID, addressToBytes32(oftAddresses[84532]));
        console.log("Base Sepolia peer configured");
        
        // Set Optimism Sepolia peer
        oft.setPeer(OPTIMISM_SEPOLIA_EID, addressToBytes32(oftAddresses[11155420]));
        console.log("Optimism Sepolia peer configured");
        
        // Set Arbitrum Sepolia peer
        oft.setPeer(ARBITRUM_SEPOLIA_EID, addressToBytes32(oftAddresses[421614]));
        console.log("Arbitrum Sepolia peer configured");
    }
    
    function configureBaseSepoliaPeers(SovaBTCOFT oft) internal {
        console.log("Configuring Base Sepolia peers...");
        
        // Set Ethereum Sepolia peer
        oft.setPeer(ETHEREUM_SEPOLIA_EID, addressToBytes32(oftAddresses[11155111]));
        console.log("Ethereum Sepolia peer configured");
        
        // Set Optimism Sepolia peer
        oft.setPeer(OPTIMISM_SEPOLIA_EID, addressToBytes32(oftAddresses[11155420]));
        console.log("Optimism Sepolia peer configured");
        
        // Set Arbitrum Sepolia peer
        oft.setPeer(ARBITRUM_SEPOLIA_EID, addressToBytes32(oftAddresses[421614]));
        console.log("Arbitrum Sepolia peer configured");
    }
    
    function configureOptimismSepoliaPeers(SovaBTCOFT oft) internal {
        console.log("Configuring Optimism Sepolia peers...");
        
        // Set Ethereum Sepolia peer
        oft.setPeer(ETHEREUM_SEPOLIA_EID, addressToBytes32(oftAddresses[11155111]));
        console.log("Ethereum Sepolia peer configured");
        
        // Set Base Sepolia peer
        oft.setPeer(BASE_SEPOLIA_EID, addressToBytes32(oftAddresses[84532]));
        console.log("Base Sepolia peer configured");
        
        // Set Arbitrum Sepolia peer
        oft.setPeer(ARBITRUM_SEPOLIA_EID, addressToBytes32(oftAddresses[421614]));
        console.log("Arbitrum Sepolia peer configured");
    }
    
    function configureArbitrumSepoliaPeers(SovaBTCOFT oft) internal {
        console.log("Configuring Arbitrum Sepolia peers...");
        
        // Set Ethereum Sepolia peer
        oft.setPeer(ETHEREUM_SEPOLIA_EID, addressToBytes32(oftAddresses[11155111]));
        console.log("Ethereum Sepolia peer configured");
        
        // Set Base Sepolia peer
        oft.setPeer(BASE_SEPOLIA_EID, addressToBytes32(oftAddresses[84532]));
        console.log("Base Sepolia peer configured");
        
        // Set Optimism Sepolia peer
        oft.setPeer(OPTIMISM_SEPOLIA_EID, addressToBytes32(oftAddresses[11155420]));
        console.log("Optimism Sepolia peer configured");
    }
    
    function addressToBytes32(address addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }
    
    // Helper function to check current peer configuration
    function checkPeerConfiguration(address oftAddress) external view {
        SovaBTCOFT oft = SovaBTCOFT(oftAddress);
        
        console.log("=== Current Peer Configuration ===");
        console.log("Chain ID:", block.chainid);
        console.log("OFT Address:", oftAddress);
        console.log("");
        
        // Check each possible peer
        console.log("Ethereum Sepolia EID 40161:", vm.toString(oft.peers(ETHEREUM_SEPOLIA_EID)));
        console.log("Base Sepolia EID 40245:", vm.toString(oft.peers(BASE_SEPOLIA_EID)));
        console.log("Optimism Sepolia EID 40232:", vm.toString(oft.peers(OPTIMISM_SEPOLIA_EID)));
        console.log("Arbitrum Sepolia EID 40231:", vm.toString(oft.peers(ARBITRUM_SEPOLIA_EID)));
    }
} 