// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CustodyManager.sol";
import "./mocks/MockERC20BTC.sol";

/**
 * @title TestCustodyManager
 * @notice Test contract that extends CustodyManager to use the onlyValidDestination modifier
 */
contract TestCustodyManager is CustodyManager {
    constructor(address admin) CustodyManager(admin) {}
    
    /**
     * @notice Test function that uses the onlyValidDestination modifier
     * @param token The token address
     * @param destination The destination address
     */
    function testModifierFunction(address token, address destination) 
        external 
        view 
        onlyValidDestination(token, destination) 
        returns (bool) 
    {
        return true;
    }
}

/**
 * @title CustodyManagerCoverageTest
 * @notice Focused test suite to achieve 100% coverage for CustodyManager contract
 */
contract CustodyManagerCoverageTest is Test {
    CustodyManager public custodyManager;
    TestCustodyManager public testCustodyManager;
    MockERC20BTC public token1;
    MockERC20BTC public token2;
    MockERC20BTC public token3;
    
    address public admin = address(0x1);
    address public user1 = address(0x2);
    address public custodian = address(0x3);
    address public custodyAddr = address(0x4);
    
    bytes32 public constant CUSTODIAN_ROLE = keccak256("CUSTODIAN_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    bytes32 public constant CUSTODY_ADMIN_ROLE = keccak256("CUSTODY_ADMIN_ROLE");
    
    function setUp() public {
        vm.startPrank(admin);
        custodyManager = new CustodyManager(admin);
        testCustodyManager = new TestCustodyManager(admin);
        
        token1 = new MockERC20BTC("Token1", "TK1", 18);
        token2 = new MockERC20BTC("Token2", "TK2", 18);
        token3 = new MockERC20BTC("Token3", "TK3", 18);
        
        vm.stopPrank();
    }

    // ============ Constructor Edge Cases ============

    function test_Constructor_ZeroAddress() public {
        vm.expectRevert(CustodyManager.ZeroAddress.selector);
        new CustodyManager(address(0));
    }

    // ============ Emergency Functions Edge Cases ============

    function test_EmergencySweep_ZeroTokenAddress() public {
        vm.prank(admin);
        vm.expectRevert(CustodyManager.ZeroAddress.selector);
        custodyManager.emergencySweep(address(0), user1, 100);
    }

    function test_EmergencySweep_ZeroFromAddress() public {
        vm.prank(admin);
        vm.expectRevert(CustodyManager.ZeroAddress.selector);
        custodyManager.emergencySweep(address(token1), address(0), 100);
    }

    function test_EmergencySweep_ZeroAmount() public {
        vm.prank(admin);
        vm.expectRevert(CustodyManager.ZeroAddress.selector);
        custodyManager.emergencySweep(address(token1), user1, 0);
    }

    function test_EmergencySweep_CustodyNotSet() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(CustodyManager.CustodyNotSet.selector, address(token1)));
        custodyManager.emergencySweep(address(token1), user1, 100);
    }

    function test_EmergencySweep_OnlyEmergencyRole() public {
        vm.startPrank(admin);
        custodyManager.setCustodyAddress(address(token1), custodyAddr);
        vm.stopPrank();
        
        vm.prank(user1);
        vm.expectRevert();
        custodyManager.emergencySweep(address(token1), user1, 100);
    }

    function test_EmergencyPause_OnlyEmergencyRole() public {
        vm.prank(user1);
        vm.expectRevert();
        custodyManager.emergencyPause();
    }

    function test_EmergencyUnpause_OnlyEmergencyRole() public {
        vm.startPrank(admin);
        custodyManager.emergencyPause();
        vm.stopPrank();
        
        vm.prank(user1);
        vm.expectRevert();
        custodyManager.emergencyUnpause();
    }

    // ============ Batch Add Custodians Edge Cases ============

    function test_BatchAddCustodians_WithZeroAddresses() public {
        address[] memory custodians = new address[](3);
        custodians[0] = user1;
        custodians[1] = address(0); // Zero address should be skipped
        custodians[2] = custodian;
        
        vm.prank(admin);
        custodyManager.batchAddCustodians(custodians);
        
        // Only non-zero addresses should be added
        assertTrue(custodyManager.isAuthorizedCustodian(user1));
        assertFalse(custodyManager.isAuthorizedCustodian(address(0)));
        assertTrue(custodyManager.isAuthorizedCustodian(custodian));
    }

    function test_BatchAddCustodians_EmptyArray() public {
        address[] memory custodians = new address[](0);
        
        vm.prank(admin);
        custodyManager.batchAddCustodians(custodians); // Should not revert
    }

    function test_BatchAddCustodians_OnlyZeroAddresses() public {
        address[] memory custodians = new address[](2);
        custodians[0] = address(0);
        custodians[1] = address(0);
        
        vm.prank(admin);
        custodyManager.batchAddCustodians(custodians); // Should not revert but add nothing
    }

    function test_BatchAddCustodians_OnlyAdmin() public {
        address[] memory custodians = new address[](1);
        custodians[0] = user1;
        
        vm.prank(user1);
        vm.expectRevert();
        custodyManager.batchAddCustodians(custodians);
    }

    // ============ Custody List Management Edge Cases ============

    function test_RemoveCustodyAddress_MultipleTokens() public {
        vm.startPrank(admin);
        
        // Add multiple tokens
        custodyManager.setCustodyAddress(address(token1), custodyAddr);
        custodyManager.setCustodyAddress(address(token2), custodyAddr);
        custodyManager.setCustodyAddress(address(token3), custodyAddr);
        
        assertEq(custodyManager.getAllCustodyTokens().length, 3);
        
        // Remove middle token
        custodyManager.removeCustodyAddress(address(token2));
        
        address[] memory tokens = custodyManager.getAllCustodyTokens();
        assertEq(tokens.length, 2);
        
        // Verify token2 is not in the list
        bool found = false;
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == address(token2)) {
                found = true;
                break;
            }
        }
        assertFalse(found);
        
        vm.stopPrank();
    }

    function test_RemoveCustodyAddress_LastToken() public {
        vm.startPrank(admin);
        
        custodyManager.setCustodyAddress(address(token1), custodyAddr);
        custodyManager.setCustodyAddress(address(token2), custodyAddr);
        
        // Remove last token
        custodyManager.removeCustodyAddress(address(token2));
        
        address[] memory tokens = custodyManager.getAllCustodyTokens();
        assertEq(tokens.length, 1);
        assertEq(tokens[0], address(token1));
        
        vm.stopPrank();
    }

    function test_RemoveCustodyAddress_FirstToken() public {
        vm.startPrank(admin);
        
        custodyManager.setCustodyAddress(address(token1), custodyAddr);
        custodyManager.setCustodyAddress(address(token2), custodyAddr);
        
        // Remove first token
        custodyManager.removeCustodyAddress(address(token1));
        
        address[] memory tokens = custodyManager.getAllCustodyTokens();
        assertEq(tokens.length, 1);
        assertEq(tokens[0], address(token2));
        
        vm.stopPrank();
    }

    function test_RemoveCustodyAddress_NonExistentToken() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(CustodyManager.CustodyNotSet.selector, address(token1)));
        custodyManager.removeCustodyAddress(address(token1));
    }

    function test_RemoveCustodyAddress_OnlyAdmin() public {
        vm.startPrank(admin);
        custodyManager.setCustodyAddress(address(token1), custodyAddr);
        vm.stopPrank();
        
        vm.prank(user1);
        vm.expectRevert();
        custodyManager.removeCustodyAddress(address(token1));
    }

    // ============ Access Control Edge Cases ============

    function test_SetCustodyAddress_OnlyAdmin() public {
        vm.prank(user1);
        vm.expectRevert();
        custodyManager.setCustodyAddress(address(token1), custodyAddr);
    }

    function test_SetCustodyEnforcement_OnlyAdmin() public {
        vm.startPrank(admin);
        custodyManager.setCustodyAddress(address(token1), custodyAddr);
        vm.stopPrank();
        
        vm.prank(user1);
        vm.expectRevert();
        custodyManager.setCustodyEnforcement(address(token1), true);
    }

    function test_AddCustodian_OnlyAdmin() public {
        vm.prank(user1);
        vm.expectRevert();
        custodyManager.addCustodian(custodian);
    }

    function test_RemoveCustodian_OnlyAdmin() public {
        vm.prank(user1);
        vm.expectRevert();
        custodyManager.removeCustodian(custodian);
    }

    // ============ Validation Edge Cases ============

    function test_ValidateDestination_NotEnforced() public {
        vm.startPrank(admin);
        custodyManager.setCustodyAddress(address(token1), custodyAddr);
        // Don't enforce
        vm.stopPrank();
        
        // Should not revert for any destination when not enforced
        custodyManager.validateDestination(address(token1), user1);
        custodyManager.validateDestination(address(token1), address(0x999));
    }

    function test_ValidateDestination_NoCustodySet() public {
        // Should not revert when no custody is set
        custodyManager.validateDestination(address(token1), user1);
        custodyManager.validateDestination(address(token1), address(0x999));
    }

    function test_ValidateDestination_EnforcedWrongAddress() public {
        vm.startPrank(admin);
        custodyManager.setCustodyAddress(address(token1), custodyAddr);
        custodyManager.setCustodyEnforcement(address(token1), true);
        vm.stopPrank();
        
        vm.expectRevert(
            abi.encodeWithSelector(
                CustodyManager.InvalidCustodyAddress.selector,
                address(token1),
                user1,
                custodyAddr
            )
        );
        custodyManager.validateDestination(address(token1), user1);
    }

    function test_ValidateDestination_EnforcedCorrectAddress() public {
        vm.startPrank(admin);
        custodyManager.setCustodyAddress(address(token1), custodyAddr);
        custodyManager.setCustodyEnforcement(address(token1), true);
        vm.stopPrank();
        
        // Should not revert for correct custody address
        custodyManager.validateDestination(address(token1), custodyAddr);
    }

    // ============ Role Management Edge Cases ============

    function test_RemoveCustodian_ZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(CustodyManager.ZeroAddress.selector);
        custodyManager.removeCustodian(address(0));
    }

    function test_AddCustodian_ZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(CustodyManager.ZeroAddress.selector);
        custodyManager.addCustodian(address(0));
    }

    // ============ View Functions Edge Cases ============

    function test_GetCustodianAtIndex_ValidIndex() public {
        vm.startPrank(admin);
        custodyManager.addCustodian(custodian);
        vm.stopPrank();
        
        // Admin is custodian by default, so custodian should be at index 1
        address retrieved = custodyManager.getCustodianAtIndex(1);
        assertEq(retrieved, custodian);
    }

    function test_IsAuthorizedCustodian_False() public {
        assertFalse(custodyManager.isAuthorizedCustodian(user1));
    }

    function test_IsAuthorizedCustodian_True() public {
        vm.prank(admin);
        custodyManager.addCustodian(user1);
        
        assertTrue(custodyManager.isAuthorizedCustodian(user1));
    }

    function test_IsCustodyEnforced_False() public {
        assertFalse(custodyManager.isCustodyEnforced(address(token1)));
    }

    function test_GetCustodyConfig_Default() public {
        (address custody, bool enforced) = custodyManager.getCustodyConfig(address(token1));
        assertEq(custody, address(0));
        assertFalse(enforced);
    }

    // ============ Integration Tests ============

    function test_FullWorkflow_MultipleCustodyTokens() public {
        vm.startPrank(admin);
        
        // Set up multiple tokens with custody
        custodyManager.setCustodyAddress(address(token1), address(0x111));
        custodyManager.setCustodyAddress(address(token2), address(0x222));
        custodyManager.setCustodyAddress(address(token3), address(0x333));
        
        // Enable enforcement for some
        custodyManager.setCustodyEnforcement(address(token1), true);
        custodyManager.setCustodyEnforcement(address(token3), true);
        
        // Add multiple custodians
        custodyManager.addCustodian(user1);
        custodyManager.addCustodian(custodian);
        
        vm.stopPrank();
        
        // Verify state
        assertEq(custodyManager.getAllCustodyTokens().length, 3);
        assertTrue(custodyManager.isCustodyEnforced(address(token1)));
        assertFalse(custodyManager.isCustodyEnforced(address(token2)));
        assertTrue(custodyManager.isCustodyEnforced(address(token3)));
        assertTrue(custodyManager.isAuthorizedCustodian(user1));
        assertTrue(custodyManager.isAuthorizedCustodian(custodian));
        
        // Test validation
        custodyManager.validateDestination(address(token1), address(0x111)); // Should pass
        custodyManager.validateDestination(address(token2), address(0x999)); // Should pass (not enforced)
        
        vm.expectRevert();
        custodyManager.validateDestination(address(token3), address(0x999)); // Should fail (enforced)
    }

    function test_SetCustodyAddress_OverwriteExisting() public {
        vm.startPrank(admin);
        
        // Set initial custody
        custodyManager.setCustodyAddress(address(token1), address(0x111));
        assertEq(custodyManager.getAllCustodyTokens().length, 1);
        
        // Overwrite with new custody - should not add to list again
        custodyManager.setCustodyAddress(address(token1), address(0x222));
        assertEq(custodyManager.getAllCustodyTokens().length, 1);
        
        (address custody, ) = custodyManager.getCustodyConfig(address(token1));
        assertEq(custody, address(0x222));
        
        vm.stopPrank();
    }

    function test_SetCustodyEnforcement_CustodyNotSet() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(CustodyManager.CustodyNotSet.selector, address(token1)));
        custodyManager.setCustodyEnforcement(address(token1), true);
    }

    // ============ Test Unused Modifier Coverage ============

    function test_OnlyValidDestination_ModifierCoverage() public {
        vm.startPrank(admin);
        
        // Setup custody with enforcement in test contract
        testCustodyManager.setCustodyAddress(address(token1), custodyAddr);
        testCustodyManager.setCustodyEnforcement(address(token1), true);
        
        vm.stopPrank();
        
        // Test the modifier with valid custody address - should pass
        bool result = testCustodyManager.testModifierFunction(address(token1), custodyAddr);
        assertTrue(result);
        
        // Test the modifier with invalid custody address - should revert
        vm.expectRevert(
            abi.encodeWithSelector(
                CustodyManager.InvalidCustodyAddress.selector,
                address(token1),
                user1,
                custodyAddr
            )
        );
        testCustodyManager.testModifierFunction(address(token1), user1);
    }

    function test_OnlyValidDestination_ModifierNotEnforced() public {
        vm.startPrank(admin);
        
        // Setup custody without enforcement
        testCustodyManager.setCustodyAddress(address(token1), custodyAddr);
        // Don't enforce custody
        
        vm.stopPrank();
        
        // Should pass for any destination when not enforced
        bool result = testCustodyManager.testModifierFunction(address(token1), user1);
        assertTrue(result);
        
        result = testCustodyManager.testModifierFunction(address(token1), custodyAddr);
        assertTrue(result);
    }
} 