// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/TokenWhitelist.sol";
import "../src/SovaBTCWrapper.sol";
import "../src/CustodyManager.sol";
import "./mocks/MockSovaBTC.sol";
import "./mocks/MockERC20BTC.sol";

contract Task1WhitelistSystemTest is Test {
    TokenWhitelist public whitelist;
    SovaBTCWrapper public wrapper;
    MockSovaBTC public sovaBTC;

    MockERC20BTC public wbtc; // 8 decimals
    MockERC20BTC public usdc; // 6 decimals
    MockERC20BTC public weth; // 18 decimals

    address public owner = address(0x1);
    address public user = address(0x2);
    address public nonOwner = address(0x3);

    uint256 constant MIN_DEPOSIT_SATS = 10_000; // 0.0001 BTC

    event TokenWhitelistUpdated(address indexed token, bool allowed, uint8 decimals);
    event TokenWrapped(address indexed user, address indexed token, uint256 amountIn, uint256 sovaAmount);

    function setUp() public {
        vm.startPrank(owner);

        // Deploy MockSovaBTC
        sovaBTC = new MockSovaBTC();

        // Deploy TokenWhitelist
        whitelist = new TokenWhitelist();

        // Deploy SovaBTCWrapper
        CustodyManager custodyManager = new CustodyManager(address(this));
        wrapper = new SovaBTCWrapper(address(sovaBTC), address(whitelist), address(custodyManager), MIN_DEPOSIT_SATS);

        // Set wrapper as minter so it can mint SovaBTC
        sovaBTC.setMinter(address(wrapper), true);

        // Deploy mock tokens with different decimals
        wbtc = new MockERC20BTC("Wrapped Bitcoin", "WBTC", 8);
        usdc = new MockERC20BTC("USD Coin", "USDC", 6);
        weth = new MockERC20BTC("Wrapped Ethereum", "WETH", 18);

        vm.stopPrank();

        // Setup user balances
        vm.startPrank(user);
        wbtc.mint(user, 10 * 1e8); // 10 WBTC
        usdc.mint(user, 10 * 1e6); // 10 USDC (representing 10 BTC value)
        weth.mint(user, 10 * 1e18); // 10 WETH (representing 10 BTC value)
        vm.stopPrank();
    }

    // ========== WHITELIST MANAGEMENT TESTS ==========

    function test_AddAllowedToken_Success() public {
        vm.startPrank(owner);

        // Expect event emission
        vm.expectEmit(true, false, false, true);
        emit TokenWhitelistUpdated(address(wbtc), true, 8);

        whitelist.addAllowedToken(address(wbtc));

        // Verify token is allowed
        assertTrue(whitelist.allowedTokens(address(wbtc)));
        assertEq(whitelist.tokenDecimals(address(wbtc)), 8);
        assertTrue(whitelist.isTokenAllowed(address(wbtc)));
        assertEq(whitelist.getTokenDecimals(address(wbtc)), 8);

        vm.stopPrank();
    }

    function test_AddAllowedToken_DifferentDecimals() public {
        vm.startPrank(owner);

        // Add USDC (6 decimals)
        vm.expectEmit(true, false, false, true);
        emit TokenWhitelistUpdated(address(usdc), true, 6);
        whitelist.addAllowedToken(address(usdc));

        // Add WETH (18 decimals)
        vm.expectEmit(true, false, false, true);
        emit TokenWhitelistUpdated(address(weth), true, 18);
        whitelist.addAllowedToken(address(weth));

        // Verify both tokens
        assertTrue(whitelist.isTokenAllowed(address(usdc)));
        assertEq(whitelist.getTokenDecimals(address(usdc)), 6);

        assertTrue(whitelist.isTokenAllowed(address(weth)));
        assertEq(whitelist.getTokenDecimals(address(weth)), 18);

        vm.stopPrank();
    }

    function test_AddAllowedToken_RevertIfZeroAddress() public {
        vm.startPrank(owner);

        vm.expectRevert(TokenWhitelist.ZeroAddress.selector);
        whitelist.addAllowedToken(address(0));

        vm.stopPrank();
    }

    function test_AddAllowedToken_RevertIfAlreadyAllowed() public {
        vm.startPrank(owner);

        whitelist.addAllowedToken(address(wbtc));

        vm.expectRevert(abi.encodeWithSelector(TokenWhitelist.AlreadyAllowed.selector, address(wbtc)));
        whitelist.addAllowedToken(address(wbtc));

        vm.stopPrank();
    }

    function test_AddAllowedToken_RevertIfNotOwner() public {
        vm.startPrank(nonOwner);

        vm.expectRevert(Ownable.Unauthorized.selector);
        whitelist.addAllowedToken(address(wbtc));

        vm.stopPrank();
    }

    function test_RemoveAllowedToken_Success() public {
        vm.startPrank(owner);

        // First add token
        whitelist.addAllowedToken(address(wbtc));
        assertTrue(whitelist.isTokenAllowed(address(wbtc)));

        // Then remove it
        vm.expectEmit(true, false, false, true);
        emit TokenWhitelistUpdated(address(wbtc), false, 8);

        whitelist.removeAllowedToken(address(wbtc));

        // Verify token is no longer allowed but decimals are preserved
        assertFalse(whitelist.isTokenAllowed(address(wbtc)));
        assertEq(whitelist.getTokenDecimals(address(wbtc)), 8);

        vm.stopPrank();
    }

    function test_RemoveAllowedToken_RevertIfNotInAllowlist() public {
        vm.startPrank(owner);

        vm.expectRevert(abi.encodeWithSelector(TokenWhitelist.NotInAllowlist.selector, address(wbtc)));
        whitelist.removeAllowedToken(address(wbtc));

        vm.stopPrank();
    }

    function test_RemoveAllowedToken_RevertIfNotOwner() public {
        vm.startPrank(owner);
        whitelist.addAllowedToken(address(wbtc));
        vm.stopPrank();

        vm.startPrank(nonOwner);
        vm.expectRevert(Ownable.Unauthorized.selector);
        whitelist.removeAllowedToken(address(wbtc));
        vm.stopPrank();
    }

    function test_AddAllowedTokensBatch_Success() public {
        vm.startPrank(owner);

        address[] memory tokens = new address[](3);
        tokens[0] = address(wbtc);
        tokens[1] = address(usdc);
        tokens[2] = address(weth);

        // Expect events for all tokens
        vm.expectEmit(true, false, false, true);
        emit TokenWhitelistUpdated(address(wbtc), true, 8);
        vm.expectEmit(true, false, false, true);
        emit TokenWhitelistUpdated(address(usdc), true, 6);
        vm.expectEmit(true, false, false, true);
        emit TokenWhitelistUpdated(address(weth), true, 18);

        whitelist.addAllowedTokensBatch(tokens);

        // Verify all tokens are allowed
        assertTrue(whitelist.isTokenAllowed(address(wbtc)));
        assertTrue(whitelist.isTokenAllowed(address(usdc)));
        assertTrue(whitelist.isTokenAllowed(address(weth)));

        vm.stopPrank();
    }

    // ========== WRAPPER DEPOSIT TESTS ==========

    function test_Deposit_WBTC_8Decimals() public {
        // Setup: Add WBTC to whitelist
        vm.prank(owner);
        whitelist.addAllowedToken(address(wbtc));

        vm.startPrank(user);

        uint256 depositAmount = 1e8; // 1 WBTC
        uint256 expectedSovaAmount = 1e8; // 1 SovaBTC (same decimals)

        // Approve wrapper to spend WBTC
        wbtc.approve(address(wrapper), depositAmount);

        // Preview deposit
        uint256 previewAmount = wrapper.previewDeposit(address(wbtc), depositAmount);
        assertEq(previewAmount, expectedSovaAmount);

        // Expect event emission
        vm.expectEmit(true, true, false, true);
        emit TokenWrapped(user, address(wbtc), depositAmount, expectedSovaAmount);

        // Perform deposit
        wrapper.deposit(address(wbtc), depositAmount);

        // Verify balances
        assertEq(sovaBTC.balanceOf(user), expectedSovaAmount);
        assertEq(wbtc.balanceOf(address(wrapper)), depositAmount);

        vm.stopPrank();
    }

    function test_Deposit_USDC_6Decimals() public {
        // Setup: Add USDC to whitelist
        vm.prank(owner);
        whitelist.addAllowedToken(address(usdc));

        vm.startPrank(user);

        uint256 depositAmount = 1e6; // 1 USDC (6 decimals, representing 1 BTC value)
        uint256 expectedSovaAmount = 1e8; // 1 SovaBTC (8 decimals) = 1e6 * 10^(8-6)

        // Approve wrapper to spend USDC
        usdc.approve(address(wrapper), depositAmount);

        // Preview deposit
        uint256 previewAmount = wrapper.previewDeposit(address(usdc), depositAmount);
        assertEq(previewAmount, expectedSovaAmount);

        // Expect event emission
        vm.expectEmit(true, true, false, true);
        emit TokenWrapped(user, address(usdc), depositAmount, expectedSovaAmount);

        // Perform deposit
        wrapper.deposit(address(usdc), depositAmount);

        // Verify balances
        assertEq(sovaBTC.balanceOf(user), expectedSovaAmount);
        assertEq(usdc.balanceOf(address(wrapper)), depositAmount);

        vm.stopPrank();
    }

    function test_Deposit_WETH_18Decimals() public {
        // Setup: Add WETH to whitelist
        vm.prank(owner);
        whitelist.addAllowedToken(address(weth));

        vm.startPrank(user);

        uint256 depositAmount = 1e18; // 1 WETH (18 decimals, representing 1 BTC value)
        uint256 expectedSovaAmount = 1e8; // 1 SovaBTC (8 decimals) = 1e18 / 10^(18-8)

        // Approve wrapper to spend WETH
        weth.approve(address(wrapper), depositAmount);

        // Preview deposit
        uint256 previewAmount = wrapper.previewDeposit(address(weth), depositAmount);
        assertEq(previewAmount, expectedSovaAmount);

        // Expect event emission
        vm.expectEmit(true, true, false, true);
        emit TokenWrapped(user, address(weth), depositAmount, expectedSovaAmount);

        // Perform deposit
        wrapper.deposit(address(weth), depositAmount);

        // Verify balances
        assertEq(sovaBTC.balanceOf(user), expectedSovaAmount);
        assertEq(weth.balanceOf(address(wrapper)), depositAmount);

        vm.stopPrank();
    }

    function test_Deposit_RevertIfTokenNotAllowed() public {
        vm.startPrank(user);

        uint256 depositAmount = 1e8;
        wbtc.approve(address(wrapper), depositAmount);

        vm.expectRevert(abi.encodeWithSelector(SovaBTCWrapper.TokenNotAllowed.selector, address(wbtc)));
        wrapper.deposit(address(wbtc), depositAmount);

        vm.stopPrank();
    }

    function test_Deposit_RevertIfZeroAmount() public {
        vm.prank(owner);
        whitelist.addAllowedToken(address(wbtc));

        vm.startPrank(user);

        vm.expectRevert(SovaBTCWrapper.ZeroAmount.selector);
        wrapper.deposit(address(wbtc), 0);

        vm.stopPrank();
    }

    function test_Deposit_RevertIfBelowMinimum() public {
        vm.prank(owner);
        whitelist.addAllowedToken(address(wbtc));

        vm.startPrank(user);

        uint256 depositAmount = MIN_DEPOSIT_SATS - 1; // Below minimum
        wbtc.approve(address(wrapper), depositAmount);

        vm.expectRevert(
            abi.encodeWithSelector(SovaBTCWrapper.InsufficientAmount.selector, depositAmount, MIN_DEPOSIT_SATS)
        );
        wrapper.deposit(address(wbtc), depositAmount);

        vm.stopPrank();
    }

    function test_Deposit_RevertIfFractionalSatoshi_18Decimals() public {
        vm.prank(owner);
        whitelist.addAllowedToken(address(weth));

        vm.startPrank(user);

        // This amount would result in a fractional satoshi
        uint256 depositAmount = 1e18 + 1; // 1.000000000000000001 WETH
        uint256 factor = 10 ** (18 - 8);

        weth.approve(address(wrapper), depositAmount);

        vm.expectRevert(abi.encodeWithSelector(SovaBTCWrapper.InsufficientAmount.selector, depositAmount, factor));
        wrapper.deposit(address(weth), depositAmount);

        vm.stopPrank();
    }

    function test_Deposit_RevertWhenPaused() public {
        vm.prank(owner);
        whitelist.addAllowedToken(address(wbtc));

        vm.prank(owner);
        wrapper.pause();

        vm.startPrank(user);

        uint256 depositAmount = 1e8;
        wbtc.approve(address(wrapper), depositAmount);

        vm.expectRevert(SovaBTCWrapper.ContractPaused.selector);
        wrapper.deposit(address(wbtc), depositAmount);

        vm.stopPrank();
    }

    // ========== ADMIN FUNCTION TESTS ==========

    function test_SetMinDepositSatoshi() public {
        vm.prank(owner);
        wrapper.setMinDepositSatoshi(50_000);

        assertEq(wrapper.minDepositSatoshi(), 50_000);
    }

    function test_SetMinDepositSatoshi_RevertIfNotOwner() public {
        vm.startPrank(nonOwner);

        vm.expectRevert(Ownable.Unauthorized.selector);
        wrapper.setMinDepositSatoshi(50_000);

        vm.stopPrank();
    }

    function test_PauseUnpause() public {
        vm.startPrank(owner);

        assertFalse(wrapper.isPaused());

        wrapper.pause();
        assertTrue(wrapper.isPaused());

        wrapper.unpause();
        assertFalse(wrapper.isPaused());

        vm.stopPrank();
    }

    function test_GetTokenBalance() public {
        vm.prank(owner);
        whitelist.addAllowedToken(address(wbtc));

        vm.startPrank(user);
        uint256 depositAmount = 1e8;
        wbtc.approve(address(wrapper), depositAmount);
        wrapper.deposit(address(wbtc), depositAmount);
        vm.stopPrank();

        assertEq(wrapper.getTokenBalance(address(wbtc)), depositAmount);
    }

    // ========== DECIMAL CONVERSION TESTS ==========

    function test_DecimalConversion_Precision() public {
        vm.prank(owner);
        whitelist.addAllowedToken(address(weth));

        vm.startPrank(user);

        // Test exact satoshi conversions for 18-decimal token
        // For 18-decimal token representing BTC value:
        // 1 BTC = 1e18 token units = 1e8 satoshis
        // So conversion: token_amount / 10^(18-8) = token_amount / 1e10

        uint256[] memory testAmounts = new uint256[](3);
        testAmounts[0] = 1e16; // 0.01 BTC in 18 decimals (0.01 * 1e18)
        testAmounts[1] = 5e16; // 0.05 BTC in 18 decimals (0.05 * 1e18)
        testAmounts[2] = 1e18; // 1 BTC in 18 decimals

        uint256[] memory expectedSats = new uint256[](3);
        expectedSats[0] = 1e6; // 0.01 BTC in sats (1e16 / 1e10)
        expectedSats[1] = 5e6; // 0.05 BTC in sats (5e16 / 1e10)
        expectedSats[2] = 1e8; // 1 BTC in sats (1e18 / 1e10)

        for (uint256 i = 0; i < testAmounts.length; i++) {
            uint256 previewAmount = wrapper.previewDeposit(address(weth), testAmounts[i]);
            assertEq(previewAmount, expectedSats[i], "Conversion precision error");
        }

        vm.stopPrank();
    }
}
