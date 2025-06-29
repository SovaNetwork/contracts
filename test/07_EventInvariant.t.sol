// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/TokenWrapper.sol";
import "../src/SovaBTC.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./mocks/MockERC20BTC.sol";

contract EventAndInvariantTest is Test {
    SovaBTC public sova;
    TokenWrapper public wrapper;
    MockERC20BTC public t1; // 6-dec
    MockERC20BTC public t2; // 18-dec

    address public admin = address(0xA11CE);
    address public alice = address(0xBEEF);
    address public bob = address(0xCAFE);

    function setUp() public {
        sova = new SovaBTC();
        TokenWrapper impl = new TokenWrapper();
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), "");
        wrapper = TokenWrapper(address(proxy));
        vm.prank(admin);
        wrapper.initialize(address(sova));
        sova.transferOwnership(address(wrapper));

        t1 = new MockERC20BTC("USDToken", "USDT", 6);
        t2 = new MockERC20BTC("LongDecimals", "LDEC", 18);
        vm.prank(admin);
        vm.expectEmit(true, false, false, true);
        emit TokenWrapper.AllowedTokenAdded(address(t1));
        wrapper.addAllowedToken(address(t1));
        vm.prank(admin);
        wrapper.addAllowedToken(address(t2));

        // Mint balances
        t1.mint(alice, 1e9); // 1000 USDT (~100k sats)
        t2.mint(bob, 1e21); // large amount

        vm.startPrank(alice);
        t1.approve(address(wrapper), type(uint256).max);
        vm.stopPrank();
        vm.startPrank(bob);
        t2.approve(address(wrapper), type(uint256).max);
        vm.stopPrank();
    }

    /* -------------------------------------------------------------------------- */
    /*                           6.1 Event payload check                          */
    /* -------------------------------------------------------------------------- */

    function testAllowedTokenAddedEventPayload() public {
        // add new token and verify event data matches
        MockERC20BTC token = new MockERC20BTC("Fake", "FAK", 8);
        vm.prank(admin);
        vm.expectEmit(true, false, false, true);
        emit TokenWrapper.AllowedTokenAdded(address(token));
        wrapper.addAllowedToken(address(token));
    }

    function testTokenWrappedEventPayload() public {
        uint256 amount = 1e6; // 1 USDT
        uint256 expectedSats = 1e8;

        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit TokenWrapper.TokenWrapped(alice, address(t1), amount, expectedSats);
        wrapper.deposit(address(t1), amount);
    }

    /* -------------------------------------------------------------------------- */
    /*                          6.3 Fuzz decimal conversion                       */
    /* -------------------------------------------------------------------------- */

    function testFuzzDecimalConversion(uint8 dec, uint64 sats) public {
        vm.assume(dec >= 1 && dec <= 30);
        vm.assume(sats >= 10000 && sats <= 1e6); // Ensure above minDepositSatoshi

        MockERC20BTC token = new MockERC20BTC("Rand", "RND", dec);
        vm.prank(admin);
        wrapper.addAllowedToken(address(token));

        // Calculate the token amount needed to get exactly `sats` sovaBTC
        uint256 tokenAmount;
        if (dec > 8) {
            uint256 factor = 10 ** (dec - 8);
            tokenAmount = sats * factor;
        } else if (dec < 8) {
            uint256 factor = 10 ** (8 - dec);
            tokenAmount = sats / factor;
            if (tokenAmount == 0) tokenAmount = 1;
            sats = uint64(tokenAmount * factor); // adjust expected
        } else {
            tokenAmount = sats;
        }

        // Ensure tokenAmount meets minimum requirements
        vm.assume(tokenAmount > 0);
        
        token.mint(alice, tokenAmount);
        vm.prank(alice);
        token.approve(address(wrapper), tokenAmount);
        vm.prank(alice);
        wrapper.deposit(address(token), tokenAmount);

        assertEq(sova.balanceOf(alice), sats);
    }
} 