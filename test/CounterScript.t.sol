// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../script/Counter.s.sol";
import "../src/SovaBTC.sol";

/// @title Counter Script Tests
/// @notice Tests for the Counter deployment script
contract CounterScriptTest is Test {
    CounterScript public script;

    function setUp() public {
        script = new CounterScript();
    }

    function test_SetUp() public {
        // Test that setUp function can be called without reverting
        script.setUp();

        // Since setUp is empty, we just verify it doesn't revert
        assertTrue(true, "setUp should complete without reverting");
    }

    function test_Run() public {
        // Test the run function
        script.run();

        // Verify that sovaBtc was deployed
        SovaBTC deployedContract = script.sovaBtc();
        assertTrue(address(deployedContract) != address(0), "SovaBTC should be deployed");

        // Verify it's actually a SovaBTC contract by checking some basic properties
        assertEq(deployedContract.name(), "Sova Wrapped Bitcoin", "Contract should have correct name");
        assertEq(deployedContract.symbol(), "sovaBTC", "Contract should have correct symbol");
        assertEq(deployedContract.decimals(), 8, "Contract should have 8 decimals");
    }

    function test_RunMultipleTimes() public {
        // Test that run can be called multiple times (each creates a new contract)
        script.run();
        SovaBTC firstDeployment = script.sovaBtc();

        script.run();
        SovaBTC secondDeployment = script.sovaBtc();

        // Verify both deployments are valid but different
        assertTrue(address(firstDeployment) != address(0), "First deployment should be valid");
        assertTrue(address(secondDeployment) != address(0), "Second deployment should be valid");
        assertTrue(address(firstDeployment) != address(secondDeployment), "Deployments should be different contracts");
    }

    function test_DeployedContractFunctionality() public {
        // Test that the deployed contract works correctly
        script.run();
        SovaBTC deployedContract = script.sovaBtc();

        // Test basic functionality of the deployed contract
        assertEq(deployedContract.totalSupply(), 0, "Initial total supply should be 0");
        assertEq(deployedContract.minDepositAmount(), 10000, "Should have correct min deposit amount");
        assertEq(deployedContract.maxDepositAmount(), 100000000000, "Should have correct max deposit amount");
        assertEq(deployedContract.maxGasLimitAmount(), 50000000, "Should have correct max gas limit");
    }
}
