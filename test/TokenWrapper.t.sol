// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SovaBTC.sol";
import "../src/TokenWrapper.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./mocks/MockERC20BTC.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

contract TokenWrapperTest is Test {
    SovaBTC internal sovaBTC;
    TokenWrapper internal wrapper;
    MockERC20BTC internal wbtc;
    MockERC20BTC internal lbtc;
    address internal admin;
    address internal user1;
    address internal user2;

    function setUp() public {
        admin = address(0xA11CE);
        user1 = address(0xB0B);
        user2 = address(0xC0C);

        // Deploy core contracts
        sovaBTC = new SovaBTC();
        TokenWrapper impl = new TokenWrapper();
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), "");
        wrapper = TokenWrapper(address(proxy));

        // Initialize wrapper via admin
        vm.prank(admin);
        wrapper.initialize(address(sovaBTC));
        sovaBTC.transferOwnership(address(wrapper));

        // Deploy mock tokens
        wbtc = new MockERC20BTC("Wrapped Bitcoin", "WBTC", 8);
        lbtc = new MockERC20BTC("Liquid BTC", "LBTC", 18);

        vm.prank(admin);
        wrapper.addAllowedToken(address(wbtc));
        vm.prank(admin);
        wrapper.addAllowedToken(address(lbtc));

        // Fund users and approve
        wbtc.mint(user1, 1e8);
        lbtc.mint(user2, 1e18);

        vm.startPrank(user1);
        wbtc.approve(address(wrapper), type(uint256).max);
        vm.stopPrank();
        vm.startPrank(user2);
        lbtc.approve(address(wrapper), type(uint256).max);
        vm.stopPrank();
    }

    function testDepositAndWrap() public {
        uint256 amount = 1e8; // 1 WBTC
        vm.expectEmit(true, true, false, true);
        emit TokenWrapper.TokenWrapped(user1, address(wbtc), amount, amount);
        vm.prank(user1);
        wrapper.deposit(address(wbtc), amount);
        assertEq(sovaBTC.balanceOf(user1), amount);
        assertEq(wbtc.balanceOf(address(wrapper)), amount);
        assertEq(sovaBTC.totalSupply(), amount);
    }

    function testDepositDifferentDecimals() public {
        uint256 amount = 1e18; // 1 LBTC
        uint256 expected = 1e8; // 1 sovaBTC worth
        vm.prank(user2);
        wrapper.deposit(address(lbtc), amount);
        assertEq(sovaBTC.balanceOf(user2), expected);
        assertEq(lbtc.balanceOf(address(wrapper)), amount);
        assertEq(sovaBTC.totalSupply(), expected);
    }

    function testRedeemUnwrap() public {
        vm.prank(user1);
        wrapper.deposit(address(wbtc), 1e8);
        uint256 bal = sovaBTC.balanceOf(user1);
        vm.prank(user1);
        wrapper.redeem(address(wbtc), bal);
        assertEq(wbtc.balanceOf(user1), 1e8);
        assertEq(sovaBTC.balanceOf(user1), 0);
        assertEq(sovaBTC.totalSupply(), 0);
        assertEq(wbtc.balanceOf(address(wrapper)), 0);
    }

    function testCrossAssetRedemption() public {
        vm.prank(user1);
        wrapper.deposit(address(wbtc), 1e8);
        vm.prank(user2);
        wrapper.deposit(address(lbtc), 1e18);

        vm.prank(user1);
        wrapper.redeem(address(lbtc), 1e8);
        assertEq(lbtc.balanceOf(user1), 1e18);
        assertEq(sovaBTC.balanceOf(user1), 0);
        assertEq(lbtc.balanceOf(address(wrapper)), 0);

        vm.prank(user2);
        wrapper.redeem(address(wbtc), 1e8);
        assertEq(wbtc.balanceOf(user2), 1e8);
        assertEq(sovaBTC.balanceOf(user2), 0);
        assertEq(wbtc.balanceOf(address(wrapper)), 0);
        assertEq(sovaBTC.totalSupply(), 0);
    }

    function testNonOwnerCannotAddOrPause() public {
        vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user1));
        vm.prank(user1);
        wrapper.addAllowedToken(address(0xDEAD));

        vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user1));
        vm.prank(user1);
        wrapper.pause();
    }

    function testPauseAndUnpause() public {
        vm.prank(admin);
        wrapper.pause();

        vm.expectRevert(PausableUpgradeable.EnforcedPause.selector);
        vm.prank(user1);
        wrapper.deposit(address(wbtc), 1e8);

        vm.prank(admin);
        wrapper.unpause();
        vm.prank(user1);
        wrapper.deposit(address(wbtc), 1e8);
    }

    function testRejectUnallowedTokenDeposit() public {
        MockERC20BTC fakeBTC = new MockERC20BTC("Fake BTC", "FBTC", 8);
        fakeBTC.mint(user1, 1000);
        vm.startPrank(user1);
        fakeBTC.approve(address(wrapper), 1000);
        vm.expectRevert(abi.encodeWithSelector(TokenWrapper.TokenNotAllowed.selector, address(fakeBTC)));
        wrapper.deposit(address(fakeBTC), 1000);
        vm.stopPrank();
    }

    function testMinimumDepositEnforced() public {
        vm.prank(admin);
        wrapper.setMinDepositSatoshi(100);

        wbtc.mint(user1, 50);
        vm.startPrank(user1);
        wbtc.approve(address(wrapper), 50);
        vm.expectRevert(abi.encodeWithSelector(TokenWrapper.DepositBelowMinimum.selector, 50, 100));
        wrapper.deposit(address(wbtc), 50);
        vm.stopPrank();
    }

    function testInsufficientReserveReverts() public {
        vm.prank(user1);
        wrapper.deposit(address(wbtc), 1e8);

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(TokenWrapper.InsufficientReserve.selector, address(lbtc), 1e18, 0));
        wrapper.redeem(address(lbtc), 1e8);
    }

    function testDepositWithMintFee() public {
        vm.prank(admin);
        wrapper.setMintFee(true, 50); // 0.5%

        uint256 amount = 1e8;
        vm.prank(user1);
        wrapper.deposit(address(wbtc), amount);

        uint256 fee = (amount * 50) / 10_000;
        uint256 minted = amount - fee;
        assertEq(sovaBTC.balanceOf(user1), minted);
        assertEq(sovaBTC.balanceOf(admin), fee);
    }

    function testRedeemWithBurnFee() public {
        // deposit without mint fee first
        vm.prank(user1);
        wrapper.deposit(address(wbtc), 1e8);
        uint256 bal = sovaBTC.balanceOf(user1);

        vm.prank(admin);
        wrapper.setBurnFee(true, 100); // 1%

        vm.prank(user1);
        wrapper.redeem(address(wbtc), bal);

        uint256 fee = (1e8 * 100) / 10_000;
        assertEq(wbtc.balanceOf(user1), 1e8 - fee);
        assertEq(wbtc.balanceOf(admin), fee);
    }

    function testOnlyOwnerCanSetMintFee() public {
        vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user1));
        vm.prank(user1);
        wrapper.setMintFee(true, 10);
    }

    function testOnlyOwnerCanSetBurnFee() public {
        vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, user1));
        vm.prank(user1);
        wrapper.setBurnFee(true, 10);
    }
}
