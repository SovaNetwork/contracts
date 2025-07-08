// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import {SovaBTCWrapper} from "../src/SovaBTCWrapper.sol";
import {SovaBTCOFT} from "../src/SovaBTCOFT.sol";

contract DeployNewWrappers is Script {
    
    // NEW SovaBTC OFT addresses (with receive functions)
    address payable constant BASE_NEW_OFT = payable(0xAD36450E98E3AEa8d79FBc6D55C47C85eBCbb807);
    address payable constant OP_NEW_OFT = payable(0x4ffDe609b6655e66299d97D347A8dc7Fb26aE062);
    
    // Existing supporting contract addresses
    address constant BASE_TOKEN_WHITELIST = 0x3793FaA1bD71258336c877427b105B2E74e8C030;
    address constant BASE_CUSTODY_MANAGER = 0xe9781E85F6A55E76624fed62530AB75c53Db10C6;
    address constant BASE_REDEMPTION_QUEUE = 0xdD4284D33fFf9cBbe4c852664cB0496830ca46Ab;
    
    address constant OP_TOKEN_WHITELIST = 0xb386ef9D4C9FeF67058DBc00b31126AFE8D7600d;
    address constant OP_CUSTODY_MANAGER = 0x56b1F2664E5AceaBe31F64021bFF7744b7d391c7;
    address constant OP_REDEMPTION_QUEUE = 0x3793FaA1bD71258336c877427b105B2E74e8C030;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        uint256 chainId = block.chainid;
        
        if (chainId == 84532) {
            // Base Sepolia
            console.log("=== Deploying NEW Wrapper on Base Sepolia ===");
            console.log("New SovaBTC OFT:", BASE_NEW_OFT);
            console.log("TokenWhitelist:", BASE_TOKEN_WHITELIST);
            console.log("CustodyManager:", BASE_CUSTODY_MANAGER);
            
            // Deploy new wrapper pointing to new OFT
            SovaBTCWrapper newWrapper = new SovaBTCWrapper(
                address(BASE_NEW_OFT),  // NEW SovaBTC OFT address
                BASE_TOKEN_WHITELIST,   // Existing TokenWhitelist
                BASE_CUSTODY_MANAGER,   // Existing CustodyManager
                10_000                  // Min deposit (0.0001 BTC = 10,000 sats)
            );
            
            console.log("NEW Wrapper deployed at:", address(newWrapper));
            
            // Add new wrapper as minter to the new OFT
            SovaBTCOFT newOFT = SovaBTCOFT(BASE_NEW_OFT);
            newOFT.addMinter(address(newWrapper));
            console.log("New wrapper added as minter to new OFT");
            
            // Set redemption queue in new wrapper
            newWrapper.setRedemptionQueue(BASE_REDEMPTION_QUEUE);
            console.log("Redemption queue configured in new wrapper");
            
            // Verify
            console.log("Wrapper is minter:", newOFT.isMinter(address(newWrapper)));
            console.log("Redemption queue set:", newWrapper.getRedemptionQueue());
            
        } else if (chainId == 11155420) {
            // Optimism Sepolia
            console.log("=== Deploying NEW Wrapper on Optimism Sepolia ===");
            console.log("New SovaBTC OFT:", OP_NEW_OFT);
            console.log("TokenWhitelist:", OP_TOKEN_WHITELIST);
            console.log("CustodyManager:", OP_CUSTODY_MANAGER);
            
            // Deploy new wrapper pointing to new OFT
            SovaBTCWrapper newWrapper = new SovaBTCWrapper(
                address(OP_NEW_OFT),    // NEW SovaBTC OFT address
                OP_TOKEN_WHITELIST,     // Existing TokenWhitelist
                OP_CUSTODY_MANAGER,     // Existing CustodyManager
                10_000                  // Min deposit (0.0001 BTC = 10,000 sats)
            );
            
            console.log("NEW Wrapper deployed at:", address(newWrapper));
            
            // Add new wrapper as minter to the new OFT
            SovaBTCOFT newOFT = SovaBTCOFT(OP_NEW_OFT);
            newOFT.addMinter(address(newWrapper));
            console.log("New wrapper added as minter to new OFT");
            
            // Set redemption queue in new wrapper
            newWrapper.setRedemptionQueue(OP_REDEMPTION_QUEUE);
            console.log("Redemption queue configured in new wrapper");
            
            // Verify
            console.log("Wrapper is minter:", newOFT.isMinter(address(newWrapper)));
            console.log("Redemption queue set:", newWrapper.getRedemptionQueue());
            
        } else {
            revert("Unsupported chain");
        }
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== IMPORTANT: UPDATE FRONTEND ===");
        console.log("Update the wrapper contract address in the frontend to use the new wrapper!");
    }
} 