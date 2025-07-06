// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@solady/auth/Ownable.sol";
import "@solady/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import "./interfaces/ISovaBTC.sol";
import "./TokenWhitelist.sol";
import "./RedemptionQueue.sol";
import "./CustodyManager.sol";

/**
 * @title SovaBTCWrapper
 * @notice Multi-token wrapper for SovaBTC with deposit and redemption functionality
 * @dev Integrates with TokenWhitelist for approved tokens and RedemptionQueue for delayed redemptions
 */
contract SovaBTCWrapper is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice SovaBTC contract reference
    ISovaBTC public immutable sovaBTC;

    /// @notice TokenWhitelist contract reference
    TokenWhitelist public immutable tokenWhitelist;

    /// @notice RedemptionQueue contract reference
    RedemptionQueue public redemptionQueue;

    /// @notice CustodyManager contract reference
    CustodyManager public immutable custodyManager;

    /// @notice Minimum deposit amount in satoshis
    uint256 public minDepositSatoshi;

    /// @notice Pause state
    bool private _paused;

    // ----------- Events -----------
    event TokenWrapped(address indexed user, address indexed token, uint256 tokenAmount, uint256 sovaAmount);

    event RedemptionQueueUpdated(address indexed oldQueue, address indexed newQueue);
    event MinDepositUpdated(uint256 oldMin, uint256 newMin);
    event ContractPausedByOwner(address indexed account);
    event ContractUnpausedByOwner(address indexed account);

    // ----------- Custom Errors -----------
    error TokenNotAllowed(address token);
    error InsufficientAmount(uint256 provided, uint256 required);
    error ZeroAmount();
    error ZeroAddress();
    error ContractPaused();
    error UnauthorizedCustodian(address caller);
    error InvalidCustodyDestination(address token, address destination);

    modifier whenNotPaused() {
        if (_paused) revert ContractPaused();
        _;
    }

    constructor(address _sovaBTC, address _tokenWhitelist, address _custodyManager, uint256 _minDepositSatoshi) {
        _initializeOwner(msg.sender);

        if (_sovaBTC == address(0)) revert ZeroAddress();
        if (_tokenWhitelist == address(0)) revert ZeroAddress();
        if (_custodyManager == address(0)) revert ZeroAddress();

        sovaBTC = ISovaBTC(_sovaBTC);
        tokenWhitelist = TokenWhitelist(_tokenWhitelist);
        custodyManager = CustodyManager(_custodyManager);
        minDepositSatoshi = _minDepositSatoshi;
        _paused = false;
    }

    // ============ Deposit Functions ============

    /**
     * @notice Deposit BTC-pegged tokens and mint SovaBTC
     * @param token Address of the token to deposit
     * @param amount Amount of tokens to deposit
     */
    function deposit(address token, uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (!tokenWhitelist.isTokenAllowed(token)) revert TokenNotAllowed(token);

        // Get token decimals
        uint8 tokenDecimals = tokenWhitelist.getTokenDecimals(token);

        // Convert to satoshi amount (8 decimals)
        uint256 sovaAmount;
        if (tokenDecimals == 8) {
            sovaAmount = amount; // 1:1 conversion
        } else if (tokenDecimals < 8) {
            sovaAmount = amount * (10 ** (8 - tokenDecimals));
        } else {
            // For tokens with more than 8 decimals, ensure exact satoshi multiples
            uint256 divisor = 10 ** (tokenDecimals - 8);
            if (amount % divisor != 0) {
                revert InsufficientAmount(amount, divisor);
            }
            sovaAmount = amount / divisor;
        }

        // Validate minimum deposit
        if (sovaAmount < minDepositSatoshi) {
            revert InsufficientAmount(sovaAmount, minDepositSatoshi);
        }

        // Transfer tokens from user to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // If redemption queue is set, transfer tokens there for reserves
        if (address(redemptionQueue) != address(0)) {
            IERC20(token).safeTransfer(address(redemptionQueue), amount);
        }

        // Mint SovaBTC to user
        sovaBTC.adminMint(msg.sender, sovaAmount);

        emit TokenWrapped(msg.sender, token, amount, sovaAmount);
    }

    // ============ Redemption Functions ============
    // NOTE: Redemption functions have been removed from the wrapper.
    // Users should interact directly with the RedemptionQueue contract for redemptions.
    // The wrapper's job is to handle deposits and transfer tokens to the RedemptionQueue.

    /**
     * @notice Preview the SovaBTC amount that would be minted for a given token deposit
     * @param token The token address to deposit
     * @param amount The amount of the token to deposit
     * @return sovaAmount The amount of SovaBTC that would be minted
     */
    function previewDeposit(address token, uint256 amount) external view returns (uint256 sovaAmount) {
        if (!tokenWhitelist.isTokenAllowed(token)) {
            revert TokenNotAllowed(token);
        }

        uint8 tokenDecimals = tokenWhitelist.getTokenDecimals(token);

        if (tokenDecimals == 8) {
            return amount; // 1:1 conversion
        } else if (tokenDecimals < 8) {
            return amount * (10 ** (8 - tokenDecimals));
        } else {
            // For tokens with more than 8 decimals, ensure exact satoshi multiples
            uint256 divisor = 10 ** (tokenDecimals - 8);
            if (amount % divisor != 0) {
                revert InsufficientAmount(amount, divisor);
            }
            return amount / divisor;
        }
    }

    // ============ View Functions ============

    /**
     * @notice Get available reserve for a token in the RedemptionQueue
     * @param token Address of the token
     * @return Available balance in the redemption queue
     */
    function getAvailableReserve(address token) external view returns (uint256) {
        if (address(redemptionQueue) == address(0)) return 0;
        return redemptionQueue.getAvailableReserve(token);
    }

    /**
     * @notice Get the RedemptionQueue contract address
     * @return Address of the current RedemptionQueue
     */
    function getRedemptionQueue() external view returns (address) {
        return address(redemptionQueue);
    }

    // ============ Admin Functions ============

    /**
     * @notice Set the RedemptionQueue contract address
     * @param _redemptionQueue Address of the RedemptionQueue contract
     */
    function setRedemptionQueue(address _redemptionQueue) external onlyOwner {
        address oldQueue = address(redemptionQueue);
        redemptionQueue = RedemptionQueue(_redemptionQueue);
        emit RedemptionQueueUpdated(oldQueue, _redemptionQueue);
    }

    /**
     * @notice Set minimum deposit amount in satoshis
     * @param _minDepositSatoshi New minimum deposit amount
     */
    function setMinDepositSatoshi(uint256 _minDepositSatoshi) external onlyOwner {
        uint256 oldMin = minDepositSatoshi;
        minDepositSatoshi = _minDepositSatoshi;
        emit MinDepositUpdated(oldMin, _minDepositSatoshi);
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        if (_paused) revert ContractPaused();
        _paused = true;
        emit ContractPausedByOwner(msg.sender);
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        if (!_paused) revert("Contract not paused");
        _paused = false;
        emit ContractUnpausedByOwner(msg.sender);
    }

    /**
     * @notice Check if the contract is paused
     * @return True if paused, false otherwise
     */
    function isPaused() external view returns (bool) {
        return _paused;
    }

    /**
     * @notice Emergency withdrawal of tokens with custody validation (only owner)
     * @param token Address of the token to withdraw
     * @param amount Amount to withdraw
     * @param to Destination address (must be custody address if enforced)
     */
    function emergencyWithdraw(address token, uint256 amount, address to) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        // Validate destination against custody requirements
        custodyManager.validateDestination(token, to);

        IERC20(token).safeTransfer(to, amount);
    }

    /**
     * @notice Emergency sweep all tokens to custody addresses (only owner)
     * @param tokens Array of token addresses to sweep
     */
    function emergencySweepToCustody(address[] calldata tokens) external onlyOwner {
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            uint256 balance = IERC20(token).balanceOf(address(this));

            if (balance > 0) {
                (address custody, bool enforced) = custodyManager.getCustodyConfig(token);
                if (custody != address(0) && enforced) {
                    IERC20(token).safeTransfer(custody, balance);
                }
            }
        }
    }

    /**
     * @notice Get the balance of a specific token held by this contract
     * @param token The token address to check
     * @return The balance of the token
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    // ============ Custody Management Functions ============

    /**
     * @notice Get custody configuration for a token
     * @param token The token address
     * @return custody The custody address
     * @return enforced Whether custody is enforced
     */
    function getCustodyConfig(address token) external view returns (address custody, bool enforced) {
        return custodyManager.getCustodyConfig(token);
    }

    /**
     * @notice Check if an address is authorized as a custodian
     * @param account The address to check
     * @return True if authorized as custodian
     */
    function isAuthorizedCustodian(address account) external view returns (bool) {
        return custodyManager.isAuthorizedCustodian(account);
    }

    /**
     * @notice Get all tokens that have custody addresses configured
     * @return Array of token addresses with custody configuration
     */
    function getAllCustodyTokens() external view returns (address[] memory) {
        return custodyManager.getAllCustodyTokens();
    }
}
