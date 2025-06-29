// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SovaBTC.sol";
import "./mocks/MockBTCPrecompile.sol";

contract SovaBTCWithdrawTest is Test {
    SovaBTC internal sova;
    MockBTCPrecompile internal precompile;

    address internal user = address(0xABCD);

    uint64 internal constant WITHDRAW_AMOUNT = 60_000; // sats
    uint64 internal constant GAS_LIMIT = 10_000; // sats

    function setUp() public {
        // Deploy contracts
        sova = new SovaBTC();
        precompile = new MockBTCPrecompile();
        vm.etch(address(0x999), address(precompile).code);

        // Mint uBTC to user for withdrawal tests (owner is this contract)
        sova.adminMint(user, WITHDRAW_AMOUNT + GAS_LIMIT);
    }

    /* -------------------------------------------------------------------------- */
    /*                               1.2 Happy path                               */
    /* -------------------------------------------------------------------------- */

    function testWithdrawCreatesPendingAndEmitsEvent() public {
        vm.prank(user);
        vm.expectEmit(true, false, false, true);
        emit SovaBTC.Withdraw(bytes32(uint256(0xabc123)), WITHDRAW_AMOUNT);
        sova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, 1000, "destBtcAddress");

        // Assert pending withdrawal recorded (amount + gas)
        uint256 expected = WITHDRAW_AMOUNT + GAS_LIMIT;
        assertEq(sova.pendingWithdrawalAmountOf(user), expected);
    }

    /* -------------------------------------------------------------------------- */
    /*                         1.4 Finalize burns & clears                         */
    /* -------------------------------------------------------------------------- */

    function testFinalizeClearsPendingWithdrawalAndBurns() public {
        vm.prank(user);
        sova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, 1000, "destBtcAddress");

        uint256 totalBefore = sova.totalSupply();

        // finalize
        sova.finalize(user);

        uint256 expectedBurn = WITHDRAW_AMOUNT + GAS_LIMIT;
        assertEq(sova.pendingWithdrawalAmountOf(user), 0);
        assertEq(sova.balanceOf(user), 0);
        assertEq(sova.totalSupply(), totalBefore - expectedBurn);
    }

    /* -------------------------------------------------------------------------- */
    /*         1.7 TransactionAlreadyUsed & 1.8 PendingDepositExists              */
    /* -------------------------------------------------------------------------- */

    function testReusingTxidReverts() public {
        // First deposit (records txid 0x1 in mock)
        bytes memory signedTx = abi.encode(uint256(70_000));
        vm.prank(user);
        sova.depositBTC(70_000, signedTx);

        address other = address(0xDEAD);
        vm.prank(other);
        vm.expectRevert(SovaBTC.TransactionAlreadyUsed.selector);
        sova.depositBTC(70_000, signedTx); // same signedTx → same txid
    }

    function testPendingDepositExistsReverts() public {
        bytes memory signedTx = abi.encode(uint256(80_000));
        vm.prank(user);
        sova.depositBTC(80_000, signedTx);

        // attempt second deposit with different txid but existing pending deposit
        bytes memory signedTx2 = abi.encode(uint256(81_000));
        vm.prank(user);
        vm.expectRevert(SovaBTC.PendingDepositExists.selector);
        sova.depositBTC(81_000, signedTx2);
    }

    /* -------------------------------------------------------------------------- */
    /*              1.9 ZeroAmount / 1.10 ZeroGasLimit / 1.11 TooHigh             */
    /* -------------------------------------------------------------------------- */

    function testWithdrawZeroAmountReverts() public {
        vm.prank(user);
        vm.expectRevert(SovaBTC.ZeroAmount.selector);
        sova.withdraw(0, GAS_LIMIT, 1000, "dest");
    }

    function testWithdrawZeroGasLimitReverts() public {
        vm.prank(user);
        vm.expectRevert(SovaBTC.ZeroGasLimit.selector);
        sova.withdraw(WITHDRAW_AMOUNT, 0, 1000, "dest");
    }

    function testGasLimitTooHighReverts() public {
        uint64 tooHigh = sova.maxGasLimitAmount() + 1;
        vm.prank(user);
        vm.expectRevert(SovaBTC.GasLimitTooHigh.selector);
        sova.withdraw(WITHDRAW_AMOUNT, tooHigh, 1000, "dest");
    }

    /* -------------------------------------------------------------------------- */
    /*                          1.12 InsufficientAmount                            */
    /* -------------------------------------------------------------------------- */

    function testInsufficientAmountReverts() public {
        // user only has WITHDRAW_AMOUNT + GAS_LIMIT, so ask to withdraw more
        vm.prank(user);
        vm.expectRevert(SovaBTC.InsufficientAmount.selector);
        sova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT + 1, 1000, "dest");
    }

    /* -------------------------------------------------------------------------- */
    /*                      1.13 PendingWithdrawalExists                          */
    /* -------------------------------------------------------------------------- */

    function testPendingWithdrawalExistsReverts() public {
        vm.prank(user);
        sova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, 1000, "dest");

        vm.prank(user);
        vm.expectRevert(SovaBTC.PendingWithdrawalExists.selector);
        sova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, 1000, "dest");
    }

    /* -------------------------------------------------------------------------- */
    /*                       1.14/1.15 Pause & Unpause                            */
    /* -------------------------------------------------------------------------- */

    function testPauseBlocksDepositAndWithdraw() public {
        // Owner pauses (owner == this test contract)
        sova.pause();

        bytes memory signedTx = abi.encode(uint256(90_000));

        vm.prank(user);
        vm.expectRevert(SovaBTC.ContractPaused.selector);
        sova.depositBTC(90_000, signedTx);

        vm.prank(user);
        vm.expectRevert(SovaBTC.ContractPaused.selector);
        sova.withdraw(WITHDRAW_AMOUNT, GAS_LIMIT, 1000, "dest");
    }

    function testUnpauseRestoresFunctionality() public {
        sova.pause();
        sova.unpause();

        bytes memory signedTx = abi.encode(uint256(100_000));
        vm.prank(user);
        sova.depositBTC(100_000, signedTx);

        // should succeed without revert
        vm.prank(user);
        sova.withdraw(10_000, 5_000, 1000, "dest");
    }

    /* -------------------------------------------------------------------------- */
    /*                         1.16 Admin setter bounds                           */
    /* -------------------------------------------------------------------------- */

    function testInvalidDepositLimitsRevert() public {
        uint64 currentMax = sova.maxDepositAmount();
        uint64 invalidMin = currentMax; // equal to max → invalid

        vm.expectRevert(SovaBTC.InvalidDepositLimits.selector);
        sova.setMinDepositAmount(invalidMin);

        uint64 currentMin = sova.minDepositAmount();
        uint64 invalidMax = currentMin; // equal to min → invalid

        vm.expectRevert(SovaBTC.InvalidDepositLimits.selector);
        sova.setMaxDepositAmount(invalidMax);
    }

    function testSetMaxGasLimitAmountZeroReverts() public {
        vm.expectRevert(SovaBTC.ZeroAmount.selector);
        sova.setMaxGasLimitAmount(0);
    }
} 