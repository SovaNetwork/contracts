// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import {Script, console} from "forge-std/Script.sol";
import {UBTC} from "../src/UBTC.sol";

contract CounterScript is Script {
    UBTC public ubtc;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        ubtc = new UBTC();

        vm.stopBroadcast();
    }
}
