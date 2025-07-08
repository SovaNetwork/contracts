// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

/**
 * @title ConfigureRealOFTPeers
 * @notice Configure peer relationships for the real LayerZero OFT contracts
 */
contract ConfigureRealOFTPeers is Script {
    
    // LayerZero Endpoint IDs
    uint32 constant ETHEREUM_SEPOLIA_EID = 40161;
    uint32 constant BASE_SEPOLIA_EID = 40245;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // UPDATED WITH ACTIVE OFT CONTRACT ADDRESSES (FRONTEND CONFIGURED)
        address ethereumOFT = address(0);                                      // NOT DEPLOYED - FOCUSING ON BASE + OP ONLY
        address baseOFT = 0x802Ea91b5aAf53D067b0bB72bAD4Cc714e1855Be;       // Base Sepolia OFT (ACTIVE)
        address optimismOFT = 0x00626Ed5FE6Bf77Ae13BEa79e304CF6A5554903b;    // Optimism Sepolia OFT (ACTIVE)
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Determine which network we're on
        uint256 chainId = block.chainid;
        address localOFT;
        string memory networkName;
        
        if (chainId == 11155111) {
            // Ethereum Sepolia
            localOFT = ethereumOFT;
            networkName = "Ethereum Sepolia";
        } else if (chainId == 84532) {
            // Base Sepolia
            localOFT = baseOFT;
            networkName = "Base Sepolia";
        } else if (chainId == 11155420) {
            // Optimism Sepolia
            localOFT = optimismOFT;
            networkName = "Optimism Sepolia";
        } else {
            revert("Unsupported chain ID");
        }
        
        console.log("Configuring peers for:", networkName);
        console.log("Local OFT:", localOFT);
        
        SovaBTCOFT oft = SovaBTCOFT(localOFT);
        
        // Configure peer relationships
        if (chainId == 11155111) {
            // Ethereum Sepolia - configure peers to Base and Optimism
            oft.setPeer(BASE_SEPOLIA_EID, addressToBytes32(baseOFT));
            oft.setPeer(OPTIMISM_SEPOLIA_EID, addressToBytes32(optimismOFT));
            
            console.log("Set peer for Base Sepolia EID", BASE_SEPOLIA_EID, ":", baseOFT);
            console.log("Set peer for Optimism Sepolia EID", OPTIMISM_SEPOLIA_EID, ":", optimismOFT);
            
        } else if (chainId == 84532) {
            // Base Sepolia - configure peers to Ethereum and Optimism
            oft.setPeer(ETHEREUM_SEPOLIA_EID, addressToBytes32(ethereumOFT));
            oft.setPeer(OPTIMISM_SEPOLIA_EID, addressToBytes32(optimismOFT));
            
            console.log("Set peer for Ethereum Sepolia EID", ETHEREUM_SEPOLIA_EID, ":", ethereumOFT);
            console.log("Set peer for Optimism Sepolia EID", OPTIMISM_SEPOLIA_EID, ":", optimismOFT);
            
        } else if (chainId == 11155420) {
            // Optimism Sepolia - configure peers to Ethereum and Base
            oft.setPeer(ETHEREUM_SEPOLIA_EID, addressToBytes32(ethereumOFT));
            oft.setPeer(BASE_SEPOLIA_EID, addressToBytes32(baseOFT));
            
            console.log("Set peer for Ethereum Sepolia EID", ETHEREUM_SEPOLIA_EID, ":", ethereumOFT);
            console.log("Set peer for Base Sepolia EID", BASE_SEPOLIA_EID, ":", baseOFT);
        }
        
        vm.stopBroadcast();
        
        console.log("\n=== PEER CONFIGURATION COMPLETE ===");
        console.log("Network:", networkName);
        console.log("Local OFT:", localOFT);
        console.log("Peers configured successfully!");
    }
    
    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }
} 