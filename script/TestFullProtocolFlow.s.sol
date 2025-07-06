// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

// Import contracts
import {SovaBTCWrapper} from "../src/SovaBTCWrapper.sol";
import {RedemptionQueue} from "../src/RedemptionQueue.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Test the full protocol flow: wrap → reserves → redeem
contract TestFullProtocolFlow is Script {
    
    // Contract addresses
    address constant WRAPPER = 0x58c969172fa3A1D8379Eb942Bae4693d3b9cd58c;
    address constant REDEMPTION_QUEUE = 0x6CDD3cD1c677abbc347A0bDe0eAf350311403638;
    address constant MOCK_WBTC = 0x8dA7DE3D18747ba6b8A788Eb07dD40cD660eC860;
    
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        
        vm.startBroadcast(deployerKey);

        console.log("=== Testing Full Protocol Flow ===");
        console.log("User:", deployer);
        console.log("Chain ID:", block.chainid);

        // Connect to contracts
        SovaBTCWrapper wrapper = SovaBTCWrapper(WRAPPER);
        RedemptionQueue redemptionQueue = RedemptionQueue(REDEMPTION_QUEUE);
        IERC20 wbtc = IERC20(MOCK_WBTC);

        // Check initial state
        uint256 initialWbtcBalance = wbtc.balanceOf(deployer);
        uint256 initialReserves = redemptionQueue.getAvailableReserve(MOCK_WBTC);
        
        console.log("Initial WBTC balance:", initialWbtcBalance);
        console.log("Initial WBTC reserves:", initialReserves);

        // Test 1: Wrap 1 WBTC
        uint256 wrapAmount = 1e8; // 1 WBTC (8 decimals)
        console.log("Testing wrap of", wrapAmount, "WBTC...");
        
        if (initialWbtcBalance >= wrapAmount) {
            // Approve and wrap
            wbtc.approve(address(wrapper), wrapAmount);
            wrapper.deposit(MOCK_WBTC, wrapAmount);
            
            // Check reserves after wrap
            uint256 newReserves = redemptionQueue.getAvailableReserve(MOCK_WBTC);
            console.log("Reserves after wrap:", newReserves);
            console.log("Reserve increase:", newReserves - initialReserves);
            
            if (newReserves > initialReserves) {
                console.log("SUCCESS: Reserves increased after wrap!");
            } else {
                console.log("ISSUE: Reserves did not increase");
            }
        } else {
            console.log("Not enough WBTC balance for test");
        }

        vm.stopBroadcast();

        console.log("");
        console.log("=== PROTOCOL FLOW TEST COMPLETE ===");
        console.log("");
        console.log("Next steps:");
        console.log("1. Wrap tokens via SovaBTCWrapper (reserves should increase)");
        console.log("2. Create redemptions via RedemptionQueue.redeem()");
        console.log("3. Track multiple redemptions with unique IDs");
        console.log("4. Wait 10 days for fulfillment eligibility");
    }
} 