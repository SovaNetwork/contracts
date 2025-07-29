// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface ISovaBTCWrapper {
    struct SupportedToken {
        bool isSupported;
        uint256 totalDeposited;
        uint8 decimals;
        string name;
    }

    struct RedemptionRequest {
        address user;
        uint256 amount;
        address preferredToken;
        uint256 requestTime;
        bool fulfilled;
    }

    // Events
    event TokenAdded(address indexed token, string name, uint8 decimals);
    event TokenRemoved(address indexed token);
    event Deposit(address indexed user, address indexed token, uint256 amount, uint256 sovaBTCMinted);
    event RedemptionRequested(uint256 indexed requestId, address indexed user, uint256 amount, address preferredToken);
    event RedemptionFulfilled(uint256 indexed requestId, address indexed user, uint256 amount, address token);
    event AdminWithdrawal(address indexed token, address indexed to, uint256 amount);
    event QueueDurationUpdated(uint256 oldDuration, uint256 newDuration);

    // Errors
    error TokenNotSupported();
    error TokenAlreadySupported();
    error InsufficientBalance();
    error ZeroAmount();
    error ZeroAddress();
    error RedemptionNotReady();
    error RedemptionAlreadyFulfilled();
    error InvalidQueueDuration();
    error InsufficientLiquidity();

    // View functions
    function isTokenSupported(address token) external view returns (bool);
    function getSupportedToken(address token) external view returns (SupportedToken memory);
    function getRedemptionRequest(uint256 requestId) external view returns (RedemptionRequest memory);
    function queueDuration() external view returns (uint256);
    function redemptionCounter() external view returns (uint256);

    // User functions
    function deposit(address token, uint256 amount) external;
    function requestRedemption(uint256 amount, address preferredToken) external returns (uint256 requestId);
    function claimRedemption(uint256 requestId) external;

    // Admin functions
    function addSupportedToken(address token, string calldata name) external;
    function removeSupportedToken(address token) external;
    function adminWithdraw(address token, address to, uint256 amount) external;
    function setQueueDuration(uint256 _queueDuration) external;
    function emergencyWithdraw(address token, address to, uint256 amount) external;
}