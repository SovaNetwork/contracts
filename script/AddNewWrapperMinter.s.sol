// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

contract AddNewWrapperMinter is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        console.log("=== Adding New Wrapper as Minter ===");
        console.log("Chain ID:", block.chainid);
        
        address sovaBTC = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
        address newWrapper = 0x3a0E701323156753bC0AD2979263F3D782Dfd81c;
        
        console.log("SovaBTC OFT:", sovaBTC);
        console.log("New Wrapper:", newWrapper);
        
        vm.startBroadcast(deployerPrivateKey);
        
        SovaBTCOFT oft = SovaBTCOFT(sovaBTC);
        oft.addMinter(newWrapper);
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== Verification ===");
        console.log("New wrapper is minter:", oft.isMinter(newWrapper));
        console.log("SUCCESS: New wrapper added as minter!");
    }
} 