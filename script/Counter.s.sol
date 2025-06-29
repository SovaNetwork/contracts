// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SovaBTC} from "../src/SovaBTC.sol";

contract CounterScript is Script {
    SovaBTC public sovaBtc;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        sovaBtc = new SovaBTC();

        vm.stopBroadcast();
    }
}
