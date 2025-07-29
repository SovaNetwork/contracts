// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IDualTokenStaking {
    struct StakeInfo {
        uint256 sovaBTCAmount;
        uint256 sovaAmount;
        uint256 sovaBTCRewards;
        uint256 sovaRewards;
        uint256 lastUpdateTime;
        uint256 lockEndTime;
    }

    struct RewardRate {
        uint256 sovaBTCToSovaRate; // Reward rate for staking SovaBTC -> earn SOVA
        uint256 sovaToSovaBTCRate; // Reward rate for staking SOVA -> earn SovaBTC
        uint256 dualStakeMultiplier; // Bonus multiplier for dual staking (basis points)
    }

    // Events
    event SovaBTCStaked(address indexed user, uint256 amount, uint256 lockPeriod);
    event SovaStaked(address indexed user, uint256 amount, uint256 lockPeriod);
    event SovaBTCUnstaked(address indexed user, uint256 amount);
    event SovaUnstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 sovaBTCRewards, uint256 sovaRewards);
    event RewardRatesUpdated(uint256 sovaBTCToSovaRate, uint256 sovaToSovaBTCRate, uint256 dualStakeMultiplier);
    event EmergencyWithdraw(address indexed user, uint256 sovaBTCAmount, uint256 sovaAmount);

    // Errors
    error ZeroAmount();
    error ZeroAddress();
    error InsufficientBalance();
    error StillLocked();
    error NoRewards();
    error InvalidLockPeriod();
    error InvalidRewardRate();

    // View functions
    function getStakeInfo(address user) external view returns (StakeInfo memory);
    function getPendingRewards(address user) external view returns (uint256 sovaBTCRewards, uint256 sovaRewards);
    function getRewardRates() external view returns (RewardRate memory);
    function totalSovaBTCStaked() external view returns (uint256);
    function totalSovaStaked() external view returns (uint256);

    // User functions
    function stakeSovaBTC(uint256 amount, uint256 lockPeriod) external;
    function stakeSova(uint256 amount, uint256 lockPeriod) external;
    function unstakeSovaBTC(uint256 amount) external;
    function unstakeSova(uint256 amount) external;
    function claimRewards() external;
    function compound() external;
    function emergencyUnstake() external;

    // Admin functions
    function setRewardRates(uint256 sovaBTCToSovaRate, uint256 sovaToSovaBTCRate, uint256 dualStakeMultiplier)
        external;
    function addRewards(uint256 sovaBTCAmount, uint256 sovaAmount) external;
    function setLockPeriods(uint256[] calldata periods, uint256[] calldata multipliers) external;
}
