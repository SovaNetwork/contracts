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
        precompile.reset();
        vm.etch(address(0x999), address(precompile).code);

        // Mint some initial balance so transfers can be attempted even before finalize
        sova.adminMint(user, 1_000_000);
    }

    /* -------------------------------------------------------------------------- */
    /*                               2.1 transfer()                               */
    /* -------------------------------------------------------------------------- */


    /* -------------------------------------------------------------------------- */
    /*                             2.2 transferFrom()                             */
    /* -------------------------------------------------------------------------- */


    /* -------------------------------------------------------------------------- */
    /*                        2.3 transfers succeed after finalize                */
    /* -------------------------------------------------------------------------- */

} 