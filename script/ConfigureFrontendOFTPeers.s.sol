// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

/**
 * @title ConfigureFrontendOFTPeers
 * @notice Configure LayerZero peer relationships for the OFT contracts used by the frontend
 * @dev These are the exact addresses configured in ui/src/contracts/addresses.ts
 */
contract ConfigureFrontendOFTPeers is Script {
    
    // LayerZero Endpoint IDs
    uint32 constant BASE_SEPOLIA_EID = 40245;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    // FRONTEND-CONFIGURED OFT CONTRACT ADDRESSES
    address constant BASE_SEPOLIA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    address constant OPTIMISM_SEPOLIA_OFT = 0x1b7227A7A6BcAe6c64907b1B51dD0801C3E8ba30;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 chainId = block.chainid;
        
        console.log("=== Configuring Frontend OFT Peers ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", chainId);
        
        vm.startBroadcast(deployerPrivateKey);
        
        if (chainId == 84532) {
            // Base Sepolia - configure Optimism as peer
            console.log("Configuring Base Sepolia OFT peers...");
            console.log("Base OFT:", BASE_SEPOLIA_OFT);
            
            SovaBTCOFT baseOFT = SovaBTCOFT(BASE_SEPOLIA_OFT);
            
            // Verify we're the owner
            require(baseOFT.owner() == deployer, "Not the owner of Base OFT contract");
            
            // Convert Optimism address to bytes32
            bytes32 optimismPeer = bytes32(uint256(uint160(OPTIMISM_SEPOLIA_OFT)));
            
            // Set Optimism Sepolia as peer
            baseOFT.setPeer(OPTIMISM_SEPOLIA_EID, optimismPeer);
            
            console.log("SUCCESS: Set Optimism Sepolia peer");
            console.log("  EID:", OPTIMISM_SEPOLIA_EID);
            console.log("  Address:", OPTIMISM_SEPOLIA_OFT);
            
        } else if (chainId == 11155420) {
            // Optimism Sepolia - configure Base as peer
            console.log("Configuring Optimism Sepolia OFT peers...");
            console.log("Optimism OFT:", OPTIMISM_SEPOLIA_OFT);
            
            SovaBTCOFT optimismOFT = SovaBTCOFT(OPTIMISM_SEPOLIA_OFT);
            
            // Verify we're the owner
            require(optimismOFT.owner() == deployer, "Not the owner of Optimism OFT contract");
            
            // Convert Base address to bytes32
            bytes32 basePeer = bytes32(uint256(uint160(BASE_SEPOLIA_OFT)));
            
            // Set Base Sepolia as peer
            optimismOFT.setPeer(BASE_SEPOLIA_EID, basePeer);
            
            console.log("SUCCESS: Set Base Sepolia peer");
            console.log("  EID:", BASE_SEPOLIA_EID);
            console.log("  Address:", BASE_SEPOLIA_OFT);
            
        } else {
            revert("Unsupported chain ID - run on Base Sepolia (84532) or Optimism Sepolia (11155420)");
        }
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== Peer Configuration Complete ===");
        console.log("Frontend bridge should now work between Base Sepolia and Optimism Sepolia");
    }
    
    /**
     * @notice Verify peer configuration (read-only)
     */
    function verifyPeers() external view {
        uint256 chainId = block.chainid;
        
        console.log("=== Verifying Peer Configuration ===");
        
        if (chainId == 84532) {
            SovaBTCOFT baseOFT = SovaBTCOFT(BASE_SEPOLIA_OFT);
            bytes32 optimismPeer = baseOFT.peers(OPTIMISM_SEPOLIA_EID);
            address peerAddress = address(uint160(uint256(optimismPeer)));
            
            console.log("Base Sepolia OFT:", BASE_SEPOLIA_OFT);
            console.log("Optimism peer configured:", peerAddress);
            console.log("Expected peer:", OPTIMISM_SEPOLIA_OFT);
            console.log("Match:", peerAddress == OPTIMISM_SEPOLIA_OFT);
            
        } else if (chainId == 11155420) {
            SovaBTCOFT optimismOFT = SovaBTCOFT(OPTIMISM_SEPOLIA_OFT);
            bytes32 basePeer = optimismOFT.peers(BASE_SEPOLIA_EID);
            address peerAddress = address(uint160(uint256(basePeer)));
            
            console.log("Optimism Sepolia OFT:", OPTIMISM_SEPOLIA_OFT);
            console.log("Base peer configured:", peerAddress);
            console.log("Expected peer:", BASE_SEPOLIA_OFT);
            console.log("Match:", peerAddress == BASE_SEPOLIA_OFT);
        }
    }
} 