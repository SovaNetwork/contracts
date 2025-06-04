// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import {Test, console} from "forge-std/Test.sol";
import {UBTC} from "../src/UBTC.sol";

contract UBTCTest is Test {
    UBTC public ubtc;

    function setUp() public {
        ubtc = new UBTC();
    }

    function testTokenName() public view {
        string memory expectedName = "Universal Bitcoin";
        assertEq(ubtc.name(), expectedName);
    }

    function testTokenSymbol() public view {
        string memory expectedSymbol = "uBTC";
        assertEq(ubtc.symbol(), expectedSymbol);
    }
}
