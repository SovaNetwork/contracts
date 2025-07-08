// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

contract AddMinters is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 chainId = block.chainid;
        
        console.log("=== Adding Minters to SovaBTC OFT ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", chainId);
        
        // Contract addresses based on network
        address sovaBTCOFT;
        address sovaBTCWrapper;
        address redemptionQueue;
        string memory networkName;
        
        if (chainId == 84532) {
            // Base Sepolia
            sovaBTCOFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
            sovaBTCWrapper = 0x7a08aF83566724F59D81413f3bD572E58711dE7b;
            redemptionQueue = 0xdD4284D33fFf9cBbe4c852664cB0496830ca46Ab;
            networkName = "Base Sepolia";
        } else if (chainId == 11155420) {
            // Optimism Sepolia
            sovaBTCOFT = 0x1b7227A7A6BcAe6c64907b1B51dD0801C3E8ba30;
            sovaBTCWrapper = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
            redemptionQueue = 0x3793FaA1bD71258336c877427b105B2E74e8C030;
            networkName = "Optimism Sepolia";
        } else {
            revert("Unsupported network");
        }
        
        console.log("Network:", networkName);
        console.log("SovaBTC OFT:", sovaBTCOFT);
        console.log("Wrapper:", sovaBTCWrapper);
        console.log("RedemptionQueue:", redemptionQueue);
        
        vm.startBroadcast(deployerPrivateKey);
        
        SovaBTCOFT oft = SovaBTCOFT(sovaBTCOFT);
        
        // Add wrapper as minter
        oft.addMinter(sovaBTCWrapper);
        console.log("SUCCESS: Wrapper added as minter");
        
        // Add redemption queue as minter  
        oft.addMinter(redemptionQueue);
        console.log("SUCCESS: RedemptionQueue added as minter");
        
        vm.stopBroadcast();
        
        // Verify
        console.log("");
        console.log("=== Verification ===");
        console.log("Wrapper is minter:", oft.isMinter(sovaBTCWrapper));
        console.log("RedemptionQueue is minter:", oft.isMinter(redemptionQueue));
    }
} 