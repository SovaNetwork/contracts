// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

/// @notice Simple interface for our test tokens
interface ITestToken {
    function mint(address to, uint256 amount) external;
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function balanceOf(address account) external view returns (uint256);
}

/// @notice Script to mint test tokens for multi-chain testing
contract MintTestTokens is Script {
    // Default mint amounts
    uint256 constant DEFAULT_WBTC_AMOUNT = 100 * 10**8;  // 100 WBTC
    uint256 constant DEFAULT_LBTC_AMOUNT = 100 * 10**8;  // 100 LBTC
    uint256 constant DEFAULT_USDC_AMOUNT = 10000 * 10**6; // 10,000 USDC

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        
        console.log("=== Minting Test Tokens ===");
        console.log("Network:", getNetworkName(block.chainid));
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("");

        // Get token addresses for current network
        (address wbtc, address lbtc, address usdc) = getTokenAddresses(block.chainid);
        
        if (wbtc == address(0) || lbtc == address(0) || usdc == address(0)) {
            console.log("ERROR: Token addresses not configured for this network");
            console.log("Please update the script with deployed token addresses");
            return;
        }

        vm.startBroadcast(deployerKey);

        // Mint tokens to deployer
        mintTokensToAddress(wbtc, lbtc, usdc, deployer, "deployer");

        // Mint to specific test address
        address targetUser = 0x6182051f545E673b54119800126d8802E3Da034b;
        mintTokensToAddress(wbtc, lbtc, usdc, targetUser, "target test user");

        // Optional: Mint to additional test addresses
        // Uncomment and modify as needed for testing
        /*
        address testUser1 = 0x...; // Add test addresses here
        address testUser2 = 0x...;
        
        mintTokensToAddress(wbtc, lbtc, usdc, testUser1, "test user 1");
        mintTokensToAddress(wbtc, lbtc, usdc, testUser2, "test user 2");
        */

        vm.stopBroadcast();

        console.log("");
        console.log("SUCCESS: Token minting complete!");
        console.log("");
        console.log("Token Addresses:");
        console.log("WBTC:", wbtc);
        console.log("LBTC:", lbtc);
        console.log("USDC:", usdc);
    }

    function mintTokensToAddress(
        address wbtc,
        address lbtc,
        address usdc,
        address recipient,
        string memory recipientName
    ) internal {
        console.log("Minting tokens to", recipientName, ":", recipient);

        try ITestToken(wbtc).mint(recipient, DEFAULT_WBTC_AMOUNT) {
            console.log("SUCCESS: Minted", DEFAULT_WBTC_AMOUNT / 10**8, "WBTC");
        } catch {
            console.log("ERROR: Failed to mint WBTC");
        }

        try ITestToken(lbtc).mint(recipient, DEFAULT_LBTC_AMOUNT) {
            console.log("SUCCESS: Minted", DEFAULT_LBTC_AMOUNT / 10**8, "LBTC");
        } catch {
            console.log("ERROR: Failed to mint LBTC");
        }

        try ITestToken(usdc).mint(recipient, DEFAULT_USDC_AMOUNT) {
            console.log("SUCCESS: Minted", DEFAULT_USDC_AMOUNT / 10**6, "USDC");
        } catch {
            console.log("ERROR: Failed to mint USDC");
        }

        console.log("");
    }

    function getTokenAddresses(uint256 chainId) internal pure returns (
        address wbtc,
        address lbtc,
        address usdc
    ) {
        if (chainId == 84532) {
            // Base Sepolia - CURRENT DEPLOYED ADDRESSES (Updated 1/7/25)
            wbtc = 0x10E8116eBA84981A7959a1158e03eE19c0Ad41f2;
            lbtc = 0xf6E78618CA4bAA67259970039F49e215f15820FE;
            usdc = 0x0C19b539bc7C323Bec14C0A153B21D1295A42e38;
        } else if (chainId == 11155111) {
            // Ethereum Sepolia - UPDATE THESE AFTER DEPLOYMENT
            wbtc = address(0); // TODO: Update with deployed address
            lbtc = address(0); // TODO: Update with deployed address
            usdc = address(0); // TODO: Update with deployed address
        } else if (chainId == 11155420) {
            // Optimism Sepolia - UPDATE THESE AFTER DEPLOYMENT
            wbtc = address(0); // TODO: Update with deployed address
            lbtc = address(0); // TODO: Update with deployed address
            usdc = address(0); // TODO: Update with deployed address
        }
        // Add more networks as needed
    }

    function getNetworkName(uint256 chainId) internal pure returns (string memory) {
        if (chainId == 11155111) return "Ethereum Sepolia";
        if (chainId == 11155420) return "Optimism Sepolia";
        if (chainId == 84532) return "Base Sepolia";
        return "Unknown Network";
    }

    // Utility function to check current balances
    function checkBalances() external view {
        address deployer = msg.sender;
        (address wbtc, address lbtc, address usdc) = getTokenAddresses(block.chainid);
        
        if (wbtc == address(0)) {
            console.log("Token addresses not configured for this network");
            return;
        }

        console.log("=== Current Token Balances ===");
        console.log("Address:", deployer);
        console.log("Network:", getNetworkName(block.chainid));
        console.log("");

        try ITestToken(wbtc).balanceOf(deployer) returns (uint256 balance) {
            console.log("WBTC Balance:", balance / 10**8, "tokens");
        } catch {
            console.log("WBTC Balance: Unable to fetch");
        }

        try ITestToken(lbtc).balanceOf(deployer) returns (uint256 balance) {
            console.log("LBTC Balance:", balance / 10**8, "tokens");
        } catch {
            console.log("LBTC Balance: Unable to fetch");
        }

        try ITestToken(usdc).balanceOf(deployer) returns (uint256 balance) {
            console.log("USDC Balance:", balance / 10**6, "tokens");
        } catch {
            console.log("USDC Balance: Unable to fetch");
        }
    }
} 