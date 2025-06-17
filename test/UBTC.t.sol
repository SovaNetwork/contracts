// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import {Test, console} from "forge-std/Test.sol";
import {SovaBTC} from "../src/SovaBTC.sol";

contract UBTCTest is Test {
    SovaBTC public sovaBtc;

    function setUp() public {
        sovaBtc = new SovaBTC();
    }

    function testTokenName() public view {
        string memory expectedName = "Universal Bitcoin";
        assertEq(sovaBtc.name(), expectedName);
    }

    function testTokenSymbol() public view {
        string memory expectedSymbol = "sovaBTC";
        assertEq(sovaBtc.symbol(), expectedSymbol);
    }
}
