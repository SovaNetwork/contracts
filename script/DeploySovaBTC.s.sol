// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "../src/wrapper/SovaBTCToken.sol";
import "../src/wrapper/SovaBTCWrapper.sol";
import "../src/staking/DualTokenStaking.sol";

contract DeploySovaBTC is Script {
    // Configuration
    struct DeployConfig {
        address owner;
        address sovaToken;
        uint256 queueDuration;
        address[] initialTokens;
        string[] tokenNames;
    }

    // Deployed contracts
    struct DeployedContracts {
        address sovaBTCToken;
        address sovaBTCWrapper;
        address dualTokenStaking;
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with deployer:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "ETH");

        DeployConfig memory config = getDeployConfig();
        
        vm.startBroadcast(deployerPrivateKey);
        
        DeployedContracts memory contracts = deployContracts(config);
        configureContracts(config, contracts);
        
        vm.stopBroadcast();
        
        logDeployment(contracts);
        saveDeployment(contracts);
    }

    function getDeployConfig() internal view returns (DeployConfig memory) {
        uint256 chainId = block.chainid;
        
        if (chainId == 1) {
            // Ethereum Mainnet
            return DeployConfig({
                owner: vm.envAddress("OWNER_ADDRESS"),
                sovaToken: vm.envAddress("SOVA_TOKEN_ADDRESS"),
                queueDuration: 7 days,
                initialTokens: getMainnetTokens(),
                tokenNames: getMainnetTokenNames()
            });
        } else if (chainId == 8453) {
            // Base
            return DeployConfig({
                owner: vm.envAddress("OWNER_ADDRESS"),
                sovaToken: vm.envAddress("SOVA_TOKEN_ADDRESS"),
                queueDuration: 7 days,
                initialTokens: getBaseTokens(),
                tokenNames: getBaseTokenNames()
            });
        } else if (chainId == 11155111) {
            // Sepolia Testnet
            return DeployConfig({
                owner: vm.envAddress("OWNER_ADDRESS"),
                sovaToken: vm.envAddress("SOVA_TOKEN_ADDRESS"),
                queueDuration: 1 hours, // Shorter for testing
                initialTokens: getTestnetTokens(),
                tokenNames: getTestnetTokenNames()
            });
        } else {
            revert("Unsupported chain");
        }
    }

    function deployContracts(DeployConfig memory config) 
        internal 
        returns (DeployedContracts memory) 
    {
        console.log("Deploying SovaBTC Token...");
        
        // Deploy SovaBTC Token
        SovaBTCToken sovaBTCImpl = new SovaBTCToken();
        bytes memory sovaBTCInitData = abi.encodeCall(
            SovaBTCToken.initialize,
            (config.owner)
        );
        ERC1967Proxy sovaBTCProxy = new ERC1967Proxy(
            address(sovaBTCImpl),
            sovaBTCInitData
        );
        
        console.log("Deploying SovaBTC Wrapper...");
        
        // Deploy SovaBTC Wrapper
        SovaBTCWrapper wrapperImpl = new SovaBTCWrapper();
        bytes memory wrapperInitData = abi.encodeCall(
            SovaBTCWrapper.initialize,
            (config.owner, address(sovaBTCProxy), config.queueDuration)
        );
        ERC1967Proxy wrapperProxy = new ERC1967Proxy(
            address(wrapperImpl),
            wrapperInitData
        );
        
        console.log("Deploying Dual Token Staking...");
        
        // Deploy Dual Token Staking
        DualTokenStaking stakingImpl = new DualTokenStaking();
        bytes memory stakingInitData = abi.encodeCall(
            DualTokenStaking.initialize,
            (config.owner, address(sovaBTCProxy), config.sovaToken)
        );
        ERC1967Proxy stakingProxy = new ERC1967Proxy(
            address(stakingImpl),
            stakingInitData
        );
        
        return DeployedContracts({
            sovaBTCToken: address(sovaBTCProxy),
            sovaBTCWrapper: address(wrapperProxy),
            dualTokenStaking: address(stakingProxy)
        });
    }

    function configureContracts(
        DeployConfig memory config,
        DeployedContracts memory contracts
    ) internal {
        console.log("Configuring contracts...");
        
        SovaBTCToken sovaBTC = SovaBTCToken(contracts.sovaBTCToken);
        SovaBTCWrapper wrapper = SovaBTCWrapper(contracts.sovaBTCWrapper);
        
        // Set wrapper as minter for SovaBTC token
        sovaBTC.setWrapper(contracts.sovaBTCWrapper);
        
        // Add initial supported tokens
        for (uint256 i = 0; i < config.initialTokens.length; i++) {
            if (config.initialTokens[i] != address(0)) {
                wrapper.addSupportedToken(
                    config.initialTokens[i],
                    config.tokenNames[i]
                );
                console.log("Added token:", config.tokenNames[i], config.initialTokens[i]);
            }
        }
        
        console.log("Configuration complete!");
    }

    function logDeployment(DeployedContracts memory contracts) internal view {
        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("Chain ID:", block.chainid);
        console.log("Block number:", block.number);
        console.log("\nDeployed Contracts:");
        console.log("SovaBTC Token:", contracts.sovaBTCToken);
        console.log("SovaBTC Wrapper:", contracts.sovaBTCWrapper);
        console.log("Dual Token Staking:", contracts.dualTokenStaking);
        console.log("===========================\n");
    }

    function saveDeployment(DeployedContracts memory contracts) internal {
        string memory chainId = vm.toString(block.chainid);
        string memory filename = string.concat("deployments/", chainId, ".json");
        
        string memory json = string.concat(
            '{\n',
            '  "chainId": ', chainId, ',\n',
            '  "blockNumber": ', vm.toString(block.number), ',\n',
            '  "contracts": {\n',
            '    "sovaBTCToken": "', vm.toString(contracts.sovaBTCToken), '",\n',
            '    "sovaBTCWrapper": "', vm.toString(contracts.sovaBTCWrapper), '",\n',
            '    "dualTokenStaking": "', vm.toString(contracts.dualTokenStaking), '"\n',
            '  }\n',
            '}'
        );
        
        vm.writeFile(filename, json);
        console.log("Deployment saved to:", filename);
    }

    // Token addresses for different networks
    function getMainnetTokens() internal pure returns (address[] memory) {
        address[] memory tokens = new address[](3);
        tokens[0] = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599; // WBTC
        tokens[1] = 0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf; // cbBTC
        tokens[2] = 0x18084fbA666a33d37592fA2633fD49a74DD93a88; // tBTC
        return tokens;
    }

    function getMainnetTokenNames() internal pure returns (string[] memory) {
        string[] memory names = new string[](3);
        names[0] = "Wrapped Bitcoin";
        names[1] = "Coinbase Wrapped BTC";
        names[2] = "Threshold Bitcoin";
        return names;
    }

    function getBaseTokens() internal pure returns (address[] memory) {
        address[] memory tokens = new address[](2);
        tokens[0] = 0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b; // tBTC on Base
        tokens[1] = 0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf; // cbBTC on Base
        return tokens;
    }

    function getBaseTokenNames() internal pure returns (string[] memory) {
        string[] memory names = new string[](2);
        names[0] = "Threshold Bitcoin";
        names[1] = "Coinbase Wrapped BTC";
        return names;
    }

    function getTestnetTokens() internal pure returns (address[] memory) {
        // Return empty array for testnet - tokens will be deployed separately
        return new address[](0);
    }

    function getTestnetTokenNames() internal pure returns (string[] memory) {
        return new string[](0);
    }
}