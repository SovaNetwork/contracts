// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/SovaBTCOFT.sol";

contract ConfigureUpdatedOFTPeers is Script {
    
    // New contract addresses
    address payable constant BASE_SEPOLIA_OFT = payable(0xAD36450E98E3AEa8d79FBc6D55C47C85eBCbb807);
    address payable constant OP_SEPOLIA_OFT = payable(0x4ffDe609b6655e66299d97D347A8dc7Fb26aE062);
    
    // LayerZero EIDs
    uint32 constant BASE_EID = 40245;
    uint32 constant OP_EID = 40232;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Configure based on current chain
        uint256 chainId = block.chainid;
        
        if (chainId == 84532) {
            // Base Sepolia - configure peer to Optimism Sepolia
            console.log("Configuring Base Sepolia OFT peer to Optimism Sepolia");
            
            SovaBTCOFT baseOFT = SovaBTCOFT(BASE_SEPOLIA_OFT);
            
            // Convert Optimism OFT address to bytes32
            bytes32 opPeer = bytes32(uint256(uint160(address(OP_SEPOLIA_OFT))));
            
            // Set peer
            baseOFT.setPeer(OP_EID, opPeer);
            
            console.log("Base OFT peer set to:", OP_SEPOLIA_OFT);
            console.log("For EID:", OP_EID);
            
        } else if (chainId == 11155420) {
            // Optimism Sepolia - configure peer to Base Sepolia
            console.log("Configuring Optimism Sepolia OFT peer to Base Sepolia");
            
            SovaBTCOFT opOFT = SovaBTCOFT(OP_SEPOLIA_OFT);
            
            // Convert Base OFT address to bytes32
            bytes32 basePeer = bytes32(uint256(uint160(address(BASE_SEPOLIA_OFT))));
            
            // Set peer
            opOFT.setPeer(BASE_EID, basePeer);
            
            console.log("Optimism OFT peer set to:", BASE_SEPOLIA_OFT);
            console.log("For EID:", BASE_EID);
            
        } else {
            revert("Unsupported chain");
        }
        
        vm.stopBroadcast();
    }
} 