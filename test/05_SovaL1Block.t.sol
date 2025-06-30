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

    /* -------------------------------------------------------------------------- */
    /*                            4.3 Version function                            */
    /* -------------------------------------------------------------------------- */

    function testVersionReturnsCorrectString() public {
        string memory version = l1.version();
        assertEq(version, "0.1.0-beta.1", "Version should return correct semver string");
    }

    function testVersionIsPureFunction() public {
        // Test that version function can be called without state changes
        string memory version1 = l1.version();
        string memory version2 = l1.version();
        assertEq(version1, version2, "Version should be deterministic");
    }

    /* -------------------------------------------------------------------------- */
    /*                            Additional edge cases                           */
    /* -------------------------------------------------------------------------- */

    function testSetBitcoinBlockDataWithZeroValues() public {
        vm.prank(SYSTEM_ACCOUNT);
        l1.setBitcoinBlockData(0, bytes32(0));

        // Verify zero values are stored correctly
        uint256 heightSlot = uint256(vm.load(address(l1), bytes32(uint256(0))));
        uint64 storedHeight = uint64(heightSlot);
        assertEq(storedHeight, 0, "Should store zero height");

        bytes32 storedHash = vm.load(address(l1), bytes32(uint256(1)));
        assertEq(storedHash, bytes32(0), "Should store zero hash");
    }

    function testSetBitcoinBlockDataWithMaxValues() public {
        uint64 maxHeight = type(uint64).max;
        bytes32 maxHash = bytes32(type(uint256).max);

        vm.prank(SYSTEM_ACCOUNT);
        l1.setBitcoinBlockData(maxHeight, maxHash);

        // Verify max values are stored correctly
        uint256 heightSlot = uint256(vm.load(address(l1), bytes32(uint256(0))));
        uint64 storedHeight = uint64(heightSlot);
        assertEq(storedHeight, maxHeight, "Should store max uint64 height");

        bytes32 storedHash = vm.load(address(l1), bytes32(uint256(1)));
        assertEq(storedHash, maxHash, "Should store max bytes32 hash");
    }

    function testMultipleUpdatesOverwritePreviousData() public {
        vm.prank(SYSTEM_ACCOUNT);
        l1.setBitcoinBlockData(100, bytes32(uint256(0x111)));

        vm.prank(SYSTEM_ACCOUNT);
        l1.setBitcoinBlockData(200, bytes32(uint256(0x222)));

        // Should only have the latest values
        uint256 heightSlot = uint256(vm.load(address(l1), bytes32(uint256(0))));
        uint64 storedHeight = uint64(heightSlot);
        assertEq(storedHeight, 200, "Should store latest height");

        bytes32 storedHash = vm.load(address(l1), bytes32(uint256(1)));
        assertEq(storedHash, bytes32(uint256(0x222)), "Should store latest hash");
    }

    function testLastUpdatedBlockTracksCorrectly() public {
        // Set initial block number
        vm.roll(100);
        vm.prank(SYSTEM_ACCOUNT);
        l1.setBitcoinBlockData(1000, bytes32(uint256(0x100)));

        uint256 storedBlock1 = uint256(vm.load(address(l1), bytes32(uint256(2))));
        assertEq(storedBlock1, 100, "Should track first update block");

        // Change block number and update again
        vm.roll(200);
        vm.prank(SYSTEM_ACCOUNT);
        l1.setBitcoinBlockData(2000, bytes32(uint256(0x200)));

        uint256 storedBlock2 = uint256(vm.load(address(l1), bytes32(uint256(2))));
        assertEq(storedBlock2, 200, "Should track second update block");
    }
}
