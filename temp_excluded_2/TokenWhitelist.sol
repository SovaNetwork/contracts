// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@solady/auth/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/**
 * @title TokenWhitelist
 * @notice Manages the whitelist of approved BTC-pegged tokens for the SovaBTC wrapper system
 * @dev Provides admin-controlled whitelist functionality with proper access controls
 */
contract TokenWhitelist is Ownable {
    /// @notice Mapping of allowed token addresses to their approval status
    mapping(address => bool) public allowedTokens;

    /// @notice Mapping of token addresses to their decimal precision
    mapping(address => uint8) public tokenDecimals;

    // ----------- Custom Errors -----------
    error TokenNotAllowed(address token);
    error AlreadyAllowed(address token);
    error NotInAllowlist(address token);
    error ZeroAddress();

    // ----------- Events -----------
    /// @notice Emitted when a token is added or removed from the whitelist
    /// @param token The token address that was updated
    /// @param allowed Whether the token is now allowed (true) or removed (false)
    /// @param decimals The token's decimal precision (only relevant when allowed=true)
    event TokenWhitelistUpdated(address indexed token, bool allowed, uint8 decimals);

    constructor() {
        _initializeOwner(msg.sender);
    }

    /**
     * @notice Add a new ERC-20 token to the whitelist of allowed BTC-pegged tokens
     * @dev Only owner can call this function. Automatically stores token decimals for conversion calculations
     * @param token The address of the BTC-pegged ERC20 token to allow
     */
    function addAllowedToken(address token) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (allowedTokens[token]) revert AlreadyAllowed(token);

        // Get decimals from the token contract
        uint8 decimals = IERC20Metadata(token).decimals();

        // Update mappings
        allowedTokens[token] = true;
        tokenDecimals[token] = decimals;

        emit TokenWhitelistUpdated(token, true, decimals);
    }

    /**
     * @notice Remove an ERC-20 token from the whitelist
     * @dev Only owner can call this function. Gracefully handles removal to allow existing redemptions
     * @param token The address of the token to remove from whitelist
     */
    function removeAllowedToken(address token) external onlyOwner {
        if (!allowedTokens[token]) revert NotInAllowlist(token);

        uint8 decimals = tokenDecimals[token];

        // Update mapping (keep decimals for existing redemptions)
        allowedTokens[token] = false;

        emit TokenWhitelistUpdated(token, false, decimals);
    }

    /**
     * @notice Check if a token is currently allowed
     * @param token The token address to check
     * @return bool True if the token is allowed, false otherwise
     */
    function isTokenAllowed(address token) external view returns (bool) {
        return allowedTokens[token];
    }

    /**
     * @notice Get the decimal precision for a token
     * @param token The token address to check
     * @return uint8 The number of decimals for the token
     */
    function getTokenDecimals(address token) external view returns (uint8) {
        return tokenDecimals[token];
    }

    /**
     * @notice Batch add multiple tokens to the whitelist
     * @dev Only owner can call this function. Useful for initial setup
     * @param tokens Array of token addresses to add
     */
    function addAllowedTokensBatch(address[] calldata tokens) external onlyOwner {
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            if (token == address(0)) revert ZeroAddress();
            if (allowedTokens[token]) continue; // Skip already allowed tokens

            uint8 decimals = IERC20Metadata(token).decimals();
            allowedTokens[token] = true;
            tokenDecimals[token] = decimals;

            emit TokenWhitelistUpdated(token, true, decimals);
        }
    }
}
