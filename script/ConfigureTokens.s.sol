// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/TokenWhitelist.sol";
import "../test/mocks/MockERC20BTC.sol";

contract ConfigureTokens is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 chainId = block.chainid;
        
        console.log("=== Configuring Tokens ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", chainId);
        
        // Contract addresses based on network
        address tokenWhitelist;
        address sovaBTCWrapper;
        address mockWBTC;
        address mockLBTC;
        address mockUSDC;
        string memory networkName;
        
        if (chainId == 84532) {
            // Base Sepolia - CORRECTED TokenWhitelist address (from wrapper.tokenWhitelist())
            tokenWhitelist = 0x94F983EB3Fd547b68E1760E2fe2193811f8f7c4e;
            sovaBTCWrapper = 0x7a08aF83566724F59D81413f3bD572E58711dE7b;
            mockWBTC = 0x10E8116eBA84981A7959a1158e03eE19c0Ad41f2;
            mockLBTC = 0xf6E78618CA4bAA67259970039F49e215f15820FE;
            mockUSDC = 0x0C19b539bc7C323Bec14C0A153B21D1295A42e38;
            networkName = "Base Sepolia";
        } else if (chainId == 11155420) {
            // Optimism Sepolia
            tokenWhitelist = 0xb386ef9D4C9FeF67058DBc00b31126AFE8D7600d;
            sovaBTCWrapper = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
            mockWBTC = 0x6f5249F8507445F1F0178eD162097bc4a262404E;
            mockLBTC = 0xBc2945fa12bF06fC292dac00BbbaF1e52eFD5A22;
            mockUSDC = 0xA57484Ac87b23668A19f388eB5812cCc5A8D1EEe;
            networkName = "Optimism Sepolia";
        } else {
            revert("Unsupported network");
        }
        
        console.log("Network:", networkName);
        console.log("TokenWhitelist:", tokenWhitelist);
        console.log("Wrapper:", sovaBTCWrapper);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Add tokens to whitelist
        console.log("=== Adding Tokens to Whitelist ===");
        TokenWhitelist whitelist = TokenWhitelist(tokenWhitelist);
        
        whitelist.addAllowedToken(mockWBTC);
        console.log("SUCCESS: WBTC added to whitelist:", mockWBTC);
        
        whitelist.addAllowedToken(mockLBTC);
        console.log("SUCCESS: LBTC added to whitelist:", mockLBTC);
        
        whitelist.addAllowedToken(mockUSDC);
        console.log("SUCCESS: USDC added to whitelist:", mockUSDC);
        
        // 2. Approve tokens for wrapper
        console.log("");
        console.log("=== Approving Tokens for Wrapper ===");
        MockERC20BTC wbtc = MockERC20BTC(mockWBTC);
        MockERC20BTC lbtc = MockERC20BTC(mockLBTC);
        MockERC20BTC usdc = MockERC20BTC(mockUSDC);
        
        wbtc.approve(sovaBTCWrapper, type(uint256).max);
        console.log("SUCCESS: WBTC approved for wrapper");
        
        lbtc.approve(sovaBTCWrapper, type(uint256).max);
        console.log("SUCCESS: LBTC approved for wrapper");
        
        usdc.approve(sovaBTCWrapper, type(uint256).max);
        console.log("SUCCESS: USDC approved for wrapper");
        
        vm.stopBroadcast();
        
        // 3. Verify configuration
        console.log("");
        console.log("=== Verification ===");
        console.log("WBTC whitelisted:", whitelist.isTokenAllowed(mockWBTC));
        console.log("LBTC whitelisted:", whitelist.isTokenAllowed(mockLBTC));
        console.log("USDC whitelisted:", whitelist.isTokenAllowed(mockUSDC));
        console.log("SUCCESS: All tokens configured!");
    }
} 