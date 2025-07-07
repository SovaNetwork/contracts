// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SovaBTCWrapper.sol";
import "../src/TokenWhitelist.sol";
import "../src/CustodyManager.sol";

contract DeployNewWrapper is Script {
    // New OFT contract addresses
    address constant ETH_SEPOLIA_OFT = 0xf059C386BA88DA3C3919eDe0E6209B66C4D3DeE1;
    address constant BASE_SEPOLIA_OFT = 0x802Ea91b5aAf53D067b0bB72bAD4Cc714e1855Be;
    address constant OP_SEPOLIA_OFT = 0x00626Ed5FE6Bf77Ae13BEa79e304CF6A5554903b;
    
    // Existing supporting contract addresses
    address constant BASE_WHITELIST = 0x94F983EB3Fd547b68E1760E2fe2193811f8f7c4e;
    address constant BASE_CUSTODY = 0x78Ea93068bF847fF1703Dde09a772FC339CA4433;
    address constant BASE_REDEMPTION = 0xBb95e1e4DbaaB783264947c19fA4e7398621af23;
    
    address constant ETH_WHITELIST = 0xF03B500351FA5A7CBE64Ba0387c97D68331EA3C9;
    address constant ETH_CUSTODY = 0xe3c0FE7911a0813a6a880c640A71f59619638d77;
    address constant ETH_REDEMPTION = 0x2415A13271aa21DBAC959b8143E072934dBC41C6;
    
    address constant OP_WHITELIST = 0x319501B1da942abA28854Dd573cd088CBd0bDF4C;
    address constant OP_CUSTODY = 0xCdBFaB2F5760d320C7c4024A5e676248ba956c7D;
    address constant OP_REDEMPTION = 0x205B8115068801576901A544e96E4C051834FBe4;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        uint256 chainId = block.chainid;
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        if (chainId == 84532) {
            // Base Sepolia
            deployBaseWrapper(deployer);
        } else if (chainId == 11155111) {
            // Ethereum Sepolia
            deployEthereumWrapper(deployer);
        } else if (chainId == 11155420) {
            // OP Sepolia
            deployOptimismWrapper(deployer);
        }
        
        vm.stopBroadcast();
    }
    
    function deployBaseWrapper(address deployer) internal {
        console.log("Deploying new Base Sepolia wrapper...");
        
        SovaBTCWrapper wrapper = new SovaBTCWrapper(
            BASE_SEPOLIA_OFT,    // Point to new OFT contract
            BASE_WHITELIST,
            BASE_CUSTODY,
            10_000              // Min deposit 10k sats
        );
        
        // Set redemption queue
        wrapper.setRedemptionQueue(BASE_REDEMPTION);
        
        console.log("New Base wrapper deployed:", address(wrapper));
        console.log("- Points to OFT:", BASE_SEPOLIA_OFT);
        console.log("- Uses whitelist:", BASE_WHITELIST);
        console.log("- Uses custody:", BASE_CUSTODY);
        console.log("- Uses redemption:", BASE_REDEMPTION);
    }
    
    function deployEthereumWrapper(address deployer) internal {
        console.log("Deploying new Ethereum Sepolia wrapper...");
        
        SovaBTCWrapper wrapper = new SovaBTCWrapper(
            ETH_SEPOLIA_OFT,     // Point to new OFT contract
            ETH_WHITELIST,
            ETH_CUSTODY,
            10_000              // Min deposit 10k sats
        );
        
        // Set redemption queue
        wrapper.setRedemptionQueue(ETH_REDEMPTION);
        
        console.log("New Ethereum wrapper deployed:", address(wrapper));
        console.log("- Points to OFT:", ETH_SEPOLIA_OFT);
        console.log("- Uses whitelist:", ETH_WHITELIST);
        console.log("- Uses custody:", ETH_CUSTODY);
        console.log("- Uses redemption:", ETH_REDEMPTION);
    }
    
    function deployOptimismWrapper(address deployer) internal {
        console.log("Deploying new Optimism Sepolia wrapper...");
        
        SovaBTCWrapper wrapper = new SovaBTCWrapper(
            OP_SEPOLIA_OFT,      // Point to new OFT contract
            OP_WHITELIST,
            OP_CUSTODY,
            10_000              // Min deposit 10k sats
        );
        
        // Set redemption queue
        wrapper.setRedemptionQueue(OP_REDEMPTION);
        
        console.log("New Optimism wrapper deployed:", address(wrapper));
        console.log("- Points to OFT:", OP_SEPOLIA_OFT);
        console.log("- Uses whitelist:", OP_WHITELIST);
        console.log("- Uses custody:", OP_CUSTODY);
        console.log("- Uses redemption:", OP_REDEMPTION);
    }
} 