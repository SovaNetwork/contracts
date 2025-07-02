// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SovaBTCWrapper.sol";
import "../src/TokenWhitelist.sol";
import "../src/RedemptionQueue.sol";
import "../src/CustodyManager.sol";
import "./mocks/MockSovaBTC.sol";
import "./mocks/MockERC20BTC.sol";

/**
 * @title SovaBTCWrapperCoverageTest
 * @notice Comprehensive test suite to achieve 100% coverage for SovaBTCWrapper contract
 */
contract SovaBTCWrapperCoverageTest is Test {
    SovaBTCWrapper public wrapper;
    MockSovaBTC public sovaBTC;
    TokenWhitelist public whitelist;
    RedemptionQueue public redemptionQueue;
    CustodyManager public custodyManager;

    MockERC20BTC public wbtc;
    MockERC20BTC public usdc;
    MockERC20BTC public weth;

    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public custodian = address(0x4);

    uint256 constant MIN_DEPOSIT_SATS = 10000; // 0.0001 BTC

    // Events to test
    event TokenWrapped(address indexed user, address indexed token, uint256 tokenAmount, uint256 sovaAmount);
    event RedemptionQueueUpdated(address indexed oldQueue, address indexed newQueue);
    event MinDepositUpdated(uint256 oldMin, uint256 newMin);
    event ContractPausedByOwner(address indexed account);
    event ContractUnpausedByOwner(address indexed account);

    function setUp() public {
        vm.startPrank(owner);

        // Deploy mock tokens
        wbtc = new MockERC20BTC("Wrapped Bitcoin", "WBTC", 8);
        usdc = new MockERC20BTC("USD Coin", "USDC", 6);
        weth = new MockERC20BTC("Wrapped Ether", "WETH", 18);

        // Deploy mock SovaBTC
        sovaBTC = new MockSovaBTC();

        // Deploy supporting contracts
        whitelist = new TokenWhitelist();
        custodyManager = new CustodyManager(owner);

        // Deploy wrapper
        wrapper = new SovaBTCWrapper(address(sovaBTC), address(whitelist), address(custodyManager), MIN_DEPOSIT_SATS);

        // Set wrapper as minter
        sovaBTC.setMinter(address(wrapper), true);

        // Add tokens to whitelist
        whitelist.addAllowedToken(address(wbtc));
        whitelist.addAllowedToken(address(usdc));
        whitelist.addAllowedToken(address(weth));

        // Give users tokens
        wbtc.mint(user1, 100 * 1e8);
        usdc.mint(user1, 100000 * 1e6);
        weth.mint(user1, 1000 * 1e18);

        vm.stopPrank();
    }

    // ============ Constructor Tests ============

    function test_Constructor_ZeroSovaBTCAddress() public {
        vm.startPrank(owner);
        vm.expectRevert(SovaBTCWrapper.ZeroAddress.selector);
        new SovaBTCWrapper(address(0), address(whitelist), address(custodyManager), MIN_DEPOSIT_SATS);
        vm.stopPrank();
    }

    function test_Constructor_ZeroWhitelistAddress() public {
        vm.startPrank(owner);
        vm.expectRevert(SovaBTCWrapper.ZeroAddress.selector);
        new SovaBTCWrapper(address(sovaBTC), address(0), address(custodyManager), MIN_DEPOSIT_SATS);
        vm.stopPrank();
    }

    function test_Constructor_ZeroCustodyManagerAddress() public {
        vm.startPrank(owner);
        vm.expectRevert(SovaBTCWrapper.ZeroAddress.selector);
        new SovaBTCWrapper(address(sovaBTC), address(whitelist), address(0), MIN_DEPOSIT_SATS);
        vm.stopPrank();
    }

    function test_Constructor_ValidParameters() public {
        vm.startPrank(owner);
        SovaBTCWrapper newWrapper =
            new SovaBTCWrapper(address(sovaBTC), address(whitelist), address(custodyManager), MIN_DEPOSIT_SATS);

        assertEq(address(newWrapper.sovaBTC()), address(sovaBTC));
        assertEq(address(newWrapper.tokenWhitelist()), address(whitelist));
        assertEq(address(newWrapper.custodyManager()), address(custodyManager));
        assertEq(newWrapper.minDepositSatoshi(), MIN_DEPOSIT_SATS);
        assertFalse(newWrapper.isPaused());
        vm.stopPrank();
    }

    // ============ previewDeposit Tests ============

    function test_PreviewDeposit_TokenNotAllowed() public {
        MockERC20BTC randomToken = new MockERC20BTC("Random", "RND", 18);

        vm.expectRevert(abi.encodeWithSelector(SovaBTCWrapper.TokenNotAllowed.selector, address(randomToken)));
        wrapper.previewDeposit(address(randomToken), 1000 * 1e18);
    }

    function test_PreviewDeposit_8Decimals() public {
        uint256 amount = 1 * 1e8;
        uint256 expected = amount; // 1:1 conversion

        uint256 result = wrapper.previewDeposit(address(wbtc), amount);
        assertEq(result, expected);
    }

    function test_PreviewDeposit_6Decimals() public {
        uint256 amount = 1000 * 1e6; // 1000 USDC
        uint256 expected = amount * 1e2; // Convert to 8 decimals

        uint256 result = wrapper.previewDeposit(address(usdc), amount);
        assertEq(result, expected);
    }

    function test_PreviewDeposit_18Decimals_ValidMultiple() public {
        uint256 amount = 1 * 1e18; // 1 WETH
        uint256 expected = 1e8; // Convert to 8 decimals

        uint256 result = wrapper.previewDeposit(address(weth), amount);
        assertEq(result, expected);
    }

    function test_PreviewDeposit_18Decimals_InvalidMultiple() public {
        uint256 amount = 1e18 + 1; // 1 WETH + 1 wei (not exact satoshi multiple)

        vm.expectRevert(abi.encodeWithSelector(SovaBTCWrapper.InsufficientAmount.selector, amount, 1e10));
        wrapper.previewDeposit(address(weth), amount);
    }

    // ============ Redemption Functions Coverage ============

    function test_FulfillRedemption_NoRedemptionQueue() public {
        vm.expectRevert(SovaBTCWrapper.ZeroAddress.selector);
        wrapper.fulfillRedemption(user1);
    }

    function test_FulfillRedemption_UnauthorizedCustodian() public {
        // Deploy and set redemption queue
        vm.startPrank(owner);
        redemptionQueue = new RedemptionQueue(address(sovaBTC), address(whitelist), 10 days);
        wrapper.setRedemptionQueue(address(redemptionQueue));
        vm.stopPrank();

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(SovaBTCWrapper.UnauthorizedCustodian.selector, user1));
        wrapper.fulfillRedemption(user1);
    }

    function test_BatchFulfillRedemptions_NoRedemptionQueue() public {
        address[] memory users = new address[](1);
        users[0] = user1;

        vm.expectRevert(SovaBTCWrapper.ZeroAddress.selector);
        wrapper.batchFulfillRedemptions(users);
    }

    function test_BatchFulfillRedemptions_UnauthorizedCustodian() public {
        // Deploy and set redemption queue
        vm.startPrank(owner);
        redemptionQueue = new RedemptionQueue(address(sovaBTC), address(whitelist), 10 days);
        wrapper.setRedemptionQueue(address(redemptionQueue));
        vm.stopPrank();

        address[] memory users = new address[](1);
        users[0] = user1;

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(SovaBTCWrapper.UnauthorizedCustodian.selector, user1));
        wrapper.batchFulfillRedemptions(users);
    }

    // ============ View Functions with Edge Cases ============

    function test_GetRedemptionRequest_NoQueue() public {
        RedemptionQueue.RedemptionRequest memory request = wrapper.getRedemptionRequest(user1);

        assertEq(request.user, address(0));
        assertEq(request.token, address(0));
        assertEq(request.sovaAmount, 0);
        assertEq(request.underlyingAmount, 0);
        assertEq(request.requestTime, 0);
        assertFalse(request.fulfilled);
    }

    function test_IsRedemptionReady_NoQueue() public {
        assertFalse(wrapper.isRedemptionReady(user1));
    }

    function test_GetRedemptionReadyTime_NoQueue() public {
        assertEq(wrapper.getRedemptionReadyTime(user1), 0);
    }

    function test_GetAvailableReserve_NoQueue() public {
        assertEq(wrapper.getAvailableReserve(address(wbtc)), 0);
    }

    function test_GetRedemptionRequest_WithQueue() public {
        // Deploy and set redemption queue
        vm.startPrank(owner);
        redemptionQueue = new RedemptionQueue(address(sovaBTC), address(whitelist), 10 days);
        wrapper.setRedemptionQueue(address(redemptionQueue));
        vm.stopPrank();

        // Test returns actual queue data (even if empty)
        RedemptionQueue.RedemptionRequest memory request = wrapper.getRedemptionRequest(user1);
        assertEq(request.user, address(0)); // No redemption for user1
    }

    function test_IsRedemptionReady_WithQueue() public {
        vm.startPrank(owner);
        redemptionQueue = new RedemptionQueue(address(sovaBTC), address(whitelist), 10 days);
        wrapper.setRedemptionQueue(address(redemptionQueue));
        vm.stopPrank();

        assertFalse(wrapper.isRedemptionReady(user1)); // No redemption for user1
    }

    function test_GetRedemptionReadyTime_WithQueue() public {
        vm.startPrank(owner);
        redemptionQueue = new RedemptionQueue(address(sovaBTC), address(whitelist), 10 days);
        wrapper.setRedemptionQueue(address(redemptionQueue));
        vm.stopPrank();

        assertEq(wrapper.getRedemptionReadyTime(user1), 0); // No redemption for user1
    }

    function test_GetAvailableReserve_WithQueue() public {
        vm.startPrank(owner);
        redemptionQueue = new RedemptionQueue(address(sovaBTC), address(whitelist), 10 days);
        wrapper.setRedemptionQueue(address(redemptionQueue));
        vm.stopPrank();

        assertEq(wrapper.getAvailableReserve(address(wbtc)), 0); // No reserves initially
    }

    // ============ Admin Functions Tests ============

    function test_SetRedemptionQueue_Success() public {
        address newQueue = address(0x123);

        vm.prank(owner);
        vm.expectEmit(true, true, false, false);
        emit RedemptionQueueUpdated(address(0), newQueue);
        wrapper.setRedemptionQueue(newQueue);

        assertEq(address(wrapper.redemptionQueue()), newQueue);
    }

    function test_SetRedemptionQueue_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        wrapper.setRedemptionQueue(address(0x123));
    }

    function test_SetMinDepositSatoshi_Success() public {
        uint256 newMin = 50000;

        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit MinDepositUpdated(MIN_DEPOSIT_SATS, newMin);
        wrapper.setMinDepositSatoshi(newMin);

        assertEq(wrapper.minDepositSatoshi(), newMin);
    }

    function test_SetMinDepositSatoshi_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        wrapper.setMinDepositSatoshi(50000);
    }

    function test_Pause_Success() public {
        assertFalse(wrapper.isPaused());

        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit ContractPausedByOwner(owner);
        wrapper.pause();

        assertTrue(wrapper.isPaused());
    }

    function test_Pause_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        wrapper.pause();
    }

    function test_Pause_AlreadyPaused() public {
        vm.startPrank(owner);
        wrapper.pause();

        vm.expectRevert(SovaBTCWrapper.ContractPaused.selector);
        wrapper.pause();
        vm.stopPrank();
    }

    function test_Unpause_Success() public {
        vm.startPrank(owner);
        wrapper.pause();
        assertTrue(wrapper.isPaused());

        vm.expectEmit(true, false, false, false);
        emit ContractUnpausedByOwner(owner);
        wrapper.unpause();

        assertFalse(wrapper.isPaused());
        vm.stopPrank();
    }

    function test_Unpause_OnlyOwner() public {
        vm.prank(owner);
        wrapper.pause();

        vm.prank(user1);
        vm.expectRevert();
        wrapper.unpause();
    }

    function test_Unpause_NotPaused() public {
        assertFalse(wrapper.isPaused());

        vm.prank(owner);
        vm.expectRevert("Contract not paused");
        wrapper.unpause();
    }

    // ============ Emergency Functions Tests ============

    function test_EmergencyWithdraw_Success() public {
        uint256 withdrawAmount = 1 * 1e8;
        address custodyAddress = address(0x123);

        // Set up custody for WBTC
        vm.startPrank(owner);
        custodyManager.setCustodyAddress(address(wbtc), custodyAddress);
        custodyManager.setCustodyEnforcement(address(wbtc), true);

        // Give wrapper some WBTC
        wbtc.mint(address(wrapper), withdrawAmount);

        wrapper.emergencyWithdraw(address(wbtc), withdrawAmount, custodyAddress);

        assertEq(wbtc.balanceOf(custodyAddress), withdrawAmount);
        assertEq(wbtc.balanceOf(address(wrapper)), 0);
        vm.stopPrank();
    }

    function test_EmergencyWithdraw_ZeroTokenAddress() public {
        vm.prank(owner);
        vm.expectRevert(SovaBTCWrapper.ZeroAddress.selector);
        wrapper.emergencyWithdraw(address(0), 1000, address(0x123));
    }

    function test_EmergencyWithdraw_ZeroToAddress() public {
        vm.prank(owner);
        vm.expectRevert(SovaBTCWrapper.ZeroAddress.selector);
        wrapper.emergencyWithdraw(address(wbtc), 1000, address(0));
    }

    function test_EmergencyWithdraw_ZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert(SovaBTCWrapper.ZeroAmount.selector);
        wrapper.emergencyWithdraw(address(wbtc), 0, address(0x123));
    }

    function test_EmergencyWithdraw_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        wrapper.emergencyWithdraw(address(wbtc), 1000, address(0x123));
    }

    function test_EmergencySweepToCustody_Success() public {
        uint256 wbtcAmount = 1 * 1e8;
        uint256 usdcAmount = 1000 * 1e6;

        address wbtcCustody = address(0x123);
        address usdcCustody = address(0x456);

        vm.startPrank(owner);

        // Set custody addresses
        custodyManager.setCustodyAddress(address(wbtc), wbtcCustody);
        custodyManager.setCustodyEnforcement(address(wbtc), true);
        custodyManager.setCustodyAddress(address(usdc), usdcCustody);
        custodyManager.setCustodyEnforcement(address(usdc), true);

        // Give wrapper tokens
        wbtc.mint(address(wrapper), wbtcAmount);
        usdc.mint(address(wrapper), usdcAmount);

        address[] memory tokens = new address[](2);
        tokens[0] = address(wbtc);
        tokens[1] = address(usdc);

        wrapper.emergencySweepToCustody(tokens);

        assertEq(wbtc.balanceOf(wbtcCustody), wbtcAmount);
        assertEq(usdc.balanceOf(usdcCustody), usdcAmount);
        assertEq(wbtc.balanceOf(address(wrapper)), 0);
        assertEq(usdc.balanceOf(address(wrapper)), 0);

        vm.stopPrank();
    }

    function test_EmergencySweepToCustody_NoCustodySet() public {
        uint256 wbtcAmount = 1 * 1e8;

        vm.startPrank(owner);

        // Give wrapper tokens but don't set custody
        wbtc.mint(address(wrapper), wbtcAmount);

        address[] memory tokens = new address[](1);
        tokens[0] = address(wbtc);

        wrapper.emergencySweepToCustody(tokens);

        // Tokens should remain in wrapper since no custody is set
        assertEq(wbtc.balanceOf(address(wrapper)), wbtcAmount);

        vm.stopPrank();
    }

    function test_EmergencySweepToCustody_CustodyNotEnforced() public {
        uint256 wbtcAmount = 1 * 1e8;
        address wbtcCustody = address(0x123);

        vm.startPrank(owner);

        // Set custody but don't enforce it
        custodyManager.setCustodyAddress(address(wbtc), wbtcCustody);
        custodyManager.setCustodyEnforcement(address(wbtc), false);
        wbtc.mint(address(wrapper), wbtcAmount);

        address[] memory tokens = new address[](1);
        tokens[0] = address(wbtc);

        wrapper.emergencySweepToCustody(tokens);

        // Tokens should remain since custody not enforced
        assertEq(wbtc.balanceOf(address(wrapper)), wbtcAmount);

        vm.stopPrank();
    }

    function test_EmergencySweepToCustody_OnlyOwner() public {
        address[] memory tokens = new address[](1);
        tokens[0] = address(wbtc);

        vm.prank(user1);
        vm.expectRevert();
        wrapper.emergencySweepToCustody(tokens);
    }

    // ============ View Functions Tests ============

    function test_GetTokenBalance() public {
        uint256 amount = 5 * 1e8;
        wbtc.mint(address(wrapper), amount);

        assertEq(wrapper.getTokenBalance(address(wbtc)), amount);
        assertEq(wrapper.getTokenBalance(address(usdc)), 0);
    }

    function test_GetCustodyConfig() public {
        address custodyAddress = address(0x123);

        vm.startPrank(owner);
        custodyManager.setCustodyAddress(address(wbtc), custodyAddress);
        custodyManager.setCustodyEnforcement(address(wbtc), true);
        vm.stopPrank();

        (address custody, bool enforced) = wrapper.getCustodyConfig(address(wbtc));
        assertEq(custody, custodyAddress);
        assertTrue(enforced);

        (custody, enforced) = wrapper.getCustodyConfig(address(usdc));
        assertEq(custody, address(0));
        assertFalse(enforced);
    }

    function test_IsAuthorizedCustodian() public {
        assertFalse(wrapper.isAuthorizedCustodian(user1));
        assertFalse(wrapper.isAuthorizedCustodian(custodian));

        vm.prank(owner);
        custodyManager.addCustodian(custodian);

        assertTrue(wrapper.isAuthorizedCustodian(custodian));
        assertFalse(wrapper.isAuthorizedCustodian(user1));
    }

    function test_GetAllCustodyTokens() public {
        address[] memory tokens = wrapper.getAllCustodyTokens();
        assertEq(tokens.length, 0);

        vm.startPrank(owner);
        custodyManager.setCustodyAddress(address(wbtc), address(0x123));
        custodyManager.setCustodyEnforcement(address(wbtc), true);
        custodyManager.setCustodyAddress(address(usdc), address(0x456));
        custodyManager.setCustodyEnforcement(address(usdc), true);
        vm.stopPrank();

        tokens = wrapper.getAllCustodyTokens();
        assertEq(tokens.length, 2);
    }

    // ============ Deposit with Redemption Queue Tests ============

    function test_Deposit_WithRedemptionQueue() public {
        vm.startPrank(owner);
        redemptionQueue = new RedemptionQueue(address(sovaBTC), address(whitelist), 10 days);
        sovaBTC.setBurner(address(redemptionQueue), true);
        wrapper.setRedemptionQueue(address(redemptionQueue));
        vm.stopPrank();

        uint256 depositAmount = 1 * 1e8;

        vm.startPrank(user1);
        wbtc.approve(address(wrapper), depositAmount);

        wrapper.deposit(address(wbtc), depositAmount);

        // Tokens should be transferred to redemption queue
        assertEq(wbtc.balanceOf(address(redemptionQueue)), depositAmount);
        assertEq(wbtc.balanceOf(address(wrapper)), 0);
        assertEq(sovaBTC.balanceOf(user1), depositAmount);

        vm.stopPrank();
    }

    function test_Deposit_WithoutRedemptionQueue() public {
        uint256 depositAmount = 1 * 1e8;

        vm.startPrank(user1);
        wbtc.approve(address(wrapper), depositAmount);

        wrapper.deposit(address(wbtc), depositAmount);

        // Tokens should remain in wrapper
        assertEq(wbtc.balanceOf(address(wrapper)), depositAmount);
        assertEq(sovaBTC.balanceOf(user1), depositAmount);

        vm.stopPrank();
    }

    // ============ Integration Tests ============

    function test_FullWorkflow_WithAllComponents() public {
        // Setup all components
        vm.startPrank(owner);
        redemptionQueue = new RedemptionQueue(address(sovaBTC), address(whitelist), 10 days);
        sovaBTC.setBurner(address(redemptionQueue), true);
        wrapper.setRedemptionQueue(address(redemptionQueue));
        custodyManager.addCustodian(custodian);
        custodyManager.setCustodyAddress(address(wbtc), address(0x999));
        custodyManager.setCustodyEnforcement(address(wbtc), true);
        vm.stopPrank();

        // User deposits
        uint256 depositAmount = 1 * 1e8;
        vm.startPrank(user1);
        wbtc.approve(address(wrapper), depositAmount);
        wrapper.deposit(address(wbtc), depositAmount);
        vm.stopPrank();

        // Verify state
        assertEq(sovaBTC.balanceOf(user1), depositAmount);
        assertEq(wbtc.balanceOf(address(redemptionQueue)), depositAmount);
        assertEq(wrapper.getAvailableReserve(address(wbtc)), depositAmount);
        assertTrue(wrapper.isAuthorizedCustodian(custodian));

        (address custody, bool enforced) = wrapper.getCustodyConfig(address(wbtc));
        assertEq(custody, address(0x999));
        assertTrue(enforced);
    }

    // ============ whenNotPaused Modifier Tests ============

    function test_Deposit_WhenPaused() public {
        vm.prank(owner);
        wrapper.pause();

        vm.startPrank(user1);
        wbtc.approve(address(wrapper), 1 * 1e8);

        vm.expectRevert(SovaBTCWrapper.ContractPaused.selector);
        wrapper.deposit(address(wbtc), 1 * 1e8);

        vm.stopPrank();
    }
}
