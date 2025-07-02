// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IStaking
 * @notice Interface for staking contracts in the SovaBTC ecosystem
 * @dev Defines standard staking mechanics for both SovaBTC and SOVA staking
 */
interface IStaking {
    /* ----------------------- STRUCTS ----------------------- */

    /**
     * @notice User staking information
     * @param amount Amount of tokens staked
     * @param rewardDebt Reward debt for accurate reward calculation
     * @param lastStakeTime Timestamp of last stake action
     * @param lockEndTime End time of lock period (if applicable)
     */
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 lastStakeTime;
        uint256 lockEndTime;
    }

    /**
     * @notice Pool configuration
     * @param stakingToken Address of the token being staked
     * @param rewardToken Address of the reward token
     * @param rewardPerSecond Rate of reward distribution
     * @param lastRewardTime Last time rewards were calculated
     * @param accRewardPerShare Accumulated reward per share
     * @param totalStaked Total amount staked in the pool
     * @param lockPeriod Required lock period for enhanced rewards
     * @param multiplier Reward multiplier for locked stakes
     */
    struct PoolInfo {
        address stakingToken;
        address rewardToken;
        uint256 rewardPerSecond;
        uint256 lastRewardTime;
        uint256 accRewardPerShare;
        uint256 totalStaked;
        uint256 lockPeriod;
        uint256 multiplier;
    }

    /* ----------------------- EVENTS ----------------------- */

    event Staked(address indexed user, uint256 indexed poolId, uint256 amount, uint256 lockEndTime);
    event Unstaked(address indexed user, uint256 indexed poolId, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 indexed poolId, uint256 amount);
    event PoolAdded(uint256 indexed poolId, address stakingToken, address rewardToken);
    event PoolUpdated(uint256 indexed poolId, uint256 rewardPerSecond, uint256 lockPeriod, uint256 multiplier);
    event RewardRateUpdated(uint256 indexed poolId, uint256 oldRate, uint256 newRate);
    event EmergencyWithdraw(address indexed user, uint256 indexed poolId, uint256 amount);

    /* ----------------------- CORE FUNCTIONS ----------------------- */

    /**
     * @notice Stake tokens in a pool
     * @param poolId Pool identifier
     * @param amount Amount to stake
     * @param lock Whether to lock for enhanced rewards
     */
    function stake(uint256 poolId, uint256 amount, bool lock) external;

    /**
     * @notice Unstake tokens from a pool
     * @param poolId Pool identifier
     * @param amount Amount to unstake
     */
    function unstake(uint256 poolId, uint256 amount) external;

    /**
     * @notice Claim pending rewards
     * @param poolId Pool identifier
     */
    function claimRewards(uint256 poolId) external;

    /**
     * @notice Emergency unstake without rewards (in case of issues)
     * @param poolId Pool identifier
     */
    function emergencyUnstake(uint256 poolId) external;

    /* ----------------------- VIEW FUNCTIONS ----------------------- */

    /**
     * @notice Get pending rewards for a user
     * @param poolId Pool identifier
     * @param user User address
     * @return Pending reward amount
     */
    function pendingRewards(uint256 poolId, address user) external view returns (uint256);

    /**
     * @notice Get user staking information
     * @param poolId Pool identifier
     * @param user User address
     * @return User staking details
     */
    function getUserInfo(uint256 poolId, address user) external view returns (UserInfo memory);

    /**
     * @notice Get pool information
     * @param poolId Pool identifier
     * @return Pool details
     */
    function getPoolInfo(uint256 poolId) external view returns (PoolInfo memory);

    /**
     * @notice Get total number of pools
     * @return Number of pools
     */
    function poolLength() external view returns (uint256);

    /* ----------------------- ADMIN FUNCTIONS ----------------------- */

    /**
     * @notice Add a new staking pool
     * @param stakingToken Token to be staked
     * @param rewardToken Token given as rewards
     * @param rewardPerSecond Rate of reward distribution
     * @param lockPeriod Lock period for enhanced rewards
     * @param multiplier Reward multiplier for locked stakes
     */
    function addPool(
        address stakingToken,
        address rewardToken,
        uint256 rewardPerSecond,
        uint256 lockPeriod,
        uint256 multiplier
    ) external;

    /**
     * @notice Update pool parameters
     * @param poolId Pool identifier
     * @param rewardPerSecond New reward rate
     * @param lockPeriod New lock period
     * @param multiplier New multiplier
     */
    function updatePool(uint256 poolId, uint256 rewardPerSecond, uint256 lockPeriod, uint256 multiplier) external;

    /**
     * @notice Fund reward pool with tokens
     * @param poolId Pool identifier
     * @param amount Amount to fund
     */
    function fundRewardPool(uint256 poolId, uint256 amount) external;
}
