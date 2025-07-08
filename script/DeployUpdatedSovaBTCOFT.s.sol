// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/SovaBTCOFT.sol";

contract DeployUpdatedSovaBTCOFT is Script {
    
    // LayerZero V2 Endpoint addresses
    address constant BASE_SEPOLIA_ENDPOINT = 0x6EDCE65403992e310A62460808c4b910D972f10f;
    address constant OP_SEPOLIA_ENDPOINT = 0x6EDCE65403992e310A62460808c4b910D972f10f;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying updated SovaBTCOFT with receive function...");
        console.log("Deployer:", deployer);
        
        // Determine which chain we're deploying to based on chainid
        uint256 chainId = block.chainid;
        address endpoint;
        string memory chainName;
        
        if (chainId == 84532) {
            endpoint = BASE_SEPOLIA_ENDPOINT;
            chainName = "Base Sepolia";
        } else if (chainId == 11155420) {
            endpoint = OP_SEPOLIA_ENDPOINT; 
            chainName = "Optimism Sepolia";
        } else {
            revert("Unsupported chain");
        }
        
        console.log("Chain:", chainName);
        console.log("Endpoint:", endpoint);
        
        // Deploy updated SovaBTCOFT
        SovaBTCOFT sovaBTCOFT = new SovaBTCOFT(
            "Sova Bitcoin",
            "sovaBTC",
            endpoint,
            deployer
        );
        
        console.log("Updated SovaBTCOFT deployed at:", address(sovaBTCOFT));
        
        // Verify the receive function works
        console.log("Testing receive function...");
        (bool success, ) = address(sovaBTCOFT).call{value: 0.001 ether}("");
        require(success, "Failed to send test ETH");
        
        console.log("Contract ETH balance:", address(sovaBTCOFT).balance);
        console.log("Successfully deployed updated SovaBTCOFT with ETH support!");
        
        vm.stopBroadcast();
    }
} 