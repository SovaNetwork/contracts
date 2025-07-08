// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/RedemptionQueue.sol";

contract DeployRedemptionQueue is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 chainId = block.chainid;
        
        console.log("=== Deploying RedemptionQueue ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", chainId);
        
        // Contract addresses based on network
        address sovaBTCOFT;
        address tokenWhitelist;
        
        if (chainId == 84532) {
            // Base Sepolia
            sovaBTCOFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
            tokenWhitelist = 0x3793FaA1bD71258336c877427b105B2E74e8C030;
        } else if (chainId == 11155420) {
            // Optimism Sepolia  
            sovaBTCOFT = 0x1b7227A7A6BcAe6c64907b1B51dD0801C3E8ba30;
            tokenWhitelist = 0xb386ef9D4C9FeF67058DBc00b31126AFE8D7600d;
        } else {
            revert("Unsupported network");
        }
        
        console.log("SovaBTC OFT:", sovaBTCOFT);
        console.log("TokenWhitelist:", tokenWhitelist);
        
        vm.startBroadcast(deployerPrivateKey);
        
        RedemptionQueue redemptionQueue = new RedemptionQueue(
            sovaBTCOFT,
            tokenWhitelist,
            10 days // 10 day redemption delay
        );
        
        vm.stopBroadcast();
        
        console.log("RedemptionQueue deployed at:", address(redemptionQueue));
        console.log("Redemption delay:", redemptionQueue.redemptionDelay() / 1 days, "days");
    }
} 