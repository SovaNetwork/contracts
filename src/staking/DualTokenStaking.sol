// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/staking/IDualTokenStaking.sol";

/**
 * @title DualTokenStaking
 * @dev Dual token staking system: SovaBTC <-> SOVA with cross-rewards
 * @notice Stake SovaBTC to earn SOVA, stake SOVA to earn SovaBTC
 */
contract DualTokenStaking is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    IDualTokenStaking
{
    using SafeERC20 for IERC20;

    /// @notice SovaBTC token contract
    IERC20 public sovaBTC;

    /// @notice SOVA token contract
    IERC20 public sova;

    /// @notice Mapping from user to stake information
    mapping(address => StakeInfo) public stakes;

    /// @notice Current reward rates
    RewardRate public rewardRates;

    /// @notice Total amount of SovaBTC staked
    uint256 public totalSovaBTCStaked;

    /// @notice Total amount of SOVA staked
    uint256 public totalSovaStaked;

    /// @notice Lock period multipliers (lock period => multiplier in basis points)
    mapping(uint256 => uint256) public lockMultipliers;

    /// @notice Available lock periods
    uint256[] public lockPeriods;

    /// @notice Minimum stake amount
    uint256 public constant MIN_STAKE_AMOUNT = 1000; // 0.00001 BTC in 8 decimals

    /// @notice Maximum lock period
    uint256 public constant MAX_LOCK_PERIOD = 365 days;

    /// @notice Emergency unstake penalty (basis points)
    uint256 public emergencyUnstakePenalty;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner, address _sovaBTC, address _sova) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        if (_sovaBTC == address(0) || _sova == address(0)) revert ZeroAddress();

        sovaBTC = IERC20(_sovaBTC);
        sova = IERC20(_sova);

        // Default reward rates (can be updated by owner)
        rewardRates = RewardRate({
            sovaBTCToSovaRate: 100, // 1% annual yield in basis points per second
            sovaToSovaBTCRate: 50, // 0.5% annual yield in basis points per second
            dualStakeMultiplier: 5000 // 50% bonus for dual staking
        });

        // Default lock periods and multipliers
        lockPeriods = [0, 30 days, 90 days, 180 days, 365 days];
        lockMultipliers[0] = 10000; // 1x (no lock)
        lockMultipliers[30 days] = 11000; // 1.1x
        lockMultipliers[90 days] = 12500; // 1.25x
        lockMultipliers[180 days] = 15000; // 1.5x
        lockMultipliers[365 days] = 20000; // 2x

        emergencyUnstakePenalty = 2500; // 25% penalty
    }

    /**
     * @notice Stake SovaBTC tokens to earn SOVA rewards
     * @param amount Amount of SovaBTC to stake
     * @param lockPeriod Lock period in seconds
     */
    function stakeSovaBTC(uint256 amount, uint256 lockPeriod) external nonReentrant whenNotPaused {
        if (amount < MIN_STAKE_AMOUNT) revert ZeroAmount();
        if (lockMultipliers[lockPeriod] == 0) revert InvalidLockPeriod();

        _updateRewards(msg.sender);

        StakeInfo storage stake = stakes[msg.sender];

        // Transfer tokens
        sovaBTC.safeTransferFrom(msg.sender, address(this), amount);

        // Update stake info
        stake.sovaBTCAmount += amount;
        totalSovaBTCStaked += amount;

        // Set lock end time (extend if longer than current)
        uint256 newLockEnd = block.timestamp + lockPeriod;
        if (newLockEnd > stake.lockEndTime) {
            stake.lockEndTime = newLockEnd;
        }

        emit SovaBTCStaked(msg.sender, amount, lockPeriod);
    }

    /**
     * @notice Stake SOVA tokens to earn SovaBTC rewards
     * @param amount Amount of SOVA to stake
     * @param lockPeriod Lock period in seconds
     */
    function stakeSova(uint256 amount, uint256 lockPeriod) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (lockMultipliers[lockPeriod] == 0) revert InvalidLockPeriod();

        _updateRewards(msg.sender);

        StakeInfo storage stake = stakes[msg.sender];

        // Transfer tokens
        sova.safeTransferFrom(msg.sender, address(this), amount);

        // Update stake info
        stake.sovaAmount += amount;
        totalSovaStaked += amount;

        // Set lock end time (extend if longer than current)
        uint256 newLockEnd = block.timestamp + lockPeriod;
        if (newLockEnd > stake.lockEndTime) {
            stake.lockEndTime = newLockEnd;
        }

        emit SovaStaked(msg.sender, amount, lockPeriod);
    }

    /**
     * @notice Unstake SovaBTC tokens
     * @param amount Amount to unstake
     */
    function unstakeSovaBTC(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        StakeInfo storage stake = stakes[msg.sender];
        if (stake.sovaBTCAmount < amount) revert InsufficientBalance();
        if (block.timestamp < stake.lockEndTime) revert StillLocked();

        _updateRewards(msg.sender);

        stake.sovaBTCAmount -= amount;
        totalSovaBTCStaked -= amount;

        sovaBTC.safeTransfer(msg.sender, amount);

        emit SovaBTCUnstaked(msg.sender, amount);
    }

    /**
     * @notice Unstake SOVA tokens
     * @param amount Amount to unstake
     */
    function unstakeSova(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        StakeInfo storage stake = stakes[msg.sender];
        if (stake.sovaAmount < amount) revert InsufficientBalance();
        if (block.timestamp < stake.lockEndTime) revert StillLocked();

        _updateRewards(msg.sender);

        stake.sovaAmount -= amount;
        totalSovaStaked -= amount;

        sova.safeTransfer(msg.sender, amount);

        emit SovaUnstaked(msg.sender, amount);
    }

    /**
     * @notice Claim accumulated rewards
     */
    function claimRewards() external nonReentrant {
        _updateRewards(msg.sender);

        StakeInfo storage stake = stakes[msg.sender];

        if (stake.sovaBTCRewards == 0 && stake.sovaRewards == 0) {
            revert NoRewards();
        }

        uint256 sovaBTCRewards = stake.sovaBTCRewards;
        uint256 sovaRewards = stake.sovaRewards;

        stake.sovaBTCRewards = 0;
        stake.sovaRewards = 0;

        if (sovaBTCRewards > 0) {
            sovaBTC.safeTransfer(msg.sender, sovaBTCRewards);
        }
        if (sovaRewards > 0) {
            sova.safeTransfer(msg.sender, sovaRewards);
        }

        emit RewardsClaimed(msg.sender, sovaBTCRewards, sovaRewards);
    }

    /**
     * @notice Compound rewards back into stakes
     */
    function compound() external nonReentrant whenNotPaused {
        _updateRewards(msg.sender);

        StakeInfo storage stake = stakes[msg.sender];

        if (stake.sovaBTCRewards > 0) {
            uint256 sovaBTCRewards = stake.sovaBTCRewards;
            stake.sovaBTCRewards = 0;
            stake.sovaBTCAmount += sovaBTCRewards;
            totalSovaBTCStaked += sovaBTCRewards;
        }

        if (stake.sovaRewards > 0) {
            uint256 sovaRewards = stake.sovaRewards;
            stake.sovaRewards = 0;
            stake.sovaAmount += sovaRewards;
            totalSovaStaked += sovaRewards;
        }
    }

    /**
     * @notice Emergency unstake with penalty
     */
    function emergencyUnstake() external nonReentrant {
        StakeInfo storage stake = stakes[msg.sender];

        if (stake.sovaBTCAmount == 0 && stake.sovaAmount == 0) {
            revert ZeroAmount();
        }

        _updateRewards(msg.sender);

        uint256 sovaBTCAmount = stake.sovaBTCAmount;
        uint256 sovaAmount = stake.sovaAmount;

        // Apply penalty
        uint256 sovaBTCPenalty = (sovaBTCAmount * emergencyUnstakePenalty) / 10000;
        uint256 sovaPenalty = (sovaAmount * emergencyUnstakePenalty) / 10000;

        uint256 sovaBTCToReturn = sovaBTCAmount - sovaBTCPenalty;
        uint256 sovaToReturn = sovaAmount - sovaPenalty;

        // Reset stakes
        stake.sovaBTCAmount = 0;
        stake.sovaAmount = 0;
        stake.lockEndTime = 0;
        totalSovaBTCStaked -= sovaBTCAmount;
        totalSovaStaked -= sovaAmount;

        // Transfer tokens (minus penalty)
        if (sovaBTCToReturn > 0) {
            sovaBTC.safeTransfer(msg.sender, sovaBTCToReturn);
        }
        if (sovaToReturn > 0) {
            sova.safeTransfer(msg.sender, sovaToReturn);
        }

        emit EmergencyWithdraw(msg.sender, sovaBTCAmount, sovaAmount);
    }

    /**
     * @notice Set reward rates (owner only)
     */
    function setRewardRates(uint256 sovaBTCToSovaRate, uint256 sovaToSovaBTCRate, uint256 dualStakeMultiplier)
        external
        onlyOwner
    {
        if (dualStakeMultiplier > 50000) revert InvalidRewardRate(); // Max 500% bonus

        rewardRates.sovaBTCToSovaRate = sovaBTCToSovaRate;
        rewardRates.sovaToSovaBTCRate = sovaToSovaBTCRate;
        rewardRates.dualStakeMultiplier = dualStakeMultiplier;

        emit RewardRatesUpdated(sovaBTCToSovaRate, sovaToSovaBTCRate, dualStakeMultiplier);
    }

    /**
     * @notice Add rewards to the contract (owner only)
     */
    function addRewards(uint256 sovaBTCAmount, uint256 sovaAmount) external onlyOwner {
        if (sovaBTCAmount > 0) {
            sovaBTC.safeTransferFrom(msg.sender, address(this), sovaBTCAmount);
        }
        if (sovaAmount > 0) {
            sova.safeTransferFrom(msg.sender, address(this), sovaAmount);
        }
    }

    /**
     * @notice Set lock periods and multipliers
     */
    function setLockPeriods(uint256[] calldata periods, uint256[] calldata multipliers) external onlyOwner {
        if (periods.length != multipliers.length) revert InvalidLockPeriod();

        // Clear existing periods
        for (uint256 i = 0; i < lockPeriods.length; i++) {
            delete lockMultipliers[lockPeriods[i]];
        }
        delete lockPeriods;

        // Set new periods
        for (uint256 i = 0; i < periods.length; i++) {
            if (periods[i] > MAX_LOCK_PERIOD) revert InvalidLockPeriod();
            lockPeriods.push(periods[i]);
            lockMultipliers[periods[i]] = multipliers[i];
        }
    }

    // View functions
    function getStakeInfo(address user) external view returns (StakeInfo memory) {
        return stakes[user];
    }

    function getPendingRewards(address user) external view returns (uint256 sovaBTCRewards, uint256 sovaRewards) {
        StakeInfo memory stake = stakes[user];

        if (stake.lastUpdateTime == 0) {
            return (0, 0);
        }

        uint256 timeElapsed = block.timestamp - stake.lastUpdateTime;

        // Calculate base rewards
        uint256 pendingSovaBTCRewards = stake.sovaBTCRewards;
        uint256 pendingSovaRewards = stake.sovaRewards;

        if (stake.sovaBTCAmount > 0) {
            // SovaBTC staked earns SOVA
            pendingSovaRewards +=
                (stake.sovaBTCAmount * rewardRates.sovaBTCToSovaRate * timeElapsed) / (365 days * 10000);
        }

        if (stake.sovaAmount > 0) {
            // SOVA staked earns SovaBTC
            pendingSovaBTCRewards +=
                (stake.sovaAmount * rewardRates.sovaToSovaBTCRate * timeElapsed) / (365 days * 10000);
        }

        // Apply dual stake bonus
        if (stake.sovaBTCAmount > 0 && stake.sovaAmount > 0) {
            pendingSovaBTCRewards = (pendingSovaBTCRewards * (10000 + rewardRates.dualStakeMultiplier)) / 10000;
            pendingSovaRewards = (pendingSovaRewards * (10000 + rewardRates.dualStakeMultiplier)) / 10000;
        }

        return (pendingSovaBTCRewards, pendingSovaRewards);
    }

    function getRewardRates() external view returns (RewardRate memory) {
        return rewardRates;
    }

    function getLockPeriods() external view returns (uint256[] memory) {
        return lockPeriods;
    }

    function getLockMultiplier(uint256 lockPeriod) external view returns (uint256) {
        return lockMultipliers[lockPeriod];
    }

    // Internal functions
    function _updateRewards(address user) internal {
        StakeInfo storage stake = stakes[user];

        if (stake.lastUpdateTime == 0) {
            stake.lastUpdateTime = block.timestamp;
            return;
        }

        (uint256 sovaBTCRewards, uint256 sovaRewards) = this.getPendingRewards(user);
        stake.sovaBTCRewards = sovaBTCRewards;
        stake.sovaRewards = sovaRewards;
        stake.lastUpdateTime = block.timestamp;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
