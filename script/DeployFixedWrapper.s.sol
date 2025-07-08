// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/SovaBTCWrapper.sol";

contract DeployFixedWrapper is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        console.log("=== Deploying Fixed Wrapper ===");
        console.log("Chain ID:", block.chainid);
        
        // Contract addresses on Base Sepolia
        address sovaBTC = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
        address tokenWhitelistCorrect = 0x3793FaA1bD71258336c877427b105B2E74e8C030; // The one where tokens are whitelisted
        address custodyManager = 0xe9781E85F6A55E76624fed62530AB75c53Db10C6;
        uint256 minDepositSatoshi = 10000; // 0.0001 BTC
        
        console.log("SovaBTC OFT:", sovaBTC);
        console.log("TokenWhitelist (CORRECT):", tokenWhitelistCorrect);
        console.log("CustodyManager:", custodyManager);
        console.log("MinDepositSatoshi:", minDepositSatoshi);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy new wrapper with correct TokenWhitelist
        SovaBTCWrapper newWrapper = new SovaBTCWrapper(
            sovaBTC,
            tokenWhitelistCorrect,
            custodyManager,
            minDepositSatoshi
        );
        
        console.log("");
        console.log("=== New Wrapper Deployed ===");
        console.log("New Wrapper Address:", address(newWrapper));
        
        // Set redemption queue
        address redemptionQueue = 0xdD4284D33fFf9cBbe4c852664cB0496830ca46Ab;
        newWrapper.setRedemptionQueue(redemptionQueue);
        console.log("Redemption queue set:", redemptionQueue);
        
        vm.stopBroadcast();
        
        // Verify configuration
        console.log("");
        console.log("=== Verification ===");
        console.log("Wrapper TokenWhitelist:", address(newWrapper.tokenWhitelist()));
        console.log("Wrapper RedemptionQueue:", newWrapper.getRedemptionQueue());
        console.log("Wrapper MinDepositSatoshi:", newWrapper.minDepositSatoshi());
        
        // Check if tokens are whitelisted
        TokenWhitelist whitelist = TokenWhitelist(tokenWhitelistCorrect);
        address wbtc = 0x10E8116eBA84981A7959a1158e03eE19c0Ad41f2;
        address lbtc = 0xf6E78618CA4bAA67259970039F49e215f15820FE;
        address usdc = 0x0C19b539bc7C323Bec14C0A153B21D1295A42e38;
        
        console.log("WBTC whitelisted:", whitelist.isTokenAllowed(wbtc));
        console.log("LBTC whitelisted:", whitelist.isTokenAllowed(lbtc));
        console.log("USDC whitelisted:", whitelist.isTokenAllowed(usdc));
        
        console.log("");
        console.log("SUCCESS: New wrapper deployed with correct TokenWhitelist!");
        console.log("UPDATE YOUR FRONTEND TO USE:", address(newWrapper));
    }
} 