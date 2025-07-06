// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SovaBTC.sol";
import "./mocks/MockBTCPrecompile.sol";

/**
 * @title SovaBTC Coverage Tests
 * @notice Comprehensive tests to achieve 100% coverage for SovaBTC.sol
 * @dev Tests focus on uncovered branches, functions, and error paths
 */
contract SovaBTCCoverageTest is Test {
    SovaBTC internal sova;
    MockBTCPrecompile internal precompile;

    address internal user = address(0xABCD);
    address internal user2 = address(0xDEAD);
    address internal nonOwner = address(0xBEEF);

    uint64 internal constant DEPOSIT_AMOUNT = 50_000; // sats
    uint64 internal constant WITHDRAW_AMOUNT = 30_000; // sats
    uint64 internal constant GAS_LIMIT = 10_000; // sats

    function setUp() public {
        // Deploy contracts
        sova = new SovaBTC();
        precompile = new MockBTCPrecompile();
        precompile.reset();

        // Configure mock precompile
        precompile.setMockValue(DEPOSIT_AMOUNT);
        precompile.setMockAddress("mockDepositAddress");

        vm.etch(address(0x999), address(precompile).code);

        // Set test contract as minter and mint initial balances
        sova.setMinter(address(this));
        sova.adminMint(user, 1_000_000);
        sova.adminMint(user2, 1_000_000);
    }

    // =============================================================================
    // UNCOVERED VIEW FUNCTIONS
    // =============================================================================

    function test_isPaused() public {
        // Test initial state
        assertFalse(sova.isPaused(), "Contract should not be paused initially");

        // Test after pausing
        sova.pause();
        assertTrue(sova.isPaused(), "Contract should be paused after pause()");

        // Test after unpausing
        sova.unpause();
        assertFalse(sova.isPaused(), "Contract should not be paused after unpause()");
    }

    function test_isTransactionUsed() public {
        bytes32 testTxid = keccak256("test_txid");

        // Test unused txid
        assertFalse(sova.isTransactionUsed(testTxid), "Unused txid should return false");

        // Test with a random txid that will never be used
        bytes32 randomTxid = keccak256("random_unused_txid");
        assertFalse(sova.isTransactionUsed(randomTxid), "Random txid should return false");
    }

    function test_isTransactionUsedWithManualSetup() public {
        // Create a custom test that manually tracks txid usage
        bytes memory signedTx = abi.encode(uint256(DEPOSIT_AMOUNT));

        // Mock the decode to return a specific txid
        MockBTCPrecompile.BitcoinTx memory btcTx;
        btcTx.txid = keccak256("specific_test_txid");
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

        // Mock decode call
        bytes memory decodeCallData = abi.encodePacked(hex"00000002", signedTx);
        vm.mockCall(address(0x999), decodeCallData, abi.encode(btcTx));

        // Mock address conversion
        bytes memory convertCallData = abi.encodePacked(hex"00000003", user);
        vm.mockCall(address(0x999), convertCallData, bytes("mockDepositAddress"));

        // Mock broadcast (no return data needed)
        bytes memory broadcastCallData = abi.encodePacked(hex"00000001", signedTx);
        vm.mockCall(address(0x999), broadcastCallData, "");

        // Test before deposit
        assertFalse(sova.isTransactionUsed(btcTx.txid), "Txid should not be used initially");

        // Perform deposit
        vm.prank(user);
        sova.depositBTC(DEPOSIT_AMOUNT, signedTx);

        // Test after deposit
        assertTrue(sova.isTransactionUsed(btcTx.txid), "Txid should be marked as used after deposit");
    }

    // =============================================================================
    // UNCOVERED PAUSE/UNPAUSE FUNCTIONALITY
    // =============================================================================

    function test_unpauseFunction() public {
        // First pause the contract
        sova.pause();
        assertTrue(sova.isPaused(), "Contract should be paused");

        // Test unpause
        sova.unpause();
        assertFalse(sova.isPaused(), "Contract should be unpaused");
    }

    function test_whenPausedModifier() public {
        // The whenPaused modifier is only used by unpause()
        // First pause the contract
        sova.pause();

        // Now test unpause which uses whenPaused modifier
        sova.unpause();
        assertFalse(sova.isPaused(), "Contract should be unpaused after calling unpause");
    }

    function test_unpauseWhenNotPausedReverts() public {
        // Contract starts unpaused, calling unpause should revert
        assertFalse(sova.isPaused(), "Contract should not be paused initially");

        vm.expectRevert(SovaBTC.ContractNotPaused.selector);
        sova.unpause();
    }

    function test_unpauseEmitsEvent() public {
        // First pause
        sova.pause();

        // Test unpause emits event
        vm.expectEmit(true, false, false, false);
        emit SovaBTC.ContractUnpausedByOwner(address(this));
        sova.unpause();
    }

    function test_nonOwnerCannotUnpause() public {
        // First pause
        sova.pause();

        // Non-owner cannot unpause
        vm.prank(nonOwner);
        vm.expectRevert(); // Ownable revert
        sova.unpause();
    }

    // =============================================================================
    // UNCOVERED DEPOSIT ERROR PATHS
    // =============================================================================

    function test_depositBTC_TransactionAlreadyUsed() public {
        bytes memory signedTx = abi.encode(uint256(DEPOSIT_AMOUNT));

        // Setup mock similar to previous test
        MockBTCPrecompile.BitcoinTx memory btcTx;
        btcTx.txid = keccak256("duplicate_txid");
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

        // Mock all necessary calls
        bytes memory decodeCallData = abi.encodePacked(hex"00000002", signedTx);
        vm.mockCall(address(0x999), decodeCallData, abi.encode(btcTx));

        bytes memory convertCallData = abi.encodePacked(hex"00000003", user);
        vm.mockCall(address(0x999), convertCallData, bytes("mockDepositAddress"));

        bytes memory broadcastCallData = abi.encodePacked(hex"00000001", signedTx);
        vm.mockCall(address(0x999), broadcastCallData, "");

        // First deposit should succeed
        vm.prank(user);
        sova.depositBTC(DEPOSIT_AMOUNT, signedTx);

        // Second deposit with same txid should fail
        vm.prank(user2); // Different user to avoid pending deposit conflict
        vm.expectRevert(SovaBTC.TransactionAlreadyUsed.selector);
        sova.depositBTC(DEPOSIT_AMOUNT, signedTx);
    }

    function test_depositBTC_PendingDepositExists() public {
        bytes memory signedTx1 = abi.encode(uint256(DEPOSIT_AMOUNT));
        bytes memory signedTx2 = abi.encode(uint256(DEPOSIT_AMOUNT + 1000));

        // Setup first transaction
        MockBTCPrecompile.BitcoinTx memory btcTx1;
        btcTx1.txid = keccak256("txid_1");
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

        // Setup second transaction
        MockBTCPrecompile.BitcoinTx memory btcTx2;
        btcTx2.txid = keccak256("txid_2");
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

        // Mock calls for first transaction
        bytes memory decodeCallData1 = abi.encodePacked(hex"00000002", signedTx1);
        vm.mockCall(address(0x999), decodeCallData1, abi.encode(btcTx1));

        bytes memory convertCallData = abi.encodePacked(hex"00000003", user);
        vm.mockCall(address(0x999), convertCallData, bytes("mockDepositAddress"));

        bytes memory broadcastCallData1 = abi.encodePacked(hex"00000001", signedTx1);
        vm.mockCall(address(0x999), broadcastCallData1, "");

        // Mock calls for second transaction
        bytes memory decodeCallData2 = abi.encodePacked(hex"00000002", signedTx2);
        vm.mockCall(address(0x999), decodeCallData2, abi.encode(btcTx2));

        bytes memory broadcastCallData2 = abi.encodePacked(hex"00000001", signedTx2);
        vm.mockCall(address(0x999), broadcastCallData2, "");

        // First deposit creates pending deposit
        vm.prank(user);
        sova.depositBTC(DEPOSIT_AMOUNT, signedTx1);

        // Verify pending deposit exists
        assertGt(sova.pendingDepositAmountOf(user), 0, "Should have pending deposit");

        // Second deposit from same user should fail
        vm.prank(user);
        vm.expectRevert(SovaBTC.PendingDepositExists.selector);
        sova.depositBTC(DEPOSIT_AMOUNT + 1000, signedTx2);
    }

    // =============================================================================
    // UNCOVERED ADMIN FUNCTION BRANCHES
    // =============================================================================

    function test_setMinDepositAmount_InvalidBranch() public {
        uint64 currentMax = sova.maxDepositAmount();

        // Test setting min equal to max (should revert)
        vm.expectRevert(SovaBTC.InvalidDepositLimits.selector);
        sova.setMinDepositAmount(currentMax);

        // Test setting min greater than max (should revert)
        vm.expectRevert(SovaBTC.InvalidDepositLimits.selector);
        sova.setMinDepositAmount(currentMax + 1);
    }

    function test_setMaxDepositAmount_InvalidBranch() public {
        uint64 currentMin = sova.minDepositAmount();

        // Test setting max equal to min (should revert)
        vm.expectRevert(SovaBTC.InvalidDepositLimits.selector);
        sova.setMaxDepositAmount(currentMin);

        // Test setting max less than min (should revert)
        vm.expectRevert(SovaBTC.InvalidDepositLimits.selector);
        sova.setMaxDepositAmount(currentMin - 1);
    }

    function test_setMaxGasLimitAmount_ZeroBranch() public {
        // Test setting gas limit to zero (should revert)
        vm.expectRevert(SovaBTC.ZeroAmount.selector);
        sova.setMaxGasLimitAmount(0);
    }

    // =============================================================================
    // SUCCESSFUL PATHS FOR COMPLETE COVERAGE
    // =============================================================================

    function test_setMinDepositAmount_Success() public {
        uint64 oldAmount = sova.minDepositAmount();
        uint64 newAmount = oldAmount + 1000;

        // Ensure new amount is less than max
        require(newAmount < sova.maxDepositAmount(), "Test setup error");

        vm.expectEmit(true, true, false, false);
        emit SovaBTC.MinDepositAmountUpdated(oldAmount, newAmount);

        sova.setMinDepositAmount(newAmount);

        assertEq(sova.minDepositAmount(), newAmount, "Min deposit amount should be updated");
    }

    function test_setMaxDepositAmount_Success() public {
        uint64 oldAmount = sova.maxDepositAmount();
        uint64 newAmount = oldAmount + 1000;

        // Ensure new amount is greater than min
        require(newAmount > sova.minDepositAmount(), "Test setup error");

        vm.expectEmit(true, true, false, false);
        emit SovaBTC.MaxDepositAmountUpdated(oldAmount, newAmount);

        sova.setMaxDepositAmount(newAmount);

        assertEq(sova.maxDepositAmount(), newAmount, "Max deposit amount should be updated");
    }

    function test_setMaxGasLimitAmount_Success() public {
        uint64 oldAmount = sova.maxGasLimitAmount();
        uint64 newAmount = oldAmount + 1000;

        vm.expectEmit(true, true, false, false);
        emit SovaBTC.MaxGasLimitAmountUpdated(oldAmount, newAmount);

        sova.setMaxGasLimitAmount(newAmount);

        assertEq(sova.maxGasLimitAmount(), newAmount, "Max gas limit amount should be updated");
    }

    // =============================================================================
    // COMPREHENSIVE DEPOSIT FLOW TESTING
    // =============================================================================

    function test_depositBTC_CompleteSuccessFlow() public {
        bytes memory signedTx = abi.encode(uint256(DEPOSIT_AMOUNT));

        MockBTCPrecompile.BitcoinTx memory btcTx;
        btcTx.txid = keccak256("success_txid");
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

        // Mock all calls
        bytes memory decodeCallData = abi.encodePacked(hex"00000002", signedTx);
        vm.mockCall(address(0x999), decodeCallData, abi.encode(btcTx));

        bytes memory convertCallData = abi.encodePacked(hex"00000003", user);
        vm.mockCall(address(0x999), convertCallData, bytes("mockDepositAddress"));

        bytes memory broadcastCallData = abi.encodePacked(hex"00000001", signedTx);
        vm.mockCall(address(0x999), broadcastCallData, "");

        // Test successful deposit
        vm.expectEmit(true, true, false, false);
        emit SovaBTC.Deposit(btcTx.txid, DEPOSIT_AMOUNT);

        vm.prank(user);
        sova.depositBTC(DEPOSIT_AMOUNT, signedTx);

        // Verify state changes
        assertTrue(sova.isTransactionUsed(btcTx.txid), "Txid should be marked as used");
        assertEq(sova.pendingDepositAmountOf(user), DEPOSIT_AMOUNT, "Should have pending deposit");
    }

    // =============================================================================
    // EDGE CASES AND BOUNDARY TESTING
    // =============================================================================

    function test_pauseUnpauseCycle() public {
        // Test multiple pause/unpause cycles
        for (uint256 i = 0; i < 3; i++) {
            // Pause
            sova.pause();
            assertTrue(sova.isPaused(), "Should be paused");

            // Try to pause again (should revert)
            vm.expectRevert(SovaBTC.ContractPaused.selector);
            sova.pause();

            // Unpause
            sova.unpause();
            assertFalse(sova.isPaused(), "Should be unpaused");

            // Try to unpause again (should revert)
            vm.expectRevert(SovaBTC.ContractNotPaused.selector);
            sova.unpause();
        }
    }

    function test_accessControlForAllFunctions() public {
        // Test that non-owner cannot call admin functions
        vm.startPrank(nonOwner);

        vm.expectRevert(); // Ownable revert
        sova.setMinDepositAmount(20000);

        vm.expectRevert(); // Ownable revert
        sova.setMaxDepositAmount(200000000000);

        vm.expectRevert(); // Ownable revert
        sova.setMaxGasLimitAmount(60000000);

        vm.expectRevert(); // Ownable revert
        sova.pause();

        vm.expectRevert(); // Ownable revert
        sova.adminMint(user, 100000);

        vm.expectRevert(); // Ownable revert
        sova.adminBurn(user, 100000);

        vm.stopPrank();
    }

    // =============================================================================
    // EVENTS
    // =============================================================================

    // Events are already tested in individual functions above, but let's add
    // some additional event testing for completeness

    event Deposit(bytes32 txid, uint256 amount);
    event Withdraw(bytes32 txid, uint256 amount);
    event MinDepositAmountUpdated(uint64 oldAmount, uint64 newAmount);
    event MaxDepositAmountUpdated(uint64 oldAmount, uint64 newAmount);
    event MaxGasLimitAmountUpdated(uint64 oldAmount, uint64 newAmount);
    event ContractPausedByOwner(address indexed account);
    event ContractUnpausedByOwner(address indexed account);
}
