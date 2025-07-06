// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/SovaBTC.sol";
import "../src/TokenWrapper.sol";
import "./mocks/MockBTCPrecompile.sol";
import "./mocks/MockERC20BTC.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// @title State Consistency During Failures Tests
/// @notice Comprehensive testing of state consistency when operations fail
contract StateConsistencyTest is Test {
    SovaBTC public sovaBTC;
    TokenWrapper public wrapper;
    MockBTCPrecompile public mockPrecompile;
    MockERC20BTC public token;

    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");

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
        bytes memory wrapperInitData = abi.encodeWithSelector(TokenWrapper.initialize.selector, address(sovaBTC));
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
    // State Consistency During Failed Deposits
    // =============================================================================

    function test_StateConsistencyFailedTokenTransfer() public {
        // Setup: Give user tokens but don't approve wrapper
        token.mint(user1, 100e8);

        // Record initial state
        uint256 initialUserTokens = token.balanceOf(user1);
        uint256 initialWrapperTokens = token.balanceOf(address(wrapper));
        uint256 initialUserSova = sovaBTC.balanceOf(user1);
        uint256 initialSovaTotalSupply = sovaBTC.totalSupply();

        vm.startPrank(user1);

        // Attempt deposit without approval - should fail
        vm.expectRevert();
        wrapper.deposit(address(token), 50e8);

        vm.stopPrank();

        // Verify state unchanged after failure
        assertEq(token.balanceOf(user1), initialUserTokens, "User token balance should be unchanged");
        assertEq(token.balanceOf(address(wrapper)), initialWrapperTokens, "Wrapper token balance should be unchanged");
        assertEq(sovaBTC.balanceOf(user1), initialUserSova, "User sovaBTC balance should be unchanged");
        assertEq(sovaBTC.totalSupply(), initialSovaTotalSupply, "SovaBTC total supply should be unchanged");
    }

    function test_StateConsistencyFailedDepositPaused() public {
        // Setup successful state first
        token.mint(user1, 100e8);

        vm.startPrank(user1);
        token.approve(address(wrapper), 100e8);
        vm.stopPrank();

        // Pause the wrapper
        vm.startPrank(owner);
        wrapper.pause();
        vm.stopPrank();

        // Record state before failed operation
        uint256 initialUserTokens = token.balanceOf(user1);
        uint256 initialWrapperTokens = token.balanceOf(address(wrapper));
        uint256 initialUserSova = sovaBTC.balanceOf(user1);
        uint256 initialSovaTotalSupply = sovaBTC.totalSupply();

        vm.startPrank(user1);

        // Attempt deposit while paused - should fail
        vm.expectRevert();
        wrapper.deposit(address(token), 50e8);

        vm.stopPrank();

        // Verify state unchanged after failure
        assertEq(token.balanceOf(user1), initialUserTokens, "User token balance should be unchanged");
        assertEq(token.balanceOf(address(wrapper)), initialWrapperTokens, "Wrapper token balance should be unchanged");
        assertEq(sovaBTC.balanceOf(user1), initialUserSova, "User sovaBTC balance should be unchanged");
        assertEq(sovaBTC.totalSupply(), initialSovaTotalSupply, "SovaBTC total supply should be unchanged");
    }

    function test_StateConsistencyFailedDepositUnallowedToken() public {
        // Create a new token that's not allowed
        MockERC20BTC unauthorizedToken = new MockERC20BTC("Unauthorized", "UNAUTH", 8);
        unauthorizedToken.mint(user1, 100e8);

        // Record initial state
        uint256 initialUserTokens = unauthorizedToken.balanceOf(user1);
        uint256 initialWrapperTokens = unauthorizedToken.balanceOf(address(wrapper));
        uint256 initialUserSova = sovaBTC.balanceOf(user1);
        uint256 initialSovaTotalSupply = sovaBTC.totalSupply();

        vm.startPrank(user1);
        unauthorizedToken.approve(address(wrapper), 50e8);

        // Attempt deposit with unauthorized token - should fail
        vm.expectRevert();
        wrapper.deposit(address(unauthorizedToken), 50e8);

        vm.stopPrank();

        // Verify state unchanged after failure
        assertEq(unauthorizedToken.balanceOf(user1), initialUserTokens, "User token balance should be unchanged");
        assertEq(
            unauthorizedToken.balanceOf(address(wrapper)),
            initialWrapperTokens,
            "Wrapper token balance should be unchanged"
        );
        assertEq(sovaBTC.balanceOf(user1), initialUserSova, "User sovaBTC balance should be unchanged");
        assertEq(sovaBTC.totalSupply(), initialSovaTotalSupply, "SovaBTC total supply should be unchanged");
    }

    // =============================================================================
    // State Consistency During Failed Redemptions
    // =============================================================================

    function test_StateConsistencyFailedRedemptionInsufficientReserve() public {
        // Setup: User has sovaBTC but wrapper has no token reserves
        vm.startPrank(address(wrapper));
        sovaBTC.adminMint(user1, 50e8);
        vm.stopPrank();

        // Record initial state
        uint256 initialUserTokens = token.balanceOf(user1);
        uint256 initialWrapperTokens = token.balanceOf(address(wrapper));
        uint256 initialUserSova = sovaBTC.balanceOf(user1);
        uint256 initialSovaTotalSupply = sovaBTC.totalSupply();

        vm.startPrank(user1);

        // Attempt redemption without sufficient reserves - should fail
        vm.expectRevert();
        wrapper.redeem(address(token), 25e8);

        vm.stopPrank();

        // Verify state unchanged after failure
        assertEq(token.balanceOf(user1), initialUserTokens, "User token balance should be unchanged");
        assertEq(token.balanceOf(address(wrapper)), initialWrapperTokens, "Wrapper token balance should be unchanged");
        assertEq(sovaBTC.balanceOf(user1), initialUserSova, "User sovaBTC balance should be unchanged");
        assertEq(sovaBTC.totalSupply(), initialSovaTotalSupply, "SovaBTC total supply should be unchanged");
    }

    function test_StateConsistencyFailedRedemptionInsufficientBalance() public {
        // Setup: Give wrapper tokens but user doesn't have enough sovaBTC
        token.mint(address(wrapper), 100e8);

        vm.startPrank(address(wrapper));
        sovaBTC.adminMint(user1, 10e8); // Only give user 10 sovaBTC
        vm.stopPrank();

        // Record initial state
        uint256 initialUserTokens = token.balanceOf(user1);
        uint256 initialWrapperTokens = token.balanceOf(address(wrapper));
        uint256 initialUserSova = sovaBTC.balanceOf(user1);
        uint256 initialSovaTotalSupply = sovaBTC.totalSupply();

        vm.startPrank(user1);

        // Attempt redemption for more than user has - should fail
        vm.expectRevert();
        wrapper.redeem(address(token), 25e8);

        vm.stopPrank();

        // Verify state unchanged after failure
        assertEq(token.balanceOf(user1), initialUserTokens, "User token balance should be unchanged");
        assertEq(token.balanceOf(address(wrapper)), initialWrapperTokens, "Wrapper token balance should be unchanged");
        assertEq(sovaBTC.balanceOf(user1), initialUserSova, "User sovaBTC balance should be unchanged");
        assertEq(sovaBTC.totalSupply(), initialSovaTotalSupply, "SovaBTC total supply should be unchanged");
    }

    // =============================================================================
    // State Consistency During Failed Withdrawals
    // =============================================================================

    function test_StateConsistencyFailedWithdrawInsufficientBalance() public {
        // User tries to withdraw more than they have
        vm.startPrank(address(wrapper));
        sovaBTC.adminMint(user1, 10e8);
        vm.stopPrank();

        // Record initial state
        uint256 initialUserSova = sovaBTC.balanceOf(user1);
        uint256 initialSovaTotalSupply = sovaBTC.totalSupply();
        uint256 initialPendingAmount = sovaBTC.pendingWithdrawalAmountOf(user1);

        vm.startPrank(user1);

        // Attempt withdrawal for more than user has - should fail
        vm.expectRevert();
        sovaBTC.withdraw(25e8, 100000, 800000, "bc1qexample");

        vm.stopPrank();

        // Verify state unchanged after failure
        assertEq(sovaBTC.balanceOf(user1), initialUserSova, "User sovaBTC balance should be unchanged");
        assertEq(sovaBTC.totalSupply(), initialSovaTotalSupply, "SovaBTC total supply should be unchanged");
        assertEq(
            sovaBTC.pendingWithdrawalAmountOf(user1), initialPendingAmount, "Pending withdrawal should be unchanged"
        );
    }

    function test_StateConsistencyFailedWithdrawGasLimitTooHigh() public {
        // Setup: User has sovaBTC but gas limit is too high
        vm.startPrank(address(wrapper));
        sovaBTC.adminMint(user1, 50e8);
        vm.stopPrank();

        // Record initial state
        uint256 initialUserSova = sovaBTC.balanceOf(user1);
        uint256 initialSovaTotalSupply = sovaBTC.totalSupply();
        uint256 initialPendingAmount = sovaBTC.pendingWithdrawalAmountOf(user1);

        vm.startPrank(user1);

        // Attempt withdrawal with excessive gas limit - should fail
        vm.expectRevert();
        sovaBTC.withdraw(25e8, type(uint64).max, 800000, "bc1qexample");

        vm.stopPrank();

        // Verify state unchanged after failure
        assertEq(sovaBTC.balanceOf(user1), initialUserSova, "User sovaBTC balance should be unchanged");
        assertEq(sovaBTC.totalSupply(), initialSovaTotalSupply, "SovaBTC total supply should be unchanged");
        assertEq(
            sovaBTC.pendingWithdrawalAmountOf(user1), initialPendingAmount, "Pending withdrawal should be unchanged"
        );
    }

    function test_StateConsistencyFailedWithdrawExistingPending() public {
        // Setup: User has a pending withdrawal already
        vm.startPrank(address(wrapper));
        sovaBTC.adminMint(user1, 100e8);
        vm.stopPrank();

        vm.startPrank(user1);
        // Create first withdrawal
        sovaBTC.withdraw(25e8, 100000, 800000, "bc1qexample");
        vm.stopPrank();

        // Record state after first withdrawal
        uint256 stateUserSova = sovaBTC.balanceOf(user1);
        uint256 stateSovaTotalSupply = sovaBTC.totalSupply();
        uint256 statePendingAmount = sovaBTC.pendingWithdrawalAmountOf(user1);

        vm.startPrank(user1);

        // Attempt second withdrawal while first is pending - should fail
        vm.expectRevert();
        sovaBTC.withdraw(25e8, 100000, 800000, "bc1qexample2");

        vm.stopPrank();

        // Verify state unchanged after failed second withdrawal
        assertEq(sovaBTC.balanceOf(user1), stateUserSova, "User sovaBTC balance should be unchanged");
        assertEq(sovaBTC.totalSupply(), stateSovaTotalSupply, "SovaBTC total supply should be unchanged");
        assertEq(sovaBTC.pendingWithdrawalAmountOf(user1), statePendingAmount, "Pending withdrawal should be unchanged");
    }

    // =============================================================================
    // Multi-User State Isolation
    // =============================================================================

    function test_StateConsistencyMultiUserIsolation() public {
        // Setup multiple users with different states
        token.mint(user1, 100e8);
        token.mint(user2, 200e8);

        vm.startPrank(user1);
        token.approve(address(wrapper), 100e8);
        wrapper.deposit(address(token), 50e8);
        vm.stopPrank();

        vm.startPrank(user2);
        token.approve(address(wrapper), 200e8);
        wrapper.deposit(address(token), 100e8);
        vm.stopPrank();

        // Record state for both users
        uint256 user1Tokens = token.balanceOf(user1);
        uint256 user1Sova = sovaBTC.balanceOf(user1);
        uint256 user2Tokens = token.balanceOf(user2);
        uint256 user2Sova = sovaBTC.balanceOf(user2);

        // User1 attempts invalid operation
        vm.startPrank(user1);
        vm.expectRevert();
        wrapper.deposit(address(token), 100e8); // User1 doesn't have enough tokens
        vm.stopPrank();

        // Verify user1's failed operation doesn't affect user2's state
        assertEq(token.balanceOf(user1), user1Tokens, "User1 token balance should be unchanged");
        assertEq(sovaBTC.balanceOf(user1), user1Sova, "User1 sovaBTC balance should be unchanged");
        assertEq(token.balanceOf(user2), user2Tokens, "User2 token balance should be unchanged");
        assertEq(sovaBTC.balanceOf(user2), user2Sova, "User2 sovaBTC balance should be unchanged");

        // User2 should still be able to operate normally
        vm.startPrank(user2);
        wrapper.deposit(address(token), 50e8);
        assertGt(sovaBTC.balanceOf(user2), user2Sova, "User2 should be able to deposit successfully");
        vm.stopPrank();
    }

    // =============================================================================
    // Pause State Consistency
    // =============================================================================

    function test_StateConsistencyPauseUnpauseCycle() public {
        // Setup initial successful operations
        token.mint(user1, 100e8);

        vm.startPrank(user1);
        token.approve(address(wrapper), 100e8);
        wrapper.deposit(address(token), 50e8);
        vm.stopPrank();

        // Record state before pause
        uint256 beforePauseUserTokens = token.balanceOf(user1);
        uint256 beforePauseUserSova = sovaBTC.balanceOf(user1);
        uint256 beforePauseWrapperTokens = token.balanceOf(address(wrapper));

        // Pause and verify failed operations don't change state
        vm.startPrank(owner);
        wrapper.pause();
        vm.stopPrank();

        vm.startPrank(user1);
        vm.expectRevert();
        wrapper.deposit(address(token), 25e8);

        vm.expectRevert();
        wrapper.redeem(address(token), 25e8);
        vm.stopPrank();

        // Verify state unchanged during pause
        assertEq(token.balanceOf(user1), beforePauseUserTokens, "User tokens unchanged during pause");
        assertEq(sovaBTC.balanceOf(user1), beforePauseUserSova, "User sovaBTC unchanged during pause");
        assertEq(token.balanceOf(address(wrapper)), beforePauseWrapperTokens, "Wrapper tokens unchanged during pause");

        // Unpause and verify operations work again
        vm.startPrank(owner);
        wrapper.unpause();
        vm.stopPrank();

        vm.startPrank(user1);
        wrapper.deposit(address(token), 25e8);
        assertGt(sovaBTC.balanceOf(user1), beforePauseUserSova, "Operations should work after unpause");
        vm.stopPrank();
    }

    // =============================================================================
    // Owner Operation State Consistency
    // =============================================================================

    function test_StateConsistencyOwnerOperationFailures() public {
        // Test non-owner cannot perform owner operations
        vm.startPrank(user1);

        vm.expectRevert();
        wrapper.addAllowedToken(makeAddr("newToken"));

        vm.expectRevert();
        wrapper.removeAllowedToken(address(token));

        vm.expectRevert();
        wrapper.pause();

        vm.expectRevert();
        wrapper.setMinDepositSatoshi(1000);

        vm.stopPrank();

        // Verify contract state is unaffected by failed owner operations
        assertTrue(wrapper.allowedTokens(address(token)), "Token should still be allowed");
        assertFalse(wrapper.paused(), "Contract should not be paused");
    }

    // =============================================================================
    // Complex Scenario State Consistency
    // =============================================================================

    function test_StateConsistencyComplexFailureScenario() public {
        // Complex scenario: Multiple operations, some succeed, some fail
        token.mint(user1, 1000e8);
        token.mint(user2, 500e8);

        // User1 successful operations
        vm.startPrank(user1);
        token.approve(address(wrapper), 1000e8);
        wrapper.deposit(address(token), 500e8);
        vm.stopPrank();

        // User2 partial operations
        vm.startPrank(user2);
        token.approve(address(wrapper), 500e8);
        wrapper.deposit(address(token), 300e8);
        vm.stopPrank();

        // Record state after successful operations
        uint256 checkpointUser1Tokens = token.balanceOf(user1);
        uint256 checkpointUser1Sova = sovaBTC.balanceOf(user1);
        uint256 checkpointUser2Tokens = token.balanceOf(user2);
        uint256 checkpointUser2Sova = sovaBTC.balanceOf(user2);
        uint256 checkpointWrapperTokens = token.balanceOf(address(wrapper));
        uint256 checkpointTotalSupply = sovaBTC.totalSupply();

        // Now cause various failures

        // User1 tries to deposit more than they have
        vm.startPrank(user1);
        vm.expectRevert();
        wrapper.deposit(address(token), 600e8);
        vm.stopPrank();

        // User2 tries to redeem more than wrapper has in reserves
        vm.startPrank(user2);
        vm.expectRevert();
        wrapper.redeem(address(token), 1000e8);
        vm.stopPrank();

        // Owner pauses, operations should fail
        vm.startPrank(owner);
        wrapper.pause();
        vm.stopPrank();

        vm.startPrank(user1);
        vm.expectRevert();
        wrapper.redeem(address(token), 100e8);
        vm.stopPrank();

        // Verify all state remains consistent after multiple failures
        assertEq(token.balanceOf(user1), checkpointUser1Tokens, "User1 tokens should be unchanged after failures");
        assertEq(sovaBTC.balanceOf(user1), checkpointUser1Sova, "User1 sovaBTC should be unchanged after failures");
        assertEq(token.balanceOf(user2), checkpointUser2Tokens, "User2 tokens should be unchanged after failures");
        assertEq(sovaBTC.balanceOf(user2), checkpointUser2Sova, "User2 sovaBTC should be unchanged after failures");
        assertEq(
            token.balanceOf(address(wrapper)),
            checkpointWrapperTokens,
            "Wrapper tokens should be unchanged after failures"
        );
        assertEq(sovaBTC.totalSupply(), checkpointTotalSupply, "Total supply should be unchanged after failures");
    }
}
