// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

// Import contracts
import {SovaBTCWrapper} from "../src/SovaBTCWrapper.sol";

/// @notice Update SovaBTCWrapper to use the new multi-redemption RedemptionQueue
contract UpdateWrapperToNewQueue is Script {
    
    // Contract addresses from DEPLOYMENT_SUMMARY.md
    address constant WRAPPER = 0x58c969172fa3A1D8379Eb942Bae4693d3b9cd58c;
    address constant NEW_REDEMPTION_QUEUE = 0x6CDD3cD1c677abbc347A0bDe0eAf350311403638;
    
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        
        vm.startBroadcast(deployerKey);

        console.log("=== Updating SovaBTCWrapper to use New RedemptionQueue ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("Wrapper:", WRAPPER);
        console.log("New RedemptionQueue:", NEW_REDEMPTION_QUEUE);

        // Connect to existing wrapper
        SovaBTCWrapper wrapper = SovaBTCWrapper(WRAPPER);

        // Update wrapper to use new RedemptionQueue
        console.log("Updating wrapper to use new RedemptionQueue...");
        wrapper.setRedemptionQueue(NEW_REDEMPTION_QUEUE);

        console.log("Successfully updated wrapper to use new RedemptionQueue!");

        vm.stopBroadcast();

        console.log("");
        console.log("=== UPDATE COMPLETE ===");
        console.log("SovaBTCWrapper now points to new multi-redemption RedemptionQueue");
        console.log("");
        console.log("PROTOCOL FLOW:");
        console.log("1. User deposits tokens via SovaBTCWrapper.deposit()");
        console.log("2. Wrapper transfers tokens to new RedemptionQueue for reserves");
        console.log("3. User can create multiple redemptions via RedemptionQueue.redeem()");
        console.log("4. Each redemption gets unique ID for tracking");
        console.log("5. Custodians fulfill redemptions by ID");
        console.log("");
        console.log("Next: Test the full flow with a deposit and redemption!");
    }
} 