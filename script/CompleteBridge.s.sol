// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

/**
 * @title CompleteBridge
 * @notice Script to manually complete bridge transactions for testing
 */
contract CompleteBridge is Script {
    function run() external {
        // Get private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Get parameters from environment
        uint32 srcEid = uint32(vm.envUint("SRC_EID"));
        address to = vm.envAddress("RECIPIENT");
        uint256 amount = vm.envUint("AMOUNT");
        address oftAddress = vm.envAddress("OFT_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Complete the bridge transaction
        SovaBTCOFT oft = SovaBTCOFT(oftAddress);
        oft.simulateReceive(srcEid, to, amount);
        
        vm.stopBroadcast();
        
        console.log("Bridge completed:");
        console.log("- From EID:", srcEid);
        console.log("- To:", to);
        console.log("- Amount:", amount);
        console.log("- OFT Address:", oftAddress);
    }
    
    /**
     * @notice Complete bridge for Base Sepolia -> OP Sepolia
     */
    function completeBridgeToOptimism() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Base Sepolia EID = 40245
        uint32 srcEid = 40245;
        // Your wallet address
        address to = 0x75BbFf2206b6Ad50786Ee3ce8A81eDb72f3e381b;
        // Amount from your transaction (0.005 sovaBTC = 500000 satoshis)
        uint256 amount = 500000;
        // OP Sepolia sovaBTC OFT address (NEW CONTRACT)
        address oftAddress = 0x00626Ed5FE6Bf77Ae13BEa79e304CF6A5554903b;
        
        vm.startBroadcast(deployerPrivateKey);
        
        SovaBTCOFT oft = SovaBTCOFT(oftAddress);
        oft.simulateReceive(srcEid, to, amount);
        
        vm.stopBroadcast();
        
        console.log("Bridge completed to Optimism:");
        console.log("- Amount: 0.005 sovaBTC");
        console.log("- Recipient:", to);
    }
} 