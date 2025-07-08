// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Script, console} from "forge-std/Script.sol";
import "../src/SovaBTCOFT.sol";

contract DiagnoseBridgeFailure is Script {
    
    // Base Sepolia addresses
    address constant BASE_SOVA_OFT = 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d;
    address constant USER_ADDRESS = 0x6182051f545E673b54119800126d8802E3Da034b;
    
    // LayerZero EIDs
    uint32 constant BASE_SEPOLIA_EID = 40245;
    uint32 constant OPTIMISM_SEPOLIA_EID = 40232;
    
    function run() external view {
        SovaBTCOFT oft = SovaBTCOFT(BASE_SOVA_OFT);
        
        console.log("=== DIAGNOSING BRIDGE TRANSACTION FAILURE ===");
        console.log("Base Sepolia OFT Address:", BASE_SOVA_OFT);
        console.log("User Address:", USER_ADDRESS);
        console.log("");
        
        // 1. Check if contract is paused
        console.log("1. CONTRACT PAUSE STATE");
        try oft.isPaused() returns (bool paused) {
            console.log("   Contract Paused:", paused);
        } catch {
            console.log("   ERROR: Could not check pause state");
        }
        console.log("");
        
        // 2. Check user balance
        console.log("2. USER BALANCE");
        try oft.balanceOf(USER_ADDRESS) returns (uint256 balance) {
            console.log("   User sovaBTC Balance:", balance);
            console.log("   User sovaBTC Balance (BTC):", balance / 1e8);
        } catch {
            console.log("   ERROR: Could not check user balance");
        }
        console.log("");
        
        // 3. Check LayerZero peer configuration
        console.log("3. LAYERZERO PEER CONFIGURATION");
        try oft.peers(OPTIMISM_SEPOLIA_EID) returns (bytes32 peer) {
            console.log("   Optimism Sepolia Peer:", vm.toString(peer));
            if (peer == bytes32(0)) {
                console.log("   WARNING: No peer set for Optimism Sepolia!");
            }
        } catch {
            console.log("   ERROR: Could not check peer configuration");
        }
        console.log("");
        
        // 4. Check enforced options
        console.log("4. ENFORCED OPTIONS");
        uint16 SEND_MSG_TYPE = 1;
        try oft.enforcedOptions(OPTIMISM_SEPOLIA_EID, SEND_MSG_TYPE) returns (bytes memory options) {
            console.log("   Enforced Options Length:", options.length);
            if (options.length == 0) {
                console.log("   WARNING: No enforced options set!");
            } else {
                console.log("   Enforced Options:", vm.toString(options));
            }
        } catch {
            console.log("   ERROR: Could not check enforced options");
        }
        console.log("");
        
        // 5. Check contract ownership
        console.log("5. CONTRACT OWNERSHIP");
        try oft.owner() returns (address owner) {
            console.log("   Contract Owner:", owner);
        } catch {
            console.log("   ERROR: Could not check owner");
        }
        console.log("");
        
        // 6. Check OFT version
        console.log("6. OFT VERSION");
        try oft.oftVersion() returns (bytes4 interfaceId, uint64 version) {
            console.log("   Interface ID:", vm.toString(interfaceId));
            console.log("   Version:", version);
        } catch {
            console.log("   ERROR: Could not check OFT version");
        }
        console.log("");
        
        // 7. Check LayerZero endpoint
        console.log("7. LAYERZERO ENDPOINT");
        console.log("   Skipping endpoint check due to type complexity");
        console.log("");
        
        // 8. Simulate the failed transaction parameters
        console.log("8. TRANSACTION SIMULATION");
        uint256 bridgeAmount = 25000000; // 0.25 BTC in 8 decimals
        console.log("   Attempted Bridge Amount:", bridgeAmount);
        console.log("   Attempted Bridge Amount (BTC):", bridgeAmount / 1e8);
        
        // Check if user has enough balance
        try oft.balanceOf(USER_ADDRESS) returns (uint256 balance) {
            if (balance < bridgeAmount) {
                console.log("   ISSUE FOUND: Insufficient balance!");
                console.log("   Required:", bridgeAmount);
                console.log("   Available:", balance);
                console.log("   Shortfall:", bridgeAmount - balance);
            } else {
                console.log("   Balance check: PASSED");
            }
        } catch {
            console.log("   ERROR: Could not verify balance for simulation");
        }
        
        console.log("");
        console.log("=== DIAGNOSIS COMPLETE ===");
    }
} 