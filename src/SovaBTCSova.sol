// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SovaBTCOFT.sol";
import "./lib/SovaBitcoin.sol";

/**
 * @title SovaBTCSova
 * @notice Sova-specific implementation of SovaBTC with immediate Bitcoin withdrawal capability
 * @dev Extends SovaBTCOFT with native Bitcoin redemption functionality only available on Sova chain
 */
contract SovaBTCSova is SovaBTCOFT {
    
    /* ----------------------- STATE VARIABLES ----------------------- */
    
    /// @notice Minimum withdrawal amount in satoshis
    uint64 public minWithdrawAmount;
    
    /// @notice Maximum withdrawal amount in satoshis  
    uint64 public maxWithdrawAmount;
    
    /// @notice Mapping to track pending withdrawals (user => amount)
    mapping(address => PendingWithdrawal) public pendingWithdrawals;
    
    struct PendingWithdrawal {
        uint256 amount;
        uint256 timestamp;
        bool exists;
    }
    
    /* ----------------------- CUSTOM ERRORS ----------------------- */
    
    error ZeroGasLimit();
    error GasLimitTooHigh();
    error InsufficientAmount();
    error WithdrawBelowMinimum();
    error WithdrawAboveMaximum();
    error InvalidWithdrawLimits();
    error EmptyDestination();
    error PendingWithdrawalExists();
    error InvalidDestinationFormat();
    
    /* ----------------------- EVENTS ----------------------- */
    
    event Withdraw(bytes32 indexed txid, address indexed user, uint256 amount, string destination);
    event PendingWithdrawalCreated(address indexed user, uint256 amount);
    event PendingWithdrawalFinalized(address indexed user, uint256 amount);
    event MinWithdrawAmountUpdated(uint64 oldAmount, uint64 newAmount);
    event MaxWithdrawAmountUpdated(uint64 oldAmount, uint64 newAmount);
    event MaxGasLimitAmountUpdated(uint64 oldAmount, uint64 newAmount);
    
    /* ----------------------- CONSTRUCTOR ----------------------- */
    
    /**
     * @notice Constructor for Sova-specific SovaBTC implementation
     * @param _endpoint LayerZero endpoint address for this chain
     * @param _delegate The delegate capable of making OApp configurations inside of the endpoint
     */
    constructor(
        address _endpoint,
        address _delegate
    ) SovaBTCOFT("Sova Bitcoin", "sovaBTC", _endpoint, _delegate) {
        // Initialize withdrawal limits (same as original SovaBTC)
        minWithdrawAmount = 10_000; // 10,000 sats (0.0001 BTC)
        maxWithdrawAmount = 100_000_000_000; // 100 billion sats (1000 BTC)
        
        // Contract starts unpaused (inherited from SovaBTCOFT)
    }
    
    /* ----------------------- WITHDRAWAL FUNCTIONS ----------------------- */
    
    /**
     * @notice Withdraws Bitcoin by burning SovaBTC tokens and creating a Bitcoin transaction
     * @dev This function preserves the exact interface from the original SovaBTC.sol
     * @dev Only available on Sova chain - uses Bitcoin precompile for immediate execution
     * 
     * @param amount The amount of satoshis to withdraw
     * @param btcGasLimit Specified gas limit for the Bitcoin transaction (in satoshis)
     * @param btcBlockHeight The current BTC block height for sourcing spendable UTXOs
     * @param dest The destination Bitcoin address (bech32 format)
     */
    function withdraw(
        uint64 amount, 
        uint64 btcGasLimit, 
        uint64 btcBlockHeight, 
        string calldata dest
    ) external override nonReentrant whenNotPaused {
        // Input validation
        if (amount == 0) revert ZeroAmount();
        if (btcGasLimit == 0) revert ZeroGasLimit();
        if (btcGasLimit > maxGasLimitAmount) revert GasLimitTooHigh();
        if (bytes(dest).length == 0) revert EmptyDestination();
        
        // Withdrawal limits validation
        if (amount < minWithdrawAmount) revert WithdrawBelowMinimum();
        if (amount > maxWithdrawAmount) revert WithdrawAboveMaximum();
        
        uint256 totalRequired = amount + btcGasLimit;
        if (balanceOf(msg.sender) < totalRequired) revert InsufficientAmount();
        
        // Check for existing pending withdrawal
        if (pendingWithdrawals[msg.sender].exists) revert PendingWithdrawalExists();
        
        // Create pending withdrawal state
        pendingWithdrawals[msg.sender] = PendingWithdrawal({
            amount: totalRequired,
            timestamp: block.timestamp,
            exists: true
        });
        
        emit PendingWithdrawalCreated(msg.sender, totalRequired);
        
        // Call Bitcoin precompile to construct and sign the BTC transaction
        bytes memory inputData = abi.encode(
            SovaBitcoin.UBTC_SIGN_TX_BYTES,
            msg.sender,
            amount,
            btcGasLimit,
            btcBlockHeight,
            dest
        );
        
        (bool success, bytes memory returndata) = SovaBitcoin.BTC_PRECOMPILE.call(inputData);
        if (!success) revert SovaBitcoin.PrecompileCallFailed();
        
        bytes32 btcTxid = bytes32(returndata);
        
        emit Withdraw(btcTxid, msg.sender, amount, dest);
    }
    
    /**
     * @notice Finalizes a pending withdrawal by burning the tokens
     * @dev Called after Bitcoin transaction is confirmed via slot unlocking mechanism
     * @param user The user whose withdrawal should be finalized
     */
    function _finalizeWithdrawal(address user) internal {
        PendingWithdrawal memory pending = pendingWithdrawals[user];
        if (!pending.exists || pending.amount == 0) return;
        
        // Clear pending state
        delete pendingWithdrawals[user];
        
        // Burn tokens from user (this decreases OFT total supply)
        _burn(user, pending.amount);
        
        emit PendingWithdrawalFinalized(user, pending.amount);
    }
    
    /**
     * @notice Allow users to finalize their own withdrawals
     */
    function finalize() external {
        _finalizeWithdrawal(msg.sender);
    }
    
    /**
     * @notice External function to finalize any user's withdrawal
     * @param user The user whose withdrawal should be finalized
     */
    function finalizeWithdrawal(address user) external {
        _finalizeWithdrawal(user);
    }
    
    /* ----------------------- ADMIN FUNCTIONS ----------------------- */
    
    /**
     * @notice Admin function to set the minimum withdrawal amount
     * @param _minAmount New minimum withdrawal amount in satoshis
     */
    function setMinWithdrawAmount(uint64 _minAmount) external onlyOwner {
        if (_minAmount >= maxWithdrawAmount) revert InvalidWithdrawLimits();
        
        uint64 oldAmount = minWithdrawAmount;
        minWithdrawAmount = _minAmount;
        
        emit MinWithdrawAmountUpdated(oldAmount, _minAmount);
    }
    
    /**
     * @notice Admin function to set the maximum withdrawal amount
     * @param _maxAmount New maximum withdrawal amount in satoshis
     */
    function setMaxWithdrawAmount(uint64 _maxAmount) external onlyOwner {
        if (_maxAmount <= minWithdrawAmount) revert InvalidWithdrawLimits();
        
        uint64 oldAmount = maxWithdrawAmount;
        maxWithdrawAmount = _maxAmount;
        
        emit MaxWithdrawAmountUpdated(oldAmount, _maxAmount);
    }
    
    /**
     * @notice Admin function to set the maximum gas limit amount (inherited from parent)
     * @param _maxGasLimitAmount New maximum gas limit amount in satoshis
     */
    function setMaxGasLimitAmount(uint64 _maxGasLimitAmount) external override onlyOwner {
        if (_maxGasLimitAmount == 0) revert ZeroAmount();
        
        uint64 oldAmount = uint64(maxGasLimitAmount);
        maxGasLimitAmount = _maxGasLimitAmount;
        
        emit MaxGasLimitAmountUpdated(oldAmount, _maxGasLimitAmount);
    }
    
    /* ----------------------- VIEW FUNCTIONS ----------------------- */
    
    /**
     * @notice Check if withdrawals are currently paused (calls parent function)
     */
    function withdrawalsPaused() external view returns (bool) {
        return this.isPaused();
    }
    
    /**
     * @notice Get pending withdrawal info for a user
     * @param user The user to check
     * @return amount The pending withdrawal amount
     * @return timestamp When the withdrawal was initiated
     * @return exists Whether a pending withdrawal exists
     */
    function getPendingWithdrawal(address user) external view returns (
        uint256 amount,
        uint256 timestamp,
        bool exists
    ) {
        PendingWithdrawal memory pending = pendingWithdrawals[user];
        return (pending.amount, pending.timestamp, pending.exists);
    }
    
    /* ----------------------- TRANSFER RESTRICTIONS ----------------------- */
    
    /**
     * @notice Override transfer to prevent transfers during pending withdrawals
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        if (pendingWithdrawals[msg.sender].exists) {
            revert PendingWithdrawalExists();
        }
        return super.transfer(to, amount);
    }
    
    /**
     * @notice Override transferFrom to prevent transfers during pending withdrawals
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        if (pendingWithdrawals[from].exists) {
            revert PendingWithdrawalExists();
        }
        return super.transferFrom(from, to, amount);
    }
} 