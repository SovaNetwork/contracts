// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";

contract FundDestinationOFT is Script {
    
    // Optimism Sepolia SovaBTCOFT contract
    address constant OP_SEPOLIA_OFT = 0x1b7227A7A6BcAe6c64907b1B51dD0801C3E8ba30;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Check current balances
        uint256 deployerBalance = deployer.balance;
        uint256 oftBalance = OP_SEPOLIA_OFT.balance;
        
        console.log("Deployer balance:", deployerBalance);
        console.log("OFT current balance:", oftBalance);
        
        // Send 0.01 ETH to the OFT contract for LayerZero execution gas  
        uint256 fundAmount = 0.01 ether;
        
        console.log("Sending", fundAmount, "ETH to OFT contract...");
        
        // Send ETH to the contract
        (bool success, ) = OP_SEPOLIA_OFT.call{value: fundAmount}("");
        require(success, "Failed to send ETH to OFT contract");
        
        console.log("Successfully funded OFT contract!");
        console.log("New OFT balance:", OP_SEPOLIA_OFT.balance);
        console.log("Remaining deployer balance:", deployer.balance);
        
        vm.stopBroadcast();
    }
} 