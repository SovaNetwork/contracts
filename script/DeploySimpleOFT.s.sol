// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

contract DeploySimpleOFT is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // LayerZero V2 Endpoint (same for all testnets)
        address endpoint = 0x1a44076050125825900e736c501f859c50fE728c;
        
        // Deploy SovaBTC OFT
        SovaBTCOFT sovaBTCOFT = new SovaBTCOFT(
            "Sova Bitcoin",
            "sovaBTC", 
            endpoint,
            deployer  // minter
        );
        
        vm.stopBroadcast();
        
        console.log("SovaBTC OFT deployed at:", address(sovaBTCOFT));
        console.log("Owner:", sovaBTCOFT.owner());
        console.log("Minter:", sovaBTCOFT.minter());
        console.log("Endpoint:", sovaBTCOFT.endpoint());
    }
} 