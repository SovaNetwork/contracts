// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CustodyManager.sol";
import "../src/SovaBTCWrapper.sol";
import "../src/TokenWhitelist.sol";
import "../src/RedemptionQueue.sol";
import "../src/SovaBTCOFT.sol";
import "./mocks/MockERC20BTC.sol";

/**
 * @title Task6_SecurityControls
 * @notice Comprehensive tests for Task 6 security controls and custody management
 */
contract Task6_SecurityControlsTest is Test {
    CustodyManager public custodyManager;
    SovaBTCWrapper public wrapper;
    TokenWhitelist public whitelist;
    RedemptionQueue public redemptionQueue;
    SovaBTCOFT public sovaBTC;

    MockERC20BTC public wbtc;
    MockERC20BTC public usdc;

    address public owner = address(0x1);
    address public custodian1 = address(0x2);
    address public custodian2 = address(0x3);
    address public user1 = address(0x4);
    address public user2 = address(0x5);
    address public custodyAddr1 = address(0x6);
    address public custodyAddr2 = address(0x7);
    address public attacker = address(0x8);

    address public lzEndpoint = address(0x999);

    bytes32 public constant CUSTODIAN_ROLE = keccak256("CUSTODIAN_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    bytes32 public constant CUSTODY_ADMIN_ROLE = keccak256("CUSTODY_ADMIN_ROLE");

    /* ----------------------- EVENTS ----------------------- */

    event CustodyAddressSet(
        address indexed token, address indexed oldCustody, address indexed newCustody, address admin
    );

    event CustodyEnforcementToggled(address indexed token, bool enforced, address admin);

    event CustodianAdded(address indexed custodian, address indexed admin);
    event CustodianRemoved(address indexed custodian, address indexed admin);

    event EmergencySweep(
        address indexed token, address indexed from, address indexed to, uint256 amount, address executor
    );

    /* ----------------------- SETUP ----------------------- */

    function setUp() public {
        vm.startPrank(owner);

        // Deploy mock tokens
        wbtc = new MockERC20BTC("Wrapped Bitcoin", "WBTC", 8);
        usdc = new MockERC20BTC("USD Coin", "USDC", 6);

        // Deploy core contracts
        custodyManager = new CustodyManager(owner);
        whitelist = new TokenWhitelist();
        whitelist.transferOwnership(owner);
        sovaBTC = new SovaBTCOFT("SovaBTC", "sovaBTC", lzEndpoint, owner);

        // Deploy wrapper with custody manager
        wrapper = new SovaBTCWrapper(
            address(sovaBTC),
            address(whitelist),
            address(custodyManager),
            10_000 // min deposit satoshi
        );

        // Deploy redemption queue
        redemptionQueue = new RedemptionQueue(
            address(sovaBTC),
            address(whitelist),
            864000 // 10 days
        );

        // Configure integrations
        wrapper.setRedemptionQueue(address(redemptionQueue));
        sovaBTC.setMinter(address(redemptionQueue)); // RedemptionQueue needs to burn tokens

        // Add wrapper as custodian to redemption queue so it can fulfill redemptions
        redemptionQueue.setCustodian(address(wrapper), true);

        // Setup token whitelist
        whitelist.addAllowedToken(address(wbtc));
        whitelist.addAllowedToken(address(usdc));

        // Set up custody addresses
        custodyManager.setCustodyAddress(address(wbtc), custodyAddr1);
        custodyManager.setCustodyAddress(address(usdc), custodyAddr2);

        // Add custodians
        custodyManager.addCustodian(custodian1);
        custodyManager.addCustodian(custodian2);

        // Mint tokens to users and owner
        wbtc.mint(user1, 10 * 10 ** 8); // 10 WBTC
        wbtc.mint(user2, 5 * 10 ** 8); // 5 WBTC
        wbtc.mint(owner, 10 * 10 ** 8); // 10 WBTC for owner
        usdc.mint(user1, 1000 * 10 ** 6); // 1000 USDC
        usdc.mint(owner, 1000 * 10 ** 6); // 1000 USDC for owner

        vm.stopPrank();
    }

    /* ----------------------- CUSTODY MANAGER TESTS ----------------------- */

    function test_CustodyManagerDeployment() public {
        assertEq(custodyManager.hasRole(custodyManager.DEFAULT_ADMIN_ROLE(), owner), true);
        assertEq(custodyManager.hasRole(CUSTODY_ADMIN_ROLE, owner), true);
        assertEq(custodyManager.hasRole(EMERGENCY_ROLE, owner), true);
        assertEq(custodyManager.hasRole(CUSTODIAN_ROLE, owner), true);
    }

    function test_SetCustodyAddress() public {
        vm.startPrank(owner);

        address newToken = address(0x123);
        address newCustody = address(0x456);

        vm.expectEmit(true, true, true, true);
        emit CustodyAddressSet(newToken, address(0), newCustody, owner);

        custodyManager.setCustodyAddress(newToken, newCustody);

        assertEq(custodyManager.custodyAddress(newToken), newCustody);

        vm.stopPrank();
    }

    function test_SetCustodyAddressOnlyAdmin() public {
        vm.startPrank(attacker);

        vm.expectRevert();
        custodyManager.setCustodyAddress(address(wbtc), address(0x999));

        vm.stopPrank();
    }

    function test_ToggleCustodyEnforcement() public {
        vm.startPrank(owner);

        // Initially not enforced
        assertFalse(custodyManager.isCustodyEnforced(address(wbtc)));

        vm.expectEmit(true, true, false, true);
        emit CustodyEnforcementToggled(address(wbtc), true, owner);

        custodyManager.setCustodyEnforcement(address(wbtc), true);
        assertTrue(custodyManager.isCustodyEnforced(address(wbtc)));

        custodyManager.setCustodyEnforcement(address(wbtc), false);
        assertFalse(custodyManager.isCustodyEnforced(address(wbtc)));

        vm.stopPrank();
    }

    function test_AddCustodian() public {
        vm.startPrank(owner);

        address newCustodian = address(0x999);

        vm.expectEmit(true, true, false, true);
        emit CustodianAdded(newCustodian, owner);

        custodyManager.addCustodian(newCustodian);
        assertTrue(custodyManager.isAuthorizedCustodian(newCustodian));

        vm.stopPrank();
    }

    function test_RemoveCustodian() public {
        vm.startPrank(owner);

        vm.expectEmit(true, true, false, true);
        emit CustodianRemoved(custodian1, owner);

        custodyManager.removeCustodian(custodian1);
        assertFalse(custodyManager.isAuthorizedCustodian(custodian1));

        vm.stopPrank();
    }

    function test_BatchAddCustodians() public {
        vm.startPrank(owner);

        address[] memory newCustodians = new address[](3);
        newCustodians[0] = address(0x111);
        newCustodians[1] = address(0x222);
        newCustodians[2] = address(0x333);

        custodyManager.batchAddCustodians(newCustodians);

        for (uint256 i = 0; i < newCustodians.length; i++) {
            assertTrue(custodyManager.isAuthorizedCustodian(newCustodians[i]));
        }

        vm.stopPrank();
    }

    /* ----------------------- CUSTODY VALIDATION TESTS ----------------------- */

    function test_ValidateDestinationWhenNotEnforced() public {
        // Should not revert when custody not enforced
        custodyManager.validateDestination(address(wbtc), address(0x999));
    }

    function test_ValidateDestinationWhenEnforced() public {
        vm.startPrank(owner);

        custodyManager.setCustodyEnforcement(address(wbtc), true);

        // Should not revert when destination is custody address
        custodyManager.validateDestination(address(wbtc), custodyAddr1);

        // Should revert when destination is not custody address
        vm.expectRevert(
            abi.encodeWithSelector(
                CustodyManager.InvalidCustodyAddress.selector, address(wbtc), address(0x999), custodyAddr1
            )
        );
        custodyManager.validateDestination(address(wbtc), address(0x999));

        vm.stopPrank();
    }

    /* ----------------------- WRAPPER CUSTODY INTEGRATION TESTS ----------------------- */

    function test_WrapperCustodyConfig() public {
        (address custody, bool enforced) = wrapper.getCustodyConfig(address(wbtc));
        assertEq(custody, custodyAddr1);
        assertFalse(enforced); // Initially not enforced
    }

    function test_IsAuthorizedCustodianThroughWrapper() public {
        assertTrue(wrapper.isAuthorizedCustodian(custodian1));
        assertFalse(wrapper.isAuthorizedCustodian(attacker));
    }

    function test_FulfillRedemptionOnlyAuthorizedCustodian() public {
        // Setup: Give user SovaBTC and put reserves in redemption queue
        vm.startPrank(address(redemptionQueue));
        sovaBTC.adminMint(user1, 1 * 10 ** 8);
        vm.stopPrank();

        vm.startPrank(owner);
        wbtc.transfer(address(redemptionQueue), 1 * 10 ** 8);
        vm.stopPrank();

        // Setup redemption request
        vm.startPrank(user1);
        redemptionQueue.redeem(address(wbtc), 1 * 10 ** 8);
        vm.stopPrank();

        // Fast forward time to make redemption ready
        vm.warp(block.timestamp + 864001);

        // Should fail for non-custodian
        vm.startPrank(attacker);
        vm.expectRevert(abi.encodeWithSelector(SovaBTCWrapper.UnauthorizedCustodian.selector, attacker));
        wrapper.fulfillRedemption(user1);
        vm.stopPrank();

        // Should succeed for custodian
        vm.startPrank(custodian1);
        wrapper.fulfillRedemption(user1);
        vm.stopPrank();
    }

    function test_EmergencyWithdrawWithCustodyValidation() public {
        // Give wrapper some tokens
        vm.startPrank(user1);
        wbtc.transfer(address(wrapper), 1 * 10 ** 8);
        vm.stopPrank();

        vm.startPrank(owner);

        // Should succeed when custody not enforced
        wrapper.emergencyWithdraw(address(wbtc), 0.5 * 10 ** 8, address(0x999));

        // Enable custody enforcement
        custodyManager.setCustodyEnforcement(address(wbtc), true);

        // Should fail when not sending to custody address
        vm.expectRevert();
        wrapper.emergencyWithdraw(address(wbtc), 0.5 * 10 ** 8, address(0x999));

        // Should succeed when sending to custody address
        wrapper.emergencyWithdraw(address(wbtc), 0.5 * 10 ** 8, custodyAddr1);

        vm.stopPrank();
    }

    function test_EmergencySweepToCustody() public {
        // Give wrapper some tokens
        vm.startPrank(user1);
        wbtc.transfer(address(wrapper), 1 * 10 ** 8);
        usdc.transfer(address(wrapper), 100 * 10 ** 6);
        vm.stopPrank();

        vm.startPrank(owner);

        // Enable custody enforcement
        custodyManager.setCustodyEnforcement(address(wbtc), true);
        custodyManager.setCustodyEnforcement(address(usdc), true);

        address[] memory tokens = new address[](2);
        tokens[0] = address(wbtc);
        tokens[1] = address(usdc);

        uint256 wbtcCustodyBefore = wbtc.balanceOf(custodyAddr1);
        uint256 usdcCustodyBefore = usdc.balanceOf(custodyAddr2);

        wrapper.emergencySweepToCustody(tokens);

        assertEq(wbtc.balanceOf(custodyAddr1), wbtcCustodyBefore + 1 * 10 ** 8);
        assertEq(usdc.balanceOf(custodyAddr2), usdcCustodyBefore + 100 * 10 ** 6);
        assertEq(wbtc.balanceOf(address(wrapper)), 0);
        assertEq(usdc.balanceOf(address(wrapper)), 0);

        vm.stopPrank();
    }

    /* ----------------------- EMERGENCY FUNCTIONS TESTS ----------------------- */

    function test_EmergencySweepDirect() public {
        // Give wrapper some tokens and approve for sweep
        vm.startPrank(user1);
        wbtc.transfer(address(wrapper), 1 * 10 ** 8);
        vm.stopPrank();

        vm.startPrank(address(wrapper));
        wbtc.approve(address(custodyManager), 1 * 10 ** 8);
        vm.stopPrank();

        vm.startPrank(owner);

        uint256 custodyBefore = wbtc.balanceOf(custodyAddr1);

        vm.expectEmit(true, true, true, true);
        emit EmergencySweep(address(wbtc), address(wrapper), custodyAddr1, 1 * 10 ** 8, owner);

        custodyManager.emergencySweep(address(wbtc), address(wrapper), 1 * 10 ** 8);

        assertEq(wbtc.balanceOf(custodyAddr1), custodyBefore + 1 * 10 ** 8);

        vm.stopPrank();
    }

    function test_EmergencyPause() public {
        vm.startPrank(owner);

        assertFalse(custodyManager.paused());

        custodyManager.emergencyPause();
        assertTrue(custodyManager.paused());

        custodyManager.emergencyUnpause();
        assertFalse(custodyManager.paused());

        vm.stopPrank();
    }

    function test_EmergencyFunctionsOnlyEmergencyRole() public {
        vm.startPrank(attacker);

        vm.expectRevert();
        custodyManager.emergencyPause();

        vm.expectRevert();
        custodyManager.emergencySweep(address(wbtc), address(wrapper), 1 * 10 ** 8);

        vm.stopPrank();
    }

    /* ----------------------- ACCESS CONTROL TESTS ----------------------- */

    function test_OnlyAdminCanManageCustodians() public {
        vm.startPrank(attacker);

        vm.expectRevert();
        custodyManager.addCustodian(address(0x999));

        vm.expectRevert();
        custodyManager.removeCustodian(custodian1);

        vm.stopPrank();
    }

    function test_OnlyCustodyAdminCanSetCustody() public {
        vm.startPrank(attacker);

        vm.expectRevert();
        custodyManager.setCustodyAddress(address(wbtc), address(0x999));

        vm.expectRevert();
        custodyManager.setCustodyEnforcement(address(wbtc), true);

        vm.stopPrank();
    }

    /* ----------------------- VIEW FUNCTIONS TESTS ----------------------- */

    function test_GetAllCustodyTokens() public {
        address[] memory tokens = custodyManager.getAllCustodyTokens();
        assertEq(tokens.length, 2);

        bool foundWBTC = false;
        bool foundUSDC = false;

        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == address(wbtc)) foundWBTC = true;
            if (tokens[i] == address(usdc)) foundUSDC = true;
        }

        assertTrue(foundWBTC);
        assertTrue(foundUSDC);
    }

    function test_GetCustodyConfig() public {
        (address custody, bool enforced) = custodyManager.getCustodyConfig(address(wbtc));
        assertEq(custody, custodyAddr1);
        assertFalse(enforced);
    }

    function test_GetCustodianCount() public {
        uint256 count = custodyManager.getCustodianCount();
        assertEq(count, 3); // owner + custodian1 + custodian2
    }

    function test_GetCustodianAtIndex() public {
        address custodian = custodyManager.getCustodianAtIndex(0);
        // Should be one of the custodians (order not guaranteed)
        assertTrue(custodian == owner || custodian == custodian1 || custodian == custodian2);
    }

    /* ----------------------- INTEGRATION TESTS ----------------------- */

    function test_EndToEndRedemptionWithCustody() public {
        vm.startPrank(owner);
        custodyManager.setCustodyEnforcement(address(wbtc), true);
        wbtc.transfer(address(redemptionQueue), 2 * 10 ** 8);
        vm.stopPrank();

        // Setup: Give user SovaBTC
        vm.startPrank(address(redemptionQueue));
        sovaBTC.adminMint(user1, 2 * 10 ** 8);
        vm.stopPrank();

        // User requests redemption
        vm.startPrank(user1);
        redemptionQueue.redeem(address(wbtc), 2 * 10 ** 8);
        vm.stopPrank();

        // Fast forward time
        vm.warp(block.timestamp + 864001);

        // Custodian fulfills redemption (should work despite custody enforcement)
        vm.startPrank(custodian1);

        uint256 userWBTCBefore = wbtc.balanceOf(user1);
        wrapper.fulfillRedemption(user1);
        uint256 userWBTCAfter = wbtc.balanceOf(user1);

        assertEq(userWBTCAfter, userWBTCBefore + 2 * 10 ** 8);

        vm.stopPrank();
    }

    function test_BatchRedemptionWithMultipleCustodyTokens() public {
        vm.startPrank(owner);
        custodyManager.setCustodyEnforcement(address(wbtc), true);
        custodyManager.setCustodyEnforcement(address(usdc), true);
        vm.stopPrank();

        // Setup reserves and mint SovaBTC to users
        vm.startPrank(owner);
        wbtc.transfer(address(redemptionQueue), 1 * 10 ** 8);
        usdc.transfer(address(redemptionQueue), 500 * 10 ** 6);
        vm.stopPrank();

        vm.startPrank(address(redemptionQueue));
        sovaBTC.adminMint(user1, 1 * 10 ** 8);
        sovaBTC.adminMint(user2, 500 * 10 ** 8);
        vm.stopPrank();

        // Setup multiple redemptions
        vm.startPrank(user1);
        redemptionQueue.redeem(address(wbtc), 1 * 10 ** 8);
        vm.stopPrank();

        vm.startPrank(user2);
        redemptionQueue.redeem(address(usdc), 500 * 10 ** 8); // 500 sovaBTC (converted)
        vm.stopPrank();

        // Fast forward time
        vm.warp(block.timestamp + 864001);

        // Batch fulfill
        vm.startPrank(custodian1);

        address[] memory users = new address[](2);
        users[0] = user1;
        users[1] = user2;

        wrapper.batchFulfillRedemptions(users);

        vm.stopPrank();
    }

    /* ----------------------- EDGE CASES AND ERROR CONDITIONS ----------------------- */

    function test_ZeroAddressValidation() public {
        vm.startPrank(owner);

        vm.expectRevert(CustodyManager.ZeroAddress.selector);
        custodyManager.setCustodyAddress(address(0), custodyAddr1);

        vm.expectRevert(CustodyManager.ZeroAddress.selector);
        custodyManager.setCustodyAddress(address(wbtc), address(0));

        vm.expectRevert(CustodyManager.ZeroAddress.selector);
        custodyManager.addCustodian(address(0));

        vm.stopPrank();
    }

    function test_RemoveCustodyAddressCleanup() public {
        vm.startPrank(owner);

        uint256 tokenCountBefore = custodyManager.getAllCustodyTokens().length;

        custodyManager.removeCustodyAddress(address(wbtc));

        uint256 tokenCountAfter = custodyManager.getAllCustodyTokens().length;
        assertEq(tokenCountAfter, tokenCountBefore - 1);

        assertEq(custodyManager.custodyAddress(address(wbtc)), address(0));
        assertFalse(custodyManager.isCustodyEnforced(address(wbtc)));

        vm.stopPrank();
    }

    function test_SetEnforcementOnNonExistentCustody() public {
        vm.startPrank(owner);

        address nonExistentToken = address(0x999);

        vm.expectRevert(abi.encodeWithSelector(CustodyManager.CustodyNotSet.selector, nonExistentToken));
        custodyManager.setCustodyEnforcement(nonExistentToken, true);

        vm.stopPrank();
    }
}
