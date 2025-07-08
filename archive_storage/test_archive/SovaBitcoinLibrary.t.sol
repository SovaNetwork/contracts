// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/lib/SovaBitcoin.sol";

/// @title SovaBitcoin Library Test Wrapper
/// @notice Wrapper contract to expose internal SovaBitcoin library functions for testing
contract SovaBitcoinTestWrapper {
    using SovaBitcoin for *;

    // Expose the version function
    function version() external pure returns (string memory) {
        return SovaBitcoin.version();
    }

    // Expose broadcastBitcoinTx
    function broadcastBitcoinTx(bytes memory signedTx) external {
        SovaBitcoin.broadcastBitcoinTx(signedTx);
    }

    // Expose convertToBtcAddress
    function convertToBtcAddress(address addr) external returns (bytes memory) {
        return SovaBitcoin.convertToBtcAddress(addr);
    }

    // Expose decodeBitcoinTx
    function decodeBitcoinTx(bytes memory signedTx) external view returns (SovaBitcoin.BitcoinTx memory) {
        return SovaBitcoin.decodeBitcoinTx(signedTx);
    }

    // Expose isValidDeposit
    function isValidDeposit(bytes memory signedTx, uint256 amount) external returns (SovaBitcoin.BitcoinTx memory) {
        return SovaBitcoin.isValidDeposit(signedTx, amount);
    }

    // Helper to test precompile calls directly
    function testPrecompileCall(bytes memory data) external returns (bool success, bytes memory returndata) {
        return SovaBitcoin.BTC_PRECOMPILE.call(data);
    }
}

