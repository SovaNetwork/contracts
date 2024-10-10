// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test, console} from "forge-std/Test.sol";
import {uBTC} from "../src/uBTC.sol";

contract uBTCTest is Test {
    uBTC public ubtc;

    function setUp() public {
        ubtc = new uBTC();
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
