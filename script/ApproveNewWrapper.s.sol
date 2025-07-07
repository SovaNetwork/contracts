// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ApproveNewWrapper is Script {
    // New wrapper contract address
    address constant NEW_WRAPPER = 0xA73550548804cFf5dD23F1C67e360C3a22433f53;
    
    // Token addresses on Base Sepolia
    address constant WBTC = 0x0a3745b48f350949Ef5D024A01eE143741EA2CE0;
    address constant LBTC = 0x7087Eb81f647448F1bd76e936A9F9A39775bC4Dc;
    address constant USDC = 0x52BA51f41713270e8071218058C3E37E1c2D4f20;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Approve large amount for all tokens (1000 units each)
        uint256 wbtcAmount = 1000 * 10**8;  // 1000 WBTC (8 decimals)
        uint256 lbtcAmount = 1000 * 10**8;  // 1000 LBTC (8 decimals)  
        uint256 usdcAmount = 1000 * 10**6;  // 1000 USDC (6 decimals)
        
        IERC20(WBTC).approve(NEW_WRAPPER, wbtcAmount);
        console.log("Approved WBTC for new wrapper:", wbtcAmount);
        
        IERC20(LBTC).approve(NEW_WRAPPER, lbtcAmount);
        console.log("Approved LBTC for new wrapper:", lbtcAmount);
        
        IERC20(USDC).approve(NEW_WRAPPER, usdcAmount);
        console.log("Approved USDC for new wrapper:", usdcAmount);
        
        console.log("New wrapper address:", NEW_WRAPPER);
        console.log("All tokens approved for wrapping!");
        
        vm.stopBroadcast();
    }
} 