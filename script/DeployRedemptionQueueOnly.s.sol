// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

// Import only the contracts we need
import {SovaBTC} from "../src/SovaBTC.sol";
import {RedemptionQueue} from "../src/RedemptionQueue.sol";
import {TokenWhitelist} from "../src/TokenWhitelist.sol";

/// @notice Deploy only the updated multi-redemption RedemptionQueue on Base Sepolia
contract DeployRedemptionQueueOnly is Script {
    
    // Existing contract addresses from DEPLOYMENT_SUMMARY.md
    address constant SOVABTC = 0xF6c09Dc46AA90Ee3BcBE7AD955c5453d7247295F;
    address constant TOKEN_WHITELIST = 0x055ccbcD0389151605057E844B86a5D8F372267e;
    
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        
        vm.startBroadcast(deployerKey);

        console.log("=== Deploying Multi-Redemption RedemptionQueue ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("SovaBTC:", SOVABTC);
        console.log("TokenWhitelist:", TOKEN_WHITELIST);

        // Deploy new RedemptionQueue with multi-redemption support
        RedemptionQueue newRedemptionQueue = new RedemptionQueue(
            SOVABTC,
            TOKEN_WHITELIST,
            10 days // 10 day redemption delay
        );
        console.log("New RedemptionQueue deployed at:", address(newRedemptionQueue));

        // Connect to existing SovaBTC contract
        SovaBTC sovaBTC = SovaBTC(SOVABTC);

        // Set new RedemptionQueue as minter in SovaBTC
        console.log("Setting new RedemptionQueue as minter...");
        sovaBTC.setMinter(address(newRedemptionQueue), true);

        vm.stopBroadcast();

        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("Multi-Redemption RedemptionQueue:", address(newRedemptionQueue));
        console.log("");
        console.log("Contract authorized as minter in SovaBTC");
        console.log("");
        console.log("FEATURES ENABLED:");
        console.log("- Multiple concurrent redemptions per user");
        console.log("- Each redemption has unique ID for tracking");
        console.log("- Comprehensive view functions for user redemptions");
        console.log("- Batch fulfillment by redemption IDs");
        console.log("");
        console.log("NEXT STEPS:");
        console.log("1. Update frontend to use new contract address");
        console.log("2. Update frontend to handle multiple redemptions");
        console.log("3. Test the new multi-redemption functionality");
        console.log("4. Update SovaBTCWrapper (separate task)");
    }
} 