// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/SovaBTCWrapper.sol";

contract ConfigureWrapper is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 chainId = block.chainid;
        
        console.log("=== Configuring Wrapper ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", chainId);
        
        // Contract addresses based on network
        address sovaBTCWrapper;
        address redemptionQueue;
        string memory networkName;
        
        if (chainId == 84532) {
            // Base Sepolia
            sovaBTCWrapper = 0x7a08aF83566724F59D81413f3bD572E58711dE7b;
            redemptionQueue = 0xdD4284D33fFf9cBbe4c852664cB0496830ca46Ab;
            networkName = "Base Sepolia";
        } else if (chainId == 11155420) {
            // Optimism Sepolia
            sovaBTCWrapper = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
            redemptionQueue = 0x3793FaA1bD71258336c877427b105B2E74e8C030;
            networkName = "Optimism Sepolia";
        } else {
            revert("Unsupported network");
        }
        
        console.log("Network:", networkName);
        console.log("Wrapper:", sovaBTCWrapper);
        console.log("RedemptionQueue:", redemptionQueue);
        
        vm.startBroadcast(deployerPrivateKey);
        
        SovaBTCWrapper wrapper = SovaBTCWrapper(sovaBTCWrapper);
        wrapper.setRedemptionQueue(redemptionQueue);
        
        vm.stopBroadcast();
        
        console.log("SUCCESS: Redemption queue set in wrapper");
        console.log("Current redemption queue:", wrapper.getRedemptionQueue());
    }
} 