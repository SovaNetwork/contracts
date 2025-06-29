// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/TokenWrapper.sol";
import "../src/SovaBTC.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./mocks/MockERC20BTC.sol";

/// @title Complete TokenWrapper Coverage Tests
/// @notice Tests to achieve 100% coverage for TokenWrapper.sol
contract TokenWrapperCompleteTest is Test {
    SovaBTC internal sovaBTC;
    TokenWrapper internal wrapper;
    TokenWrapper internal implementation;
    MockERC20BTC internal token8; // 8 decimals
    MockERC20BTC internal token6; // 6 decimals
    MockERC20BTC internal token18; // 18 decimals
    MockERC20BTC internal token0; // 0 decimals (edge case)
    
    address internal owner = makeAddr("owner");
    address internal user = makeAddr("user");
    address internal attacker = makeAddr("attacker");
    
    function setUp() public {
        // Deploy contracts
        sovaBTC = new SovaBTC();
        implementation = new TokenWrapper();
        
        // Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), "");
        wrapper = TokenWrapper(address(proxy));
        
        // Initialize
        vm.prank(owner);
        wrapper.initialize(address(sovaBTC));
        sovaBTC.transferOwnership(address(wrapper));
        
        // Deploy test tokens with different decimals
        token8 = new MockERC20BTC("Token8", "T8", 8);
        token6 = new MockERC20BTC("Token6", "T6", 6);
        token18 = new MockERC20BTC("Token18", "T18", 18);
        token0 = new MockERC20BTC("Token0", "T0", 0);
        
        // Add tokens to allowlist
        vm.startPrank(owner);
        wrapper.addAllowedToken(address(token8));
        wrapper.addAllowedToken(address(token6));
        wrapper.addAllowedToken(address(token18));
        wrapper.addAllowedToken(address(token0));
        vm.stopPrank();
        
        // Fund user
        token8.mint(user, 1e10);
        token6.mint(user, 1e8);
        token18.mint(user, 1e20);
        token0.mint(user, 1000);
        
        // Approve
        vm.startPrank(user);
        token8.approve(address(wrapper), type(uint256).max);
        token6.approve(address(wrapper), type(uint256).max);
        token18.approve(address(wrapper), type(uint256).max);
        token0.approve(address(wrapper), type(uint256).max);
        vm.stopPrank();
    }
    
    // =============================================================================
    // Constructor and Implementation Tests
    // =============================================================================
    
    function test_ConstructorDisablesInitializers() public {
        // Test that the implementation contract constructor properly disables initializers
        TokenWrapper freshImpl = new TokenWrapper();
        
        // Try to initialize the implementation directly (should fail)
        vm.expectRevert();
        freshImpl.initialize(address(sovaBTC));
    }
    
    // =============================================================================
    // Initialize Function Edge Cases
    // =============================================================================
    
    function test_InitializeWithZeroAddress() public {
        TokenWrapper freshImpl = new TokenWrapper();
        ERC1967Proxy freshProxy = new ERC1967Proxy(address(freshImpl), "");
        TokenWrapper freshWrapper = TokenWrapper(address(freshProxy));
        
        vm.expectRevert(TokenWrapper.ZeroAddress.selector);
        freshWrapper.initialize(address(0));
    }
    
    function test_InitializeCannotBeCalledTwice() public {
        vm.expectRevert();
        wrapper.initialize(address(sovaBTC));
    }
    
    // =============================================================================
    // _authorizeUpgrade Function
    // =============================================================================
    
    function test_AuthorizeUpgradeOnlyOwner() public {
        TokenWrapper newImpl = new TokenWrapper();
        
        // Non-owner cannot upgrade
        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(
            OwnableUpgradeable.OwnableUnauthorizedAccount.selector,
            attacker
        ));
        wrapper.upgradeToAndCall(address(newImpl), "");
        
        // Owner can upgrade
        vm.prank(owner);
        wrapper.upgradeToAndCall(address(newImpl), "");
    }
    
    // =============================================================================
    // Token Management Edge Cases
    // =============================================================================
    
    function test_AddTokenWithZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(TokenWrapper.ZeroAddress.selector);
        wrapper.addAllowedToken(address(0));
    }
    
    function test_RemoveTokenEmitsEvent() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit TokenWrapper.AllowedTokenRemoved(address(token8));
        wrapper.removeAllowedToken(address(token8));
        
        assertFalse(wrapper.allowedTokens(address(token8)));
    }
    
    function test_AddTokenEmitsEvent() public {
        MockERC20BTC newToken = new MockERC20BTC("New", "NEW", 8);
        
        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit TokenWrapper.AllowedTokenAdded(address(newToken));
        wrapper.addAllowedToken(address(newToken));
        
        assertTrue(wrapper.allowedTokens(address(newToken)));
        assertEq(wrapper.tokenDecimals(address(newToken)), 8);
    }
    
    // =============================================================================
    // Deposit Edge Cases - All Decimal Branches
    // =============================================================================
    
    function test_DepositToken0Decimals() public {
        uint256 amount = 100; // 100 units of 0-decimal token
        uint256 expectedSova = amount * 1e8; // Multiply by 10^(8-0) = 1e8
        
        vm.prank(user);
        wrapper.deposit(address(token0), amount);
        
        assertEq(sovaBTC.balanceOf(user), expectedSova);
        assertEq(token0.balanceOf(address(wrapper)), amount);
    }
    
    function test_DepositToken6Decimals() public {
        uint256 amount = 1e6; // 1 unit of 6-decimal token
        uint256 expectedSova = amount * 100; // Multiply by 10^(8-6) = 100
        
        vm.prank(user);
        wrapper.deposit(address(token6), amount);
        
        assertEq(sovaBTC.balanceOf(user), expectedSova);
    }
    
    function test_DepositToken8DecimalsExact() public {
        uint256 amount = 1e8; // 1 unit of 8-decimal token
        uint256 expectedSova = amount; // Same decimals, no conversion
        
        vm.prank(user);
        wrapper.deposit(address(token8), amount);
        
        assertEq(sovaBTC.balanceOf(user), expectedSova);
    }
    
    function test_DepositToken18DecimalsValid() public {
        uint256 amount = 1e18; // 1 unit of 18-decimal token (divisible by 1e10)
        uint256 expectedSova = amount / 1e10; // Divide by 10^(18-8) = 1e10
        
        vm.prank(user);
        wrapper.deposit(address(token18), amount);
        
        assertEq(sovaBTC.balanceOf(user), expectedSova);
    }
    
    function test_DepositBelowMinimumSatoshi() public {
        // Set minimum to a high value
        vm.prank(owner);
        wrapper.setMinDepositSatoshi(1e8);
        
        // Try to deposit less than minimum in sova terms
        uint256 smallAmount = 1000; // This would be 1000 * 100 = 100,000 sats < 1e8
        
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(
            TokenWrapper.DepositBelowMinimum.selector,
            smallAmount * 100,
            1e8
        ));
        wrapper.deposit(address(token6), smallAmount);
    }
    
    // =============================================================================
    // Redeem Edge Cases - All Decimal Branches
    // =============================================================================
    
    function test_RedeemToken0Decimals() public {
        // First deposit to have sova to redeem
        uint256 depositAmount = 100;
        vm.prank(user);
        wrapper.deposit(address(token0), depositAmount);
        
        uint256 sovaAmount = depositAmount * 1e8;
        
        vm.prank(user);
        wrapper.redeem(address(token0), sovaAmount);
        
        assertEq(token0.balanceOf(user), 1000); // Back to original balance
        assertEq(sovaBTC.balanceOf(user), 0);
    }
    
    function test_RedeemToken6Decimals() public {
        // First deposit
        uint256 depositAmount = 1e6;
        vm.prank(user);
        wrapper.deposit(address(token6), depositAmount);
        
        uint256 sovaAmount = depositAmount * 100;
        
        vm.prank(user);
        wrapper.redeem(address(token6), sovaAmount);
        
        assertEq(sovaBTC.balanceOf(user), 0);
    }
    
    function test_RedeemToken8DecimalsExact() public {
        // First deposit
        uint256 depositAmount = 1e8;
        vm.prank(user);
        wrapper.deposit(address(token8), depositAmount);
        
        vm.prank(user);
        wrapper.redeem(address(token8), depositAmount);
        
        assertEq(sovaBTC.balanceOf(user), 0);
    }
    
    function test_RedeemToken18DecimalsValid() public {
        // First deposit
        uint256 depositAmount = 1e18;
        vm.prank(user);
        wrapper.deposit(address(token18), depositAmount);
        
        uint256 sovaAmount = depositAmount / 1e10;
        
        vm.prank(user);
        wrapper.redeem(address(token18), sovaAmount);
        
        assertEq(sovaBTC.balanceOf(user), 0);
    }
    
    // =============================================================================
    // Administrative Functions
    // =============================================================================
    
    function test_SetMinDepositSatoshi() public {
        vm.prank(owner);
        wrapper.setMinDepositSatoshi(50000);
        
        assertEq(wrapper.minDepositSatoshi(), 50000);
    }
    
    function test_NonOwnerCannotSetMinDeposit() public {
        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(
            OwnableUpgradeable.OwnableUnauthorizedAccount.selector,
            attacker
        ));
        wrapper.setMinDepositSatoshi(50000);
    }
    
    function test_NonOwnerCannotRemoveToken() public {
        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(
            OwnableUpgradeable.OwnableUnauthorizedAccount.selector,
            attacker
        ));
        wrapper.removeAllowedToken(address(token8));
    }
    
    function test_NonOwnerCannotPauseUnpause() public {
        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(
            OwnableUpgradeable.OwnableUnauthorizedAccount.selector,
            attacker
        ));
        wrapper.pause();
        
        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(
            OwnableUpgradeable.OwnableUnauthorizedAccount.selector,
            attacker
        ));
        wrapper.unpause();
    }
    
    // =============================================================================
    // Event Verification
    // =============================================================================
    
    function test_DepositEmitsCorrectEvent() public {
        uint256 amount = 1e8;
        
        vm.prank(user);
        vm.expectEmit(true, true, false, true);
        emit TokenWrapper.TokenWrapped(user, address(token8), amount, amount);
        wrapper.deposit(address(token8), amount);
    }
    
    function test_RedeemEmitsCorrectEvent() public {
        // First deposit
        uint256 amount = 1e8;
        vm.prank(user);
        wrapper.deposit(address(token8), amount);
        
        // Then redeem
        vm.prank(user);
        vm.expectEmit(true, true, false, true);
        emit TokenWrapper.TokenUnwrapped(user, address(token8), amount, amount);
        wrapper.redeem(address(token8), amount);
    }
} 