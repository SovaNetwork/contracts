// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/staking/SovaBTCStaking.sol";
import "../src/staking/SOVAToken.sol";
import "./mocks/MockERC20BTC.sol";

/**
 * @title SovaBTCStakingCoverageTest
 * @notice Comprehensive test suite to achieve 100% coverage for SovaBTCStaking contract
 */
contract SovaBTCStakingCoverageTest is Test {
    SovaBTCStaking public stakingContract;
    SOVAToken public sovaToken;
    MockERC20BTC public stakingToken;
    MockERC20BTC public rewardToken;

    address public owner = address(0x1);
    address public feeRecipient = address(0x2);
    address public user1 = address(0x3);
    address public user2 = address(0x4);

    uint256 constant INITIAL_SUPPLY = 1000000 * 1e18;
    uint256 constant REWARD_PER_SECOND = 1e18; // 1 token per second
    uint256 constant LOCK_PERIOD = 30 days;
    uint256 constant MULTIPLIER = 20000; // 2x multiplier

    // Events to test
    event PoolAdded(uint256 indexed poolId, address stakingToken, address rewardToken);
    event PoolUpdated(uint256 indexed poolId, uint256 rewardPerSecond, uint256 lockPeriod, uint256 multiplier);
    event Staked(address indexed user, uint256 indexed poolId, uint256 amount, uint256 lockEndTime);
    event Unstaked(address indexed user, uint256 indexed poolId, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 indexed poolId, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed poolId, uint256 amount);

    function setUp() public {
        vm.startPrank(owner);

        // Deploy tokens
        stakingToken = new MockERC20BTC("Staking Token", "STAKE", 18);
        rewardToken = new MockERC20BTC("Reward Token", "REWARD", 18);

        // Deploy staking contract
        stakingContract = new SovaBTCStaking(feeRecipient);

        // Mint tokens to users
        stakingToken.mint(user1, INITIAL_SUPPLY);
        stakingToken.mint(user2, INITIAL_SUPPLY);
        rewardToken.mint(address(stakingContract), INITIAL_SUPPLY);

        vm.stopPrank();

        // Give users allowances
        vm.prank(user1);
        stakingToken.approve(address(stakingContract), INITIAL_SUPPLY);

        vm.prank(user2);
        stakingToken.approve(address(stakingContract), INITIAL_SUPPLY);
    }

    // ============ Constructor Tests ============

    function test_Constructor_ZeroFeeRecipient() public {
        vm.expectRevert(SovaBTCStaking.ZeroAddress.selector);
        new SovaBTCStaking(address(0));
    }

    function test_Constructor_Success() public {
        SovaBTCStaking newContract = new SovaBTCStaking(feeRecipient);

        assertEq(newContract.owner(), address(this));
        assertEq(newContract.feeRecipient(), feeRecipient);
        assertEq(newContract.protocolFee(), 300); // 3%
        assertFalse(newContract.emergencyMode());
        assertEq(newContract.poolLength(), 0);
    }

    // ============ Add Pool Tests ============

    function test_AddPool_ZeroStakingToken() public {
        vm.prank(owner);
        vm.expectRevert(SovaBTCStaking.ZeroAddress.selector);
        stakingContract.addPool(address(0), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);
    }

    function test_AddPool_ZeroRewardToken() public {
        vm.prank(owner);
        vm.expectRevert(SovaBTCStaking.ZeroAddress.selector);
        stakingContract.addPool(address(stakingToken), address(0), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);
    }

    function test_AddPool_InvalidLockPeriod() public {
        vm.prank(owner);
        vm.expectRevert(SovaBTCStaking.InvalidLockPeriod.selector);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, 366 days, MULTIPLIER);
    }

    function test_AddPool_InvalidMultiplier() public {
        vm.prank(owner);
        vm.expectRevert(SovaBTCStaking.InvalidMultiplier.selector);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, 60000); // > 5x
    }

    function test_AddPool_Success() public {
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit PoolAdded(0, address(stakingToken), address(rewardToken));
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        assertEq(stakingContract.poolLength(), 1);

        IStaking.PoolInfo memory pool = stakingContract.getPoolInfo(0);
        assertEq(pool.stakingToken, address(stakingToken));
        assertEq(pool.rewardToken, address(rewardToken));
        assertEq(pool.rewardPerSecond, REWARD_PER_SECOND);
        assertEq(pool.lockPeriod, LOCK_PERIOD);
        assertEq(pool.multiplier, MULTIPLIER);
        assertEq(pool.totalStaked, 0);
        assertEq(pool.accRewardPerShare, 0);
    }

    function test_AddPool_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);
    }

    // ============ Update Pool Tests ============

    function test_UpdatePool_InvalidPoolId() public {
        vm.prank(owner);
        vm.expectRevert(SovaBTCStaking.InvalidPoolId.selector);
        stakingContract.updatePool(999, REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);
    }

    function test_UpdatePool_InvalidLockPeriod() public {
        vm.startPrank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        vm.expectRevert(SovaBTCStaking.InvalidLockPeriod.selector);
        stakingContract.updatePool(0, REWARD_PER_SECOND, 366 days, MULTIPLIER);
        vm.stopPrank();
    }

    function test_UpdatePool_InvalidMultiplier() public {
        vm.startPrank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        vm.expectRevert(SovaBTCStaking.InvalidMultiplier.selector);
        stakingContract.updatePool(0, REWARD_PER_SECOND, LOCK_PERIOD, 60000);
        vm.stopPrank();
    }

    function test_UpdatePool_Success() public {
        vm.startPrank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        uint256 newRewardPerSecond = 2e18;
        uint256 newLockPeriod = 60 days;
        uint256 newMultiplier = 30000;

        vm.expectEmit(true, false, false, true);
        emit PoolUpdated(0, newRewardPerSecond, newLockPeriod, newMultiplier);
        stakingContract.updatePool(0, newRewardPerSecond, newLockPeriod, newMultiplier);

        IStaking.PoolInfo memory pool = stakingContract.getPoolInfo(0);
        assertEq(pool.rewardPerSecond, newRewardPerSecond);
        assertEq(pool.lockPeriod, newLockPeriod);
        assertEq(pool.multiplier, newMultiplier);

        vm.stopPrank();
    }

    function test_UpdatePool_OnlyOwner() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        vm.prank(user1);
        vm.expectRevert();
        stakingContract.updatePool(0, REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);
    }

    // ============ Stake Tests ============

    function test_Stake_InvalidPoolId() public {
        vm.prank(user1);
        vm.expectRevert(SovaBTCStaking.InvalidPoolId.selector);
        stakingContract.stake(999, 1000e18, false);
    }

    function test_Stake_ZeroAmount() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        vm.prank(user1);
        vm.expectRevert(SovaBTCStaking.ZeroAmount.selector);
        stakingContract.stake(0, 0, false);
    }

    function test_Stake_WhenPaused() public {
        vm.startPrank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);
        stakingContract.emergencyPause();
        vm.stopPrank();

        vm.prank(user1);
        vm.expectRevert();
        stakingContract.stake(0, 1000e18, false);
    }

    function test_Stake_WhenEmergencyMode() public {
        vm.startPrank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);
        stakingContract.emergencyPause();
        vm.stopPrank();

        vm.prank(user1);
        vm.expectRevert(); // EnforcedPause() is thrown first due to whenNotPaused modifier
        stakingContract.stake(0, 1000e18, false);
    }

    function test_Stake_WithoutLock() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        uint256 stakeAmount = 1000e18;

        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit Staked(user1, 0, stakeAmount, block.timestamp);
        stakingContract.stake(0, stakeAmount, false);

        IStaking.UserInfo memory userInfo = stakingContract.getUserInfo(0, user1);
        assertEq(userInfo.amount, stakeAmount);
        assertEq(userInfo.lockEndTime, 0); // No lock
        assertEq(userInfo.lastStakeTime, block.timestamp);

        IStaking.PoolInfo memory pool = stakingContract.getPoolInfo(0);
        assertEq(pool.totalStaked, stakeAmount);
    }

    function test_Stake_WithLock() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        uint256 stakeAmount = 1000e18;
        uint256 expectedEffectiveAmount = stakeAmount * MULTIPLIER / 10000;
        uint256 expectedLockEndTime = block.timestamp + LOCK_PERIOD;

        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit Staked(user1, 0, stakeAmount, expectedLockEndTime);
        stakingContract.stake(0, stakeAmount, true);

        IStaking.UserInfo memory userInfo = stakingContract.getUserInfo(0, user1);
        assertEq(userInfo.amount, expectedEffectiveAmount);
        assertEq(userInfo.lockEndTime, expectedLockEndTime);
        assertEq(userInfo.lastStakeTime, block.timestamp);

        IStaking.PoolInfo memory pool = stakingContract.getPoolInfo(0);
        assertEq(pool.totalStaked, expectedEffectiveAmount);
    }

    function test_Stake_WithLockZeroLockPeriod() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, 0, MULTIPLIER);

        uint256 stakeAmount = 1000e18;

        vm.prank(user1);
        stakingContract.stake(0, stakeAmount, true);

        IStaking.UserInfo memory userInfo = stakingContract.getUserInfo(0, user1);
        assertEq(userInfo.amount, stakeAmount); // No multiplier applied
        assertEq(userInfo.lockEndTime, 0); // No lock
    }

    function test_Stake_ExistingStakeClaimsPendingRewards() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        uint256 stakeAmount = 1000e18;

        // First stake
        vm.prank(user1);
        stakingContract.stake(0, stakeAmount, false);

        // Wait some time for rewards to accumulate
        vm.warp(block.timestamp + 100);

        // Second stake should claim pending rewards
        uint256 initialBalance = rewardToken.balanceOf(user1);

        vm.prank(user1);
        vm.expectEmit(true, true, false, false);
        emit RewardsClaimed(user1, 0, 0); // Will have some pending rewards
        stakingContract.stake(0, stakeAmount, false);

        // Check that rewards were claimed
        assertTrue(rewardToken.balanceOf(user1) > initialBalance);
    }

    // ============ Unstake Tests ============

    function test_Unstake_InvalidPoolId() public {
        vm.prank(user1);
        vm.expectRevert(SovaBTCStaking.InvalidPoolId.selector);
        stakingContract.unstake(999, 1000e18);
    }

    function test_Unstake_ZeroAmount() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        vm.prank(user1);
        vm.expectRevert(SovaBTCStaking.ZeroAmount.selector);
        stakingContract.unstake(0, 0);
    }

    function test_Unstake_InsufficientAmount() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        vm.prank(user1);
        vm.expectRevert(SovaBTCStaking.InsufficientAmount.selector);
        stakingContract.unstake(0, 1000e18);
    }

    function test_Unstake_StillLocked() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        uint256 stakeAmount = 1000e18;

        // Stake with lock
        vm.prank(user1);
        stakingContract.stake(0, stakeAmount, true);

        // Try to unstake immediately
        uint256 effectiveAmount = stakeAmount * MULTIPLIER / 10000;
        vm.prank(user1);
        vm.expectRevert(SovaBTCStaking.StillLocked.selector);
        stakingContract.unstake(0, effectiveAmount);
    }

    function test_Unstake_WithoutLock() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        uint256 stakeAmount = 1000e18;

        // Stake without lock
        vm.prank(user1);
        stakingContract.stake(0, stakeAmount, false);

        // Wait for some rewards
        vm.warp(block.timestamp + 100);

        uint256 initialBalance = stakingToken.balanceOf(user1);

        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit Unstaked(user1, 0, stakeAmount);
        stakingContract.unstake(0, stakeAmount);

        assertEq(stakingToken.balanceOf(user1), initialBalance + stakeAmount);

        IStaking.UserInfo memory userInfo = stakingContract.getUserInfo(0, user1);
        assertEq(userInfo.amount, 0);
    }

    function test_Unstake_WithLockAfterPeriod() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        uint256 stakeAmount = 1000e18;
        uint256 effectiveAmount = stakeAmount * MULTIPLIER / 10000;

        // Stake with lock
        vm.prank(user1);
        stakingContract.stake(0, stakeAmount, true);

        // Wait past lock period
        vm.warp(block.timestamp + LOCK_PERIOD + 1);

        uint256 initialBalance = stakingToken.balanceOf(user1);

        vm.prank(user1);
        stakingContract.unstake(0, effectiveAmount);

        // Should receive original amount back
        assertEq(stakingToken.balanceOf(user1), initialBalance + stakeAmount);
    }

    function test_Unstake_WhenEmergencyMode() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        vm.prank(user1);
        stakingContract.stake(0, 1000e18, false);

        vm.prank(owner);
        stakingContract.emergencyPause();

        vm.prank(user1);
        vm.expectRevert(SovaBTCStaking.EmergencyModeActive.selector);
        stakingContract.unstake(0, 1000e18);
    }

    // ============ Emergency Unstake Tests ============

    function test_EmergencyUnstake_InvalidPoolId() public {
        vm.prank(user1);
        vm.expectRevert(SovaBTCStaking.InvalidPoolId.selector);
        stakingContract.emergencyUnstake(999);
    }

    function test_EmergencyUnstake_InsufficientAmount() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        vm.prank(user1);
        vm.expectRevert(SovaBTCStaking.InsufficientAmount.selector);
        stakingContract.emergencyUnstake(0);
    }

    function test_EmergencyUnstake_WithoutLock() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        uint256 stakeAmount = 1000e18;

        vm.prank(user1);
        stakingContract.stake(0, stakeAmount, false);

        uint256 initialBalance = stakingToken.balanceOf(user1);

        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit EmergencyWithdraw(user1, 0, stakeAmount);
        stakingContract.emergencyUnstake(0);

        assertEq(stakingToken.balanceOf(user1), initialBalance + stakeAmount);

        IStaking.UserInfo memory userInfo = stakingContract.getUserInfo(0, user1);
        assertEq(userInfo.amount, 0);
        assertEq(userInfo.rewardDebt, 0);
        assertEq(userInfo.lockEndTime, 0);
    }

    function test_EmergencyUnstake_WithLock() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        uint256 stakeAmount = 1000e18;

        vm.prank(user1);
        stakingContract.stake(0, stakeAmount, true);

        uint256 initialBalance = stakingToken.balanceOf(user1);

        vm.prank(user1);
        stakingContract.emergencyUnstake(0);

        // Should get original amount back (not effective amount)
        assertEq(stakingToken.balanceOf(user1), initialBalance + stakeAmount);
    }

    function test_EmergencyUnstake_WorksInEmergencyMode() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        uint256 stakeAmount = 1000e18;

        vm.prank(user1);
        stakingContract.stake(0, stakeAmount, false);

        vm.prank(owner);
        stakingContract.emergencyPause();

        // Should still work in emergency mode
        vm.prank(user1);
        stakingContract.emergencyUnstake(0);
    }

    // ============ Claim Rewards Tests ============

    function test_ClaimRewards_InvalidPoolId() public {
        vm.prank(user1);
        vm.expectRevert(SovaBTCStaking.InvalidPoolId.selector);
        stakingContract.claimRewards(999);
    }

    function test_ClaimRewards_NoRewards() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        vm.prank(user1);
        stakingContract.claimRewards(0); // Should not revert but claim nothing
    }

    function test_ClaimRewards_WithRewards() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        uint256 stakeAmount = 1000e18;

        vm.prank(user1);
        stakingContract.stake(0, stakeAmount, false);

        // Wait for rewards
        vm.warp(block.timestamp + 100);

        uint256 initialBalance = rewardToken.balanceOf(user1);
        uint256 expectedRewards = stakingContract.pendingRewards(0, user1);

        vm.prank(user1);
        vm.expectEmit(true, true, false, false);
        emit RewardsClaimed(user1, 0, 0);
        stakingContract.claimRewards(0);

        assertTrue(rewardToken.balanceOf(user1) > initialBalance);
    }

    function test_ClaimRewards_WhenEmergencyMode() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        vm.prank(user1);
        stakingContract.stake(0, 1000e18, false);

        vm.prank(owner);
        stakingContract.emergencyPause();

        vm.prank(user1);
        vm.expectRevert(SovaBTCStaking.EmergencyModeActive.selector);
        stakingContract.claimRewards(0);
    }

    // ============ View Functions Tests ============

    function test_PendingRewards_InvalidPoolId() public {
        vm.expectRevert(SovaBTCStaking.InvalidPoolId.selector);
        stakingContract.pendingRewards(999, user1);
    }

    function test_PendingRewards_NoStake() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        assertEq(stakingContract.pendingRewards(0, user1), 0);
    }

    function test_PendingRewards_WithStake() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        uint256 stakeAmount = 1000e18;

        vm.prank(user1);
        stakingContract.stake(0, stakeAmount, false);

        // Wait for some time
        vm.warp(block.timestamp + 100);

        uint256 pending = stakingContract.pendingRewards(0, user1);
        assertTrue(pending > 0);
    }

    function test_PendingRewards_ZeroTotalStaked() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        // No one has staked yet
        vm.warp(block.timestamp + 100);

        assertEq(stakingContract.pendingRewards(0, user1), 0);
    }

    function test_GetActualStakedAmount_WithoutMultiplier() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        uint256 stakeAmount = 1000e18;

        vm.prank(user1);
        stakingContract.stake(0, stakeAmount, false);

        assertEq(stakingContract.getActualStakedAmount(0, user1), stakeAmount);
    }

    function test_GetActualStakedAmount_WithMultiplier() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        uint256 stakeAmount = 1000e18;

        vm.prank(user1);
        stakingContract.stake(0, stakeAmount, true);

        assertEq(stakingContract.getActualStakedAmount(0, user1), stakeAmount);
    }

    function test_GetActualStakedAmount_InvalidPoolId() public {
        vm.expectRevert(SovaBTCStaking.InvalidPoolId.selector);
        stakingContract.getActualStakedAmount(999, user1);
    }

    // ============ Admin Functions Tests ============

    function test_SetProtocolFee_InvalidFeeRate() public {
        vm.prank(owner);
        vm.expectRevert(SovaBTCStaking.InvalidFeeRate.selector);
        stakingContract.setProtocolFee(1001); // > 10%
    }

    function test_SetProtocolFee_Success() public {
        vm.prank(owner);
        stakingContract.setProtocolFee(500); // 5%

        assertEq(stakingContract.protocolFee(), 500);
    }

    function test_SetProtocolFee_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        stakingContract.setProtocolFee(500);
    }

    function test_SetFeeRecipient_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(SovaBTCStaking.ZeroAddress.selector);
        stakingContract.setFeeRecipient(address(0));
    }

    function test_SetFeeRecipient_Success() public {
        address newRecipient = address(0x99);

        vm.prank(owner);
        stakingContract.setFeeRecipient(newRecipient);

        assertEq(stakingContract.feeRecipient(), newRecipient);
    }

    function test_SetFeeRecipient_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        stakingContract.setFeeRecipient(address(0x99));
    }

    function test_EmergencyPause_Success() public {
        assertFalse(stakingContract.emergencyMode());

        vm.prank(owner);
        stakingContract.emergencyPause();

        assertTrue(stakingContract.emergencyMode());
        assertTrue(stakingContract.paused());
    }

    function test_EmergencyUnpause_Success() public {
        vm.startPrank(owner);
        stakingContract.emergencyPause();
        assertTrue(stakingContract.emergencyMode());

        stakingContract.emergencyUnpause();
        assertFalse(stakingContract.emergencyMode());
        assertFalse(stakingContract.paused());
        vm.stopPrank();
    }

    function test_EmergencyFunctions_OnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        stakingContract.emergencyPause();

        vm.prank(user1);
        vm.expectRevert();
        stakingContract.emergencyUnpause();
    }

    function test_FundRewardPool_InvalidPoolId() public {
        vm.expectRevert(SovaBTCStaking.InvalidPoolId.selector);
        stakingContract.fundRewardPool(999, 1000e18);
    }

    function test_FundRewardPool_ZeroAmount() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        vm.expectRevert(SovaBTCStaking.ZeroAmount.selector);
        stakingContract.fundRewardPool(0, 0);
    }

    function test_FundRewardPool_Success() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        uint256 fundAmount = 10000e18;
        rewardToken.mint(user1, fundAmount);

        vm.startPrank(user1);
        rewardToken.approve(address(stakingContract), fundAmount);
        stakingContract.fundRewardPool(0, fundAmount);
        vm.stopPrank();

        assertEq(rewardToken.balanceOf(address(stakingContract)), INITIAL_SUPPLY + fundAmount);
    }

    function test_MassUpdatePools() public {
        vm.startPrank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);
        vm.stopPrank();

        // Should not revert
        stakingContract.massUpdatePools();
    }

    function test_MassUpdatePools_EmptyPools() public {
        // Should not revert with no pools
        stakingContract.massUpdatePools();
    }

    // ============ Internal Function Coverage Tests ============

    function test_SafeRewardTransfer_InsufficientBalance() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        // Create a scenario with very high rewards but low balance
        // by setting balance to only 1 wei
        vm.store(address(rewardToken), keccak256(abi.encode(address(stakingContract), 0)), bytes32(uint256(1)));

        uint256 stakeAmount = 1000e18;

        vm.prank(user1);
        stakingContract.stake(0, stakeAmount, false);

        vm.warp(block.timestamp + 100);

        // Should handle insufficient balance gracefully by transferring available amount
        vm.prank(user1);
        stakingContract.claimRewards(0); // Should not revert
    }

    function test_SafeRewardTransfer_WithProtocolFee() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        uint256 stakeAmount = 1000e18;

        vm.prank(user1);
        stakingContract.stake(0, stakeAmount, false);

        vm.warp(block.timestamp + 100);

        uint256 feeRecipientBalanceBefore = rewardToken.balanceOf(feeRecipient);
        uint256 userBalanceBefore = rewardToken.balanceOf(user1);

        vm.prank(user1);
        stakingContract.claimRewards(0);

        uint256 feeRecipientBalanceAfter = rewardToken.balanceOf(feeRecipient);
        uint256 userBalanceAfter = rewardToken.balanceOf(user1);

        // Both user and fee recipient should receive tokens
        assertTrue(userBalanceAfter > userBalanceBefore);
        assertTrue(feeRecipientBalanceAfter > feeRecipientBalanceBefore);
    }

    function test_SafeRewardTransfer_ZeroProtocolFee() public {
        vm.startPrank(owner);
        stakingContract.setProtocolFee(0);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);
        vm.stopPrank();

        uint256 stakeAmount = 1000e18;

        vm.prank(user1);
        stakingContract.stake(0, stakeAmount, false);

        vm.warp(block.timestamp + 100);

        uint256 feeRecipientBalanceBefore = rewardToken.balanceOf(feeRecipient);

        vm.prank(user1);
        stakingContract.claimRewards(0);

        uint256 feeRecipientBalanceAfter = rewardToken.balanceOf(feeRecipient);

        // Fee recipient should not receive anything
        assertEq(feeRecipientBalanceAfter, feeRecipientBalanceBefore);
    }

    // ============ Edge Cases and Integration Tests ============

    function test_FullStakingLifecycle() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        uint256 stakeAmount = 1000e18;

        // Stake with lock
        vm.prank(user1);
        stakingContract.stake(0, stakeAmount, true);

        // Wait and claim rewards
        vm.warp(block.timestamp + 100);
        vm.prank(user1);
        stakingContract.claimRewards(0);

        // Wait past lock period and unstake
        vm.warp(block.timestamp + LOCK_PERIOD + 1);
        uint256 effectiveAmount = stakeAmount * MULTIPLIER / 10000;

        vm.prank(user1);
        stakingContract.unstake(0, effectiveAmount);

        // Verify final state
        IStaking.UserInfo memory userInfo = stakingContract.getUserInfo(0, user1);
        assertEq(userInfo.amount, 0);
    }

    function test_MultipleUsersStaking() public {
        vm.prank(owner);
        stakingContract.addPool(address(stakingToken), address(rewardToken), REWARD_PER_SECOND, LOCK_PERIOD, MULTIPLIER);

        uint256 stakeAmount = 1000e18;

        // Both users stake
        vm.prank(user1);
        stakingContract.stake(0, stakeAmount, false);

        vm.prank(user2);
        stakingContract.stake(0, stakeAmount, false);

        // Verify pool state
        IStaking.PoolInfo memory pool = stakingContract.getPoolInfo(0);
        assertEq(pool.totalStaked, stakeAmount * 2);

        // Wait and check both have rewards
        vm.warp(block.timestamp + 100);

        assertTrue(stakingContract.pendingRewards(0, user1) > 0);
        assertTrue(stakingContract.pendingRewards(0, user2) > 0);
    }
}
