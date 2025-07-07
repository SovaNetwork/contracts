// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

contract ConfigurePeersUpdated is Script {
    // Updated contract addresses
    address constant ETH_SEPOLIA_OFT = 0xf059C386BA88DA3C3919eDe0E6209B66C4D3DeE1;
    address constant BASE_SEPOLIA_OFT = 0x802Ea91b5aAf53D067b0bB72bAD4Cc714e1855Be;
    address constant OP_SEPOLIA_OFT = 0x00626Ed5FE6Bf77Ae13BEa79e304CF6A5554903b;
    
    // LayerZero Endpoint IDs
    uint32 constant ETH_SEPOLIA_EID = 40161;
    uint32 constant BASE_SEPOLIA_EID = 40245;
    uint32 constant OP_SEPOLIA_EID = 40232;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Get current chain ID to determine which peers to set
        uint256 chainId = block.chainid;
        
        vm.startBroadcast(deployerPrivateKey);
        
        if (chainId == 11155111) {
            // Ethereum Sepolia - set Base and OP as peers
            configureEthereumSepoliaPeers();
        } else if (chainId == 84532) {
            // Base Sepolia - set Ethereum and OP as peers
            configureBaseSepoliaPeers();
        } else if (chainId == 11155420) {
            // OP Sepolia - set Ethereum and Base as peers
            configureOptimismSepoliaPeers();
        }
        
        vm.stopBroadcast();
    }
    
    function configureEthereumSepoliaPeers() internal {
        SovaBTCOFT oft = SovaBTCOFT(ETH_SEPOLIA_OFT);
        
        // Set Base Sepolia as peer
        oft.setPeer(BASE_SEPOLIA_EID, addressToBytes32(BASE_SEPOLIA_OFT));
        console.log("Set Base Sepolia peer on Ethereum Sepolia");
        
        // Set OP Sepolia as peer
        oft.setPeer(OP_SEPOLIA_EID, addressToBytes32(OP_SEPOLIA_OFT));
        console.log("Set OP Sepolia peer on Ethereum Sepolia");
    }
    
    function configureBaseSepoliaPeers() internal {
        SovaBTCOFT oft = SovaBTCOFT(BASE_SEPOLIA_OFT);
        
        // Set Ethereum Sepolia as peer
        oft.setPeer(ETH_SEPOLIA_EID, addressToBytes32(ETH_SEPOLIA_OFT));
        console.log("Set Ethereum Sepolia peer on Base Sepolia");
        
        // Set OP Sepolia as peer
        oft.setPeer(OP_SEPOLIA_EID, addressToBytes32(OP_SEPOLIA_OFT));
        console.log("Set OP Sepolia peer on Base Sepolia");
    }
    
    function configureOptimismSepoliaPeers() internal {
        SovaBTCOFT oft = SovaBTCOFT(OP_SEPOLIA_OFT);
        
        // Set Ethereum Sepolia as peer
        oft.setPeer(ETH_SEPOLIA_EID, addressToBytes32(ETH_SEPOLIA_OFT));
        console.log("Set Ethereum Sepolia peer on OP Sepolia");
        
        // Set Base Sepolia as peer
        oft.setPeer(BASE_SEPOLIA_EID, addressToBytes32(BASE_SEPOLIA_OFT));
        console.log("Set Base Sepolia peer on OP Sepolia");
    }
    
    function configureAllPeers() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        console.log("Configuring all peer relationships...");
        
        // Configure Ethereum Sepolia peers
        vm.createSelectFork(vm.envString("ETH_SEPOLIA_RPC"));
        vm.startBroadcast(deployerPrivateKey);
        configureEthereumSepoliaPeers();
        vm.stopBroadcast();
        
        // Configure Base Sepolia peers  
        vm.createSelectFork(vm.envString("BASE_SEPOLIA_RPC"));
        vm.startBroadcast(deployerPrivateKey);
        configureBaseSepoliaPeers();
        vm.stopBroadcast();
        
        // Configure OP Sepolia peers
        vm.createSelectFork(vm.envString("OP_SEPOLIA_RPC"));
        vm.startBroadcast(deployerPrivateKey);
        configureOptimismSepoliaPeers();
        vm.stopBroadcast();
        
        console.log("All peer relationships configured!");
    }
    
    function addressToBytes32(address addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }
} 