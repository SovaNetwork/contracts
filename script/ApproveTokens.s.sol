// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ApproveTokens is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Base Sepolia addresses
        address wbtc = 0x0a3745b48f350949Ef5D024A01eE143741EA2CE0;
        address wrapper = 0x30cc05366CC687c0ab75e3908Fe2b2C5BB679db8;
        
        // Approve large amount (1000 WBTC)
        uint256 approveAmount = 1000 * 10**8; // 1000 WBTC (8 decimals)
        
        IERC20(wbtc).approve(wrapper, approveAmount);
        
        console.log("Approved WBTC for wrapper:");
        console.log("- WBTC:", wbtc);
        console.log("- Wrapper:", wrapper);
        console.log("- Amount:", approveAmount);
        
        vm.stopBroadcast();
    }
    
    function approveAllTokens() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Base Sepolia addresses
        address wbtc = 0x0a3745b48f350949Ef5D024A01eE143741EA2CE0;
        address lbtc = 0x7087Eb81f647448F1bd76e936A9F9A39775bC4Dc;
        address usdc = 0x52BA51f41713270e8071218058C3E37E1c2D4f20;
        address wrapper = 0x30cc05366CC687c0ab75e3908Fe2b2C5BB679db8;
        
        // Large approval amounts
        uint256 btcAmount = 1000 * 10**8; // 1000 tokens (8 decimals)
        uint256 usdcAmount = 1000000 * 10**6; // 1M USDC (6 decimals)
        
        // Approve all tokens
        IERC20(wbtc).approve(wrapper, btcAmount);
        IERC20(lbtc).approve(wrapper, btcAmount);
        IERC20(usdc).approve(wrapper, usdcAmount);
        
        console.log("Approved all tokens for wrapper:");
        console.log("- WBTC approved:", btcAmount);
        console.log("- LBTC approved:", btcAmount);
        console.log("- USDC approved:", usdcAmount);
        
        vm.stopBroadcast();
    }
} 