/// @title Comprehensive SovaBitcoin Library Tests
/// @notice Complete test suite covering all conditional branches
contract SovaBitcoinLibraryTest is Test {
    SovaBitcoinTestWrapper public wrapper;

    address public user = makeAddr("user");

    function setUp() public {
        // Deploy wrapper contract
        wrapper = new SovaBitcoinTestWrapper();
    }

    // =============================================================================
    // ORIGINAL WORKING TESTS - FOR BASELINE COVERAGE
    // =============================================================================

    function test_VersionFunction() public view {
        string memory version = wrapper.version();
        assertEq(version, "0.1.0-beta.1", "Version should match expected value");
    }

    function test_LibraryConstants() public pure {
        assertEq(SovaBitcoin.BTC_PRECOMPILE, address(0x999), "BTC_PRECOMPILE address should be correct");
        assertEq(
            SovaBitcoin.SOVA_L1_BLOCK_ADDRESS,
            0x2100000000000000000000000000000000000015,
            "SOVA_L1_BLOCK_ADDRESS should be correct"
        );
        assertEq(SovaBitcoin.UBTC_ADDRESS, 0x2100000000000000000000000000000000000020, "UBTC_ADDRESS should be correct");

        assertEq(SovaBitcoin.BROADCAST_BYTES, bytes4(0x00000001), "BROADCAST_BYTES selector should be correct");
        assertEq(SovaBitcoin.DECODE_BYTES, bytes4(0x00000002), "DECODE_BYTES selector should be correct");
        assertEq(
            SovaBitcoin.ADDRESS_CONVERT_LEADING_BYTES,
            bytes4(0x00000003),
            "ADDRESS_CONVERT_LEADING_BYTES selector should be correct"
        );
        assertEq(SovaBitcoin.UBTC_SIGN_TX_BYTES, bytes4(0x00000004), "UBTC_SIGN_TX_BYTES selector should be correct");
    }

    function test_BroadcastBitcoinTxSuccess() public {
        bytes memory signedTx = hex"deadbeef12345678";
        bytes memory callData = abi.encodePacked(SovaBitcoin.BROADCAST_BYTES, signedTx);

        // Mock successful broadcast call
        vm.mockCall(SovaBitcoin.BTC_PRECOMPILE, callData, "");

        // Should not revert on success
        wrapper.broadcastBitcoinTx(signedTx);
        assertTrue(true, "Broadcast should succeed");
    }

    function test_ConvertToBtcAddressSuccess() public {
        bytes memory callData = abi.encodePacked(SovaBitcoin.ADDRESS_CONVERT_LEADING_BYTES, user);

        // Mock successful convert call - return raw bytes, not abi.encode
        vm.mockCall(SovaBitcoin.BTC_PRECOMPILE, callData, bytes("bc1qtest"));

        bytes memory result = wrapper.convertToBtcAddress(user);

        assertEq(string(result), "bc1qtest", "Should return Bitcoin address");
    }

    function test_DirectPrecompileCallSuccess() public {
        bytes memory testData = abi.encodePacked(SovaBitcoin.BROADCAST_BYTES, hex"abcdef");

        // Mock successful precompile call
        vm.mockCall(SovaBitcoin.BTC_PRECOMPILE, testData, "");

        (bool success, bytes memory returndata) = wrapper.testPrecompileCall(testData);

        assertTrue(success, "Direct precompile call should succeed");
        assertTrue(true, "Precompile call completed successfully");
    }

    function test_BroadcastBitcoinTxWithEmptyData() public {
        bytes memory signedTx = hex"";
        bytes memory callData = abi.encodePacked(SovaBitcoin.BROADCAST_BYTES, signedTx);

        // Mock successful broadcast call
        vm.mockCall(SovaBitcoin.BTC_PRECOMPILE, callData, "");

        // Should handle empty transaction data
        wrapper.broadcastBitcoinTx(signedTx);
        assertTrue(true, "Should handle empty data");
    }

    function test_BroadcastBitcoinTxWithLargeData() public {
        // Test with large transaction data
        bytes memory signedTx = new bytes(100);
        for (uint256 i = 0; i < 100; i++) {
            signedTx[i] = bytes1(uint8(i % 256));
        }

        bytes memory callData = abi.encodePacked(SovaBitcoin.BROADCAST_BYTES, signedTx);

        // Mock successful broadcast call
        vm.mockCall(SovaBitcoin.BTC_PRECOMPILE, callData, "");

        wrapper.broadcastBitcoinTx(signedTx);
        assertTrue(true, "Should handle large data");
    }

    function test_ConvertToBtcAddressWithDifferentUsers() public {
        address user1 = makeAddr("user1");
        address user2 = makeAddr("user2");

        // Mock calls for both users
        bytes memory callData1 = abi.encodePacked(SovaBitcoin.ADDRESS_CONVERT_LEADING_BYTES, user1);
        bytes memory callData2 = abi.encodePacked(SovaBitcoin.ADDRESS_CONVERT_LEADING_BYTES, user2);

        vm.mockCall(SovaBitcoin.BTC_PRECOMPILE, callData1, bytes("bc1qtest1"));

        vm.mockCall(SovaBitcoin.BTC_PRECOMPILE, callData2, bytes("bc1qtest2"));

        bytes memory result1 = wrapper.convertToBtcAddress(user1);
        bytes memory result2 = wrapper.convertToBtcAddress(user2);

        // Both should succeed
        assertTrue(result1.length > 0, "User1 should get result");
        assertTrue(result2.length > 0, "User2 should get result");
    }

    // =============================================================================
    // NEW TESTS TO COVER MISSING CONDITIONAL BRANCHES
    // =============================================================================

    // BRANCH 1: decodeBitcoinTx failure case
    function test_DecodeBitcoinTxFailure() public {
        bytes memory signedTx = hex"deadbeef";
        bytes memory callData = abi.encodePacked(SovaBitcoin.DECODE_BYTES, signedTx);

        // Mock the precompile call to revert
        vm.mockCallRevert(SovaBitcoin.BTC_PRECOMPILE, callData, "Decode failure");

        vm.expectRevert(SovaBitcoin.PrecompileCallFailed.selector);
        wrapper.decodeBitcoinTx(signedTx);
    }

    // BRANCH 2: convertToBtcAddress failure case
    function test_ConvertToBtcAddressFailure() public {
        bytes memory callData = abi.encodePacked(SovaBitcoin.ADDRESS_CONVERT_LEADING_BYTES, user);

        // Mock the precompile call to revert
        vm.mockCallRevert(SovaBitcoin.BTC_PRECOMPILE, callData, "Convert failure");

        vm.expectRevert(SovaBitcoin.PrecompileCallFailed.selector);
        wrapper.convertToBtcAddress(user);
    }

    // BRANCH 3: broadcastBitcoinTx failure case
    function test_BroadcastBitcoinTxFailure() public {
        bytes memory signedTx = hex"deadbeef";
        bytes memory callData = abi.encodePacked(SovaBitcoin.BROADCAST_BYTES, signedTx);

        // Mock the precompile call to revert
        vm.mockCallRevert(SovaBitcoin.BTC_PRECOMPILE, callData, "Broadcast failure");

        vm.expectRevert(SovaBitcoin.PrecompileCallFailed.selector);
        wrapper.broadcastBitcoinTx(signedTx);
    }

    // BRANCH 4: isValidDeposit - invalid outputs count (< 1)
    function test_IsValidDepositInvalidOutputsCountZero() public {
        bytes memory signedTx = hex"deadbeef";
        bytes memory callData = abi.encodePacked(SovaBitcoin.DECODE_BYTES, signedTx);

        // Create transaction with 0 outputs
        SovaBitcoin.BitcoinTx memory btcTx;
        btcTx.txid = keccak256("test");
        btcTx.outputs = new SovaBitcoin.Output[](0); // 0 outputs - invalid
        btcTx.inputs = new SovaBitcoin.Input[](1);
        btcTx.inputs[0] = SovaBitcoin.Input({
            prevTxHash: keccak256("prev"),
            outputIndex: 0,
            scriptSig: hex"47",
            witness: new bytes[](0)
        });
        btcTx.locktime = 0;

        // Mock successful decode returning invalid transaction
        vm.mockCall(SovaBitcoin.BTC_PRECOMPILE, callData, abi.encode(btcTx));

        vm.expectRevert(SovaBitcoin.InvalidDeposit.selector);
        wrapper.isValidDeposit(signedTx, 10000);
    }

    // BRANCH 4: isValidDeposit - invalid outputs count (> 3)
    function test_IsValidDepositInvalidOutputsCountTooMany() public {
        bytes memory signedTx = hex"deadbeef";
        bytes memory callData = abi.encodePacked(SovaBitcoin.DECODE_BYTES, signedTx);

        // Create transaction with 4 outputs
        SovaBitcoin.BitcoinTx memory btcTx;
        btcTx.txid = keccak256("test");
        btcTx.outputs = new SovaBitcoin.Output[](4); // 4 outputs - invalid (>3)
        for (uint256 i = 0; i < 4; i++) {
            btcTx.outputs[i] = SovaBitcoin.Output({addr: "bc1qtest", value: 10000, script: hex"76a914"});
        }
        btcTx.inputs = new SovaBitcoin.Input[](1);
        btcTx.inputs[0] = SovaBitcoin.Input({
            prevTxHash: keccak256("prev"),
            outputIndex: 0,
            scriptSig: hex"47",
            witness: new bytes[](0)
        });
        btcTx.locktime = 0;

        // Mock successful decode returning invalid transaction
        vm.mockCall(SovaBitcoin.BTC_PRECOMPILE, callData, abi.encode(btcTx));

        vm.expectRevert(SovaBitcoin.InvalidDeposit.selector);
        wrapper.isValidDeposit(signedTx, 10000);
    }

    // BRANCH 5: isValidDeposit - invalid amount
    function test_IsValidDepositInvalidAmount() public {
        bytes memory signedTx = hex"deadbeef";
        bytes memory callData = abi.encodePacked(SovaBitcoin.DECODE_BYTES, signedTx);

        // Create transaction with wrong amount
        SovaBitcoin.BitcoinTx memory btcTx;
        btcTx.txid = keccak256("test");
        btcTx.outputs = new SovaBitcoin.Output[](1);
        btcTx.outputs[0] = SovaBitcoin.Output({addr: "bc1qtest", value: 5000, script: hex"76a914"}); // Wrong amount
        btcTx.inputs = new SovaBitcoin.Input[](1);
        btcTx.inputs[0] = SovaBitcoin.Input({
            prevTxHash: keccak256("prev"),
            outputIndex: 0,
            scriptSig: hex"47",
            witness: new bytes[](0)
        });
        btcTx.locktime = 0;

        // Mock successful decode returning invalid transaction
        vm.mockCall(SovaBitcoin.BTC_PRECOMPILE, callData, abi.encode(btcTx));

        vm.expectRevert(SovaBitcoin.InvalidAmount.selector);
        wrapper.isValidDeposit(signedTx, 10000); // expecting 10000, but tx has 5000
    }

    // BRANCH 6: isValidDeposit - insufficient inputs
    function test_IsValidDepositInsufficientInputs() public {
        bytes memory signedTx = hex"deadbeef";
        bytes memory callData = abi.encodePacked(SovaBitcoin.DECODE_BYTES, signedTx);

        // Create transaction with 0 inputs
        SovaBitcoin.BitcoinTx memory btcTx;
        btcTx.txid = keccak256("test");
        btcTx.outputs = new SovaBitcoin.Output[](1);
        btcTx.outputs[0] = SovaBitcoin.Output({addr: "bc1qtest", value: 10000, script: hex"76a914"});
        btcTx.inputs = new SovaBitcoin.Input[](0); // No inputs - invalid
        btcTx.locktime = 0;

        // Mock successful decode returning invalid transaction
        vm.mockCall(SovaBitcoin.BTC_PRECOMPILE, callData, abi.encode(btcTx));

        vm.expectRevert(SovaBitcoin.InsufficientInput.selector);
        wrapper.isValidDeposit(signedTx, 10000);
    }

    // BRANCH 7: isValidDeposit - invalid locktime
    function test_IsValidDepositInvalidLocktime() public {
        bytes memory signedTx = hex"deadbeef";
        bytes memory callData = abi.encodePacked(SovaBitcoin.DECODE_BYTES, signedTx);

        // Create transaction with invalid locktime
        SovaBitcoin.BitcoinTx memory btcTx;
        btcTx.txid = keccak256("test");
        btcTx.outputs = new SovaBitcoin.Output[](1);
        btcTx.outputs[0] = SovaBitcoin.Output({addr: "bc1qtest", value: 10000, script: hex"76a914"});
        btcTx.inputs = new SovaBitcoin.Input[](1);
        btcTx.inputs[0] = SovaBitcoin.Input({
            prevTxHash: keccak256("prev"),
            outputIndex: 0,
            scriptSig: hex"47",
            witness: new bytes[](0)
        });
        btcTx.locktime = 123456; // Invalid locktime (should be 0)

        // Mock successful decode returning invalid transaction
        vm.mockCall(SovaBitcoin.BTC_PRECOMPILE, callData, abi.encode(btcTx));

        vm.expectRevert(SovaBitcoin.InvalidLocktime.selector);
        wrapper.isValidDeposit(signedTx, 10000);
    }

    // BRANCH 8: isValidDeposit - invalid output address
    function test_IsValidDepositInvalidOutputAddress() public {
        bytes memory signedTx = hex"deadbeef";

        // Mock decode call
        bytes memory decodeCallData = abi.encodePacked(SovaBitcoin.DECODE_BYTES, signedTx);
        SovaBitcoin.BitcoinTx memory btcTx;
        btcTx.txid = keccak256("test");
        btcTx.outputs = new SovaBitcoin.Output[](1);
        btcTx.outputs[0] = SovaBitcoin.Output({addr: "bc1qwrong", value: 10000, script: hex"76a914"}); // Wrong address
        btcTx.inputs = new SovaBitcoin.Input[](1);
        btcTx.inputs[0] = SovaBitcoin.Input({
            prevTxHash: keccak256("prev"),
            outputIndex: 0,
            scriptSig: hex"47",
            witness: new bytes[](0)
        });
        btcTx.locktime = 0;

        vm.mockCall(SovaBitcoin.BTC_PRECOMPILE, decodeCallData, abi.encode(btcTx));

        // Mock convertToBtcAddress call - return raw bytes, not abi.encode
        bytes memory convertCallData = abi.encodePacked(SovaBitcoin.ADDRESS_CONVERT_LEADING_BYTES, user);
        vm.mockCall(SovaBitcoin.BTC_PRECOMPILE, convertCallData, bytes("bc1qtest"));

        vm.prank(user); // Set msg.sender for address conversion
        vm.expectRevert(abi.encodeWithSelector(SovaBitcoin.InvalidOutput.selector, "bc1qwrong", "bc1qtest"));
        wrapper.isValidDeposit(signedTx, 10000);
    }

    // SUCCESS CASE for isValidDeposit to ensure the happy path works
    function test_IsValidDepositSuccess() public {
        bytes memory signedTx = hex"deadbeef";

        // Mock decode call
        bytes memory decodeCallData = abi.encodePacked(SovaBitcoin.DECODE_BYTES, signedTx);
        SovaBitcoin.BitcoinTx memory btcTx;
        btcTx.txid = keccak256("test");
        btcTx.outputs = new SovaBitcoin.Output[](1);
        btcTx.outputs[0] = SovaBitcoin.Output({addr: "bc1qtest", value: 10000, script: hex"76a914"});
        btcTx.inputs = new SovaBitcoin.Input[](1);
        btcTx.inputs[0] = SovaBitcoin.Input({
            prevTxHash: keccak256("prev"),
            outputIndex: 0,
            scriptSig: hex"47",
            witness: new bytes[](0)
        });
        btcTx.locktime = 0;

        vm.mockCall(SovaBitcoin.BTC_PRECOMPILE, decodeCallData, abi.encode(btcTx));

        // Mock convertToBtcAddress call - return raw bytes, not abi.encode
        bytes memory convertCallData = abi.encodePacked(SovaBitcoin.ADDRESS_CONVERT_LEADING_BYTES, user);
        vm.mockCall(SovaBitcoin.BTC_PRECOMPILE, convertCallData, bytes("bc1qtest"));

        vm.prank(user); // Set msg.sender for address conversion
        SovaBitcoin.BitcoinTx memory result = wrapper.isValidDeposit(signedTx, 10000);

        assertEq(result.outputs.length, 1, "Should have 1 output");
        assertEq(result.inputs.length, 1, "Should have 1 input");
        assertEq(result.outputs[0].value, 10000, "Output value should match");
        assertEq(result.locktime, 0, "Locktime should be 0");
    }
}
