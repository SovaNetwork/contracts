// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "@solady/auth/Ownable.sol";
import "@solady/utils/ReentrancyGuard.sol";

import "./interfaces/ISovaBTC.sol";

interface IERC20 {
    function decimals() external view returns (uint8);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title TokenWrapper
 * @author Sova Labs
 *
 * Simple wrapper contract to allow ERC20 BTC-pegged tokens to be
 * converted to and from sovaBTC.
 */
contract TokenWrapper is Ownable, ReentrancyGuard {
    ISovaBTC public immutable sovaBTC;

    /// @notice mapping of ERC20 tokens allowed for wrapping
    mapping(address => bool) public allowedTokens;

    /// @notice decimals of the allowed tokens
    mapping(address => uint8) public tokenDecimals;

    /// @notice minimum deposit amount in satoshis
    uint256 public minDepositSatoshi;

    bool private _paused;

    error TokenNotAllowed(address token);
    error ZeroAmount();
    error DepositBelowMinimum(uint256 amount, uint256 minAmount);
    error InsufficientReserve(address token, uint256 requested, uint256 available);
    error TransferFailed();
    error ContractPaused();
    error ContractNotPaused();

    event TokenWrapped(address indexed account, address indexed token, uint256 underlyingAmount, uint256 sovaAmount);
    event TokenUnwrapped(address indexed account, address indexed token, uint256 underlyingAmount, uint256 sovaAmount);
    event ContractPausedByOwner(address indexed account);
    event ContractUnpausedByOwner(address indexed account);

    modifier whenNotPaused() {
        if (_paused) revert ContractPaused();
        _;
    }

    modifier whenPaused() {
        if (!_paused) revert ContractNotPaused();
        _;
    }

    constructor(ISovaBTC _sovaBTC) Ownable() {
        _initializeOwner(msg.sender);
        sovaBTC = _sovaBTC;
        minDepositSatoshi = 1; // default to 1 satoshi
    }

    function pause() external onlyOwner whenNotPaused {
        _paused = true;
        emit ContractPausedByOwner(msg.sender);
    }

    function unpause() external onlyOwner whenPaused {
        _paused = false;
        emit ContractUnpausedByOwner(msg.sender);
    }

    function setMinDepositSatoshi(uint256 amount) external onlyOwner {
        minDepositSatoshi = amount;
    }

    function addAllowedToken(address token) external onlyOwner {
        allowedTokens[token] = true;
        tokenDecimals[token] = IERC20(token).decimals();
    }

    function removeAllowedToken(address token) external onlyOwner {
        allowedTokens[token] = false;
        tokenDecimals[token] = 0;
    }

    function _safeTransferFrom(address token, address from, address to, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, amount)
        );
        if (!success || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }

    function _safeTransfer(address token, address to, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, amount)
        );
        if (!success || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
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

        uint8 dec = tokenDecimals[token];
        uint256 sovaAmount;
        if (dec > 8) {
            uint256 factor = 10 ** (dec - 8);
            if (amount % factor != 0) {
                revert DepositBelowMinimum(amount, factor);
            }
            sovaAmount = amount / factor;
        } else if (dec < 8) {
            uint256 factor = 10 ** (8 - dec);
            sovaAmount = amount * factor;
        } else {
            sovaAmount = amount;
        }

        if (sovaAmount < minDepositSatoshi) {
            revert DepositBelowMinimum(sovaAmount, minDepositSatoshi);
        }

        _safeTransferFrom(token, msg.sender, address(this), amount);
        sovaBTC.adminMint(msg.sender, sovaAmount);

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

        uint8 dec = tokenDecimals[token];
        uint256 underlyingAmount;
        if (dec > 8) {
            uint256 factor = 10 ** (dec - 8);
            underlyingAmount = sovaAmount * factor;
        } else if (dec < 8) {
            uint256 factor = 10 ** (8 - dec);
            if (sovaAmount % factor != 0) {
                revert InsufficientReserve(token, sovaAmount, 0);
            }
            underlyingAmount = sovaAmount / factor;
        } else {
            underlyingAmount = sovaAmount;
        }

        uint256 available = IERC20(token).balanceOf(address(this));
        if (underlyingAmount > available) {
            revert InsufficientReserve(token, underlyingAmount, available);
        }

        sovaBTC.adminBurn(msg.sender, sovaAmount);
        _safeTransfer(token, msg.sender, underlyingAmount);

        emit TokenUnwrapped(msg.sender, token, underlyingAmount, sovaAmount);
    }
}

