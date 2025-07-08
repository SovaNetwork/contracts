// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";
import "../src/SovaBTCWrapper.sol";
import "../src/RedemptionQueue.sol";

/**
 * @title UpdateWrappersForNewOFT
 * @notice Update wrapper and redemption queue contracts to use new real LayerZero OFT
 * @dev This script configures minter permissions and updates contract references
 */
contract UpdateWrappersForNewOFT is Script {
    
    // Existing contract addresses (these should already be deployed)
    struct ExistingContracts {
        address wrapper;
        address redemptionQueue;
        address tokenWhitelist;
        address custodyManager;
    }
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 chainId = block.chainid;
        
        console.log("=== Updating Wrapper Contracts for New OFT ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", chainId);
        
        // Get existing contract addresses for current network
        ExistingContracts memory contracts = getExistingContracts(chainId);
        
        // TODO: Update this with the new OFT address after deployment
        address newOFTAddress = getNewOFTAddress(chainId);
        require(newOFTAddress != address(0), "New OFT address not configured");
        
        console.log("New OFT Address:", newOFTAddress);
        console.log("Wrapper Address:", contracts.wrapper);
        console.log("Redemption Queue Address:", contracts.redemptionQueue);
        
        vm.startBroadcast(deployerPrivateKey);
        
        SovaBTCOFT newOFT = SovaBTCOFT(newOFTAddress);
        
        // Verify we're the owner of the new OFT
        require(newOFT.owner() == deployer, "Not the owner of new OFT contract");
        
        console.log("");
        console.log("=== Adding Minter Permissions ===");
        
        // Add wrapper as minter if it exists
        if (contracts.wrapper != address(0)) {
            console.log("Adding wrapper as minter:", contracts.wrapper);
            newOFT.addMinter(contracts.wrapper);
            console.log("Wrapper added as minter");
        }
        
        // Add redemption queue as minter if it exists
        if (contracts.redemptionQueue != address(0)) {
            console.log("Adding redemption queue as minter:", contracts.redemptionQueue);
            newOFT.addMinter(contracts.redemptionQueue);
            console.log("Redemption queue added as minter");
        }
        
        console.log("");
        console.log("=== Deploying New Wrapper (if needed) ===");
        
        // If wrapper doesn't exist, deploy a new one
        if (contracts.wrapper == address(0)) {
            console.log("Deploying new wrapper contract...");
            
            SovaBTCWrapper newWrapper = new SovaBTCWrapper(
                newOFTAddress,           // SovaBTC OFT
                contracts.tokenWhitelist, // TokenWhitelist
                contracts.custodyManager, // CustodyManager
                10_000                   // Min deposit (0.0001 BTC)
            );
            
            console.log("New Wrapper deployed:", address(newWrapper));
            
            // Add new wrapper as minter
            newOFT.addMinter(address(newWrapper));
            console.log("New wrapper added as minter");
            
            // Set redemption queue if it exists
            if (contracts.redemptionQueue != address(0)) {
                newWrapper.setRedemptionQueue(contracts.redemptionQueue);
                console.log("Redemption queue set in new wrapper");
            }
            
            contracts.wrapper = address(newWrapper);
        }
        
        console.log("");
        console.log("=== Deploying New Redemption Queue (if needed) ===");
        
        // If redemption queue doesn't exist, deploy a new one
        if (contracts.redemptionQueue == address(0)) {
            console.log("Deploying new redemption queue...");
            
            RedemptionQueue newRedemptionQueue = new RedemptionQueue(
                newOFTAddress,           // SovaBTC OFT
                contracts.tokenWhitelist, // TokenWhitelist
                10 days                  // Redemption delay
            );
            
            console.log("New Redemption Queue deployed:", address(newRedemptionQueue));
            
            // Add new redemption queue as minter
            newOFT.addMinter(address(newRedemptionQueue));
            console.log("New redemption queue added as minter");
            
            // Update wrapper to use new redemption queue
            if (contracts.wrapper != address(0)) {
                SovaBTCWrapper wrapper = SovaBTCWrapper(contracts.wrapper);
                wrapper.setRedemptionQueue(address(newRedemptionQueue));
                console.log("New redemption queue set in wrapper");
            }
            
            contracts.redemptionQueue = address(newRedemptionQueue);
        }
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== Configuration Complete ===");
        console.log("Network Chain ID:", chainId);
        console.log("New SovaBTC OFT:", newOFTAddress);
        console.log("Wrapper Contract:", contracts.wrapper);
        console.log("Redemption Queue:", contracts.redemptionQueue);
        console.log("Token Whitelist:", contracts.tokenWhitelist);
        console.log("Custody Manager:", contracts.custodyManager);
        
        // Verify minter permissions
        console.log("");
        console.log("=== Minter Verification ===");
        console.log("Deployer is minter:", newOFT.isMinter(deployer));
        console.log("Wrapper is minter:", newOFT.isMinter(contracts.wrapper));
        console.log("Redemption queue is minter:", newOFT.isMinter(contracts.redemptionQueue));
        
        console.log("");
        console.log("=== Next Steps ===");
        console.log("1. Test wrapper functionality");
        console.log("2. Test redemption queue functionality");
        console.log("3. Configure LayerZero peers");
        console.log("4. Test cross-chain transfers");
        console.log("5. Update frontend with new addresses");
    }
    
    /**
     * @notice Get existing contract addresses for the current network
     * @param chainId Current chain ID
     * @return ExistingContracts struct with addresses
     */
    function getExistingContracts(uint256 chainId) internal pure returns (ExistingContracts memory) {
        if (chainId == 84532) {
            // Base Sepolia
            return ExistingContracts({
                wrapper: 0x58c969172fa3A1D8379Eb942Bae4693d3b9cd58c,
                redemptionQueue: 0x6CDD3cD1c677abbc347A0bDe0eAf350311403638,
                tokenWhitelist: 0x055ccbcd0389151605057e844b86a5d8f372267e,
                custodyManager: 0xbb02190385cfa8e41b180e65ab28caf232f2789e
            });
        } else if (chainId == 11155420) {
            // Optimism Sepolia - TODO: Update with actual addresses
            return ExistingContracts({
                wrapper: address(0), // Deploy new or use existing
                redemptionQueue: address(0), // Deploy new or use existing
                tokenWhitelist: address(0), // Deploy new or use existing
                custodyManager: address(0) // Deploy new or use existing
            });
        } else if (chainId == 11155111) {
            // Ethereum Sepolia - TODO: Update with actual addresses
            return ExistingContracts({
                wrapper: address(0), // Deploy new or use existing
                redemptionQueue: address(0), // Deploy new or use existing
                tokenWhitelist: address(0), // Deploy new or use existing
                custodyManager: address(0) // Deploy new or use existing
            });
        } else {
            revert("Unsupported network");
        }
    }
    
    /**
     * @notice Get the new OFT address for the current network
     * @param chainId Current chain ID
     * @return address of the new OFT contract
     */
    function getNewOFTAddress(uint256 chainId) internal pure returns (address) {
        // TODO: Update these addresses after deployment
        if (chainId == 84532) {
            return address(0); // UPDATE WITH BASE SEPOLIA OFT ADDRESS
        } else if (chainId == 11155420) {
            return address(0); // UPDATE WITH OPTIMISM SEPOLIA OFT ADDRESS
        } else if (chainId == 11155111) {
            return address(0); // UPDATE WITH ETHEREUM SEPOLIA OFT ADDRESS
        } else {
            return address(0);
        }
    }
} 