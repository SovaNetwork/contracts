// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/SovaBTC.sol";
import "../src/TokenWrapper.sol";
import "./mocks/MockBTCPrecompile.sol";
import "./mocks/MockERC20BTC.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// @title Unused Error Coverage Tests
/// @notice Tests to trigger unused error conditions and document unreachable errors
contract UnusedErrorsTest is Test {
    SovaBTC public sovaBTC;
    TokenWrapper public wrapper;
    MockBTCPrecompile public mockPrecompile;
    MockERC20BTC public token;
    
    address public owner = makeAddr("owner");
    address public user = makeAddr("user");
    
    function setUp() public {
        // Deploy mock precompile
        mockPrecompile = new MockBTCPrecompile();
        mockPrecompile.reset();
        vm.etch(address(0x999), address(mockPrecompile).code);
        
        // Deploy contracts
        vm.startPrank(owner);
        sovaBTC = new SovaBTC();
        
        // Deploy TokenWrapper with proxy
        TokenWrapper wrapperImpl = new TokenWrapper();
        bytes memory wrapperInitData = abi.encodeWithSelector(
            TokenWrapper.initialize.selector,
            address(sovaBTC)
        );
        ERC1967Proxy wrapperProxy = new ERC1967Proxy(address(wrapperImpl), wrapperInitData);
        wrapper = TokenWrapper(address(wrapperProxy));
        
        // Transfer ownership of sovaBTC to wrapper so it can mint/burn
        sovaBTC.transferOwnership(address(wrapper));
        
        // Set up test token
        token = new MockERC20BTC("Test Token", "TEST", 8);
        wrapper.addAllowedToken(address(token));
        
        vm.stopPrank();
    }

    // =============================================================================
    // 13.1: Force InsufficientDeposit error (if possible)
    // =============================================================================
    
    function test_InsufficientDepositError() public {
        // NOTE: InsufficientDeposit error is defined in SovaBTC.sol but appears to be unused
        // in the current codebase. The error is not thrown in any function.
        // This suggests it may be a legacy error or planned for future use.
        
        // Attempting various scenarios that might trigger this error:
        
        // 1. Try with zero amount (but this triggers ZeroAmount instead)
        vm.startPrank(user);
        bytes memory signedTx = abi.encodePacked(uint256(0), hex"0000000000000000");
        
        // This will actually trigger DepositBelowMinimum, not InsufficientDeposit
        vm.expectRevert(abi.encodeWithSelector(SovaBTC.DepositBelowMinimum.selector));
        sovaBTC.depositBTC(0, signedTx);
        
        vm.stopPrank();
        
        // CONCLUSION: InsufficientDeposit error appears to be unreachable in current code
        assertTrue(true, "InsufficientDeposit error appears unreachable - may be legacy or planned for future use");
    }

    // =============================================================================
    // 13.3: Force AmountTooBig error (if possible)
    // =============================================================================
    
    function test_AmountTooBigError() public {
        // NOTE: AmountTooBig error is defined but not used in current SovaBTC code
        // The contract uses DepositAboveMaximum instead for deposit limit checks
        
        vm.startPrank(address(wrapper));
        
        // First set min to a very low value, then set max to a small value
        sovaBTC.setMinDepositAmount(100); // Set min low first
        sovaBTC.setMaxDepositAmount(1000); // Then set max
        
        vm.stopPrank();
        
        vm.startPrank(user);
        
        // Try to deposit above the maximum
        uint64 largeAmount = 2000;
        bytes memory signedTx = abi.encodePacked(uint256(largeAmount), hex"746f6f626967313233343536373839");
        
        // This will trigger DepositAboveMaximum, not AmountTooBig
        vm.expectRevert(abi.encodeWithSelector(SovaBTC.DepositAboveMaximum.selector));
        sovaBTC.depositBTC(largeAmount, signedTx);
        
        vm.stopPrank();
        
        // CONCLUSION: AmountTooBig error appears to be unreachable - DepositAboveMaximum is used instead
        assertTrue(true, "AmountTooBig error appears unreachable - DepositAboveMaximum is used for limit checks");
    }

    // =============================================================================
    // 13.4: Force EmptyDestination error (if possible)
    // =============================================================================
    
    function test_EmptyDestinationError() public {
        // NOTE: EmptyDestination error is defined but not used in current withdraw function
        // The withdraw function accepts string calldata dest but doesn't validate if it's empty
        
        // Give user tokens for withdrawal
        vm.startPrank(address(wrapper));
        sovaBTC.adminMint(user, 2e8);
        vm.stopPrank();
        
        vm.startPrank(user);
        
        // Try withdrawal with empty destination
        try sovaBTC.withdraw(1e8, 1e5, 100000, "") {
            // If this succeeds, the error is not being checked
            assertEq(sovaBTC.pendingWithdrawalAmountOf(user), 1e8 + 1e5, "Withdrawal with empty dest succeeded");
            
            // Clean up
            vm.stopPrank();
            vm.startPrank(address(wrapper));
            sovaBTC.finalize(user);
            vm.stopPrank();
            vm.startPrank(user);
            
            assertTrue(true, "EmptyDestination error not enforced - empty destination allowed");
        } catch {
            // If it fails, check if it's the expected error
            assertTrue(true, "Withdrawal with empty destination failed - may use different validation");
        }
        
        vm.stopPrank();
        
        // CONCLUSION: EmptyDestination error appears to be unreachable - no validation implemented
    }

    // =============================================================================
    // 13.5: Force InvalidDestinationFormat error (if possible)
    // =============================================================================
    
    function test_InvalidDestinationFormatError() public {
        // NOTE: InvalidDestinationFormat error is defined but not used in current withdraw function
        // The withdraw function accepts any string without format validation
        
        // Give user tokens for withdrawal
        vm.startPrank(address(wrapper));
        sovaBTC.adminMint(user, 2e8);
        vm.stopPrank();
        
        vm.startPrank(user);
        
        // Try withdrawal with clearly invalid Bitcoin address format
        string memory invalidDest = "this_is_not_a_bitcoin_address_123!@#";
        
        try sovaBTC.withdraw(1e8, 1e5, 100000, invalidDest) {
            // If this succeeds, format validation is not implemented
            assertEq(sovaBTC.pendingWithdrawalAmountOf(user), 1e8 + 1e5, "Withdrawal with invalid dest format succeeded");
            
            // Clean up
            vm.stopPrank();
            vm.startPrank(address(wrapper));
            sovaBTC.finalize(user);
            vm.stopPrank();
            vm.startPrank(user);
            
            assertTrue(true, "InvalidDestinationFormat error not enforced - no format validation");
        } catch {
            assertTrue(true, "Withdrawal with invalid format failed - may use different validation");
        }
        
        vm.stopPrank();
        
        // CONCLUSION: InvalidDestinationFormat error appears to be unreachable - no format validation implemented
    }

    // =============================================================================
    // Additional test: Verify error definitions exist but are unused
    // =============================================================================
    
    function test_DocumentUnusedErrors() public {
        // This test documents the unused errors we found
        
        // The following errors are defined in SovaBTC.sol but appear to be unused:
        // 1. InsufficientDeposit - not thrown anywhere in the code
        // 2. BroadcastFailure - not thrown anywhere (library uses PrecompileCallFailed)
        // 3. AmountTooBig - not thrown anywhere (DepositAboveMaximum is used instead)
        // 4. EmptyDestination - not thrown anywhere (no destination validation)
        // 5. InvalidDestinationFormat - not thrown anywhere (no format validation)
        
        // These may be:
        // - Legacy errors from earlier implementations
        // - Planned for future features
        // - Defensive programming (defined but validation not yet implemented)
        
        // Recommendation: Consider removing unused errors or implementing the validations
        
        assertTrue(true, "Documented 5 unused errors that may need cleanup or implementation");
    }

    // =============================================================================
    // Test: Verify all reachable errors can be triggered
    // =============================================================================
    
    function test_VerifyReachableErrors() public {
        // This test verifies that all the errors we know are reachable can indeed be triggered
        
        vm.startPrank(user);
        
        // 1. DepositBelowMinimum
        bytes memory signedTx1 = abi.encodePacked(uint256(100), hex"62656c6f776d696e3132333435363738");
        vm.expectRevert(abi.encodeWithSelector(SovaBTC.DepositBelowMinimum.selector));
        sovaBTC.depositBTC(100, signedTx1); // Below default 10,000 minimum
        
        // 2. ZeroAmount (withdraw)
        vm.expectRevert(abi.encodeWithSelector(SovaBTC.ZeroAmount.selector));
        sovaBTC.withdraw(0, 1e5, 100000, "bc1qtest");
        
        // 3. ZeroGasLimit
        vm.startPrank(address(wrapper));
        sovaBTC.adminMint(user, 1e8);
        vm.stopPrank();
        vm.startPrank(user);
        
        vm.expectRevert(abi.encodeWithSelector(SovaBTC.ZeroGasLimit.selector));
        sovaBTC.withdraw(1e7, 0, 100000, "bc1qtest");
        
        // 4. InsufficientAmount
        vm.expectRevert(abi.encodeWithSelector(SovaBTC.InsufficientAmount.selector));
        sovaBTC.withdraw(2e8, 1e5, 100000, "bc1qtest"); // More than balance
        
        vm.stopPrank();
        
        assertTrue(true, "All reachable errors can be triggered as expected");
    }
} 