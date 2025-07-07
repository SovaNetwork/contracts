// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

contract SetWrapperMinter is Script {
    // New OFT contract addresses
    address constant ETH_SEPOLIA_OFT = 0xf059C386BA88DA3C3919eDe0E6209B66C4D3DeE1;
    address constant BASE_SEPOLIA_OFT = 0x802Ea91b5aAf53D067b0bB72bAD4Cc714e1855Be;
    address constant OP_SEPOLIA_OFT = 0x00626Ed5FE6Bf77Ae13BEa79e304CF6A5554903b;
    
    // Wrapper contract addresses (old but working)
    address constant BASE_WRAPPER = 0x30cc05366CC687c0ab75e3908Fe2b2C5BB679db8;
    address constant ETH_WRAPPER = 0x37cc44e3B6C9386284E3A9F5B047C6933a80BE0D;
    address constant OP_WRAPPER = 0xd2A7029baCCd24799ba497174859580Cd25e4E7F;
    
    // Redemption Queue addresses (also need minter access)
    address constant BASE_REDEMPTION = 0xBb95e1e4DbaaB783264947c19fA4e7398621af23;
    address constant ETH_REDEMPTION = 0x2415A13271aa21DBAC959b8143E072934dBC41C6;
    address constant OP_REDEMPTION = 0x205B8115068801576901A544e96E4C051834FBe4;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        uint256 chainId = block.chainid;
        
        vm.startBroadcast(deployerPrivateKey);
        
        if (chainId == 11155111) {
            // Ethereum Sepolia
            setEthereumMinters();
        } else if (chainId == 84532) {
            // Base Sepolia
            setBaseMinters();
        } else if (chainId == 11155420) {
            // OP Sepolia
            setOptimismMinters();
        }
        
        vm.stopBroadcast();
    }
    
    function setBaseMinters() internal {
        SovaBTCOFT oft = SovaBTCOFT(BASE_SEPOLIA_OFT);
        
        // Set wrapper as minter
        oft.setMinter(BASE_WRAPPER);
        console.log("Set Base wrapper as minter:", BASE_WRAPPER);
        
        // Set redemption queue as minter
        // Note: RedemptionQueue needs to be able to burn tokens
        // We'll handle this separately if needed
        
        console.log("Base Sepolia minters configured");
    }
    
    function setEthereumMinters() internal {
        SovaBTCOFT oft = SovaBTCOFT(ETH_SEPOLIA_OFT);
        
        // Set wrapper as minter
        oft.setMinter(ETH_WRAPPER);
        console.log("Set Ethereum wrapper as minter:", ETH_WRAPPER);
        
        console.log("Ethereum Sepolia minters configured");
    }
    
    function setOptimismMinters() internal {
        SovaBTCOFT oft = SovaBTCOFT(OP_SEPOLIA_OFT);
        
        // Set wrapper as minter
        oft.setMinter(OP_WRAPPER);
        console.log("Set Optimism wrapper as minter:", OP_WRAPPER);
        
        console.log("Optimism Sepolia minters configured");
    }
    
    function setAllMinters() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        console.log("Setting minters on all networks...");
        
        // Set Base Sepolia minters
        vm.createSelectFork("https://sepolia.base.org");
        vm.startBroadcast(deployerPrivateKey);
        setBaseMinters();
        vm.stopBroadcast();
        
        // Set Ethereum Sepolia minters
        vm.createSelectFork("https://ethereum-sepolia.publicnode.com");
        vm.startBroadcast(deployerPrivateKey);
        setEthereumMinters();
        vm.stopBroadcast();
        
        // Set OP Sepolia minters
        vm.createSelectFork("https://sepolia.optimism.io");
        vm.startBroadcast(deployerPrivateKey);
        setOptimismMinters();
        vm.stopBroadcast();
        
        console.log("All minters configured!");
    }
} 