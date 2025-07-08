// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/SovaBTCOFT.sol";

contract AddWrappersToNewOFT is Script {
    
    // OLD contract addresses (what wrappers are pointing to)
    address constant BASE_OLD_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    address constant OP_OLD_OFT = 0x1b7227A7A6BcAe6c64907b1B51dD0801C3E8ba30;
    
    // NEW contract addresses (what frontend uses)
    address constant BASE_NEW_OFT = 0xAD36450E98E3AEa8d79FBc6D55C47C85eBCbb807;
    address constant OP_NEW_OFT = 0x4ffDe609b6655e66299d97D347A8dc7Fb26aE062;
    
    // Wrapper contract addresses (from Addresses-7-7-25.md)
    address constant BASE_WRAPPER = 0x7a08aF83566724F59D81413f3bD572E58711dE7b;
    address constant OP_WRAPPER = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    
    // Redemption queue addresses
    address constant BASE_REDEMPTION = 0xdD4284D33fFf9cBbe4c852664cB0496830ca46Ab;
    address constant OP_REDEMPTION = 0x3793FaA1bD71258336c877427b105B2E74e8C030;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        uint256 chainId = block.chainid;
        
        if (chainId == 84532) {
            // Base Sepolia
            console.log("=== Adding Base Sepolia wrappers to NEW OFT ===");
            console.log("New OFT:", BASE_NEW_OFT);
            console.log("Wrapper:", BASE_WRAPPER);
            console.log("Redemption Queue:", BASE_REDEMPTION);
            
            SovaBTCOFT newOFT = SovaBTCOFT(BASE_NEW_OFT);
            
            // Add wrapper as minter
            newOFT.addMinter(BASE_WRAPPER);
            console.log("Wrapper added as minter");
            
            // Add redemption queue as minter
            newOFT.addMinter(BASE_REDEMPTION);
            console.log("Redemption queue added as minter");
            
            // Verify
            console.log("Wrapper is minter:", newOFT.isMinter(BASE_WRAPPER));
            console.log("Redemption queue is minter:", newOFT.isMinter(BASE_REDEMPTION));
            
        } else if (chainId == 11155420) {
            // Optimism Sepolia
            console.log("=== Adding Optimism Sepolia wrappers to NEW OFT ===");
            console.log("New OFT:", OP_NEW_OFT);
            console.log("Wrapper:", OP_WRAPPER);
            console.log("Redemption Queue:", OP_REDEMPTION);
            
            SovaBTCOFT newOFT = SovaBTCOFT(OP_NEW_OFT);
            
            // Add wrapper as minter
            newOFT.addMinter(OP_WRAPPER);
            console.log("Wrapper added as minter");
            
            // Add redemption queue as minter
            newOFT.addMinter(OP_REDEMPTION);
            console.log("Redemption queue added as minter");
            
            // Verify
            console.log("Wrapper is minter:", newOFT.isMinter(OP_WRAPPER));
            console.log("Redemption queue is minter:", newOFT.isMinter(OP_REDEMPTION));
            
        } else {
            revert("Unsupported chain");
        }
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== IMPORTANT ===");
        console.log("The wrapper contracts are still configured to mint to the OLD addresses.");
        console.log("We need to create NEW wrapper contracts that point to the NEW OFT addresses.");
        console.log("This script only adds existing wrappers as minters to both old and new contracts.");
    }
} 