// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/staking/SovaBTCStaking.sol";

contract DeployStaking is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 chainId = block.chainid;
        
        console.log("=== Deploying SovaBTCStaking ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", chainId);
        
        // Contract addresses based on network
        address sovaToken;
        address sovaBTCOFT;
        
        if (chainId == 84532) {
            // Base Sepolia
            sovaToken = 0x69041baA897687Cb16bCD57368110FfA2C8B3E63;
            sovaBTCOFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
        } else if (chainId == 11155420) {
            // Optimism Sepolia  
            sovaToken = 0xfd3CD6323c7c10d7d533D6ce86249A0c21a3A7fD;
            sovaBTCOFT = 0x1b7227A7A6BcAe6c64907b1B51dD0801C3E8ba30;
        } else {
            revert("Unsupported network");
        }
        
        console.log("SOVA Token:", sovaToken);
        console.log("SovaBTC OFT:", sovaBTCOFT);
        
        vm.startBroadcast(deployerPrivateKey);
        
        SovaBTCStaking staking = new SovaBTCStaking(
            deployer // fee recipient
        );
        
        vm.stopBroadcast();
        
        console.log("SovaBTCStaking deployed at:", address(staking));
        console.log("Rewards Distributor:", deployer);
    }
} 