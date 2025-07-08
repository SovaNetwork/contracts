// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/staking/SOVAToken.sol";

contract DeploySOVAToken is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 chainId = block.chainid;
        
        console.log("=== Deploying SOVA Token ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", chainId);
        
        vm.startBroadcast(deployerPrivateKey);
        
        SOVAToken sovaToken = new SOVAToken(
            "Sova Protocol Token",
            "SOVA",
            deployer, // initial owner
            10_000_000e18 // 10M initial supply
        );
        
        vm.stopBroadcast();
        
        console.log("SOVA Token deployed at:", address(sovaToken));
        console.log("Name:", sovaToken.name());
        console.log("Symbol:", sovaToken.symbol());
        console.log("Max Supply:", sovaToken.MAX_SUPPLY() / 1e18);
        console.log("Initial Supply:", sovaToken.totalSupply() / 1e18);
        console.log("Owner:", sovaToken.owner());
    }
} 