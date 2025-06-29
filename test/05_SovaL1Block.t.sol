// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SovaL1Block.sol";

contract SovaL1BlockTest is Test {
    SovaL1Block internal l1;

    // Copied constant from contract
    address internal constant SYSTEM_ACCOUNT = 0xDeaDDEaDDeAdDeAdDEAdDEaddeAddEAdDEAd0001;

    function setUp() public {
        l1 = new SovaL1Block();
    }

    /* -------------------------------------------------------------------------- */
    /*                               4.1 Access ctrl                              */
    /* -------------------------------------------------------------------------- */

    function testNonSystemAddressReverts() public {
        vm.prank(address(0xBEEF));
        vm.expectRevert("SovaL1Block: only the system account can set block data");
        l1.setBitcoinBlockData(100, bytes32(uint256(0x1)));
    }

    /* -------------------------------------------------------------------------- */
    /*                         4.2 System account succeeds                         */
    /* -------------------------------------------------------------------------- */

    function testSystemAccountSetsDataAndReadable() public {
        uint64 targetHeight = 650_000;
        bytes32 targetHash = bytes32(uint256(0xabc123));

        // Set a known block number for reproducibility
        vm.roll(42);

        vm.prank(SYSTEM_ACCOUNT);
        l1.setBitcoinBlockData(targetHeight, targetHash);

        // Read storage slots directly since variables are private
        uint256 heightSlot = uint256(vm.load(address(l1), bytes32(uint256(0))));
        uint64 storedHeight = uint64(heightSlot);
        assertEq(storedHeight, targetHeight);

        bytes32 storedHash = vm.load(address(l1), bytes32(uint256(1)));
        assertEq(storedHash, targetHash);

        uint256 storedUpdatedBlock = uint256(vm.load(address(l1), bytes32(uint256(2))));
        assertEq(storedUpdatedBlock, block.number); // should equal 42
    }
} 