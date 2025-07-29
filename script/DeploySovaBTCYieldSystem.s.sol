// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../src/vault/SovaBTCYieldVault.sol";
import "../src/staking/SovaBTCYieldStaking.sol";
import "../src/bridges/BridgedSovaBTC.sol";

contract DeploySovaBTCYieldSystem is Script {
    // Configuration
    struct DeployConfig {
        address owner;
        address sovaToken;
        address hyperlaneMailbox;
        uint256 chainId;
        bool isSovaNetwork;
        address primaryAsset;
        string primaryAssetName;
        address[] initialTokens;
        string[] tokenNames;
    }

    // Deployed contracts
    struct DeployedContracts {
        address rewardToken; // BridgedSovaBTC or native sovaBTC
        address yieldVault;
        address yieldStaking;
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying SovaBTC Yield System with deployer:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "ETH");

        DeployConfig memory config = getDeployConfig();

        vm.startBroadcast(deployerPrivateKey);

        DeployedContracts memory contracts = deployContracts(config);
        configureContracts(config, contracts);

        vm.stopBroadcast();

        logDeployment(contracts, config);
        saveDeployment(contracts, config);
    }

    function getDeployConfig() internal view returns (DeployConfig memory) {
        uint256 chainId = block.chainid;

        if (chainId == 1) {
            // Ethereum Mainnet
            return DeployConfig({
                owner: vm.envAddress("OWNER_ADDRESS"),
                sovaToken: vm.envAddress("SOVA_TOKEN_ADDRESS"),
                hyperlaneMailbox: vm.envAddress("HYPERLANE_MAILBOX_MAINNET"),
                chainId: chainId,
                isSovaNetwork: false,
                primaryAsset: 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599, // WBTC
                primaryAssetName: "Wrapped Bitcoin",
                initialTokens: getMainnetTokens(),
                tokenNames: getMainnetTokenNames()
            });
        } else if (chainId == 8453) {
            // Base
            return DeployConfig({
                owner: vm.envAddress("OWNER_ADDRESS"),
                sovaToken: vm.envAddress("SOVA_TOKEN_ADDRESS"),
                hyperlaneMailbox: vm.envAddress("HYPERLANE_MAILBOX_BASE"),
                chainId: chainId,
                isSovaNetwork: false,
                primaryAsset: 0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf, // cbBTC
                primaryAssetName: "Coinbase Wrapped BTC",
                initialTokens: getBaseTokens(),
                tokenNames: getBaseTokenNames()
            });
        } else if (chainId == vm.envUint("SOVA_CHAIN_ID")) {
            // Sova Network
            return DeployConfig({
                owner: vm.envAddress("OWNER_ADDRESS"),
                sovaToken: vm.envAddress("SOVA_TOKEN_ADDRESS"),
                hyperlaneMailbox: vm.envAddress("HYPERLANE_MAILBOX_SOVA"),
                chainId: chainId,
                isSovaNetwork: true,
                primaryAsset: 0x2100000000000000000000000000000000000020, // Native sovaBTC
                primaryAssetName: "Sova Bitcoin",
                initialTokens: getSovaTokens(),
                tokenNames: getSovaTokenNames()
            });
        } else if (chainId == 11155111) {
            // Sepolia Testnet
            return DeployConfig({
                owner: vm.envAddress("OWNER_ADDRESS"),
                sovaToken: vm.envAddress("SOVA_TOKEN_ADDRESS"),
                hyperlaneMailbox: vm.envAddress("HYPERLANE_MAILBOX_SEPOLIA"),
                chainId: chainId,
                isSovaNetwork: false,
                primaryAsset: vm.envAddress("TEST_WBTC_ADDRESS"),
                primaryAssetName: "Test WBTC",
                initialTokens: new address[](0),
                tokenNames: new string[](0)
            });
        } else {
            revert("Unsupported chain");
        }
    }

    function deployContracts(DeployConfig memory config) internal returns (DeployedContracts memory) {
        address rewardToken;

        if (config.isSovaNetwork) {
            // On Sova Network, use native sovaBTC
            rewardToken = config.primaryAsset;
            console.log("Using native sovaBTC at:", rewardToken);
        } else {
            // Deploy BridgedSovaBTC for other networks
            console.log("Deploying BridgedSovaBTC...");

            BridgedSovaBTC bridgedImpl = new BridgedSovaBTC();
            bytes memory bridgedInitData =
                abi.encodeCall(BridgedSovaBTC.initialize, (config.owner, config.hyperlaneMailbox, address(0)));
            ERC1967Proxy bridgedProxy = new ERC1967Proxy(address(bridgedImpl), bridgedInitData);
            rewardToken = address(bridgedProxy);
        }

        console.log("Deploying SovaBTC Yield Vault...");

        // Deploy Yield Vault
        SovaBTCYieldVault vaultImpl = new SovaBTCYieldVault();
        bytes memory vaultInitData = abi.encodeCall(
            SovaBTCYieldVault.initialize,
            (
                config.primaryAsset,
                rewardToken,
                config.isSovaNetwork,
                config.owner,
                "SovaBTC Yield Vault",
                "sovaBTCYield"
            )
        );
        ERC1967Proxy vaultProxy = new ERC1967Proxy(address(vaultImpl), vaultInitData);

        console.log("Deploying SovaBTC Yield Staking...");

        // Deploy Yield Staking
        SovaBTCYieldStaking stakingImpl = new SovaBTCYieldStaking();
        bytes memory stakingInitData = abi.encodeCall(
            SovaBTCYieldStaking.initialize,
            (config.owner, address(vaultProxy), config.sovaToken, rewardToken, config.isSovaNetwork)
        );
        ERC1967Proxy stakingProxy = new ERC1967Proxy(address(stakingImpl), stakingInitData);

        return DeployedContracts({
            rewardToken: rewardToken,
            yieldVault: address(vaultProxy),
            yieldStaking: address(stakingProxy)
        });
    }

    function configureContracts(DeployConfig memory config, DeployedContracts memory contracts) internal {
        console.log("Configuring contracts...");

        SovaBTCYieldVault vault = SovaBTCYieldVault(contracts.yieldVault);

        // Add initial supported tokens to vault
        for (uint256 i = 0; i < config.initialTokens.length; i++) {
            if (config.initialTokens[i] != address(0) && config.initialTokens[i] != config.primaryAsset) {
                vault.addSupportedAsset(config.initialTokens[i], config.tokenNames[i]);
                console.log("Added asset:", config.tokenNames[i], config.initialTokens[i]);
            }
        }

        // Grant vault role to the vault contract on BridgedSovaBTC
        if (!config.isSovaNetwork) {
            BridgedSovaBTC(contracts.rewardToken).grantVaultRole(contracts.yieldVault);
            console.log("Granted vault role to yield vault");
        }

        console.log("Configuration complete!");
    }

    function logDeployment(DeployedContracts memory contracts, DeployConfig memory config) internal view {
        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("Chain ID:", config.chainId);
        console.log("Is Sova Network:", config.isSovaNetwork);
        console.log("Block number:", block.number);
        console.log("\nDeployed Contracts:");

        if (!config.isSovaNetwork) {
            console.log("BridgedSovaBTC:", contracts.rewardToken);
        }
        console.log("SovaBTC Yield Vault:", contracts.yieldVault);
        console.log("SovaBTC Yield Staking:", contracts.yieldStaking);
        console.log("===========================\n");
    }

    function saveDeployment(DeployedContracts memory contracts, DeployConfig memory config) internal {
        string memory chainId = vm.toString(config.chainId);
        string memory filename = string.concat("deployments/yield-system-", chainId, ".json");

        string memory bridgedSovaBTCJson = config.isSovaNetwork
            ? '"bridgedSovaBTC": "native",'
            : string.concat('"bridgedSovaBTC": "', vm.toString(contracts.rewardToken), '",');

        string memory json = string.concat(
            "{\n",
            '  "chainId": ',
            chainId,
            ",\n",
            '  "isSovaNetwork": ',
            config.isSovaNetwork ? "true" : "false",
            ",\n",
            '  "blockNumber": ',
            vm.toString(block.number),
            ",\n",
            '  "contracts": {\n',
            "    ",
            bridgedSovaBTCJson,
            "\n",
            '    "yieldVault": "',
            vm.toString(contracts.yieldVault),
            '",\n',
            '    "yieldStaking": "',
            vm.toString(contracts.yieldStaking),
            '"\n',
            "  }\n",
            "}"
        );

        vm.writeFile(filename, json);
        console.log("Deployment saved to:", filename);
    }

    // Token addresses for different networks
    function getMainnetTokens() internal pure returns (address[] memory) {
        address[] memory tokens = new address[](2);
        tokens[0] = 0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf; // cbBTC
        tokens[1] = 0x18084fbA666a33d37592fA2633fD49a74DD93a88; // tBTC
        return tokens;
    }

    function getMainnetTokenNames() internal pure returns (string[] memory) {
        string[] memory names = new string[](2);
        names[0] = "Coinbase Wrapped BTC";
        names[1] = "Threshold Bitcoin";
        return names;
    }

    function getBaseTokens() internal pure returns (address[] memory) {
        address[] memory tokens = new address[](1);
        tokens[0] = 0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b; // tBTC on Base
        return tokens;
    }

    function getBaseTokenNames() internal pure returns (string[] memory) {
        string[] memory names = new string[](1);
        names[0] = "Threshold Bitcoin";
        return names;
    }

    function getSovaTokens() internal pure returns (address[] memory) {
        // On Sova Network, can accept wrapped tokens bridged from other chains
        return new address[](0);
    }

    function getSovaTokenNames() internal pure returns (string[] memory) {
        return new string[](0);
    }
}
