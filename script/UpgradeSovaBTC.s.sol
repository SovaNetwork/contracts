// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script, console} from "forge-std/Script.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "../src/wrapper/SovaBTCToken.sol";
import "../src/wrapper/SovaBTCWrapper.sol";
import "../src/staking/DualTokenStaking.sol";

contract UpgradeSovaBTC is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Upgrading contracts with deployer:", deployer);

        // Load existing deployment addresses
        address sovaBTCProxy = vm.envAddress("SOVABTC_TOKEN_PROXY");
        address wrapperProxy = vm.envAddress("SOVABTC_WRAPPER_PROXY");
        address stakingProxy = vm.envAddress("DUAL_TOKEN_STAKING_PROXY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy new implementations
        console.log("Deploying new SovaBTC Token implementation...");
        SovaBTCToken newSovaBTCImpl = new SovaBTCToken();

        console.log("Deploying new SovaBTC Wrapper implementation...");
        SovaBTCWrapper newWrapperImpl = new SovaBTCWrapper();

        console.log("Deploying new Dual Token Staking implementation...");
        DualTokenStaking newStakingImpl = new DualTokenStaking();

        // Upgrade contracts
        console.log("Upgrading SovaBTC Token...");
        SovaBTCToken(sovaBTCProxy).upgradeToAndCall(
            address(newSovaBTCImpl),
            ""
        );

        console.log("Upgrading SovaBTC Wrapper...");
        SovaBTCWrapper(wrapperProxy).upgradeToAndCall(
            address(newWrapperImpl),
            ""
        );

        console.log("Upgrading Dual Token Staking...");
        DualTokenStaking(stakingProxy).upgradeToAndCall(
            address(newStakingImpl),
            ""
        );

        vm.stopBroadcast();

        console.log("\n=== UPGRADE COMPLETE ===");
        console.log("New SovaBTC Token implementation:", address(newSovaBTCImpl));
        console.log("New SovaBTC Wrapper implementation:", address(newWrapperImpl));
        console.log("New Dual Token Staking implementation:", address(newStakingImpl));
        console.log("========================\n");
    }
}