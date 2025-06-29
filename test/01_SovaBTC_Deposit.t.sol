// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SovaBTC.sol";
import "./mocks/MockBTCPrecompile.sol";

contract SovaBTCDepositTest is Test {
    SovaBTC internal sova;
    MockBTCPrecompile internal precompile;

    address internal user = address(0xBEEF);

    function setUp() public {
        // Deploy core contract and mock precompile
        sova = new SovaBTC();
        precompile = new MockBTCPrecompile();

        // Etch mock code at the precompile address used by the library (0x999)
        vm.etch(address(0x999), address(precompile).code);
    }

    /* -------------------------------------------------------------------------- */
    /*                               1.1 Happy path                               */
    /* -------------------------------------------------------------------------- */

    function testDepositCreatesPendingAndEmitsEvent() public {
        uint64 amount = 50_000; // sats
        bytes memory signedTx = abi.encode(uint256(amount)); // embedded for mock decode

        // Expect the Deposit event with the mocked txid (0x1)
        vm.expectEmit(true, false, false, true);
        emit SovaBTC.Deposit(bytes32(uint256(amount)), amount);

        vm.prank(user);
        sova.depositBTC(amount, signedTx);

        // Pending amount correctly recorded
        assertEq(sova.pendingDepositAmountOf(user), amount);
        // txid marked as used
        assertTrue(sova.isTransactionUsed(bytes32(uint256(amount))));
    }

    /* -------------------------------------------------------------------------- */
    /*                           1.3 Finalize mints tokens                        */
    /* -------------------------------------------------------------------------- */

    function testFinalizeClearsPendingAndMints() public {
        uint64 amount = 75_000; // sats
        bytes memory signedTx = abi.encode(uint256(amount));

        vm.prank(user);
        sova.depositBTC(amount, signedTx);

        // Call finalize (anyone can trigger)
        sova.finalize(user);

        // Pending cleared & balance minted
        assertEq(sova.pendingDepositAmountOf(user), 0);
        assertEq(sova.balanceOf(user), amount);
    }

    /* -------------------------------------------------------------------------- */
    /*                    1.5 & 1.6 Deposit amount bounds checks                  */
    /* -------------------------------------------------------------------------- */

    function testDepositBelowMinimumReverts() public {
        uint64 belowMin = sova.minDepositAmount() - 1;
        bytes memory signedTx = abi.encode(uint256(belowMin));

        vm.expectRevert(SovaBTC.DepositBelowMinimum.selector);
        vm.prank(user);
        sova.depositBTC(belowMin, signedTx);
    }

    function testDepositAboveMaximumReverts() public {
        uint64 aboveMax = sova.maxDepositAmount() + 1;
        bytes memory signedTx = abi.encode(uint256(aboveMax));

        vm.expectRevert(SovaBTC.DepositAboveMaximum.selector);
        vm.prank(user);
        sova.depositBTC(aboveMax, signedTx);
    }
} 