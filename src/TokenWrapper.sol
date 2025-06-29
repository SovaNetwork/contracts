// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./interfaces/ISovaBTC.sol";

contract TokenWrapper is OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    /// @notice The unified Sova BTC token (uBTC) to mint/burn
    ISovaBTC public sovaBTC;

    /// @notice Mapping of allowed underlying token addresses (BTC-pegged ERC20) 
    mapping(address => bool) public allowedTokens;
    /// @notice Cached decimals for each allowed token (to optimize conversion calculations)
    mapping(address => uint8) public tokenDecimals;

    /// @notice Minimum deposit amount in satoshis (to prevent dust deposits)
    uint256 public minDepositSatoshi;

    /// @notice Whether mint fee is enabled
    bool public mintFeeEnabled;
    /// @notice Fee in basis points applied when minting
    uint256 public mintFeeBps;
    /// @notice Whether burn fee is enabled
    bool public burnFeeEnabled;
    /// @notice Fee in basis points applied when burning
    uint256 public burnFeeBps;

    uint256 internal constant FEE_DENOMINATOR = 10_000;

    // ----------- Custom Errors -----------
    error TokenNotAllowed(address token);
    error DepositBelowMinimum(uint256 amount, uint256 minimum);
    error InsufficientReserve(address token, uint256 requested, uint256 available);
    error AlreadyAllowed(address token);
    error NotInAllowlist(address token);
    error ZeroAddress();
    error ZeroAmount();

    // ----------- Events -----------
    event TokenWrapped(address indexed user, address indexed token, uint256 amountIn, uint256 sovaAmount);
    event TokenUnwrapped(address indexed user, address indexed token, uint256 amountOut, uint256 sovaAmount);
    event AllowedTokenAdded(address indexed token);
    event AllowedTokenRemoved(address indexed token);
    event MintFeeUpdated(bool enabled, uint256 bps);
    event BurnFeeUpdated(bool enabled, uint256 bps);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        // Prevent initialization on implementation (UUPS upgradeable pattern)
        _disableInitializers();
    }

    /**
     * @notice Initialize the TokenWrapper contract (UUPS proxy initializer).
     * @param _sovaBTC Address of the SovaBTC (uBTC) token contract.
     */
    function initialize(address _sovaBTC) external initializer {
        __Ownable_init(msg.sender);
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        if (_sovaBTC == address(0)) revert ZeroAddress();
        sovaBTC = ISovaBTC(_sovaBTC);
        // Set default minimum deposit to 10,000 sats (0.0001 BTC)
        minDepositSatoshi = 10_000;
    }

    /// @notice UUPS upgrade authorization (owner-only)
    function _authorizeUpgrade(address) internal override onlyOwner {}

    // ----------- Governance: Token Allowlist Management -----------

    /**
     * @notice Add a new ERC-20 token to the allowlist of underlying BTC tokens.
     * @dev Only owner. Stores the token's decimals for conversion calculations.
     * @param token The address of the BTC-pegged ERC20 token to allow.
     */
    function addAllowedToken(address token) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (allowedTokens[token]) revert AlreadyAllowed(token);
        allowedTokens[token] = true;
        uint8 decimals = IERC20Metadata(token).decimals();
        tokenDecimals[token] = decimals;
        emit AllowedTokenAdded(token);
    }

    /**
     * @notice Remove an ERC-20 token from the allowlist (disables new deposits of that token).
     * @dev Only owner. Does not affect existing reserves, which can still be redeemed.
     * @param token The address of the token to remove.
     */
    function removeAllowedToken(address token) external onlyOwner {
        if (!allowedTokens[token]) revert NotInAllowlist(token);
        allowedTokens[token] = false;
        // (Optionally clear tokenDecimals[token] to save storage, not strictly necessary)
        emit AllowedTokenRemoved(token);
    }

    // ----------- User Functions: Deposit & Redeem -----------

    /**
     * @notice Deposit an allowed BTC-pegged token to receive sovaBTC in return (1:1 BTC value).
     * @param token Address of the allowed ERC20 token to deposit (e.g. WBTC).
     * @param amount Amount of the underlying token to deposit.
     * Emits a `TokenWrapped` event on success.
     */
    function deposit(address token, uint256 amount) external whenNotPaused nonReentrant {
        if (!allowedTokens[token]) revert TokenNotAllowed(token);
        if (amount == 0) revert ZeroAmount();

        // Compute equivalent sovaBTC amount (in satoshis, 8 decimals) based on the token's decimals
        uint8 dec = tokenDecimals[token];
        uint256 sovaAmount;
        if (dec > 8) {
            // Token has more than 8 decimals (e.g. 18): divide to convert to 8-decimal (sat) units
            uint256 factor = 10 ** (dec - 8);
            // Ensure deposit amount is an exact multiple of 1 satoshi in this token's units
            if (amount % factor != 0) {
                // `factor` here represents the smallest deposit amount that equals 1 satoshi of value
                revert DepositBelowMinimum(amount, factor);
            }
            sovaAmount = amount / factor;
        } else if (dec < 8) {
            // Token has fewer decimals (e.g. 6): multiply to convert to satoshi units
            uint256 factor = 10 ** (8 - dec);
            sovaAmount = amount * factor;
        } else {
            // Token has exactly 8 decimals (common case for WBTC, renBTC, etc.)
            sovaAmount = amount;
        }

        if (sovaAmount < minDepositSatoshi) {
            revert DepositBelowMinimum(sovaAmount, minDepositSatoshi);
        }

        // Transfer underlying tokens from sender to this contract as collateral
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        uint256 feeAmount;
        uint256 mintAmount = sovaAmount;
        if (mintFeeEnabled && mintFeeBps > 0) {
            feeAmount = (sovaAmount * mintFeeBps) / FEE_DENOMINATOR;
            mintAmount = sovaAmount - feeAmount;
        }

        // Mint sovaBTC to sender and fee to owner if applicable
        sovaBTC.adminMint(msg.sender, mintAmount);
        if (feeAmount > 0) {
            sovaBTC.adminMint(owner(), feeAmount);
        }

        emit TokenWrapped(msg.sender, token, amount, sovaAmount);
    }

    /**
     * @notice Redeem (unwrap) sovaBTC for a chosen underlying BTC-pegged token.
     * @param token Address of the ERC20 token to redeem into (must be (or have been) allowed).
     * @param sovaAmount Amount of sovaBTC to burn in exchange.
     * Emits a `TokenUnwrapped` event on success.
     */
    function redeem(address token, uint256 sovaAmount) external whenNotPaused nonReentrant {
        if (sovaAmount == 0) revert ZeroAmount();
        // Compute how many underlying token units to return for the given sovaBTC amount
        uint8 dec = tokenDecimals[token];
        uint256 underlyingAmount;
        if (dec > 8) {
            // Token has more than 8 decimals: multiply sovaAmount to convert up to token's units
            uint256 factor = 10 ** (dec - 8);
            underlyingAmount = sovaAmount * factor;
        } else if (dec < 8) {
            // Token has fewer decimals: divide to convert down to token's base units
            uint256 factor = 10 ** (8 - dec);
            // Ensure sovaAmount is an exact multiple of the token's base unit value
            if (sovaAmount % factor != 0) {
                // Cannot redeem a fractional underlying unit – revert as insufficient reserve for that fraction
                revert InsufficientReserve(token, sovaAmount, 0);
            }
            underlyingAmount = sovaAmount / factor;
        } else {
            underlyingAmount = sovaAmount;
        }

        // Check that the contract holds enough of the requested token to fulfill the redemption
        uint256 available = IERC20(token).balanceOf(address(this));
        if (underlyingAmount > available) {
            revert InsufficientReserve(token, underlyingAmount, available);
        }

        uint256 feeAmount;
        uint256 amountOut = underlyingAmount;
        if (burnFeeEnabled && burnFeeBps > 0) {
            feeAmount = (underlyingAmount * burnFeeBps) / FEE_DENOMINATOR;
            amountOut = underlyingAmount - feeAmount;
        }

        // Burn the specified amount of sovaBTC from the sender (wrapper is SovaBTC owner)
        sovaBTC.adminBurn(msg.sender, sovaAmount);
        // Transfer out the underlying tokens to the sender and fee to owner if applicable
        IERC20(token).safeTransfer(msg.sender, amountOut);
        if (feeAmount > 0) {
            IERC20(token).safeTransfer(owner(), feeAmount);
        }

        emit TokenUnwrapped(msg.sender, token, underlyingAmount, sovaAmount);
    }

    // ----------- Administrative Functions -----------

    /**
     * @notice Update the minimum required deposit amount (in satoshis).
     * @dev Only owner. Useful to adjust for dust prevention.
     * @param minimumSats New minimum deposit amount in satoshi units.
     */
    function setMinDepositSatoshi(uint256 minimumSats) external onlyOwner {
        minDepositSatoshi = minimumSats;
    }

    /**
     * @notice Configure the mint fee
     * @param enabled Whether mint fee is enabled
     * @param bps Fee in basis points
     */
    function setMintFee(bool enabled, uint256 bps) external onlyOwner {
        mintFeeEnabled = enabled;
        mintFeeBps = bps;
        emit MintFeeUpdated(enabled, bps);
    }

    /**
     * @notice Configure the burn fee
     * @param enabled Whether burn fee is enabled
     * @param bps Fee in basis points
     */
    function setBurnFee(bool enabled, uint256 bps) external onlyOwner {
        burnFeeEnabled = enabled;
        burnFeeBps = bps;
        emit BurnFeeUpdated(enabled, bps);
    }

    /**
     * @notice Pause the contract (emergency halt on deposits/redeems).
     * @dev Only owner. Emits a standard Paused(event).
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract.
     * @dev Only owner. Resumes normal operations.
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}

