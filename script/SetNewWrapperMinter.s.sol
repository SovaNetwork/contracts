// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

contract SetNewWrapperMinter is Script {
    // New OFT contract address
    address constant BASE_SEPOLIA_OFT = 0x802Ea91b5aAf53D067b0bB72bAD4Cc714e1855Be;
    
    // New wrapper contract address
    address constant NEW_BASE_WRAPPER = 0xA73550548804cFf5dD23F1C67e360C3a22433f53;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        SovaBTCOFT oft = SovaBTCOFT(BASE_SEPOLIA_OFT);
        
        // Set new wrapper as minter
        oft.setMinter(NEW_BASE_WRAPPER);
        
        console.log("Set new wrapper as minter:");
        console.log("- OFT contract:", BASE_SEPOLIA_OFT);
        console.log("- New wrapper:", NEW_BASE_WRAPPER);
        
        vm.stopBroadcast();
    }
} 