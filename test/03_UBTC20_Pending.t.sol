// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SovaBTC.sol";
import "../src/UBTC20.sol";
import "./mocks/MockBTCPrecompile.sol";

/// @title UBTC20 Pending Transactions Tests
/// @notice Covers section 2 of TESTSTOADD (pending deposit/withdraw transfer guards).
contract UBTC20PendingTest is Test {
    SovaBTC internal sova;
    MockBTCPrecompile internal precompile;

    address internal user = address(0xFEED);
    address internal spender = address(0xDEAD);
    address internal recipient = address(0xBEEF);

    uint64 internal constant DEPOSIT_AMOUNT = 55_000; // sats

    function setUp() public {
        sova = new SovaBTC();
        precompile = new MockBTCPrecompile();
        vm.etch(address(0x999), address(precompile).code);

        // Mint some initial balance so transfers can be attempted even before finalize
        sova.adminMint(user, 1_000_000);
    }

    /* -------------------------------------------------------------------------- */
    /*                               2.1 transfer()                               */
    /* -------------------------------------------------------------------------- */

    function testTransferRevertsDuringPendingDeposit() public {
        bytes memory signedTx = abi.encode(uint256(DEPOSIT_AMOUNT));

        vm.prank(user);
        sova.depositBTC(DEPOSIT_AMOUNT, signedTx);

        // Attempt transfer should revert with PendingTransactionExists
        vm.prank(user);
        vm.expectRevert(UBTC20.PendingTransactionExists.selector);
        sova.transfer(recipient, 10_000);
    }

    /* -------------------------------------------------------------------------- */
    /*                             2.2 transferFrom()                             */
    /* -------------------------------------------------------------------------- */

    function testTransferFromRevertsDuringPendingDeposit() public {
        bytes memory signedTx = abi.encode(uint256(DEPOSIT_AMOUNT));

        vm.startPrank(user);
        sova.depositBTC(DEPOSIT_AMOUNT, signedTx);
        sova.approve(spender, 20_000);
        vm.stopPrank();

        vm.prank(spender);
        vm.expectRevert(UBTC20.PendingTransactionExists.selector);
        sova.transferFrom(user, recipient, 10_000);
    }

    /* -------------------------------------------------------------------------- */
    /*                        2.3 transfers succeed after finalize                */
    /* -------------------------------------------------------------------------- */

    function testTransfersAfterFinalizeSucceed() public {
        // Perform deposit to create pending state first
        bytes memory signedTx = abi.encode(uint256(DEPOSIT_AMOUNT));
        vm.prank(user);
        sova.depositBTC(DEPOSIT_AMOUNT, signedTx);

        // Finalize deposit (anyone can call)
        sova.finalize(user);

        // transfer should now succeed
        vm.prank(user);
        sova.transfer(recipient, 15_000);
        assertEq(sova.balanceOf(recipient), 15_000);

        // transferFrom should also succeed
        vm.startPrank(user);
        sova.approve(spender, 5_000);
        vm.stopPrank();

        vm.prank(spender);
        sova.transferFrom(user, recipient, 5_000);
        assertEq(sova.balanceOf(recipient), 20_000);
    }
} 