// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RedemptionQueue.sol";

/// @notice Script to manage custodian permissions for the RedemptionQueue
contract SetCustodian is Script {
    
    // Contract addresses (Base Sepolia)
    address constant REDEMPTION_QUEUE = 0x6CDD3cD1c677abbc347A0bDe0eAf350311403638;
    
    // Custodian addresses to authorize
    address constant DEPLOYER_ADDRESS = 0x75BbFf2206b6Ad50786Ee3ce8A81eDb72f3e381b;
    
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        
        vm.startBroadcast(deployerKey);

        console.log("=== Setting Custodian Permissions ===");
        console.log("Redemption Queue:", REDEMPTION_QUEUE);
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        RedemptionQueue redemptionQueue = RedemptionQueue(REDEMPTION_QUEUE);
        
        // Check current owner
        address currentOwner = redemptionQueue.owner();
        console.log("Current contract owner:", currentOwner);
        
        if (currentOwner != deployer) {
            console.log("ERROR: You are not the contract owner!");
            console.log("Only the owner can set custodian permissions.");
            return;
        }
        
        // Check if already authorized
        bool alreadyAuthorized = redemptionQueue.custodians(DEPLOYER_ADDRESS);
        console.log("Current authorization status for", DEPLOYER_ADDRESS, ":", alreadyAuthorized);
        
        if (!alreadyAuthorized) {
            console.log("Authorizing", DEPLOYER_ADDRESS, "as custodian...");
            
            // Authorize the deployer address as custodian
            redemptionQueue.setCustodian(DEPLOYER_ADDRESS, true);
            
            console.log("SUCCESS: Custodian authorized!");
        } else {
            console.log("Address is already authorized as custodian.");
        }
        
        // Verify the change
        bool newStatus = redemptionQueue.custodians(DEPLOYER_ADDRESS);
        console.log("Final authorization status:", newStatus);

        vm.stopBroadcast();

        console.log("");
        console.log("=== CUSTODIAN SETUP COMPLETE ===");
        console.log("");
        console.log("Next steps:");
        console.log("1. Go to http://localhost:3000/admin");
        console.log("2. Connect wallet with address:", DEPLOYER_ADDRESS);
        console.log("3. You should now have access to the custodian dashboard");
        console.log("4. You can fulfill pending redemptions and batch process them");
    }
    
    /// @notice Function to remove custodian access (for testing or emergency)
    function removeCustodian() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        
        vm.startBroadcast(deployerKey);

        console.log("=== Removing Custodian Permissions ===");
        
        RedemptionQueue redemptionQueue = RedemptionQueue(REDEMPTION_QUEUE);
        
        // Remove custodian access
        redemptionQueue.setCustodian(DEPLOYER_ADDRESS, false);
        
        console.log("Custodian access removed for:", DEPLOYER_ADDRESS);

        vm.stopBroadcast();
    }
} 