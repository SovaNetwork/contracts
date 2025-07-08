// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/SovaBTCOFT.sol";

contract TestBridgeWithProperGas is Script {
    // Base Sepolia -> Optimism Sepolia
    uint32 constant BASE_EID = 40245;
    uint32 constant OP_EID = 40232;
    
    // Test with different gas amounts
    uint256[] gasAmounts = [200000, 300000, 500000, 1000000];
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Get Base Sepolia OFT contract
        SovaBTCOFT baseOFT = SovaBTCOFT(0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d);
        
        console.log("Testing bridge with different gas configurations");
        console.log("Base OFT Balance:", baseOFT.balanceOf(deployer));
        
        // Test amount: 0.1 sovaBTC
        uint256 amount = 10**17; // 0.1 * 10^18
        
        // Convert deployer address to bytes32
        bytes32 recipient = bytes32(uint256(uint160(deployer)));
        
        for (uint256 i = 0; i < gasAmounts.length; i++) {
            uint256 gasAmount = gasAmounts[i];
            console.log("");
            console.log("=== Testing with gas:", gasAmount);
            
            // Create options with specific destination gas
            // LayerZero V2 options format: 
            // - uint16(1) for OPTION_TYPE_LZRECEIVE
            // - uint128 gas amount
            bytes memory options = abi.encodePacked(
                uint16(1), // OPTION_TYPE_LZRECEIVE  
                uint128(gasAmount)
            );
            
            // Create SendParam
            SendParam memory sendParam = SendParam({
                dstEid: OP_EID,
                to: recipient,
                amountLD: amount,
                minAmountLD: amount,
                extraOptions: options,
                composeMsg: "",
                oftCmd: ""
            });
            
            // Get fee quote
            try baseOFT.quoteSend(sendParam, false) returns (MessagingFee memory fee) {
                console.log("Quote successful - Native fee:", fee.nativeFee);
                console.log("Quote successful - LZ token fee:", fee.lzTokenFee);
                
                // Attempt the bridge transaction
                try baseOFT.send{value: fee.nativeFee}(
                    sendParam, 
                    fee, 
                    deployer
                ) {
                    console.log("SUCCESS: Bridge transaction with gas:", gasAmount);
                    
                    // Wait a bit before next test
                    vm.sleep(5000);
                    break; // Exit on first success
                    
                } catch Error(string memory reason) {
                    console.log("FAILED: Bridge with gas:", gasAmount, "reason:", reason);
                } catch {
                    console.log("FAILED: Bridge with gas:", gasAmount, "unknown error");
                }
                
            } catch Error(string memory reason) {
                console.log("FAILED: Quote with gas:", gasAmount, "reason:", reason);
            } catch {
                console.log("FAILED: Quote with gas:", gasAmount, "unknown error");
            }
        }
        
        vm.stopBroadcast();
    }
} 