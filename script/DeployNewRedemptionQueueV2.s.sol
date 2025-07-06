// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

// Import contracts
import {SovaBTC} from "../src/SovaBTC.sol";
import {SovaBTCWrapper} from "../src/SovaBTCWrapper.sol";
import {RedemptionQueue} from "../src/RedemptionQueue.sol";
import {TokenWhitelist} from "../src/TokenWhitelist.sol";

/// @notice Deploy updated multi-redemption RedemptionQueue on Base Sepolia
contract DeployNewRedemptionQueueV2 is Script {
    
    // Existing contract addresses from DEPLOYMENT_SUMMARY.md
    address constant SOVABTC = 0xF6c09Dc46AA90Ee3BcBE7AD955c5453d7247295F;
    address constant TOKEN_WHITELIST = 0x055ccbcD0389151605057E844B86a5D8F372267e;
    address constant WRAPPER = 0x58c969172fa3A1D8379Eb942Bae4693d3b9cd58c;
    
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        
        vm.startBroadcast(deployerKey);

        console.log("=== Deploying Multi-Redemption RedemptionQueue V2 ===");
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

        // Connect to existing contracts
        SovaBTC sovaBTC = SovaBTC(SOVABTC);

        // Set new RedemptionQueue as minter in SovaBTC
        console.log("Setting new RedemptionQueue as minter...");
        sovaBTC.setMinter(address(newRedemptionQueue), true);
        
        // NOTE: SovaBTCWrapper needs to be updated separately to work with new RedemptionQueue
        // The wrapper uses the old single-redemption API and needs to be upgraded
        console.log("WARNING: SovaBTCWrapper still uses old API and needs separate update");

        vm.stopBroadcast();

        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("Multi-Redemption RedemptionQueue V2:", address(newRedemptionQueue));
        console.log("");
        console.log("Contract authorized as minter in SovaBTC");
        console.log("WARNING: Wrapper NOT updated - needs separate upgrade");
        console.log("");
        console.log("Multiple concurrent redemptions per user now supported!");
        console.log("");
        console.log("New features:");
        console.log("- Users can have multiple redemptions in flight");
        console.log("- Each redemption has unique ID for tracking");
        console.log("- Comprehensive view functions for user redemptions");
        console.log("- Batch fulfillment by redemption IDs");
        console.log("");
        console.log("NEXT STEPS:");
        console.log("1. Update SovaBTCWrapper to use redemption IDs");
        console.log("2. Update frontend to handle multiple redemptions");
        console.log("3. Test the new multi-redemption functionality");
        console.log("");
        console.log("Frontend integration needed:");
        console.log("- Update contract address in frontend");
        console.log("- Handle multiple redemptions per user in UI");
        console.log("- Display redemption IDs and status for each");
    }
} 