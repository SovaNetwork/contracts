// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/TokenWhitelist.sol";

contract DeployTokenWhitelist is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 chainId = block.chainid;
        
        console.log("=== Deploying TokenWhitelist ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", chainId);
        
        vm.startBroadcast(deployerPrivateKey);
        
        TokenWhitelist tokenWhitelist = new TokenWhitelist();
        
        vm.stopBroadcast();
        
        console.log("TokenWhitelist deployed at:", address(tokenWhitelist));
        console.log("Owner:", tokenWhitelist.owner());
    }
} 