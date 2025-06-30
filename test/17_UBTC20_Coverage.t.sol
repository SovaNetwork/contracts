// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SovaBTC.sol";
import "./mocks/MockBTCPrecompile.sol";

/**
 * @title UBTC20 Coverage Tests
 * @notice Comprehensive tests to achieve 100% coverage for UBTC20.sol
 * @dev Tests focus on the missing deposit finalization path in _maybeFinalize
 */
contract UBTC20CoverageTest is Test {
    SovaBTC internal sova;
    MockBTCPrecompile internal precompile;

    address internal user = address(0xABCD);
    address internal user2 = address(0xDEAD);
    address internal recipient = address(0xBEEF);

    uint64 internal constant DEPOSIT_AMOUNT = 50_000; // sats
    uint64 internal constant WITHDRAW_AMOUNT = 30_000; // sats
    uint64 internal constant GAS_LIMIT = 10_000; // sats

    function setUp() public {
        // Deploy contracts
        sova = new SovaBTC();
        precompile = new MockBTCPrecompile();
        precompile.reset();

        // Configure mock precompile for deposits
        precompile.setMockValue(DEPOSIT_AMOUNT);
        precompile.setMockAddress("mockDepositAddress");

        vm.etch(address(0x999), address(precompile).code);

        // Mint initial balances for withdrawals
        sova.adminMint(user, 1_000_000);
        sova.adminMint(user2, 1_000_000);
    }

    // =============================================================================
    // MISSING COVERAGE: DEPOSIT FINALIZATION PATH
    // =============================================================================

    function test_DepositFinalizationPath() public {
        // This test covers the missing branch in _maybeFinalize:
        // if (_pendingDeposits[user].amount > 0) { ... }

        bytes memory signedTx = abi.encode(uint256(DEPOSIT_AMOUNT));

        // Setup mock transaction for deposit
        MockBTCPrecompile.BitcoinTx memory btcTx;
        btcTx.txid = keccak256("deposit_finalization_test");
        btcTx.outputs = new MockBTCPrecompile.Output[](1);
        btcTx.outputs[0] = MockBTCPrecompile.Output({addr: "mockDepositAddress", value: DEPOSIT_AMOUNT, script: ""});
        btcTx.inputs = new MockBTCPrecompile.Input[](1);
        btcTx.inputs[0] = MockBTCPrecompile.Input({
            prevTxHash: bytes32(uint256(0x1)),
            outputIndex: 0,
            scriptSig: "",
            witness: new bytes[](0)
        });
        btcTx.locktime = 0;

        // Mock all necessary precompile calls
        bytes memory decodeCallData = abi.encodePacked(hex"00000002", signedTx);
        vm.mockCall(address(0x999), decodeCallData, abi.encode(btcTx));

        bytes memory convertCallData = abi.encodePacked(hex"00000003", user);
        vm.mockCall(address(0x999), convertCallData, bytes("mockDepositAddress"));

        bytes memory broadcastCallData = abi.encodePacked(hex"00000001", signedTx);
        vm.mockCall(address(0x999), broadcastCallData, "");

        // Record initial state
        uint256 initialBalance = sova.balanceOf(user);
        uint256 initialTotalSupply = sova.totalSupply();

        // Step 1: Create pending deposit through depositBTC
        vm.prank(user);
        sova.depositBTC(DEPOSIT_AMOUNT, signedTx);

        // Verify pending deposit was created
        assertEq(sova.pendingDepositAmountOf(user), DEPOSIT_AMOUNT, "Should have pending deposit");
        assertGt(sova.pendingDepositTimestampOf(user), 0, "Should have pending deposit timestamp");

        // Balance and total supply should not change yet (pending state)
        assertEq(sova.balanceOf(user), initialBalance, "Balance should not change during pending state");
        assertEq(sova.totalSupply(), initialTotalSupply, "Total supply should not change during pending state");

        // Step 2: Finalize the deposit - this covers the missing branch!
        sova.finalize(user);

        // Verify deposit finalization effects
        assertEq(sova.pendingDepositAmountOf(user), 0, "Pending deposit should be cleared");
        assertEq(sova.pendingDepositTimestampOf(user), 0, "Pending deposit timestamp should be cleared");

        // Balance and total supply should increase after finalization
        assertEq(sova.balanceOf(user), initialBalance + DEPOSIT_AMOUNT, "Balance should increase after finalization");
        assertEq(
            sova.totalSupply(), initialTotalSupply + DEPOSIT_AMOUNT, "Total supply should increase after finalization"
        );
    }

    function test_BothDepositAndWithdrawalFinalization() public {
        // Test that _maybeFinalize can handle both deposits and withdrawals in sequence

        bytes memory signedTx = abi.encode(uint256(DEPOSIT_AMOUNT));

        // Setup mock for deposit
        MockBTCPrecompile.BitcoinTx memory btcTx;
        btcTx.txid = keccak256("combined_test");
        btcTx.outputs = new MockBTCPrecompile.Output[](1);
        btcTx.outputs[0] = MockBTCPrecompile.Output({addr: "mockDepositAddress", value: DEPOSIT_AMOUNT, script: ""});
        btcTx.inputs = new MockBTCPrecompile.Input[](1);
        btcTx.inputs[0] = MockBTCPrecompile.Input({
            prevTxHash: bytes32(uint256(0x1)),
            outputIndex: 0,
            scriptSig: "",
            witness: new bytes[](0)
        });
        btcTx.locktime = 0;

        // Mock precompile calls
        bytes memory decodeCallData = abi.encodePacked(hex"00000002", signedTx);
        vm.mockCall(address(0x999), decodeCallData, abi.encode(btcTx));

        bytes memory convertCallData = abi.encodePacked(hex"00000003", user);
        vm.mockCall(address(0x999), convertCallData, bytes("mockDepositAddress"));

        bytes memory broadcastCallData = abi.encodePacked(hex"00000001", signedTx);
        vm.mockCall(address(0x999), broadcastCallData, "");

        uint256 initialBalance = sova.balanceOf(user);
        uint256 initialTotalSupply = sova.totalSupply();

        // Step 1: Create pending deposit
        vm.prank(user);
        sova.depositBTC(DEPOSIT_AMOUNT, signedTx);

        // Verify pending deposit exists
        assertEq(sova.pendingDepositAmountOf(user), DEPOSIT_AMOUNT, "Should have pending deposit");

        // Step 2: Finalize deposit
        sova.finalize(user);

        // Verify deposit was finalized
        assertEq(sova.pendingDepositAmountOf(user), 0, "Pending deposit should be cleared");
        assertEq(sova.balanceOf(user), initialBalance + DEPOSIT_AMOUNT, "Balance should increase");

        // Step 3: Create pending withdrawal
        vm.prank(user);
        sova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, 1000, "btcAddress");

        // Verify pending withdrawal exists
        assertEq(sova.pendingWithdrawalAmountOf(user), WITHDRAW_AMOUNT + GAS_LIMIT, "Should have pending withdrawal");

        // Step 4: Finalize withdrawal
        sova.finalize(user);

        // Verify withdrawal was finalized
        assertEq(sova.pendingWithdrawalAmountOf(user), 0, "Pending withdrawal should be cleared");

        // Final balance should be: initial + deposit - withdrawal - gas
        uint256 expectedFinalBalance = initialBalance + DEPOSIT_AMOUNT - WITHDRAW_AMOUNT - GAS_LIMIT;
        assertEq(sova.balanceOf(user), expectedFinalBalance, "Final balance should be correct");
    }

    function test_FinalizationWithMultipleUsers() public {
        // Test finalization for different users to ensure user isolation

        bytes memory signedTx1 = abi.encode(uint256(DEPOSIT_AMOUNT));
        bytes memory signedTx2 = abi.encode(uint256(DEPOSIT_AMOUNT + 1000));

        // Setup mocks for user1 deposit
        MockBTCPrecompile.BitcoinTx memory btcTx1;
        btcTx1.txid = keccak256("user1_deposit");
        btcTx1.outputs = new MockBTCPrecompile.Output[](1);
        btcTx1.outputs[0] = MockBTCPrecompile.Output({addr: "mockDepositAddress", value: DEPOSIT_AMOUNT, script: ""});
        btcTx1.inputs = new MockBTCPrecompile.Input[](1);
        btcTx1.inputs[0] = MockBTCPrecompile.Input({
            prevTxHash: bytes32(uint256(0x1)),
            outputIndex: 0,
            scriptSig: "",
            witness: new bytes[](0)
        });
        btcTx1.locktime = 0;

        // Setup mocks for user2 deposit
        MockBTCPrecompile.BitcoinTx memory btcTx2;
        btcTx2.txid = keccak256("user2_deposit");
        btcTx2.outputs = new MockBTCPrecompile.Output[](1);
        btcTx2.outputs[0] =
            MockBTCPrecompile.Output({addr: "mockDepositAddress", value: DEPOSIT_AMOUNT + 1000, script: ""});
        btcTx2.inputs = new MockBTCPrecompile.Input[](1);
        btcTx2.inputs[0] = MockBTCPrecompile.Input({
            prevTxHash: bytes32(uint256(0x2)),
            outputIndex: 0,
            scriptSig: "",
            witness: new bytes[](0)
        });
        btcTx2.locktime = 0;

        // Mock calls for user1
        bytes memory decodeCallData1 = abi.encodePacked(hex"00000002", signedTx1);
        vm.mockCall(address(0x999), decodeCallData1, abi.encode(btcTx1));

        bytes memory convertCallData1 = abi.encodePacked(hex"00000003", user);
        vm.mockCall(address(0x999), convertCallData1, bytes("mockDepositAddress"));

        bytes memory broadcastCallData1 = abi.encodePacked(hex"00000001", signedTx1);
        vm.mockCall(address(0x999), broadcastCallData1, "");

        // Mock calls for user2
        bytes memory decodeCallData2 = abi.encodePacked(hex"00000002", signedTx2);
        vm.mockCall(address(0x999), decodeCallData2, abi.encode(btcTx2));

        bytes memory convertCallData2 = abi.encodePacked(hex"00000003", user2);
        vm.mockCall(address(0x999), convertCallData2, bytes("mockDepositAddress"));

        bytes memory broadcastCallData2 = abi.encodePacked(hex"00000001", signedTx2);
        vm.mockCall(address(0x999), broadcastCallData2, "");

        uint256 initialBalance1 = sova.balanceOf(user);
        uint256 initialBalance2 = sova.balanceOf(user2);

        // Both users create pending deposits
        vm.prank(user);
        sova.depositBTC(DEPOSIT_AMOUNT, signedTx1);

        vm.prank(user2);
        sova.depositBTC(DEPOSIT_AMOUNT + 1000, signedTx2);

        // Verify both have pending deposits
        assertEq(sova.pendingDepositAmountOf(user), DEPOSIT_AMOUNT, "User1 should have pending deposit");
        assertEq(sova.pendingDepositAmountOf(user2), DEPOSIT_AMOUNT + 1000, "User2 should have pending deposit");

        // Finalize only user1 - should not affect user2
        sova.finalize(user);

        assertEq(sova.pendingDepositAmountOf(user), 0, "User1 pending deposit should be cleared");
        assertEq(sova.pendingDepositAmountOf(user2), DEPOSIT_AMOUNT + 1000, "User2 pending deposit should remain");
        assertEq(sova.balanceOf(user), initialBalance1 + DEPOSIT_AMOUNT, "User1 balance should increase");
        assertEq(sova.balanceOf(user2), initialBalance2, "User2 balance should not change yet");

        // Finalize user2
        sova.finalize(user2);

        assertEq(sova.pendingDepositAmountOf(user2), 0, "User2 pending deposit should be cleared");
        assertEq(sova.balanceOf(user2), initialBalance2 + DEPOSIT_AMOUNT + 1000, "User2 balance should increase");
    }

    function test_FinalizationEdgeCases() public {
        // Test finalization when user has no pending transactions
        uint256 initialBalance = sova.balanceOf(user);
        uint256 initialTotalSupply = sova.totalSupply();

        // Should not revert or change state
        sova.finalize(user);

        assertEq(sova.balanceOf(user), initialBalance, "Balance should not change");
        assertEq(sova.totalSupply(), initialTotalSupply, "Total supply should not change");
        assertEq(sova.pendingDepositAmountOf(user), 0, "Should remain 0");
        assertEq(sova.pendingWithdrawalAmountOf(user), 0, "Should remain 0");
    }

    function test_FinalizationAccessControl() public {
        // Test that anyone can call finalize for any user (it's public)
        bytes memory signedTx = abi.encode(uint256(DEPOSIT_AMOUNT));

        // Setup mock
        MockBTCPrecompile.BitcoinTx memory btcTx;
        btcTx.txid = keccak256("access_control_test");
        btcTx.outputs = new MockBTCPrecompile.Output[](1);
        btcTx.outputs[0] = MockBTCPrecompile.Output({addr: "mockDepositAddress", value: DEPOSIT_AMOUNT, script: ""});
        btcTx.inputs = new MockBTCPrecompile.Input[](1);
        btcTx.inputs[0] = MockBTCPrecompile.Input({
            prevTxHash: bytes32(uint256(0x1)),
            outputIndex: 0,
            scriptSig: "",
            witness: new bytes[](0)
        });
        btcTx.locktime = 0;

        bytes memory decodeCallData = abi.encodePacked(hex"00000002", signedTx);
        vm.mockCall(address(0x999), decodeCallData, abi.encode(btcTx));

        bytes memory convertCallData = abi.encodePacked(hex"00000003", user);
        vm.mockCall(address(0x999), convertCallData, bytes("mockDepositAddress"));

        bytes memory broadcastCallData = abi.encodePacked(hex"00000001", signedTx);
        vm.mockCall(address(0x999), broadcastCallData, "");

        // User creates pending deposit
        vm.prank(user);
        sova.depositBTC(DEPOSIT_AMOUNT, signedTx);

        assertEq(sova.pendingDepositAmountOf(user), DEPOSIT_AMOUNT, "Should have pending deposit");

        // Different user can finalize for the original user
        vm.prank(user2);
        sova.finalize(user);

        assertEq(sova.pendingDepositAmountOf(user), 0, "Pending deposit should be cleared");
    }
}
