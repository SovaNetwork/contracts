// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "./mocks/MockBTCPrecompile.sol";

/// @title Comprehensive MockBTCPrecompile Tests
/// @notice Complete test suite covering all conditional branches in MockBTCPrecompile.sol
contract MockBTCPrecompileTest is Test {
    MockBTCPrecompile public mock;
    
    // Constants matching the precompile selectors
    bytes4 private constant BROADCAST_BYTES = 0x00000001;
    bytes4 private constant DECODE_BYTES = 0x00000002;
    bytes4 private constant ADDRESS_CONVERT_LEADING_BYTES = 0x00000003;
    bytes4 private constant UBTC_SIGN_TX_BYTES = 0x00000004;
    
    function setUp() public {
        mock = new MockBTCPrecompile();
    }

    // =============================================================================
    // BASIC FUNCTIONALITY TESTS - BASELINE COVERAGE
    // =============================================================================
    
    function test_InitialState() public view {
        assertEq(mock.mockOutputs(), 1, "Default outputs should be 1");
        assertEq(mock.mockValue(), 0, "Default value should be 0");
        assertEq(mock.mockInputs(), 1, "Default inputs should be 1");
        assertEq(mock.mockLocktime(), 0, "Default locktime should be 0");
        assertEq(mock.mockAddress(), "", "Default address should be empty");
        assertEq(mock.precompileFails(), false, "Default precompileFails should be false");
    }

    function test_SetterFunctions() public {
        mock.setMockOutputs(3);
        mock.setMockValue(50000);
        mock.setMockInputs(2);
        mock.setMockLocktime(123456);
        mock.setMockAddress("bc1qtest");
        mock.setPrecompileFails(true);
        
        assertEq(mock.mockOutputs(), 3, "Should set outputs");
        assertEq(mock.mockValue(), 50000, "Should set value");
        assertEq(mock.mockInputs(), 2, "Should set inputs");
        assertEq(mock.mockLocktime(), 123456, "Should set locktime");
        assertEq(mock.mockAddress(), "bc1qtest", "Should set address");
        assertEq(mock.precompileFails(), true, "Should set precompileFails");
    }

    function test_ResetFunction() public {
        // Set non-default values
        mock.setMockOutputs(5);
        mock.setMockValue(99999);
        mock.setMockInputs(3);
        mock.setMockLocktime(999999);
        mock.setMockAddress("custom");
        mock.setPrecompileFails(true);
        
        // Reset
        mock.reset();
        
        // Verify reset to defaults
        assertEq(mock.mockOutputs(), 1, "Reset: outputs should be 1");
        assertEq(mock.mockValue(), 0, "Reset: value should be 0");
        assertEq(mock.mockInputs(), 1, "Reset: inputs should be 1");
        assertEq(mock.mockLocktime(), 0, "Reset: locktime should be 0");
        assertEq(mock.mockAddress(), "", "Reset: address should be empty");
        assertEq(mock.precompileFails(), false, "Reset: precompileFails should be false");
    }

    // =============================================================================
    // BRANCH COVERAGE TESTS - ALL 7 CONDITIONAL BRANCHES
    // =============================================================================

    // DEBUG: Test selector extraction
    function test_DebugSelectorExtraction() public {
        mock.setPrecompileFails(false);
        
        // Test raw call with exact selector format
        uint256 amount = 9999;
        bytes memory callData = abi.encodePacked(DECODE_BYTES, abi.encode(amount));
        
        (bool success, bytes memory result) = address(mock).call(callData);
        emit log_named_bytes("CallData", callData);
        emit log_named_string("Success", success ? "true" : "false");
        emit log_named_uint("Result length", result.length);
        
        assertTrue(success, "Debug call should succeed");
        assertTrue(result.length > 0, "Should return data for DECODE_BYTES");
    }

    // Test manual assembly selector extraction
    function test_ManualSelectorExtraction() public {
        // Test the same assembly logic that MockBTCPrecompile uses
        bytes memory data = hex"00000002000000000000000000000000000000000000000000000000000000000000270f";
        
        bytes4 extractedSelector;
        uint256 rawResult;
        assembly {
            // Load from data + 32 (skip 32-byte length prefix) and then shift right to get first 4 bytes
            let rawData := mload(add(data, 0x20))
            extractedSelector := shr(224, rawData)
            rawResult := rawData
        }
        
        emit log_named_bytes("Manual extracted selector", abi.encodePacked(extractedSelector));
        emit log_named_bytes("Expected DECODE_BYTES", abi.encodePacked(DECODE_BYTES));
        emit log_named_uint("Raw mload result", rawResult);
        
        // Test different approach - let's see what the raw bytes look like
        bytes4 directCast = bytes4(data);
        emit log_named_bytes("Direct cast bytes4(data)", abi.encodePacked(directCast));
        
        assertTrue(directCast == DECODE_BYTES, "Direct cast should match DECODE_BYTES");
    }

    // Test with minimal direct calldata
    function test_MinimalDirectCalldata() public {
        mock.setPrecompileFails(false);
        
        // Use direct hex bytes instead of abi.encodePacked
        bytes memory callData = hex"00000002" hex"000000000000000000000000000000000000000000000000000000000000270f";
        
        (bool success, bytes memory result) = address(mock).call(callData);
        emit log_named_bytes("Direct CallData", callData);
        emit log_named_string("Success", success ? "true" : "false");
        emit log_named_uint("Result length", result.length);
        
        assertTrue(success, "Direct call should succeed");
        assertTrue(result.length > 0, "Should return data for direct DECODE_BYTES");
    }

    // Test BROADCAST_BYTES path (should return empty but successfully)
    function test_BroadcastDirectCalldata() public {
        mock.setPrecompileFails(false);
        
        // Use BROADCAST_BYTES selector
        bytes memory callData = hex"00000001" hex"deadbeef";
        
        (bool success, bytes memory result) = address(mock).call(callData);
        emit log_named_bytes("Broadcast CallData", callData);
        emit log_named_string("Success", success ? "true" : "false");
        emit log_named_uint("Result length", result.length);
        
        assertTrue(success, "Broadcast call should succeed");
        assertEq(result.length, 0, "Broadcast should return empty bytes (which is success)");
    }

    // BRANCH 1: precompileFails = true
    function test_PrecompileFailsTrue() public {
        mock.setPrecompileFails(true);
        
        bytes memory callData = abi.encodePacked(BROADCAST_BYTES, hex"deadbeef");
        
        // Should revert when precompileFails is true
        (bool success, ) = address(mock).call(callData);
        assertFalse(success, "Call should fail when precompileFails is true");
    }

    // BRANCH 2: selector == BROADCAST_BYTES
    function test_BroadcastBytesPath() public {
        mock.setPrecompileFails(false); // Ensure it doesn't fail globally
        
        bytes memory callData = abi.encodePacked(BROADCAST_BYTES, hex"deadbeef");
        
        (bool success, bytes memory result) = address(mock).call(callData);
        assertTrue(success, "Broadcast call should succeed");
        assertEq(result.length, 0, "Broadcast should return empty bytes");
    }

    // BRANCH 3: selector == DECODE_BYTES
    function test_DecodeBytesPath() public {
        mock.setPrecompileFails(false);
        
        uint256 amount = 10000;
        // Create calldata: selector (4 bytes) + amount (32 bytes)
        bytes memory callData = abi.encodePacked(DECODE_BYTES, abi.encode(amount));
        
        (bool success, bytes memory result) = address(mock).call(callData);
        assertTrue(success, "Decode call should succeed");
        assertTrue(result.length > 0, "Decode should return transaction data");
        
        // Decode the returned BitcoinTx
        MockBTCPrecompile.BitcoinTx memory btcTx = abi.decode(result, (MockBTCPrecompile.BitcoinTx));
        assertEq(btcTx.outputs.length, 1, "Should have 1 output by default");
        assertEq(btcTx.inputs.length, 1, "Should have 1 input by default");
        assertEq(btcTx.outputs[0].value, amount, "Output value should match amount");
        assertEq(btcTx.locktime, 0, "Locktime should be 0 by default");
    }

    // BRANCH 4: selector == ADDRESS_CONVERT_LEADING_BYTES
    function test_AddressConvertPath() public {
        mock.setPrecompileFails(false);
        
        address testAddress = makeAddr("testUser");
        bytes memory callData = abi.encodePacked(ADDRESS_CONVERT_LEADING_BYTES, testAddress);
        
        (bool success, bytes memory result) = address(mock).call(callData);
        assertTrue(success, "Address convert call should succeed");
        
        string memory returnedAddress = string(result);
        assertEq(returnedAddress, "mockDepositAddress", "Should return mock deposit address");
    }

    // BRANCH 5: selector == UBTC_SIGN_TX_BYTES
    function test_UBTCSignTxPath() public {
        mock.setPrecompileFails(false);
        
        bytes memory callData = abi.encodePacked(UBTC_SIGN_TX_BYTES, hex"deadbeef");
        
        (bool success, bytes memory result) = address(mock).call(callData);
        assertTrue(success, "UBTC sign tx call should succeed");
        
        bytes32 txid = abi.decode(result, (bytes32));
        assertEq(txid, bytes32(uint256(0xabc123)), "Should return expected txid");
    }

    // BRANCH 6: mockOutputs > 0 (in _encodeTx)
    function test_MockOutputsGreaterThanZero() public {
        mock.setPrecompileFails(false);
        mock.setMockOutputs(2); // Set > 0
        mock.setMockValue(25000);
        mock.setMockAddress("custom-address");
        
        uint256 amount = 10000;
        bytes memory callData = abi.encodePacked(DECODE_BYTES, abi.encode(amount));
        
        (bool success, bytes memory result) = address(mock).call(callData);
        assertTrue(success, "Should succeed");
        
        MockBTCPrecompile.BitcoinTx memory btcTx = abi.decode(result, (MockBTCPrecompile.BitcoinTx));
        assertEq(btcTx.outputs.length, 2, "Should have 2 outputs");
        assertEq(btcTx.outputs[0].addr, "custom-address", "Should use custom address");
        assertEq(btcTx.outputs[0].value, 25000, "Should use mockValue when set");
    }

    // BRANCH 6: mockOutputs = 0 (in _encodeTx) 
    function test_MockOutputsZero() public {
        mock.setPrecompileFails(false);
        mock.setMockOutputs(0); // Set to 0 to skip the if condition
        
        uint256 amount = 10000;
        bytes memory callData = abi.encodePacked(DECODE_BYTES, abi.encode(amount));
        
        (bool success, bytes memory result) = address(mock).call(callData);
        assertTrue(success, "Should succeed");
        
        MockBTCPrecompile.BitcoinTx memory btcTx = abi.decode(result, (MockBTCPrecompile.BitcoinTx));
        assertEq(btcTx.outputs.length, 0, "Should have 0 outputs");
    }

    // BRANCH 7: mockInputs > 0 (in _encodeTx)
    function test_MockInputsGreaterThanZero() public {
        mock.setPrecompileFails(false);
        mock.setMockInputs(3); // Set > 0
        
        uint256 amount = 10000;
        bytes memory callData = abi.encodePacked(DECODE_BYTES, abi.encode(amount));
        
        (bool success, bytes memory result) = address(mock).call(callData);
        assertTrue(success, "Should succeed");
        
        MockBTCPrecompile.BitcoinTx memory btcTx = abi.decode(result, (MockBTCPrecompile.BitcoinTx));
        assertEq(btcTx.inputs.length, 3, "Should have 3 inputs");
        assertEq(btcTx.inputs[0].prevTxHash, bytes32(uint256(0x1)), "Should have expected prevTxHash");
        assertEq(btcTx.inputs[0].outputIndex, 0, "Should have expected outputIndex");
    }

    // BRANCH 7: mockInputs = 0 (in _encodeTx)
    function test_MockInputsZero() public {
        mock.setPrecompileFails(false);
        mock.setMockInputs(0); // Set to 0 to skip the if condition
        
        uint256 amount = 10000;
        bytes memory callData = abi.encodePacked(DECODE_BYTES, abi.encode(amount));
        
        (bool success, bytes memory result) = address(mock).call(callData);
        assertTrue(success, "Should succeed");
        
        MockBTCPrecompile.BitcoinTx memory btcTx = abi.decode(result, (MockBTCPrecompile.BitcoinTx));
        assertEq(btcTx.inputs.length, 0, "Should have 0 inputs");
    }

    // =============================================================================
    // EDGE CASES AND INTEGRATION TESTS
    // =============================================================================

    function test_UnknownSelector() public {
        mock.setPrecompileFails(false);
        
        bytes4 unknownSelector = 0x12345678;
        bytes memory callData = abi.encodePacked(unknownSelector, hex"deadbeef");
        
        (bool success, bytes memory result) = address(mock).call(callData);
        assertTrue(success, "Unknown selector should succeed");
        assertEq(result.length, 0, "Unknown selector should return empty bytes");
    }

    function test_EmptyCallData() public {
        mock.setPrecompileFails(false);
        
        bytes memory callData = "";
        
        (bool success, bytes memory result) = address(mock).call(callData);
        assertTrue(success, "Empty calldata should succeed");
        assertEq(result.length, 0, "Empty calldata should return empty bytes");
    }

    function test_ShortCallData() public {
        mock.setPrecompileFails(false);
        
        bytes memory callData = hex"12"; // Less than 4 bytes
        
        (bool success, bytes memory result) = address(mock).call(callData);
        assertTrue(success, "Short calldata should succeed");
        assertEq(result.length, 0, "Short calldata should return empty bytes");
    }

    function test_DecodeWithMockValueZero() public {
        mock.setPrecompileFails(false);
        mock.setMockValue(0); // Use amount from calldata instead
        
        uint256 amount = 30000;
        bytes memory callData = abi.encodePacked(DECODE_BYTES, abi.encode(amount));
        
        (bool success, bytes memory result) = address(mock).call(callData);
        assertTrue(success, "Should succeed");
        
        MockBTCPrecompile.BitcoinTx memory btcTx = abi.decode(result, (MockBTCPrecompile.BitcoinTx));
        assertEq(btcTx.outputs[0].value, amount, "Should use amount from calldata when mockValue is 0");
    }

    function test_DecodeWithCustomAddressEmpty() public {
        mock.setPrecompileFails(false);
        mock.setMockAddress(""); // Empty address should use default
        
        uint256 amount = 10000;
        bytes memory callData = abi.encodePacked(DECODE_BYTES, abi.encode(amount));
        
        (bool success, bytes memory result) = address(mock).call(callData);
        assertTrue(success, "Should succeed");
        
        MockBTCPrecompile.BitcoinTx memory btcTx = abi.decode(result, (MockBTCPrecompile.BitcoinTx));
        assertEq(btcTx.outputs[0].addr, "mockDepositAddress", "Should use default address when mockAddress is empty");
    }

    function test_AllBranchesCombined() public {
        // Test that doesn't fail globally
        mock.setPrecompileFails(false);
        
        // Test all selector paths in sequence
        bytes memory broadcastData = abi.encodePacked(BROADCAST_BYTES, hex"deadbeef");
        bytes memory decodeData = abi.encodePacked(DECODE_BYTES, abi.encode(uint256(15000)));
        bytes memory convertData = abi.encodePacked(ADDRESS_CONVERT_LEADING_BYTES, makeAddr("user"));
        bytes memory signData = abi.encodePacked(UBTC_SIGN_TX_BYTES, hex"deadbeef");
        
        (bool success1, ) = address(mock).call(broadcastData);
        (bool success2, ) = address(mock).call(decodeData);
        (bool success3, ) = address(mock).call(convertData);
        (bool success4, ) = address(mock).call(signData);
        
        assertTrue(success1, "Broadcast should succeed");
        assertTrue(success2, "Decode should succeed");
        assertTrue(success3, "Convert should succeed");
        assertTrue(success4, "Sign should succeed");
    }

    // Test DECODE_BYTES with forced mockValue (bypass amount extraction)
    function test_DecodeWithForcedMockValue() public {
        mock.setPrecompileFails(false);
        mock.setMockValue(12345); // Force non-zero mockValue to bypass assembly amount extraction
        
        // Use DECODE_BYTES selector with any data
        bytes memory callData = hex"00000002" hex"deadbeef";
        
        (bool success, bytes memory result) = address(mock).call(callData);
        emit log_named_bytes("Decode CallData", callData);
        emit log_named_string("Success", success ? "true" : "false");
        emit log_named_uint("Result length", result.length);
        
        assertTrue(success, "Decode call should succeed");
        assertTrue(result.length > 0, "Should return data when mockValue is set");
    }

    // Test ADDRESS_CONVERT_LEADING_BYTES (simpler path, no _encodeTx)
    function test_AddressConvertDirectCalldata() public {
        mock.setPrecompileFails(false);
        
        // Use ADDRESS_CONVERT_LEADING_BYTES selector
        bytes memory callData = hex"00000003" hex"deadbeef";
        
        (bool success, bytes memory result) = address(mock).call(callData);
        emit log_named_bytes("Address CallData", callData);
        emit log_named_string("Success", success ? "true" : "false");
        emit log_named_uint("Result length", result.length);
        if (result.length > 0) {
            emit log_named_string("Result", string(result));
        }
        
        assertTrue(success, "Address convert call should succeed");
        assertTrue(result.length > 0, "Should return address data");
        assertEq(string(result), "mockDepositAddress", "Should return expected address");
    }

    // Test all selectors systematically
    function test_AllSelectorsSystematic() public {
        mock.setPrecompileFails(false);
        
        // Test all 4 selectors
        bytes4[4] memory selectors = [
            bytes4(0x00000001), // BROADCAST_BYTES
            bytes4(0x00000002), // DECODE_BYTES  
            bytes4(0x00000003), // ADDRESS_CONVERT_LEADING_BYTES
            bytes4(0x00000004)  // UBTC_SIGN_TX_BYTES
        ];
        
        string[4] memory selectorNames = [
            "BROADCAST_BYTES",
            "DECODE_BYTES", 
            "ADDRESS_CONVERT_LEADING_BYTES",
            "UBTC_SIGN_TX_BYTES"
        ];
        
        for (uint i = 0; i < 4; i++) {
            bytes memory callData = abi.encodePacked(selectors[i], hex"deadbeef");
            (bool success, bytes memory result) = address(mock).call(callData);
            
            emit log_named_string("Testing selector", selectorNames[i]);
            emit log_named_bytes("Selector bytes", abi.encodePacked(selectors[i]));
            emit log_named_string("Success", success ? "true" : "false");
            emit log_named_uint("Result length", result.length);
            
            assertTrue(success, string(abi.encodePacked("Selector ", selectorNames[i], " should succeed")));
        }
    }
} 