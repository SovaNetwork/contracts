// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@solady/auth/Ownable.sol";
import "@solady/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/ISovaBTC.sol";
import "./TokenWhitelist.sol";

/**
 * @title RedemptionQueue
 * @notice Manages queued redemptions of SovaBTC for underlying BTC-pegged tokens
 * @dev Implements configurable delays, immediate burning, and reserve validation
 * @dev Supports multiple concurrent redemptions per user
 */
contract RedemptionQueue is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    /**
     * @notice Redemption request structure
     * @param id Unique redemption identifier
     * @param user Address of the user requesting redemption
     * @param token Address of the token to be redeemed
     * @param sovaAmount Amount of SovaBTC burned (8 decimals)
     * @param underlyingAmount Amount of underlying token to be received
     * @param requestTime Timestamp when the request was made
     * @param fulfilled Whether the redemption has been completed
     */
    struct RedemptionRequest {
        uint256 id;
        address user;
        address token;
        uint256 sovaAmount;
        uint256 underlyingAmount;
        uint256 requestTime;
        bool fulfilled;
    }

    // ============ State Variables ============

    /// @notice SovaBTC contract reference
    ISovaBTC public immutable sovaBTC;

    /// @notice Token whitelist contract reference
    TokenWhitelist public immutable tokenWhitelist;

    /// @notice Redemption delay in seconds (default 10 days)
    uint256 public redemptionDelay;

    /// @notice Auto-incrementing redemption ID counter
    uint256 public nextRedemptionId;

    /// @notice Mapping from redemption ID to redemption request
    mapping(uint256 => RedemptionRequest) public redemptionRequests;

    /// @notice Mapping from user address to array of their redemption IDs
    mapping(address => uint256[]) public userRedemptions;

    /// @notice Pause state
    bool private _paused;

    /// @notice Admin role for fulfilling redemptions
    mapping(address => bool) public custodians;

    // ============ Constants ============

    uint256 public constant DEFAULT_REDEMPTION_DELAY = 10 days;
    uint256 public constant MIN_REDEMPTION_DELAY = 1 hours;
    uint256 public constant MAX_REDEMPTION_DELAY = 30 days;

    // ============ Events ============

    event RedemptionQueued(
        uint256 indexed redemptionId,
        address indexed user, 
        address indexed token, 
        uint256 sovaAmount, 
        uint256 underlyingAmount, 
        uint256 requestTime
    );

    event RedemptionCompleted(
        uint256 indexed redemptionId,
        address indexed user,
        address indexed token,
        uint256 sovaAmount,
        uint256 underlyingAmount,
        address custodian
    );

    event RedemptionDelayUpdated(uint256 oldDelay, uint256 newDelay);
    event CustodianUpdated(address indexed custodian, bool authorized);
    event EmergencyWithdrawal(address indexed token, uint256 amount, address indexed to);

    // ============ Errors ============

    error ZeroAmount();
    error ZeroAddress();
    error TokenNotAllowed(address token);
    error InsufficientReserve(uint256 requested, uint256 available);
    error InvalidRedemptionId(uint256 redemptionId);
    error RedemptionNotReady(uint256 currentTime, uint256 readyTime);
    error RedemptionAlreadyFulfilled(uint256 redemptionId);
    error UnauthorizedCustodian(address caller);
    error InvalidRedemptionDelay(uint256 delay);
    error ContractPaused();

    // ============ Modifiers ============

    modifier onlyCustodian() {
        if (!custodians[msg.sender] && msg.sender != owner()) {
            revert UnauthorizedCustodian(msg.sender);
        }
        _;
    }

    modifier whenNotPaused() {
        if (_paused) revert ContractPaused();
        _;
    }

    modifier validRedemptionId(uint256 redemptionId) {
        if (redemptionId >= nextRedemptionId || redemptionRequests[redemptionId].id == 0) {
            revert InvalidRedemptionId(redemptionId);
        }
        _;
    }

    // ============ Constructor ============

    constructor(address _sovaBTC, address _tokenWhitelist, uint256 _redemptionDelay) {
        _initializeOwner(msg.sender);

        if (_sovaBTC == address(0)) revert ZeroAddress();
        if (_tokenWhitelist == address(0)) revert ZeroAddress();
        if (_redemptionDelay < MIN_REDEMPTION_DELAY || _redemptionDelay > MAX_REDEMPTION_DELAY) {
            revert InvalidRedemptionDelay(_redemptionDelay);
        }

        sovaBTC = ISovaBTC(_sovaBTC);
        tokenWhitelist = TokenWhitelist(_tokenWhitelist);
        redemptionDelay = _redemptionDelay;
        nextRedemptionId = 1; // Start IDs at 1
        _paused = false;
    }

    // ============ Core Redemption Functions ============

    /**
     * @notice Queue a redemption request
     * @param token Address of the token to redeem
     * @param sovaAmount Amount of SovaBTC to burn (8 decimals)
     * @return redemptionId The unique ID of the created redemption
     */
    function redeem(address token, uint256 sovaAmount) external nonReentrant whenNotPaused returns (uint256 redemptionId) {
        if (sovaAmount == 0) revert ZeroAmount();
        if (!tokenWhitelist.isTokenAllowed(token)) revert TokenNotAllowed(token);

        // Calculate underlying token amount based on decimals
        uint8 tokenDecimals = tokenWhitelist.getTokenDecimals(token);
        uint256 underlyingAmount;

        if (tokenDecimals == 8) {
            underlyingAmount = sovaAmount; // 1:1 conversion
        } else if (tokenDecimals < 8) {
            underlyingAmount = sovaAmount / (10 ** (8 - tokenDecimals));
        } else {
            underlyingAmount = sovaAmount * (10 ** (tokenDecimals - 8));
        }

        // Validate reserve availability
        uint256 availableReserve = IERC20(token).balanceOf(address(this));
        if (availableReserve < underlyingAmount) {
            revert InsufficientReserve(underlyingAmount, availableReserve);
        }

        // Burn SovaBTC immediately
        sovaBTC.adminBurn(msg.sender, sovaAmount);

        // Create redemption request with unique ID
        redemptionId = nextRedemptionId++;
        redemptionRequests[redemptionId] = RedemptionRequest({
            id: redemptionId,
            user: msg.sender,
            token: token,
            sovaAmount: sovaAmount,
            underlyingAmount: underlyingAmount,
            requestTime: block.timestamp,
            fulfilled: false
        });

        // Add to user's redemption list
        userRedemptions[msg.sender].push(redemptionId);

        emit RedemptionQueued(redemptionId, msg.sender, token, sovaAmount, underlyingAmount, block.timestamp);
    }

    /**
     * @notice Fulfill a redemption request after the delay period
     * @param redemptionId The ID of the redemption to fulfill
     */
    function fulfillRedemption(uint256 redemptionId) external onlyCustodian nonReentrant whenNotPaused validRedemptionId(redemptionId) {
        _fulfillRedemptionInternal(redemptionId);
    }

    /**
     * @notice Internal function to fulfill a redemption request
     * @param redemptionId The ID of the redemption to fulfill
     */
    function _fulfillRedemptionInternal(uint256 redemptionId) internal {
        RedemptionRequest storage request = redemptionRequests[redemptionId];
        if (request.fulfilled) revert RedemptionAlreadyFulfilled(redemptionId);

        // Check if delay period has passed
        uint256 readyTime = request.requestTime + redemptionDelay;
        if (block.timestamp < readyTime) {
            revert RedemptionNotReady(block.timestamp, readyTime);
        }

        // Double-check reserve availability
        uint256 availableReserve = IERC20(request.token).balanceOf(address(this));
        if (availableReserve < request.underlyingAmount) {
            revert InsufficientReserve(request.underlyingAmount, availableReserve);
        }

        // Mark as fulfilled before transfer (reentrancy protection)
        request.fulfilled = true;

        // Transfer underlying token to user
        IERC20(request.token).safeTransfer(request.user, request.underlyingAmount);

        emit RedemptionCompleted(redemptionId, request.user, request.token, request.sovaAmount, request.underlyingAmount, msg.sender);
    }

    /**
     * @notice Batch fulfill multiple redemption requests
     * @param redemptionIds Array of redemption IDs to fulfill
     */
    function batchFulfillRedemptions(uint256[] calldata redemptionIds) external onlyCustodian nonReentrant whenNotPaused {
        for (uint256 i = 0; i < redemptionIds.length; i++) {
            if (redemptionIds[i] >= nextRedemptionId || redemptionRequests[redemptionIds[i]].id == 0) {
                continue; // Skip invalid IDs
            }
            _fulfillRedemptionInternal(redemptionIds[i]);
        }
    }

    // ============ View Functions ============

    /**
     * @notice Get redemption request details by ID
     * @param redemptionId The redemption ID
     * @return The redemption request struct
     */
    function getRedemptionRequest(uint256 redemptionId) external view validRedemptionId(redemptionId) returns (RedemptionRequest memory) {
        return redemptionRequests[redemptionId];
    }

    /**
     * @notice Get all redemption IDs for a user
     * @param user Address of the user
     * @return Array of redemption IDs
     */
    function getUserRedemptions(address user) external view returns (uint256[] memory) {
        return userRedemptions[user];
    }

    /**
     * @notice Get all redemption details for a user
     * @param user Address of the user
     * @return Array of redemption request structs
     */
    function getUserRedemptionDetails(address user) external view returns (RedemptionRequest[] memory) {
        uint256[] memory redemptionIds = userRedemptions[user];
        RedemptionRequest[] memory redemptions = new RedemptionRequest[](redemptionIds.length);
        
        for (uint256 i = 0; i < redemptionIds.length; i++) {
            redemptions[i] = redemptionRequests[redemptionIds[i]];
        }
        
        return redemptions;
    }

    /**
     * @notice Get pending (unfulfilled) redemptions for a user
     * @param user Address of the user
     * @return Array of pending redemption request structs
     */
    function getPendingRedemptions(address user) external view returns (RedemptionRequest[] memory) {
        uint256[] memory redemptionIds = userRedemptions[user];
        
        // Count pending redemptions
        uint256 pendingCount = 0;
        for (uint256 i = 0; i < redemptionIds.length; i++) {
            if (!redemptionRequests[redemptionIds[i]].fulfilled) {
                pendingCount++;
            }
        }
        
        // Build pending redemptions array
        RedemptionRequest[] memory pendingRedemptions = new RedemptionRequest[](pendingCount);
        uint256 index = 0;
        for (uint256 i = 0; i < redemptionIds.length; i++) {
            if (!redemptionRequests[redemptionIds[i]].fulfilled) {
                pendingRedemptions[index++] = redemptionRequests[redemptionIds[i]];
            }
        }
        
        return pendingRedemptions;
    }

    /**
     * @notice Check if a redemption is ready to be fulfilled
     * @param redemptionId The redemption ID
     * @return True if the redemption can be fulfilled
     */
    function isRedemptionReady(uint256 redemptionId) external view validRedemptionId(redemptionId) returns (bool) {
        RedemptionRequest storage request = redemptionRequests[redemptionId];
        if (request.fulfilled) return false;
        return block.timestamp >= request.requestTime + redemptionDelay;
    }

    /**
     * @notice Get the time when a redemption will be ready
     * @param redemptionId The redemption ID
     * @return Timestamp when redemption can be fulfilled
     */
    function getRedemptionReadyTime(uint256 redemptionId) external view validRedemptionId(redemptionId) returns (uint256) {
        RedemptionRequest storage request = redemptionRequests[redemptionId];
        return request.requestTime + redemptionDelay;
    }

    /**
     * @notice Get available reserve for a token
     * @param token Address of the token
     * @return Available balance in the contract
     */
    function getAvailableReserve(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @notice Get total number of redemptions created
     * @return Total redemption count
     */
    function getRedemptionCount() external view returns (uint256) {
        return nextRedemptionId - 1;
    }

    /**
     * @notice Get number of redemptions for a user
     * @param user Address of the user
     * @return Number of redemptions
     */
    function getUserRedemptionCount(address user) external view returns (uint256) {
        return userRedemptions[user].length;
    }

    // ============ Admin Functions ============

    /**
     * @notice Set redemption delay
     * @param _redemptionDelay New delay in seconds
     */
    function setRedemptionDelay(uint256 _redemptionDelay) external onlyOwner {
        if (_redemptionDelay < MIN_REDEMPTION_DELAY || _redemptionDelay > MAX_REDEMPTION_DELAY) {
            revert InvalidRedemptionDelay(_redemptionDelay);
        }

        uint256 oldDelay = redemptionDelay;
        redemptionDelay = _redemptionDelay;

        emit RedemptionDelayUpdated(oldDelay, _redemptionDelay);
    }

    /**
     * @notice Set custodian authorization
     * @param custodian Address of the custodian
     * @param authorized Whether the custodian is authorized
     */
    function setCustodian(address custodian, bool authorized) external onlyOwner {
        if (custodian == address(0)) revert ZeroAddress();

        custodians[custodian] = authorized;
        emit CustodianUpdated(custodian, authorized);
    }

    /**
     * @notice Emergency withdrawal of tokens (only owner)
     * @param token Address of the token to withdraw
     * @param amount Amount to withdraw
     * @param to Destination address
     */
    function emergencyWithdraw(address token, uint256 amount, address to) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        IERC20(token).safeTransfer(to, amount);
        emit EmergencyWithdrawal(token, amount, to);
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        if (_paused) revert ContractPaused();
        _paused = true;
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        if (!_paused) revert("Contract not paused");
        _paused = false;
    }

    /**
     * @notice Check if the contract is paused
     * @return True if paused, false otherwise
     */
    function isPaused() external view returns (bool) {
        return _paused;
    }

    // ============ Internal Functions ============

    /**
     * @notice Internal function to handle decimal conversion validation
     * @param sovaAmount Amount in SovaBTC (8 decimals)
     * @param tokenDecimals Decimals of the target token
     * @return underlyingAmount Converted amount in target token decimals
     */
    function _calculateUnderlyingAmount(uint256 sovaAmount, uint8 tokenDecimals)
        internal
        pure
        returns (uint256 underlyingAmount)
    {
        if (tokenDecimals == 8) {
            return sovaAmount; // 1:1 conversion
        } else if (tokenDecimals < 8) {
            return sovaAmount / (10 ** (8 - tokenDecimals));
        } else {
            return sovaAmount * (10 ** (tokenDecimals - 8));
        }
    }
}
