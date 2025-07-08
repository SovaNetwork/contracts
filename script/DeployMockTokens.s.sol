// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../test/mocks/MockERC20BTC.sol";

contract DeployMockTokens is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 chainId = block.chainid;
        
        console.log("=== Deploying Mock Tokens ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", chainId);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Mock WBTC
        MockERC20BTC mockWBTC = new MockERC20BTC(
            "Wrapped Bitcoin",
            "WBTC",
            8 // 8 decimals like real WBTC
        );
        
        // Deploy Mock LBTC
        MockERC20BTC mockLBTC = new MockERC20BTC(
            "Lombard Staked Bitcoin",
            "LBTC",
            8 // 8 decimals like real LBTC
        );
        
        // Deploy Mock USDC
        MockERC20BTC mockUSDC = new MockERC20BTC(
            "USD Coin",
            "USDC",
            6 // 6 decimals like real USDC
        );
        
        // Mint initial tokens to deployer
        mockWBTC.mint(deployer, 100e8);  // 100 WBTC
        mockLBTC.mint(deployer, 100e8);  // 100 LBTC
        mockUSDC.mint(deployer, 100_000e6); // 100,000 USDC
        
        vm.stopBroadcast();
        
        console.log("=== Mock Tokens Deployed ===");
        console.log("Mock WBTC:", address(mockWBTC));
        console.log("Mock LBTC:", address(mockLBTC));
        console.log("Mock USDC:", address(mockUSDC));
        console.log("");
        console.log("=== Initial Balances Minted ===");
        console.log("WBTC Balance:", mockWBTC.balanceOf(deployer) / 1e8, "tokens");
        console.log("LBTC Balance:", mockLBTC.balanceOf(deployer) / 1e8, "tokens");
        console.log("USDC Balance:", mockUSDC.balanceOf(deployer) / 1e6, "tokens");
    }
} 