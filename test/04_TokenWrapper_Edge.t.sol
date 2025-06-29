// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/TokenWrapper.sol";
import "../src/SovaBTC.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./mocks/MockERC20BTC.sol";

contract TokenWrapperEdgeTest is Test {
    SovaBTC internal sovaBTC;
    TokenWrapper internal wrapper;
    MockERC20BTC internal wbtc; // 8 decimals
    MockERC20BTC internal lbtc; // 18 decimals
    MockERC20BTC internal usdt; // 6 decimals

    address internal admin = address(0xA11CE);
    address internal user = address(0xCAFEBABE);

    function setUp() public {
        // Deploy core contracts
        sovaBTC = new SovaBTC();
        TokenWrapper impl = new TokenWrapper();
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), "");
        wrapper = TokenWrapper(address(proxy));

        vm.prank(admin);
        wrapper.initialize(address(sovaBTC));
        sovaBTC.transferOwnership(address(wrapper));

        // Deploy tokens
        wbtc = new MockERC20BTC("Wrapped Bitcoin", "WBTC", 8);
        lbtc = new MockERC20BTC("Liquid BTC", "LBTC", 18);
        usdt = new MockERC20BTC("sUSDt", "USDT", 6);

        // Allow tokens
        vm.prank(admin);
        wrapper.addAllowedToken(address(wbtc));
        vm.prank(admin);
        wrapper.addAllowedToken(address(lbtc));
        vm.prank(admin);
        wrapper.addAllowedToken(address(usdt));

        // Fund user balances
        wbtc.mint(user, 1e10); // 100 BTC sats worth
        lbtc.mint(user, 1e20);
        usdt.mint(user, 1e6 * 10); // 10 USDT

        // Approvals
        vm.startPrank(user);
        wbtc.approve(address(wrapper), type(uint256).max);
        lbtc.approve(address(wrapper), type(uint256).max);
        usdt.approve(address(wrapper), type(uint256).max);
        vm.stopPrank();
    }

    /* -------------------------------------------------------------------------- */
    /*                               Deposits                                     */
    /* -------------------------------------------------------------------------- */

    function testDepositDecimalsSixMintsCorrect() public {
        uint256 amount = 1e6; // 1 USDT (6 decimals)
        uint256 expectedSats = 1e8; // *100 factor

        vm.prank(user);
        wrapper.deposit(address(usdt), amount);

        assertEq(sovaBTC.balanceOf(user), expectedSats);
        assertEq(usdt.balanceOf(address(wrapper)), amount);
    }

    function testDecimalsGreaterThanEightInvalidMultipleReverts() public {
        uint256 amount = 1e9; // not divisible by 1e10 factor for 18-dec token
        uint256 factor = 10 ** (18 - 8); // 1e10

        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(TokenWrapper.DepositBelowMinimum.selector, amount, factor));
        wrapper.deposit(address(lbtc), amount);
    }

    function testDepositZeroAmountReverts() public {
        vm.prank(user);
        vm.expectRevert(TokenWrapper.ZeroAmount.selector);
        wrapper.deposit(address(wbtc), 0);
    }

    /* -------------------------------------------------------------------------- */
    /*                               Redemptions                                  */
    /* -------------------------------------------------------------------------- */

    function testRedeemDecimalsLessThanEightNotDivisibleReverts() public {
        // deposit 10001 sat via WBTC (8 dec) to mint 10001 sovaBTC
        uint256 depositAmount = 10001;
        vm.prank(user);
        wrapper.deposit(address(wbtc), depositAmount);

        // Attempt to redeem into USDT (6 dec) – factor 100, 10001 not divisible
        vm.prank(user);
        vm.expectRevert(
            abi.encodeWithSelector(TokenWrapper.InsufficientReserve.selector, address(usdt), depositAmount, 0)
        );
        wrapper.redeem(address(usdt), depositAmount);
    }

    function testRedeemZeroAmountReverts() public {
        vm.prank(user);
        vm.expectRevert(TokenWrapper.ZeroAmount.selector);
        wrapper.redeem(address(wbtc), 0);
    }

    /* -------------------------------------------------------------------------- */
    /*                        Governance / Allowlist Logic                         */
    /* -------------------------------------------------------------------------- */

    function testAddAllowedTokenTwiceReverts() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(TokenWrapper.AlreadyAllowed.selector, address(wbtc)));
        wrapper.addAllowedToken(address(wbtc));
    }

    function testRemoveNonexistentTokenReverts() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(TokenWrapper.NotInAllowlist.selector, address(0xDEAD)));
        wrapper.removeAllowedToken(address(0xDEAD));
    }

    function testRemoveTokenThenRedeemStillWorks() public {
        // User deposits LBTC
        uint256 depositAmount = 1e18; // 1 LBTC
        uint256 expectedSats = 1e8;

        uint256 startingBal = lbtc.balanceOf(user);

        vm.prank(user);
        wrapper.deposit(address(lbtc), depositAmount);

        // Admin removes LBTC from allowlist
        vm.prank(admin);
        wrapper.removeAllowedToken(address(lbtc));

        // User redeems successfully
        vm.prank(user);
        wrapper.redeem(address(lbtc), expectedSats);

        assertEq(lbtc.balanceOf(user), startingBal);
        assertEq(sovaBTC.balanceOf(user), 0);
    }

    /* -------------------------------------------------------------------------- */
    /*                                 Pausing                                     */
    /* -------------------------------------------------------------------------- */

    function testPauseBlocksDepositAndRedeem() public {
        // Admin pauses
        vm.prank(admin);
        wrapper.pause();

        vm.prank(user);
        vm.expectRevert(PausableUpgradeable.EnforcedPause.selector);
        wrapper.deposit(address(wbtc), 10000);

        vm.prank(user);
        vm.expectRevert(PausableUpgradeable.EnforcedPause.selector);
        wrapper.redeem(address(wbtc), 10000);
    }

    function testUnpauseRestoresDepositAndRedeem() public {
        vm.prank(admin);
        wrapper.pause();
        vm.prank(admin);
        wrapper.unpause();

        // Deposit then redeem
        vm.prank(user);
        wrapper.deposit(address(wbtc), 10000);
        vm.prank(user);
        wrapper.redeem(address(wbtc), 10000);
    }
} 