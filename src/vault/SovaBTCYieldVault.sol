// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC4626Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title SovaBTCYieldVault
 * @dev ERC-4626 compliant vault for Bitcoin yield generation
 * @notice Users deposit BTC variants and receive sovaBTCYield tokens representing their share
 */
contract SovaBTCYieldVault is
    Initializable,
    ERC4626Upgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    /// @notice Whether this vault is deployed on Sova Network
    bool public isSovaNetwork;

    /// @notice Reward token for redemptions (sovaBTC on Sova, BridgedSovaBTC elsewhere)
    IERC20 public rewardToken;

    /// @notice Mapping of supported deposit tokens
    mapping(address => bool) public supportedAssets;

    /// @notice Array of supported asset addresses for enumeration
    address[] public supportedAssetsList;

    /// @notice Total assets managed by admin strategies (not held in contract)
    uint256 public assetsUnderManagement;

    /// @notice Exchange rate: how many reward tokens per vault token
    uint256 public exchangeRate;

    /// @notice Decimals for exchange rate calculations
    uint256 public constant EXCHANGE_RATE_PRECISION = 1e18;

    // Events
    event AssetAdded(address indexed asset, string name);
    event AssetRemoved(address indexed asset);
    event AdminWithdrawal(address indexed asset, uint256 amount, address indexed destination);
    event YieldAdded(uint256 rewardTokenAmount, uint256 newExchangeRate);
    event RewardTokensRedeemed(address indexed user, uint256 vaultTokens, uint256 rewardTokens);
    event AssetsUnderManagementUpdated(uint256 oldAmount, uint256 newAmount);

    // Errors
    error AssetNotSupported();
    error AssetAlreadySupported();
    error ZeroAmount();
    error ZeroAddress();
    error InsufficientRewardTokens();
    error InvalidExchangeRate();
    error NoAssetsToWithdraw();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _underlyingAsset,
        address _rewardToken,
        bool _isSovaNetwork,
        address initialOwner,
        string memory vaultName,
        string memory vaultSymbol
    ) public initializer {
        if (_underlyingAsset == address(0) || _rewardToken == address(0) || initialOwner == address(0)) {
            revert ZeroAddress();
        }

        __ERC4626_init(IERC20Metadata(_underlyingAsset));
        __ERC20_init(vaultName, vaultSymbol);
        __Ownable_init(initialOwner);
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        rewardToken = IERC20(_rewardToken);
        isSovaNetwork = _isSovaNetwork;
        exchangeRate = EXCHANGE_RATE_PRECISION; // 1:1 initially

        // Add the primary underlying asset as supported
        supportedAssets[_underlyingAsset] = true;
        supportedAssetsList.push(_underlyingAsset);

        emit AssetAdded(_underlyingAsset, IERC20Metadata(_underlyingAsset).name());
    }

    /**
     * @notice Returns 8 decimals to match Bitcoin precision
     */
    function decimals() public pure override returns (uint8) {
        return 8;
    }

    /**
     * @notice Add a supported deposit asset
     * @param asset Address of the asset to support
     * @param name Human readable name for logging
     */
    function addSupportedAsset(address asset, string calldata name) external onlyOwner {
        if (asset == address(0)) revert ZeroAddress();
        if (supportedAssets[asset]) revert AssetAlreadySupported();

        supportedAssets[asset] = true;
        supportedAssetsList.push(asset);

        emit AssetAdded(asset, name);
    }

    /**
     * @notice Remove a supported asset
     * @param asset Address of the asset to remove
     */
    function removeSupportedAsset(address asset) external onlyOwner {
        if (!supportedAssets[asset]) revert AssetNotSupported();

        supportedAssets[asset] = false;

        // Remove from array
        for (uint256 i = 0; i < supportedAssetsList.length; i++) {
            if (supportedAssetsList[i] == asset) {
                supportedAssetsList[i] = supportedAssetsList[supportedAssetsList.length - 1];
                supportedAssetsList.pop();
                break;
            }
        }

        emit AssetRemoved(asset);
    }

    /**
     * @notice Deposit any supported asset and receive vault tokens
     * @param asset The asset to deposit
     * @param amount Amount to deposit
     * @param receiver Address to receive vault tokens
     * @return shares Amount of vault tokens minted
     */
    function depositAsset(address asset, uint256 amount, address receiver)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 shares)
    {
        if (!supportedAssets[asset]) revert AssetNotSupported();
        if (amount == 0) revert ZeroAmount();
        if (receiver == address(0)) revert ZeroAddress();

        // Transfer asset from user
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        // Convert to 8 decimals if needed
        uint256 normalizedAmount = _normalizeAmount(asset, amount);

        // Calculate shares to mint
        if (totalSupply() == 0) {
            // First deposit: 1:1 ratio
            shares = normalizedAmount;
        } else {
            // Use standard ERC4626 conversion
            shares = convertToShares(normalizedAmount);
        }

        // Mint vault tokens
        _mint(receiver, shares);

        emit Deposit(msg.sender, receiver, normalizedAmount, shares);
    }

    /**
     * @notice Redeem vault tokens for reward tokens (sovaBTC/BridgedSovaBTC)
     * @param shares Amount of vault tokens to redeem
     * @param receiver Address to receive reward tokens
     * @return rewardAmount Amount of reward tokens received
     */
    function redeemForRewards(uint256 shares, address receiver)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 rewardAmount)
    {
        if (shares == 0) revert ZeroAmount();
        if (receiver == address(0)) revert ZeroAddress();
        if (balanceOf(msg.sender) < shares) revert InsufficientRewardTokens();

        // Calculate reward tokens based on current exchange rate
        rewardAmount = (shares * exchangeRate) / EXCHANGE_RATE_PRECISION;

        if (rewardToken.balanceOf(address(this)) < rewardAmount) {
            revert InsufficientRewardTokens();
        }

        // Burn vault tokens
        _burn(msg.sender, shares);

        // Transfer reward tokens
        rewardToken.safeTransfer(receiver, rewardAmount);

        emit RewardTokensRedeemed(msg.sender, shares, rewardAmount);
    }

    /**
     * @notice Admin function to withdraw assets for investment strategies
     * @param asset The asset to withdraw
     * @param amount Amount to withdraw
     * @param destination Where to send the assets
     */
    function adminWithdraw(address asset, uint256 amount, address destination) external onlyOwner {
        if (destination == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        uint256 balance = IERC20(asset).balanceOf(address(this));
        if (balance < amount) revert NoAssetsToWithdraw();

        IERC20(asset).safeTransfer(destination, amount);

        // Update assets under management
        uint256 normalizedAmount = _normalizeAmount(asset, amount);
        assetsUnderManagement += normalizedAmount;

        emit AdminWithdrawal(asset, amount, destination);
        emit AssetsUnderManagementUpdated(assetsUnderManagement - normalizedAmount, assetsUnderManagement);
    }

    /**
     * @notice Admin function to add yield to the vault
     * @param rewardAmount Amount of reward tokens to add as yield
     */
    function addYield(uint256 rewardAmount) external onlyOwner {
        if (rewardAmount == 0) revert ZeroAmount();

        // Transfer reward tokens to vault
        rewardToken.safeTransferFrom(msg.sender, address(this), rewardAmount);

        // Update exchange rate to reflect increased value
        uint256 totalSupply = totalSupply();
        if (totalSupply > 0) {
            uint256 currentRewardBalance = rewardToken.balanceOf(address(this));
            exchangeRate = (currentRewardBalance * EXCHANGE_RATE_PRECISION) / totalSupply;
        }

        emit YieldAdded(rewardAmount, exchangeRate);
    }

    /**
     * @notice Update assets under management amount
     * @param newAmount New total amount under management
     */
    function updateAssetsUnderManagement(uint256 newAmount) external onlyOwner {
        uint256 oldAmount = assetsUnderManagement;
        assetsUnderManagement = newAmount;

        emit AssetsUnderManagementUpdated(oldAmount, newAmount);
    }

    /**
     * @notice Get total assets (in vault + under management)
     */
    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this)) + assetsUnderManagement;
    }

    /**
     * @notice Get current exchange rate (reward tokens per vault token)
     */
    function getCurrentExchangeRate() external view returns (uint256) {
        return exchangeRate;
    }

    /**
     * @notice Get list of supported assets
     */
    function getSupportedAssets() external view returns (address[] memory) {
        return supportedAssetsList;
    }

    /**
     * @notice Check if an asset is supported
     */
    function isAssetSupported(address asset) external view returns (bool) {
        return supportedAssets[asset];
    }

    /**
     * @notice Pause the vault
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the vault
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Normalize amount to 8 decimals
     */
    function _normalizeAmount(address token, uint256 amount) internal view returns (uint256) {
        uint8 tokenDecimals = IERC20Metadata(token).decimals();
        if (tokenDecimals == 8) {
            return amount;
        } else if (tokenDecimals > 8) {
            return amount / (10 ** (tokenDecimals - 8));
        } else {
            return amount * (10 ** (8 - tokenDecimals));
        }
    }

    /**
     * @notice Override deposit to ensure only primary asset
     */
    function deposit(uint256 assets, address receiver) public override nonReentrant whenNotPaused returns (uint256) {
        return super.deposit(assets, receiver);
    }

    /**
     * @notice Override mint to ensure pausing works
     */
    function mint(uint256 shares, address receiver) public override nonReentrant whenNotPaused returns (uint256) {
        return super.mint(shares, receiver);
    }

    /**
     * @notice Override withdraw to ensure pausing works
     */
    function withdraw(uint256 assets, address receiver, address owner)
        public
        override
        nonReentrant
        whenNotPaused
        returns (uint256)
    {
        return super.withdraw(assets, receiver, owner);
    }

    /**
     * @notice Override redeem to ensure pausing works
     */
    function redeem(uint256 shares, address receiver, address owner)
        public
        override
        nonReentrant
        whenNotPaused
        returns (uint256)
    {
        return super.redeem(shares, receiver, owner);
    }

    /**
     * @notice Authorize contract upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
