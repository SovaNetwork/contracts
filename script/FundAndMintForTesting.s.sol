// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/SovaBTCOFT.sol";

contract FundAndMintForTesting is Script {
    
    // New contract addresses
    address payable constant BASE_SEPOLIA_OFT = payable(0xAD36450E98E3AEa8d79FBc6D55C47C85eBCbb807);
    address payable constant OP_SEPOLIA_OFT = payable(0x4ffDe609b6655e66299d97D347A8dc7Fb26aE062);
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        uint256 chainId = block.chainid;
        
        if (chainId == 84532) {
            // Base Sepolia - mint tokens for testing
            console.log("Minting tokens on Base Sepolia for testing...");
            
            SovaBTCOFT baseOFT = SovaBTCOFT(BASE_SEPOLIA_OFT);
            
            // Mint 1 sovaBTC (1 * 10^8 since 8 decimals)
            uint256 mintAmount = 100_000_000; // 1 sovaBTC
            baseOFT.adminMint(deployer, mintAmount);
            
            console.log("Minted", mintAmount, "sovaBTC to deployer");
            console.log("Deployer balance:", baseOFT.balanceOf(deployer));
            
        } else if (chainId == 11155420) {
            // Optimism Sepolia - fund with ETH for LayerZero execution
            console.log("Funding Optimism Sepolia OFT with ETH...");
            
            uint256 fundAmount = 0.005 ether; // 0.005 ETH should be enough for multiple transactions
            console.log("Sending", fundAmount, "ETH to destination contract...");
            
            (bool success, ) = OP_SEPOLIA_OFT.call{value: fundAmount}("");
            require(success, "Failed to fund destination contract");
            
            console.log("Successfully funded destination contract!");
            console.log("Contract ETH balance:", OP_SEPOLIA_OFT.balance);
            
        } else {
            revert("Unsupported chain");
        }
        
        vm.stopBroadcast();
    }
} 