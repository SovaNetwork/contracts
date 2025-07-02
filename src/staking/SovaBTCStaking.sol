// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@solady/auth/Ownable.sol";
import "@solady/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IStaking.sol";

/**
 * @title SovaBTCStaking
 * @notice MasterChef-style staking contract for SovaBTC ecosystem
 * @dev Supports multiple pools, lock periods, and reward multipliers
 */
contract SovaBTCStaking is IStaking, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /* ----------------------- CONSTANTS ----------------------- */
    
    /// @notice Precision factor for reward calculations (1e18)
    uint256 public constant PRECISION_FACTOR = 1e18;
    
    /// @notice Maximum lock period (365 days)
    uint256 public constant MAX_LOCK_PERIOD = 365 days;
    
    /// @notice Maximum reward multiplier (5x)
    uint256 public constant MAX_MULTIPLIER = 50000; // 50000 = 5x (in basis points)
    
    /// @notice Basis points denominator
    uint256 public constant BASIS_POINTS = 10000;

    /* ----------------------- STATE VARIABLES ----------------------- */
    
    /// @notice Array of all pools
    PoolInfo[] public pools;
    
    /// @notice User staking information per pool
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    
    /// @notice Emergency pause state
    bool public emergencyMode;
    
    /// @notice Protocol fee recipient
    address public feeRecipient;
    
    /// @notice Protocol fee rate (in basis points)
    uint256 public protocolFee = 300; // 3%

    /* ----------------------- CUSTOM ERRORS ----------------------- */
    
    error InvalidPoolId();
    error InsufficientAmount();
    error StillLocked();
    error InvalidLockPeriod();
    error InvalidMultiplier();
    error EmergencyModeActive();
    error ZeroAddress();
    error ZeroAmount();
    error PoolNotFound();
    error InvalidFeeRate();

    /* ----------------------- MODIFIERS ----------------------- */
    
    modifier validPool(uint256 poolId) {
        if (poolId >= pools.length) revert InvalidPoolId();
        _;
    }
    
    modifier notEmergency() {
        if (emergencyMode) revert EmergencyModeActive();
        _;
    }

    /* ----------------------- CONSTRUCTOR ----------------------- */
    
    constructor(address _feeRecipient) {
        _initializeOwner(msg.sender);
        
        if (_feeRecipient == address(0)) revert ZeroAddress();
        feeRecipient = _feeRecipient;
    }

    /* ----------------------- CORE STAKING FUNCTIONS ----------------------- */
    
    /**
     * @notice Stake tokens in a pool
     * @param poolId Pool identifier
     * @param amount Amount to stake
     * @param lock Whether to lock for enhanced rewards
     */
    function stake(uint256 poolId, uint256 amount, bool lock) 
        external 
        override 
        validPool(poolId) 
        nonReentrant 
        whenNotPaused 
        notEmergency 
    {
        if (amount == 0) revert ZeroAmount();
        
        PoolInfo storage pool = pools[poolId];
        UserInfo storage user = userInfo[poolId][msg.sender];
        
        // Update pool rewards before changing user state
        _updatePool(poolId);
        
        // If user has existing stake, claim pending rewards
        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accRewardPerShare / PRECISION_FACTOR) - user.rewardDebt;
            if (pending > 0) {
                _safeRewardTransfer(pool.rewardToken, msg.sender, pending);
                emit RewardsClaimed(msg.sender, poolId, pending);
            }
        }
        
        // Transfer staking tokens from user
        IERC20(pool.stakingToken).safeTransferFrom(msg.sender, address(this), amount);
        
        // Calculate effective amount with multiplier if locked
        uint256 effectiveAmount = amount;
        uint256 lockEndTime = block.timestamp;
        
        if (lock && pool.lockPeriod > 0) {
            lockEndTime = block.timestamp + pool.lockPeriod;
            effectiveAmount = amount * pool.multiplier / BASIS_POINTS;
        }
        
        // Update user info
        user.amount += effectiveAmount;
        user.lastStakeTime = block.timestamp;
        if (lock && pool.lockPeriod > 0) {
            user.lockEndTime = lockEndTime;
        }
        user.rewardDebt = user.amount * pool.accRewardPerShare / PRECISION_FACTOR;
        
        // Update pool total
        pool.totalStaked += effectiveAmount;
        
        emit Staked(msg.sender, poolId, amount, lockEndTime);
    }
    
    /**
     * @notice Unstake tokens from a pool
     * @param poolId Pool identifier
     * @param amount Amount to unstake (effective amount)
     */
    function unstake(uint256 poolId, uint256 amount) 
        external 
        override 
        validPool(poolId) 
        nonReentrant 
        notEmergency 
    {
        if (amount == 0) revert ZeroAmount();
        
        PoolInfo storage pool = pools[poolId];
        UserInfo storage user = userInfo[poolId][msg.sender];
        
        if (user.amount < amount) revert InsufficientAmount();
        
        // Check lock period
        if (user.lockEndTime > block.timestamp) revert StillLocked();
        
        // Update pool rewards
        _updatePool(poolId);
        
        // Calculate and send pending rewards
        uint256 pending = (user.amount * pool.accRewardPerShare / PRECISION_FACTOR) - user.rewardDebt;
        if (pending > 0) {
            _safeRewardTransfer(pool.rewardToken, msg.sender, pending);
            emit RewardsClaimed(msg.sender, poolId, pending);
        }
        
        // Calculate actual token amount to return (reverse multiplier calculation)
        uint256 actualAmount = amount;
        if (user.lockEndTime > user.lastStakeTime && pool.multiplier > BASIS_POINTS) {
            // If this was a locked stake with multiplier, calculate original amount
            actualAmount = amount * BASIS_POINTS / pool.multiplier;
        }
        
        // Update user info
        user.amount -= amount;
        user.rewardDebt = user.amount * pool.accRewardPerShare / PRECISION_FACTOR;
        
        // Update pool total
        pool.totalStaked -= amount;
        
        // Transfer staking tokens back to user
        IERC20(pool.stakingToken).safeTransfer(msg.sender, actualAmount);
        
        emit Unstaked(msg.sender, poolId, actualAmount);
    }
    
    /**
     * @notice Claim pending rewards without unstaking
     * @param poolId Pool identifier
     */
    function claimRewards(uint256 poolId) 
        external 
        override 
        validPool(poolId) 
        nonReentrant 
        notEmergency 
    {
        PoolInfo storage pool = pools[poolId];
        UserInfo storage user = userInfo[poolId][msg.sender];
        
        // Update pool rewards
        _updatePool(poolId);
        
        // Calculate pending rewards
        uint256 pending = (user.amount * pool.accRewardPerShare / PRECISION_FACTOR) - user.rewardDebt;
        
        if (pending > 0) {
            // Update reward debt
            user.rewardDebt = user.amount * pool.accRewardPerShare / PRECISION_FACTOR;
            
            // Transfer rewards
            _safeRewardTransfer(pool.rewardToken, msg.sender, pending);
            
            emit RewardsClaimed(msg.sender, poolId, pending);
        }
    }
    
    /**
     * @notice Emergency unstake without rewards (in case of issues)
     * @param poolId Pool identifier
     */
    function emergencyUnstake(uint256 poolId) 
        external 
        override 
        validPool(poolId) 
        nonReentrant 
    {
        PoolInfo storage pool = pools[poolId];
        UserInfo storage user = userInfo[poolId][msg.sender];
        
        uint256 userAmount = user.amount;
        if (userAmount == 0) revert InsufficientAmount();
        
        // Calculate actual token amount to return
        uint256 actualAmount = userAmount;
        if (user.lockEndTime > user.lastStakeTime && pool.multiplier > BASIS_POINTS) {
            actualAmount = userAmount * BASIS_POINTS / pool.multiplier;
        }
        
        // Reset user info
        user.amount = 0;
        user.rewardDebt = 0;
        user.lockEndTime = 0;
        
        // Update pool total
        pool.totalStaked -= userAmount;
        
        // Transfer staking tokens back to user (no rewards)
        IERC20(pool.stakingToken).safeTransfer(msg.sender, actualAmount);
        
        emit EmergencyWithdraw(msg.sender, poolId, actualAmount);
    }

    /* ----------------------- VIEW FUNCTIONS ----------------------- */
    
    /**
     * @notice Get pending rewards for a user
     * @param poolId Pool identifier
     * @param user User address
     * @return Pending reward amount
     */
    function pendingRewards(uint256 poolId, address user) 
        external 
        view 
        override 
        validPool(poolId) 
        returns (uint256) 
    {
        PoolInfo storage pool = pools[poolId];
        UserInfo storage userStake = userInfo[poolId][user];
        
        uint256 accRewardPerShare = pool.accRewardPerShare;
        
        if (block.timestamp > pool.lastRewardTime && pool.totalStaked != 0) {
            uint256 timeElapsed = block.timestamp - pool.lastRewardTime;
            uint256 rewardAmount = timeElapsed * pool.rewardPerSecond;
            accRewardPerShare += (rewardAmount * PRECISION_FACTOR) / pool.totalStaked;
        }
        
        return (userStake.amount * accRewardPerShare / PRECISION_FACTOR) - userStake.rewardDebt;
    }
    
    /**
     * @notice Get user staking information
     * @param poolId Pool identifier
     * @param user User address
     * @return User staking details
     */
    function getUserInfo(uint256 poolId, address user) 
        external 
        view 
        override 
        validPool(poolId) 
        returns (UserInfo memory) 
    {
        return userInfo[poolId][user];
    }
    
    /**
     * @notice Get pool information
     * @param poolId Pool identifier
     * @return Pool details
     */
    function getPoolInfo(uint256 poolId) 
        external 
        view 
        override 
        validPool(poolId) 
        returns (PoolInfo memory) 
    {
        return pools[poolId];
    }
    
    /**
     * @notice Get total number of pools
     * @return Number of pools
     */
    function poolLength() external view override returns (uint256) {
        return pools.length;
    }
    
    /**
     * @notice Get actual staked amount for a user (accounting for multipliers)
     * @param poolId Pool identifier
     * @param user User address
     * @return Actual staked token amount
     */
    function getActualStakedAmount(uint256 poolId, address user) 
        external 
        view 
        validPool(poolId) 
        returns (uint256) 
    {
        UserInfo storage userStake = userInfo[poolId][user];
        PoolInfo storage pool = pools[poolId];
        
        if (userStake.lockEndTime > userStake.lastStakeTime && pool.multiplier > BASIS_POINTS) {
            return userStake.amount * BASIS_POINTS / pool.multiplier;
        }
        return userStake.amount;
    }

    /* ----------------------- ADMIN FUNCTIONS ----------------------- */
    
    /**
     * @notice Add a new staking pool
     * @param stakingToken Token to be staked
     * @param rewardToken Token given as rewards
     * @param rewardPerSecond Rate of reward distribution
     * @param lockPeriod Lock period for enhanced rewards
     * @param multiplier Reward multiplier for locked stakes (in basis points)
     */
    function addPool(
        address stakingToken,
        address rewardToken,
        uint256 rewardPerSecond,
        uint256 lockPeriod,
        uint256 multiplier
    ) external override onlyOwner {
        if (stakingToken == address(0) || rewardToken == address(0)) revert ZeroAddress();
        if (lockPeriod > MAX_LOCK_PERIOD) revert InvalidLockPeriod();
        if (multiplier > MAX_MULTIPLIER) revert InvalidMultiplier();
        
        pools.push(PoolInfo({
            stakingToken: stakingToken,
            rewardToken: rewardToken,
            rewardPerSecond: rewardPerSecond,
            lastRewardTime: block.timestamp,
            accRewardPerShare: 0,
            totalStaked: 0,
            lockPeriod: lockPeriod,
            multiplier: multiplier
        }));
        
        uint256 poolId = pools.length - 1;
        emit PoolAdded(poolId, stakingToken, rewardToken);
    }
    
    /**
     * @notice Update pool parameters
     * @param poolId Pool identifier
     * @param rewardPerSecond New reward rate
     * @param lockPeriod New lock period
     * @param multiplier New multiplier
     */
    function updatePool(
        uint256 poolId,
        uint256 rewardPerSecond,
        uint256 lockPeriod,
        uint256 multiplier
    ) external override onlyOwner validPool(poolId) {
        if (lockPeriod > MAX_LOCK_PERIOD) revert InvalidLockPeriod();
        if (multiplier > MAX_MULTIPLIER) revert InvalidMultiplier();
        
        // Update rewards before changing parameters
        _updatePool(poolId);
        
        PoolInfo storage pool = pools[poolId];
        pool.rewardPerSecond = rewardPerSecond;
        pool.lockPeriod = lockPeriod;
        pool.multiplier = multiplier;
        
        emit PoolUpdated(poolId, rewardPerSecond, lockPeriod, multiplier);
    }
    
    /**
     * @notice Fund reward pool with tokens
     * @param poolId Pool identifier
     * @param amount Amount to fund
     */
    function fundRewardPool(uint256 poolId, uint256 amount) 
        external 
        override 
        validPool(poolId) 
    {
        if (amount == 0) revert ZeroAmount();
        
        PoolInfo storage pool = pools[poolId];
        IERC20(pool.rewardToken).safeTransferFrom(msg.sender, address(this), amount);
    }
    
    /**
     * @notice Set protocol fee rate
     * @param _protocolFee New fee rate in basis points
     */
    function setProtocolFee(uint256 _protocolFee) external onlyOwner {
        if (_protocolFee > 1000) revert InvalidFeeRate(); // Max 10%
        protocolFee = _protocolFee;
    }
    
    /**
     * @notice Set fee recipient
     * @param _feeRecipient New fee recipient address
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        if (_feeRecipient == address(0)) revert ZeroAddress();
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @notice Emergency pause
     */
    function emergencyPause() external onlyOwner {
        emergencyMode = true;
        _pause();
    }
    
    /**
     * @notice Emergency unpause
     */
    function emergencyUnpause() external onlyOwner {
        emergencyMode = false;
        _unpause();
    }
    
    /**
     * @notice Mass update all pools (update reward calculations)
     */
    function massUpdatePools() external {
        for (uint256 i = 0; i < pools.length; i++) {
            _updatePool(i);
        }
    }

    /* ----------------------- INTERNAL FUNCTIONS ----------------------- */
    
    /**
     * @notice Update reward variables for a pool
     * @param poolId Pool identifier
     */
    function _updatePool(uint256 poolId) internal {
        PoolInfo storage pool = pools[poolId];
        
        if (block.timestamp <= pool.lastRewardTime) {
            return;
        }
        
        if (pool.totalStaked == 0) {
            pool.lastRewardTime = block.timestamp;
            return;
        }
        
        uint256 timeElapsed = block.timestamp - pool.lastRewardTime;
        uint256 rewardAmount = timeElapsed * pool.rewardPerSecond;
        
        pool.accRewardPerShare += (rewardAmount * PRECISION_FACTOR) / pool.totalStaked;
        pool.lastRewardTime = block.timestamp;
    }
    
    /**
     * @notice Safe reward transfer (handles insufficient balance)
     * @param rewardToken Reward token address
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function _safeRewardTransfer(address rewardToken, address to, uint256 amount) internal {
        uint256 rewardBalance = IERC20(rewardToken).balanceOf(address(this));
        
        if (amount > rewardBalance) {
            // If insufficient balance, transfer what's available
            amount = rewardBalance;
        }
        
        if (amount > 0) {
            // Deduct protocol fee
            uint256 fee = 0;
            if (protocolFee > 0) {
                fee = amount * protocolFee / BASIS_POINTS;
                if (fee > 0) {
                    IERC20(rewardToken).safeTransfer(feeRecipient, fee);
                }
            }
            
            // Transfer remaining amount to user
            uint256 userAmount = amount - fee;
            if (userAmount > 0) {
                IERC20(rewardToken).safeTransfer(to, userAmount);
            }
        }
    }
} 