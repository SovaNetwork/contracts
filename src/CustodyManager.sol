// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CustodyManager
 * @notice Manages custody addresses and role-based access control for SovaBTC ecosystem
 * @dev Implements secure token custody with admin controls and emergency functions
 */
contract CustodyManager is AccessControlEnumerable, Pausable {
    using SafeERC20 for IERC20;

    /* ----------------------- ROLES ----------------------- */

    /// @notice Role for custodians who can fulfill redemptions
    bytes32 public constant CUSTODIAN_ROLE = keccak256("CUSTODIAN_ROLE");

    /// @notice Role for emergency operations
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    /// @notice Role for custody address management
    bytes32 public constant CUSTODY_ADMIN_ROLE = keccak256("CUSTODY_ADMIN_ROLE");

    /* ----------------------- STATE VARIABLES ----------------------- */

    /// @notice Mapping of token address to its designated custody address
    mapping(address => address) public custodyAddress;

    /// @notice Mapping of token address to whether custody is enforced
    mapping(address => bool) public custodyEnforced;

    /// @notice List of all tokens that have custody addresses set
    address[] public custodyTokens;

    /// @notice Mapping to track if a token is in the custody tokens list
    mapping(address => bool) private _isInCustodyList;

    /* ----------------------- EVENTS ----------------------- */

    event CustodyAddressSet(
        address indexed token, address indexed oldCustody, address indexed newCustody, address admin
    );

    event CustodyEnforcementToggled(address indexed token, bool enforced, address admin);

    event EmergencySweep(
        address indexed token, address indexed from, address indexed to, uint256 amount, address executor
    );

    event CustodianAdded(address indexed custodian, address indexed admin);
    event CustodianRemoved(address indexed custodian, address indexed admin);

    /* ----------------------- CUSTOM ERRORS ----------------------- */

    error ZeroAddress();
    error InvalidCustodyAddress(address token, address attempted, address required);
    error CustodyNotSet(address token);
    error TokenNotFound(address token);
    error UnauthorizedTransfer(address token, address destination);
    error CustodyEnforcementActive(address token);
    error InvalidRole(bytes32 role);

    /* ----------------------- MODIFIERS ----------------------- */

    /**
     * @notice Validates that destination is the custody address for the token (if enforced)
     * @param token The token address
     * @param destination The intended destination address
     */
    modifier onlyValidDestination(address token, address destination) {
        _validateDestination(token, destination);
        _;
    }

    /* ----------------------- CONSTRUCTOR ----------------------- */

    /**
     * @notice Initialize the CustodyManager
     * @param admin The admin address who will have DEFAULT_ADMIN_ROLE
     */
    constructor(address admin) {
        if (admin == address(0)) revert ZeroAddress();

        // Grant admin all roles
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CUSTODY_ADMIN_ROLE, admin);
        _grantRole(EMERGENCY_ROLE, admin);

        // Admin starts as a custodian too
        _grantRole(CUSTODIAN_ROLE, admin);
    }

    /* ----------------------- CUSTODY MANAGEMENT ----------------------- */

    /**
     * @notice Set custody address for a token
     * @param token The token address
     * @param custody The custody address where tokens should be sent
     */
    function setCustodyAddress(address token, address custody) external onlyRole(CUSTODY_ADMIN_ROLE) {
        if (token == address(0)) revert ZeroAddress();
        if (custody == address(0)) revert ZeroAddress();

        address oldCustody = custodyAddress[token];
        custodyAddress[token] = custody;

        // Add to custody tokens list if not already present
        if (!_isInCustodyList[token]) {
            custodyTokens.push(token);
            _isInCustodyList[token] = true;
        }

        emit CustodyAddressSet(token, oldCustody, custody, msg.sender);
    }

    /**
     * @notice Remove custody address for a token
     * @param token The token address
     */
    function removeCustodyAddress(address token) external onlyRole(CUSTODY_ADMIN_ROLE) {
        if (custodyAddress[token] == address(0)) revert CustodyNotSet(token);

        address oldCustody = custodyAddress[token];
        delete custodyAddress[token];
        delete custodyEnforced[token];

        // Remove from custody tokens list
        if (_isInCustodyList[token]) {
            _removeFromCustodyList(token);
            _isInCustodyList[token] = false;
        }

        emit CustodyAddressSet(token, oldCustody, address(0), msg.sender);
    }

    /**
     * @notice Toggle custody enforcement for a token
     * @param token The token address
     * @param enforced Whether to enforce custody restrictions
     */
    function setCustodyEnforcement(address token, bool enforced) external onlyRole(CUSTODY_ADMIN_ROLE) {
        if (custodyAddress[token] == address(0)) revert CustodyNotSet(token);

        custodyEnforced[token] = enforced;
        emit CustodyEnforcementToggled(token, enforced, msg.sender);
    }

    /* ----------------------- ACCESS VALIDATION ----------------------- */

    /**
     * @notice Validate that a destination address is allowed for a token transfer
     * @param token The token address
     * @param destination The destination address
     */
    function validateDestination(address token, address destination) external view {
        _validateDestination(token, destination);
    }

    /**
     * @notice Check if an address is authorized for redemption fulfillment
     * @param account The address to check
     * @return True if authorized as custodian
     */
    function isAuthorizedCustodian(address account) external view returns (bool) {
        return hasRole(CUSTODIAN_ROLE, account);
    }

    /**
     * @notice Check if custody is enforced for a token
     * @param token The token address
     * @return True if custody enforcement is active
     */
    function isCustodyEnforced(address token) external view returns (bool) {
        return custodyEnforced[token];
    }

    /* ----------------------- EMERGENCY FUNCTIONS ----------------------- */

    /**
     * @notice Emergency sweep tokens from any address to custody (emergency role only)
     * @param token The token to sweep
     * @param from The address to sweep from
     * @param amount The amount to sweep
     */
    function emergencySweep(address token, address from, uint256 amount) external onlyRole(EMERGENCY_ROLE) {
        if (token == address(0)) revert ZeroAddress();
        if (from == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAddress();

        address custody = custodyAddress[token];
        if (custody == address(0)) revert CustodyNotSet(token);

        // Transfer tokens to custody address
        IERC20(token).safeTransferFrom(from, custody, amount);

        emit EmergencySweep(token, from, custody, amount, msg.sender);
    }

    /**
     * @notice Emergency pause all operations
     */
    function emergencyPause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }

    /**
     * @notice Emergency unpause all operations
     */
    function emergencyUnpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
    }

    /* ----------------------- ROLE MANAGEMENT ----------------------- */

    /**
     * @notice Add a custodian (admin only)
     * @param custodian The address to grant custodian role
     */
    function addCustodian(address custodian) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (custodian == address(0)) revert ZeroAddress();

        _grantRole(CUSTODIAN_ROLE, custodian);
        emit CustodianAdded(custodian, msg.sender);
    }

    /**
     * @notice Remove a custodian (admin only)
     * @param custodian The address to revoke custodian role from
     */
    function removeCustodian(address custodian) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (custodian == address(0)) revert ZeroAddress();

        _revokeRole(CUSTODIAN_ROLE, custodian);
        emit CustodianRemoved(custodian, msg.sender);
    }

    /**
     * @notice Batch add custodians
     * @param custodians Array of addresses to grant custodian role
     */
    function batchAddCustodians(address[] calldata custodians) external onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i = 0; i < custodians.length; i++) {
            if (custodians[i] != address(0)) {
                _grantRole(CUSTODIAN_ROLE, custodians[i]);
                emit CustodianAdded(custodians[i], msg.sender);
            }
        }
    }

    /* ----------------------- VIEW FUNCTIONS ----------------------- */

    /**
     * @notice Get all tokens that have custody addresses set
     * @return Array of token addresses
     */
    function getAllCustodyTokens() external view returns (address[] memory) {
        return custodyTokens;
    }

    /**
     * @notice Get custody configuration for a token
     * @param token The token address
     * @return custody The custody address
     * @return enforced Whether custody is enforced
     */
    function getCustodyConfig(address token) external view returns (address custody, bool enforced) {
        return (custodyAddress[token], custodyEnforced[token]);
    }

    /**
     * @notice Get count of custodians
     * @return The number of addresses with custodian role
     */
    function getCustodianCount() external view returns (uint256) {
        return getRoleMemberCount(CUSTODIAN_ROLE);
    }

    /**
     * @notice Get custodian address at index
     * @param index The index to query
     * @return The custodian address
     */
    function getCustodianAtIndex(uint256 index) external view returns (address) {
        return getRoleMember(CUSTODIAN_ROLE, index);
    }

    /* ----------------------- INTERNAL FUNCTIONS ----------------------- */

    /**
     * @notice Internal function to validate destination address
     * @param token The token address
     * @param destination The destination address
     */
    function _validateDestination(address token, address destination) internal view {
        // If custody is not set or not enforced, allow any destination
        if (custodyAddress[token] == address(0) || !custodyEnforced[token]) {
            return;
        }

        // If custody is enforced, destination must be the custody address
        if (destination != custodyAddress[token]) {
            revert InvalidCustodyAddress(token, destination, custodyAddress[token]);
        }
    }

    /**
     * @notice Remove a token from the custody tokens list
     * @param token The token to remove
     */
    function _removeFromCustodyList(address token) internal {
        for (uint256 i = 0; i < custodyTokens.length; i++) {
            if (custodyTokens[i] == token) {
                custodyTokens[i] = custodyTokens[custodyTokens.length - 1];
                custodyTokens.pop();
                break;
            }
        }
    }
}
