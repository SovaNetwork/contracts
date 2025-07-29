// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/wrapper/ISovaBTCWrapper.sol";
import "./SovaBTCToken.sol";

/**
 * @title SovaBTCWrapper
 * @dev Main wrapper contract for managing Bitcoin token deposits and SovaBTC minting
 * @notice Allows users to deposit supported wrapped Bitcoin tokens and mint SovaBTC
 *
 * This contract handles ERC-20 wrapped Bitcoin tokens (WBTC, cbBTC, tBTC) on any EVM chain.
 * On Sova Network, it works alongside the native SovaBTC predeploy contract that handles
 * actual Bitcoin deposits via precompiles. The SovaBTCBridge contract can unify these
 * two systems on Sova Network.
 */
contract SovaBTCWrapper is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    ISovaBTCWrapper
{
    using SafeERC20 for IERC20;

    /// @notice The SovaBTC token contract
    SovaBTCToken public sovaBTC;

    /// @notice Mapping of supported tokens
    mapping(address => SupportedToken) public supportedTokens;

    /// @notice Array of supported token addresses for enumeration
    address[] public supportedTokenAddresses;

    /// @notice Mapping from request ID to redemption request
    mapping(uint256 => RedemptionRequest) public redemptionRequests;

    /// @notice Queue duration in seconds (default 7 days)
    uint256 public queueDuration;

    /// @notice Counter for redemption requests
    uint256 public redemptionCounter;

    /// @notice Minimum deposit amount (in token's native decimals)
    uint256 public minDepositAmount;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner, address _sovaBTC, uint256 _queueDuration) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        if (_sovaBTC == address(0)) revert ZeroAddress();
        if (_queueDuration == 0) revert InvalidQueueDuration();

        sovaBTC = SovaBTCToken(_sovaBTC);
        queueDuration = _queueDuration;
        minDepositAmount = 1000; // 0.00001 BTC in 8 decimals
    }

    /**
     * @notice Add a supported wrapped Bitcoin token
     * @param token Address of the token to add
     * @param name Human readable name of the token
     */
    function addSupportedToken(address token, string calldata name) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (supportedTokens[token].isSupported) revert TokenAlreadySupported();

        uint8 decimals = IERC20Metadata(token).decimals();

        supportedTokens[token] = SupportedToken({isSupported: true, totalDeposited: 0, decimals: decimals, name: name});

        supportedTokenAddresses.push(token);

        emit TokenAdded(token, name, decimals);
    }

    /**
     * @notice Remove a supported token (emergency use)
     * @param token Address of the token to remove
     */
    function removeSupportedToken(address token) external onlyOwner {
        if (!supportedTokens[token].isSupported) revert TokenNotSupported();

        supportedTokens[token].isSupported = false;

        // Remove from array
        for (uint256 i = 0; i < supportedTokenAddresses.length; i++) {
            if (supportedTokenAddresses[i] == token) {
                supportedTokenAddresses[i] = supportedTokenAddresses[supportedTokenAddresses.length - 1];
                supportedTokenAddresses.pop();
                break;
            }
        }

        emit TokenRemoved(token);
    }

    /**
     * @notice Deposit wrapped Bitcoin tokens and mint SovaBTC
     * @param token Address of the token to deposit
     * @param amount Amount to deposit (in token's native decimals)
     */
    function deposit(address token, uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (!supportedTokens[token].isSupported) revert TokenNotSupported();

        // Convert amount to 8 decimals if needed
        uint256 normalizedAmount = _normalizeAmount(token, amount);
        if (normalizedAmount < minDepositAmount) revert ZeroAmount();

        // Transfer tokens from user
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Update total deposited
        supportedTokens[token].totalDeposited += amount;

        // Mint SovaBTC tokens (1:1 ratio in 8 decimals)
        sovaBTC.mint(msg.sender, normalizedAmount);

        emit Deposit(msg.sender, token, amount, normalizedAmount);
    }

    /**
     * @notice Request redemption of SovaBTC for underlying tokens
     * @param amount Amount of SovaBTC to redeem (8 decimals)
     * @param preferredToken Preferred token to receive (fallback to available tokens)
     * @return requestId The ID of the redemption request
     */
    function requestRedemption(uint256 amount, address preferredToken)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 requestId)
    {
        if (amount == 0) revert ZeroAmount();
        if (sovaBTC.balanceOf(msg.sender) < amount) revert InsufficientBalance();

        // Burn SovaBTC tokens immediately
        sovaBTC.burnFrom(msg.sender, amount);

        requestId = ++redemptionCounter;
        redemptionRequests[requestId] = RedemptionRequest({
            user: msg.sender,
            amount: amount,
            preferredToken: preferredToken,
            requestTime: block.timestamp,
            fulfilled: false
        });

        emit RedemptionRequested(requestId, msg.sender, amount, preferredToken);
    }

    /**
     * @notice Claim redemption after queue period
     * @param requestId ID of the redemption request
     */
    function claimRedemption(uint256 requestId) external nonReentrant whenNotPaused {
        RedemptionRequest storage request = redemptionRequests[requestId];

        if (request.user != msg.sender) revert ZeroAddress();
        if (request.fulfilled) revert RedemptionAlreadyFulfilled();
        if (block.timestamp < request.requestTime + queueDuration) revert RedemptionNotReady();

        // Determine which token to give back
        address tokenToReturn = _selectTokenForRedemption(request.preferredToken, request.amount);
        uint256 amountToReturn = _denormalizeAmount(tokenToReturn, request.amount);

        // Check if we have enough liquidity
        if (IERC20(tokenToReturn).balanceOf(address(this)) < amountToReturn) {
            revert InsufficientLiquidity();
        }

        request.fulfilled = true;
        supportedTokens[tokenToReturn].totalDeposited -= amountToReturn;

        // Transfer tokens to user
        IERC20(tokenToReturn).safeTransfer(msg.sender, amountToReturn);

        emit RedemptionFulfilled(requestId, msg.sender, request.amount, tokenToReturn);
    }

    /**
     * @notice Admin function to withdraw tokens (for liquidity management)
     * @param token Token to withdraw
     * @param to Destination address
     * @param amount Amount to withdraw
     */
    function adminWithdraw(address token, address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (!supportedTokens[token].isSupported) revert TokenNotSupported();

        IERC20(token).safeTransfer(to, amount);
        emit AdminWithdrawal(token, to, amount);
    }

    /**
     * @notice Emergency withdrawal function
     * @param token Token to withdraw
     * @param to Destination address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner whenPaused {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        IERC20(token).safeTransfer(to, amount);
        emit AdminWithdrawal(token, to, amount);
    }

    /**
     * @notice Set the redemption queue duration
     * @param _queueDuration New queue duration in seconds
     */
    function setQueueDuration(uint256 _queueDuration) external onlyOwner {
        if (_queueDuration == 0) revert InvalidQueueDuration();

        uint256 oldDuration = queueDuration;
        queueDuration = _queueDuration;

        emit QueueDurationUpdated(oldDuration, _queueDuration);
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // View functions
    function isTokenSupported(address token) external view returns (bool) {
        return supportedTokens[token].isSupported;
    }

    function getSupportedToken(address token) external view returns (SupportedToken memory) {
        return supportedTokens[token];
    }

    function getRedemptionRequest(uint256 requestId) external view returns (RedemptionRequest memory) {
        return redemptionRequests[requestId];
    }

    function getSupportedTokensCount() external view returns (uint256) {
        return supportedTokenAddresses.length;
    }

    function getSupportedTokenAt(uint256 index) external view returns (address) {
        return supportedTokenAddresses[index];
    }

    // Internal functions
    function _normalizeAmount(address token, uint256 amount) internal view returns (uint256) {
        uint8 tokenDecimals = supportedTokens[token].decimals;
        if (tokenDecimals == 8) {
            return amount;
        } else if (tokenDecimals > 8) {
            return amount / (10 ** (tokenDecimals - 8));
        } else {
            return amount * (10 ** (8 - tokenDecimals));
        }
    }

    function _denormalizeAmount(address token, uint256 amount) internal view returns (uint256) {
        uint8 tokenDecimals = supportedTokens[token].decimals;
        if (tokenDecimals == 8) {
            return amount;
        } else if (tokenDecimals > 8) {
            return amount * (10 ** (tokenDecimals - 8));
        } else {
            return amount / (10 ** (8 - tokenDecimals));
        }
    }

    function _selectTokenForRedemption(address preferredToken, uint256 amount) internal view returns (address) {
        // Try preferred token first if it's supported and has liquidity
        if (supportedTokens[preferredToken].isSupported) {
            uint256 requiredAmount = _denormalizeAmount(preferredToken, amount);
            if (IERC20(preferredToken).balanceOf(address(this)) >= requiredAmount) {
                return preferredToken;
            }
        }

        // Fall back to any token with sufficient liquidity
        for (uint256 i = 0; i < supportedTokenAddresses.length; i++) {
            address token = supportedTokenAddresses[i];
            if (supportedTokens[token].isSupported) {
                uint256 requiredAmount = _denormalizeAmount(token, amount);
                if (IERC20(token).balanceOf(address(this)) >= requiredAmount) {
                    return token;
                }
            }
        }

        revert InsufficientLiquidity();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
