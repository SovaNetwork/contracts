// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

/**
 * @title DeployRealSovaBTCOFT
 * @notice Deploy real LayerZero OFT implementation of SovaBTC
 * @dev This replaces the previous mock implementations with actual LayerZero functionality
 */
contract DeployRealSovaBTCOFT is Script {
    
    // LayerZero V2 Endpoints (Sepolia testnets)
    address constant ETHEREUM_SEPOLIA_ENDPOINT = 0x6EDCE65403992e310A62460808c4b910D972f10f;
    address constant BASE_SEPOLIA_ENDPOINT = 0x6EDCE65403992e310A62460808c4b910D972f10f;
    address constant OPTIMISM_SEPOLIA_ENDPOINT = 0x6EDCE65403992e310A62460808c4b910D972f10f;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        uint256 chainId = block.chainid;
        
        console.log("=== Deploying Real SovaBTC LayerZero OFT ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", chainId);
        console.log("Deployer Balance:", deployer.balance / 1e18, "ETH");
        
        // Verify we have enough ETH for deployment
        require(deployer.balance > 0.01 ether, "Insufficient ETH for deployment");
        
        vm.startBroadcast(deployerPrivateKey);
        
        address endpoint;
        string memory networkName;
        
        // Determine network and endpoint
        if (chainId == 11155111) {
            endpoint = ETHEREUM_SEPOLIA_ENDPOINT;
            networkName = "Ethereum Sepolia";
        } else if (chainId == 84532) {
            endpoint = BASE_SEPOLIA_ENDPOINT;
            networkName = "Base Sepolia";
        } else if (chainId == 11155420) {
            endpoint = OPTIMISM_SEPOLIA_ENDPOINT;
            networkName = "Optimism Sepolia";
        } else {
            revert("Unsupported network");
        }
        
        console.log("Network:", networkName);
        console.log("LayerZero Endpoint:", endpoint);
        
        // Deploy SovaBTC OFT
        SovaBTCOFT sovaBTCOFT = new SovaBTCOFT(
            "Sova Bitcoin",
            "sovaBTC",
            endpoint,
            deployer  // Owner and initial delegate
        );
        
        console.log("");
        console.log("=== Deployment Successful ===");
        console.log("SovaBTC OFT Address:", address(sovaBTCOFT));
        console.log("Network:", networkName);
        console.log("Chain ID:", chainId);
        console.log("Owner:", sovaBTCOFT.owner());
        console.log("Symbol:", sovaBTCOFT.symbol());
        console.log("Decimals:", sovaBTCOFT.decimals());
        console.log("Initial Minter:", deployer);
        
        // Verify deployment
        require(sovaBTCOFT.decimals() == 8, "Incorrect decimals");
        require(sovaBTCOFT.owner() == deployer, "Incorrect owner");
        require(sovaBTCOFT.isMinter(deployer), "Deployer not initial minter");
        
        console.log("");
        console.log("=== Configuration ===");
        console.log("Min Deposit Amount:", sovaBTCOFT.minDepositAmount(), "satoshi");
        console.log("Max Deposit Amount:", sovaBTCOFT.maxDepositAmount(), "satoshi");
        console.log("Max Gas Limit Amount:", sovaBTCOFT.maxGasLimitAmount(), "satoshi");
        console.log("Paused:", sovaBTCOFT.isPaused());
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== Next Steps ===");
        console.log("1. Record contract address:", address(sovaBTCOFT));
        console.log("2. Verify contract on block explorer");
        console.log("3. Configure LayerZero peers with other networks");
        console.log("4. Add wrapper contracts as minters");
        console.log("5. Update wrapper contracts to use new OFT address");
        
        console.log("");
        console.log("=== Save This Information ===");
        console.log("Network: %s", networkName);
        console.log("Chain ID: %s", chainId);
        console.log("SovaBTC OFT: %s", address(sovaBTCOFT));
        console.log("Deployer: %s", deployer);
        console.log("LayerZero Endpoint: %s", endpoint);
    }
} 