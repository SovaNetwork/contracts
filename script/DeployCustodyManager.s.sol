// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/CustodyManager.sol";

contract DeployCustodyManager is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 chainId = block.chainid;
        
        console.log("=== Deploying CustodyManager ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", chainId);
        
        vm.startBroadcast(deployerPrivateKey);
        
        CustodyManager custodyManager = new CustodyManager(deployer);
        
        vm.stopBroadcast();
        
        console.log("CustodyManager deployed at:", address(custodyManager));
        console.log("Admin:", deployer);
    }
} 