// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/staking/SovaBTCStaking.sol";
import "../src/staking/SOVAToken.sol";
import "../src/SovaBTCOFT.sol";
import "./mocks/MockERC20BTC.sol";

/**
 * @title Task7_StakingSystem
 * @notice Comprehensive tests for Task 7 staking and yield functionality
 */
contract Task7_StakingSystemTest is Test {
    SovaBTCStaking public stakingContract;
    SOVAToken public sovaToken;
    SovaBTCOFT public sovaBTC;
    MockERC20BTC public revenueToken; // For protocol revenue sharing

    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public user3 = address(0x4);
    address public feeRecipient = address(0x5);
    address public lzEndpoint = address(0x999);

    // Pool configurations
    uint256 public constant SOVA_REWARD_RATE = 1e18; // 1 SOVA per second
    uint256 public constant REVENUE_REWARD_RATE = 0.1e18; // 0.1 revenue tokens per second
    uint256 public constant LOCK_PERIOD_30_DAYS = 30 days;
    uint256 public constant LOCK_PERIOD_90_DAYS = 90 days;
    uint256 public constant MULTIPLIER_1_5X = 15000; // 1.5x in basis points (1.5 * 10000)
    uint256 public constant MULTIPLIER_2X = 20000; // 2x in basis points (2.0 * 10000)

    // Pool IDs
    uint256 public sovaBTCPoolId;
    uint256 public sovaPoolId;

    /* ----------------------- EVENTS ----------------------- */

    event Staked(address indexed user, uint256 indexed poolId, uint256 amount, uint256 lockEndTime);
    event Unstaked(address indexed user, uint256 indexed poolId, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 indexed poolId, uint256 amount);
    event PoolAdded(uint256 indexed poolId, address stakingToken, address rewardToken);

    /* ----------------------- SETUP ----------------------- */

    function setUp() public {
        vm.startPrank(owner);

        // Deploy tokens
        sovaToken = new SOVAToken("SOVA Token", "SOVA", owner, 50_000_000 * 1e18); // 50M initial supply
        sovaBTC = new SovaBTCOFT("SovaBTC", "sovaBTC", lzEndpoint, owner);
        revenueToken = new MockERC20BTC("Revenue Token", "REV", 18);

        // Deploy staking contract
        stakingContract = new SovaBTCStaking(feeRecipient);

        // Grant staking contract minting rights for SOVA
        sovaToken.addMinter(address(stakingContract));

        // Set up pools
        // Pool 0: Stake SovaBTC, earn SOVA (30-day lock, 1.5x multiplier)
        stakingContract.addPool(
            address(sovaBTC), address(sovaToken), SOVA_REWARD_RATE, LOCK_PERIOD_30_DAYS, MULTIPLIER_1_5X
        );
        sovaBTCPoolId = 0;

        // Pool 1: Stake SOVA, earn revenue tokens (90-day lock, 2x multiplier)
        stakingContract.addPool(
            address(sovaToken), address(revenueToken), REVENUE_REWARD_RATE, LOCK_PERIOD_90_DAYS, MULTIPLIER_2X
        );
        sovaPoolId = 1;

        // Fund reward pools
        sovaToken.transfer(address(stakingContract), 10_000_000 * 1e18); // 10M SOVA for rewards
        revenueToken.mint(owner, 1_000_000 * 1e18);
        revenueToken.transfer(address(stakingContract), 1_000_000 * 1e18); // 1M revenue tokens

        // Set up user balances
        sovaBTC.adminMint(user1, 100 * 1e8); // 100 sovaBTC
        sovaBTC.adminMint(user2, 50 * 1e8); // 50 sovaBTC
        sovaBTC.adminMint(user3, 25 * 1e8); // 25 sovaBTC

        sovaToken.transfer(user1, 10_000 * 1e18); // 10K SOVA
        sovaToken.transfer(user2, 5_000 * 1e18); // 5K SOVA
        sovaToken.transfer(user3, 2_500 * 1e18); // 2.5K SOVA

        vm.stopPrank();
    }

    /* ----------------------- BASIC FUNCTIONALITY TESTS ----------------------- */

    function test_StakingContract_BasicSetup() public {
        assertEq(stakingContract.poolLength(), 2);
        assertEq(stakingContract.owner(), owner);
        assertEq(stakingContract.feeRecipient(), feeRecipient);
        assertEq(stakingContract.protocolFee(), 300); // 3%
    }

    function test_PoolConfiguration() public {
        IStaking.PoolInfo memory sovaBTCPool = stakingContract.getPoolInfo(sovaBTCPoolId);
        assertEq(sovaBTCPool.stakingToken, address(sovaBTC));
        assertEq(sovaBTCPool.rewardToken, address(sovaToken));
        assertEq(sovaBTCPool.rewardPerSecond, SOVA_REWARD_RATE);
        assertEq(sovaBTCPool.lockPeriod, LOCK_PERIOD_30_DAYS);
        assertEq(sovaBTCPool.multiplier, MULTIPLIER_1_5X);

        IStaking.PoolInfo memory sovaPool = stakingContract.getPoolInfo(sovaPoolId);
        assertEq(sovaPool.stakingToken, address(sovaToken));
        assertEq(sovaPool.rewardToken, address(revenueToken));
        assertEq(sovaPool.rewardPerSecond, REVENUE_REWARD_RATE);
        assertEq(sovaPool.lockPeriod, LOCK_PERIOD_90_DAYS);
        assertEq(sovaPool.multiplier, MULTIPLIER_2X);
    }

    /* ----------------------- SOVABTC STAKING TESTS ----------------------- */

    function test_SovaBTC_StakeWithoutLock() public {
        uint256 stakeAmount = 10 * 1e8; // 10 sovaBTC

        vm.startPrank(user1);
        sovaBTC.approve(address(stakingContract), stakeAmount);

        vm.expectEmit(true, true, false, true);
        emit Staked(user1, sovaBTCPoolId, stakeAmount, block.timestamp);

        stakingContract.stake(sovaBTCPoolId, stakeAmount, false);

        // Check user info
        IStaking.UserInfo memory userInfo = stakingContract.getUserInfo(sovaBTCPoolId, user1);
        assertEq(userInfo.amount, stakeAmount); // No multiplier without lock
        assertEq(userInfo.lockEndTime, 0); // No lock - should be 0

        // Check pool total
        IStaking.PoolInfo memory poolInfo = stakingContract.getPoolInfo(sovaBTCPoolId);
        assertEq(poolInfo.totalStaked, stakeAmount);

        // Check balances
        assertEq(sovaBTC.balanceOf(user1), 90 * 1e8);
        assertEq(sovaBTC.balanceOf(address(stakingContract)), stakeAmount);

        vm.stopPrank();
    }

    function test_SovaBTC_StakeWithLock() public {
        uint256 stakeAmount = 10 * 1e8; // 10 sovaBTC

        vm.startPrank(user1);
        sovaBTC.approve(address(stakingContract), stakeAmount);

        uint256 expectedLockEnd = block.timestamp + LOCK_PERIOD_30_DAYS;
        uint256 expectedEffectiveAmount = stakeAmount * MULTIPLIER_1_5X / 10000; // 1.5x multiplier

        vm.expectEmit(true, true, false, true);
        emit Staked(user1, sovaBTCPoolId, stakeAmount, expectedLockEnd);

        stakingContract.stake(sovaBTCPoolId, stakeAmount, true);

        // Check user info
        IStaking.UserInfo memory userInfo = stakingContract.getUserInfo(sovaBTCPoolId, user1);
        assertEq(userInfo.amount, expectedEffectiveAmount); // With multiplier
        assertEq(userInfo.lockEndTime, expectedLockEnd);

        // Check actual staked amount function
        uint256 actualStaked = stakingContract.getActualStakedAmount(sovaBTCPoolId, user1);
        assertEq(actualStaked, stakeAmount);

        vm.stopPrank();
    }

    function test_SovaBTC_ClaimRewards() public {
        uint256 stakeAmount = 10 * 1e8;

        // Stake tokens
        vm.startPrank(user1);
        sovaBTC.approve(address(stakingContract), stakeAmount);
        stakingContract.stake(sovaBTCPoolId, stakeAmount, false);
        vm.stopPrank();

        // Fast forward time (1 day)
        vm.warp(block.timestamp + 1 days);

        // Check pending rewards
        uint256 pendingRewards = stakingContract.pendingRewards(sovaBTCPoolId, user1);
        uint256 expectedRewards = 1 days * SOVA_REWARD_RATE; // 1 day worth of rewards
        assertEq(pendingRewards, expectedRewards);

        // Claim rewards
        vm.startPrank(user1);
        uint256 initialSOVABalance = sovaToken.balanceOf(user1);

        vm.expectEmit(true, true, false, true);
        emit RewardsClaimed(user1, sovaBTCPoolId, expectedRewards);

        stakingContract.claimRewards(sovaBTCPoolId);

        // Check SOVA balance (minus protocol fee)
        uint256 protocolFee = expectedRewards * 300 / 10000; // 3% fee
        uint256 userReward = expectedRewards - protocolFee;
        assertEq(sovaToken.balanceOf(user1), initialSOVABalance + userReward);
        assertEq(sovaToken.balanceOf(feeRecipient), protocolFee);

        vm.stopPrank();
    }

    function test_SovaBTC_UnstakeWithoutLock() public {
        uint256 stakeAmount = 10 * 1e8;

        // Stake without lock
        vm.startPrank(user1);
        sovaBTC.approve(address(stakingContract), stakeAmount);
        stakingContract.stake(sovaBTCPoolId, stakeAmount, false);

        // Unstake immediately (no lock period)
        vm.expectEmit(true, true, false, true);
        emit Unstaked(user1, sovaBTCPoolId, stakeAmount);

        stakingContract.unstake(sovaBTCPoolId, stakeAmount);

        // Check balances
        assertEq(sovaBTC.balanceOf(user1), 100 * 1e8); // Back to original
        assertEq(sovaBTC.balanceOf(address(stakingContract)), 0);

        vm.stopPrank();
    }

    function test_SovaBTC_UnstakeWithLock_ShouldFail() public {
        uint256 stakeAmount = 10 * 1e8;

        // Stake with lock
        vm.startPrank(user1);
        sovaBTC.approve(address(stakingContract), stakeAmount);
        stakingContract.stake(sovaBTCPoolId, stakeAmount, true);

        // Try to unstake before lock period ends
        uint256 effectiveAmount = stakeAmount * MULTIPLIER_1_5X / 10000;
        vm.expectRevert(SovaBTCStaking.StillLocked.selector);
        stakingContract.unstake(sovaBTCPoolId, effectiveAmount);

        vm.stopPrank();
    }

    function test_SovaBTC_UnstakeAfterLockPeriod() public {
        uint256 stakeAmount = 10 * 1e8;

        // Stake with lock
        vm.startPrank(user1);
        sovaBTC.approve(address(stakingContract), stakeAmount);
        stakingContract.stake(sovaBTCPoolId, stakeAmount, true);

        // Fast forward past lock period
        vm.warp(block.timestamp + LOCK_PERIOD_30_DAYS + 1);

        // Unstake
        uint256 effectiveAmount = stakeAmount * MULTIPLIER_1_5X / 10000;
        stakingContract.unstake(sovaBTCPoolId, effectiveAmount);

        // Check balances (should get back original amount)
        assertEq(sovaBTC.balanceOf(user1), 100 * 1e8);

        vm.stopPrank();
    }

    /* ----------------------- SOVA STAKING TESTS ----------------------- */

    function test_SOVA_StakeAndEarnRevenue() public {
        uint256 stakeAmount = 1000 * 1e18; // 1000 SOVA

        // Stake SOVA with lock
        vm.startPrank(user1);
        sovaToken.approve(address(stakingContract), stakeAmount);
        stakingContract.stake(sovaPoolId, stakeAmount, true);

        // Fast forward time (1 week)
        vm.warp(block.timestamp + 7 days);

        // Check pending revenue rewards
        uint256 pendingRewards = stakingContract.pendingRewards(sovaPoolId, user1);
        uint256 effectiveAmount = stakeAmount * MULTIPLIER_2X / 10000; // 2x multiplier
        uint256 expectedRewards = 7 days * REVENUE_REWARD_RATE; // Based on total staked
        assertEq(pendingRewards, expectedRewards);

        // Claim rewards
        uint256 initialRevenueBalance = revenueToken.balanceOf(user1);
        stakingContract.claimRewards(sovaPoolId);

        uint256 protocolFee = expectedRewards * 300 / 10000;
        uint256 userReward = expectedRewards - protocolFee;
        assertEq(revenueToken.balanceOf(user1), initialRevenueBalance + userReward);

        vm.stopPrank();
    }

    /* ----------------------- MULTIPLE USERS TESTS ----------------------- */

    function test_MultipleUsers_RewardDistribution() public {
        uint256 user1Amount = 10 * 1e8; // 10 sovaBTC
        uint256 user2Amount = 5 * 1e8; // 5 sovaBTC

        // User1 stakes first
        vm.startPrank(user1);
        sovaBTC.approve(address(stakingContract), user1Amount);
        stakingContract.stake(sovaBTCPoolId, user1Amount, false);
        vm.stopPrank();

        // Fast forward 1 day
        vm.warp(block.timestamp + 1 days);

        // User2 stakes
        vm.startPrank(user2);
        sovaBTC.approve(address(stakingContract), user2Amount);
        stakingContract.stake(sovaBTCPoolId, user2Amount, false);
        vm.stopPrank();

        // Fast forward another day
        vm.warp(block.timestamp + 1 days);

        // Check rewards
        uint256 user1Pending = stakingContract.pendingRewards(sovaBTCPoolId, user1);
        uint256 user2Pending = stakingContract.pendingRewards(sovaBTCPoolId, user2);

        // User1 should have: 1 day full rewards + 1 day 2/3 share
        uint256 expectedUser1 = (1 days * SOVA_REWARD_RATE) + (1 days * SOVA_REWARD_RATE * 10 / 15);

        // User2 should have: 1 day 1/3 share
        uint256 expectedUser2 = 1 days * SOVA_REWARD_RATE * 5 / 15;

        assertApproxEqAbs(user1Pending, expectedUser1, 1); // Allow 1 wei tolerance
        assertApproxEqAbs(user2Pending, expectedUser2, 1);
    }

    /* ----------------------- LOCK PERIOD AND MULTIPLIER TESTS ----------------------- */

    function test_LockPeriod_Multiplier_Effect() public {
        uint256 stakeAmount = 10 * 1e8;

        // User1 stakes without lock
        vm.startPrank(user1);
        sovaBTC.approve(address(stakingContract), stakeAmount);
        stakingContract.stake(sovaBTCPoolId, stakeAmount, false);
        vm.stopPrank();

        // User2 stakes with lock (same amount)
        vm.startPrank(user2);
        sovaBTC.approve(address(stakingContract), stakeAmount);
        stakingContract.stake(sovaBTCPoolId, stakeAmount, true);
        vm.stopPrank();

        // Fast forward time
        vm.warp(block.timestamp + 1 days);

        // Check rewards - user2 should earn more due to multiplier
        uint256 user1Pending = stakingContract.pendingRewards(sovaBTCPoolId, user1);
        uint256 user2Pending = stakingContract.pendingRewards(sovaBTCPoolId, user2);

        // User2 has 1.5x effective stake, so should earn 1.5x more in proportion
        uint256 totalEffective = stakeAmount + (stakeAmount * MULTIPLIER_1_5X / 10000);
        uint256 expectedUser1 = 1 days * SOVA_REWARD_RATE * stakeAmount / totalEffective;
        uint256 expectedUser2 = 1 days * SOVA_REWARD_RATE * (stakeAmount * MULTIPLIER_1_5X / 10000) / totalEffective;

        assertApproxEqAbs(user1Pending, expectedUser1, 1);
        assertApproxEqAbs(user2Pending, expectedUser2, 1);
        assertTrue(user2Pending > user1Pending); // User2 earns more due to multiplier
    }

    /* ----------------------- EMERGENCY FUNCTIONS TESTS ----------------------- */

    function test_EmergencyUnstake() public {
        uint256 stakeAmount = 10 * 1e8;

        // Stake with lock
        vm.startPrank(user1);
        sovaBTC.approve(address(stakingContract), stakeAmount);
        stakingContract.stake(sovaBTCPoolId, stakeAmount, true);

        // Fast forward some time (but not full lock period)
        vm.warp(block.timestamp + 15 days);

        // Emergency unstake (should work even during lock period)
        stakingContract.emergencyUnstake(sovaBTCPoolId);

        // Check that user got back original tokens (no rewards)
        assertEq(sovaBTC.balanceOf(user1), 100 * 1e8); // Back to original

        // Check user info is reset
        IStaking.UserInfo memory userInfo = stakingContract.getUserInfo(sovaBTCPoolId, user1);
        assertEq(userInfo.amount, 0);
        assertEq(userInfo.rewardDebt, 0);
        assertEq(userInfo.lockEndTime, 0);

        vm.stopPrank();
    }

    function test_EmergencyPause() public {
        vm.startPrank(owner);

        stakingContract.emergencyPause();
        assertTrue(stakingContract.paused());
        assertTrue(stakingContract.emergencyMode());

        vm.stopPrank();

        // Try to stake while paused
        vm.startPrank(user1);
        sovaBTC.approve(address(stakingContract), 10 * 1e8);

        vm.expectRevert(Pausable.EnforcedPause.selector);
        stakingContract.stake(sovaBTCPoolId, 10 * 1e8, false);

        vm.stopPrank();
    }

    /* ----------------------- ADMIN FUNCTION TESTS ----------------------- */

    function test_AddPool() public {
        vm.startPrank(owner);

        // Create a new mock token for staking
        MockERC20BTC newToken = new MockERC20BTC("New Token", "NEW", 18);

        uint256 poolCountBefore = stakingContract.poolLength();

        vm.expectEmit(true, false, false, true);
        emit PoolAdded(poolCountBefore, address(newToken), address(sovaToken));

        stakingContract.addPool(
            address(newToken),
            address(sovaToken),
            0.5e18, // 0.5 SOVA per second
            60 days, // 60-day lock
            25000 // 2.5x multiplier
        );

        assertEq(stakingContract.poolLength(), poolCountBefore + 1);

        IStaking.PoolInfo memory newPool = stakingContract.getPoolInfo(poolCountBefore);
        assertEq(newPool.stakingToken, address(newToken));
        assertEq(newPool.rewardToken, address(sovaToken));
        assertEq(newPool.rewardPerSecond, 0.5e18);
        assertEq(newPool.lockPeriod, 60 days);
        assertEq(newPool.multiplier, 25000);

        vm.stopPrank();
    }

    function test_UpdatePool() public {
        vm.startPrank(owner);

        stakingContract.updatePool(
            sovaBTCPoolId,
            2e18, // New reward rate: 2 SOVA per second
            45 days, // New lock period: 45 days
            18000 // New multiplier: 1.8x
        );

        IStaking.PoolInfo memory updatedPool = stakingContract.getPoolInfo(sovaBTCPoolId);
        assertEq(updatedPool.rewardPerSecond, 2e18);
        assertEq(updatedPool.lockPeriod, 45 days);
        assertEq(updatedPool.multiplier, 18000);

        vm.stopPrank();
    }

    function test_FundRewardPool() public {
        uint256 fundAmount = 1_000_000 * 1e18;

        vm.startPrank(owner);

        uint256 contractBalanceBefore = sovaToken.balanceOf(address(stakingContract));

        sovaToken.approve(address(stakingContract), fundAmount);
        stakingContract.fundRewardPool(sovaBTCPoolId, fundAmount);

        assertEq(sovaToken.balanceOf(address(stakingContract)), contractBalanceBefore + fundAmount);

        vm.stopPrank();
    }

    function test_SetProtocolFee() public {
        vm.startPrank(owner);

        stakingContract.setProtocolFee(500); // 5%
        assertEq(stakingContract.protocolFee(), 500);

        // Test max fee limit
        vm.expectRevert(SovaBTCStaking.InvalidFeeRate.selector);
        stakingContract.setProtocolFee(1001); // > 10%

        vm.stopPrank();
    }

    /* ----------------------- EDGE CASES AND ERROR TESTS ----------------------- */

    function test_ZeroAmountStake() public {
        vm.startPrank(user1);

        vm.expectRevert(SovaBTCStaking.ZeroAmount.selector);
        stakingContract.stake(sovaBTCPoolId, 0, false);

        vm.stopPrank();
    }

    function test_InvalidPoolId() public {
        vm.startPrank(user1);

        vm.expectRevert(SovaBTCStaking.InvalidPoolId.selector);
        stakingContract.stake(999, 10 * 1e8, false);

        vm.stopPrank();
    }

    function test_InsufficientUnstake() public {
        uint256 stakeAmount = 10 * 1e8;

        vm.startPrank(user1);
        sovaBTC.approve(address(stakingContract), stakeAmount);
        stakingContract.stake(sovaBTCPoolId, stakeAmount, false);

        // Try to unstake more than staked
        vm.expectRevert(SovaBTCStaking.InsufficientAmount.selector);
        stakingContract.unstake(sovaBTCPoolId, stakeAmount + 1);

        vm.stopPrank();
    }

    /* ----------------------- INTEGRATION TESTS ----------------------- */

    function test_FullStakingLifecycle() public {
        uint256 stakeAmount = 20 * 1e8;

        vm.startPrank(user1);

        // 1. Stake SovaBTC with lock
        sovaBTC.approve(address(stakingContract), stakeAmount);
        stakingContract.stake(sovaBTCPoolId, stakeAmount, true);

        // 2. Fast forward and accumulate rewards
        vm.warp(block.timestamp + 15 days);

        // 3. Claim partial rewards
        uint256 initialSOVABalance = sovaToken.balanceOf(user1);
        stakingContract.claimRewards(sovaBTCPoolId);
        assertTrue(sovaToken.balanceOf(user1) > initialSOVABalance);

        // 4. Fast forward past lock period
        vm.warp(block.timestamp + 16 days); // Total 31 days

        // 5. Stake some of the earned SOVA in SOVA pool
        uint256 sovaEarned = sovaToken.balanceOf(user1) - initialSOVABalance;
        sovaToken.approve(address(stakingContract), sovaEarned);
        stakingContract.stake(sovaPoolId, sovaEarned, true);

        // 6. Unstake original SovaBTC position
        uint256 effectiveAmount = stakeAmount * MULTIPLIER_1_5X / 10000;
        stakingContract.unstake(sovaBTCPoolId, effectiveAmount);

        // 7. Verify balances and positions
        assertEq(sovaBTC.balanceOf(user1), 100 * 1e8); // Got back original SovaBTC

        IStaking.UserInfo memory sovaStakeInfo = stakingContract.getUserInfo(sovaPoolId, user1);
        assertTrue(sovaStakeInfo.amount > 0); // Has SOVA staked
        assertTrue(sovaStakeInfo.lockEndTime > block.timestamp); // Locked for 90 days

        vm.stopPrank();
    }

    function test_CrossPoolRewardGeneration() public {
        // Set up stakes in both pools
        vm.startPrank(user1);

        // Stake SovaBTC to earn SOVA
        sovaBTC.approve(address(stakingContract), 10 * 1e8);
        stakingContract.stake(sovaBTCPoolId, 10 * 1e8, false);

        // Stake SOVA to earn revenue
        sovaToken.approve(address(stakingContract), 1000 * 1e18);
        stakingContract.stake(sovaPoolId, 1000 * 1e18, false);

        vm.stopPrank();

        // Fast forward time
        vm.warp(block.timestamp + 10 days);

        // Check that user earns rewards from both pools
        uint256 sovaPending = stakingContract.pendingRewards(sovaBTCPoolId, user1);
        uint256 revenuePending = stakingContract.pendingRewards(sovaPoolId, user1);

        assertTrue(sovaPending > 0);
        assertTrue(revenuePending > 0);

        // Claim from both pools
        vm.startPrank(user1);

        uint256 initialSOVA = sovaToken.balanceOf(user1);
        uint256 initialRevenue = revenueToken.balanceOf(user1);

        stakingContract.claimRewards(sovaBTCPoolId);
        stakingContract.claimRewards(sovaPoolId);

        assertTrue(sovaToken.balanceOf(user1) > initialSOVA);
        assertTrue(revenueToken.balanceOf(user1) > initialRevenue);

        vm.stopPrank();
    }

    /* ----------------------- SOVA TOKEN TESTS ----------------------- */

    function test_SOVAToken_BasicFunctionality() public {
        assertEq(sovaToken.name(), "SOVA Token");
        assertEq(sovaToken.symbol(), "SOVA");
        assertEq(sovaToken.decimals(), 18);
        assertEq(sovaToken.MAX_SUPPLY(), 100_000_000 * 1e18);
        assertTrue(sovaToken.isMinter(owner));
        assertTrue(sovaToken.isMinter(address(stakingContract)));
    }

    function test_SOVAToken_MintingLimits() public {
        vm.startPrank(owner);

        // Try to mint beyond max supply
        uint256 remainingSupply = sovaToken.remainingSupply();

        vm.expectRevert(SOVAToken.ExceedsMaxSupply.selector);
        sovaToken.mint(owner, remainingSupply + 1);

        // Should be able to mint exactly the remaining amount
        sovaToken.mint(owner, remainingSupply);
        assertEq(sovaToken.totalSupply(), sovaToken.MAX_SUPPLY());

        vm.stopPrank();
    }

    function test_SOVAToken_MinterManagement() public {
        vm.startPrank(owner);

        address newMinter = address(0x123);

        // Add minter
        sovaToken.addMinter(newMinter);
        assertTrue(sovaToken.isMinter(newMinter));

        // Remove minter
        sovaToken.removeMinter(newMinter);
        assertFalse(sovaToken.isMinter(newMinter));

        vm.stopPrank();
    }

    function test_SOVAToken_UnauthorizedMinting() public {
        vm.startPrank(user1);

        vm.expectRevert(SOVAToken.UnauthorizedMinter.selector);
        sovaToken.mint(user1, 1000 * 1e18);

        vm.stopPrank();
    }
}
