// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "@solady/auth/Ownable.sol";
import "@solady/utils/ReentrancyGuard.sol";

import "./interfaces/ISovaBTC.sol";
import "./lib/SovaBitcoin.sol";

import "./UBTC20.sol";

/**
 * @custom:proxied true
 * @custom:predeploy 0x2100000000000000000000000000000000000020
 *
 * @title Sova Bitcoin (sovaBTC)
 * @author Sova Labs
 *
 * Bitcoin meets ERC20. Bitcoin meets composability.
 */
contract SovaBTC is ISovaBTC, UBTC20, Ownable, ReentrancyGuard {
    /// @notice Minimum deposit amount in satoshis
    uint64 public minDepositAmount;

    /// @notice Pause state of the contract
    bool private _paused;

    /// @notice Mapping to track Bitcoin txids that have been used for deposits
    mapping(bytes32 => bool) private usedTxids;

    /// @notice Mapping to track authorized withdraw signers
    mapping(address => bool) public withdrawSigners;

    error InsufficientDeposit();
    error InsufficientInput();
    error InsufficientAmount();
    error InvalidLocktime();
    error BroadcastFailure();
    error AmountTooBig();
    error DepositBelowMinimum();
    error DepositAboveMaximum();
    error InvalidDepositLimits();
    error ZeroAmount();
    error ZeroGasLimit();
    error GasLimitTooHigh();
    error EmptyDestination();
    error InvalidDestinationFormat();
    error ContractPaused();
    error ContractNotPaused();
    error TransactionAlreadyUsed();
    error PendingDepositExists();
    error PendingWithdrawalExists();
    error UnauthorizedWithdrawSigner();
    error SignerAlreadyExists();
    error SignerDoesNotExist();

    event Deposit(address caller, bytes32 txid, uint256 amount);
    event WithdrawSignaled(
        address indexed user, uint256 amount, uint64 btcGasBid, uint64 operatorFee, string destination
    );
    event Withdraw(address user, bytes32 txid);
    event MinDepositAmountUpdated(uint64 oldAmount, uint64 newAmount);
    event MaxDepositAmountUpdated(uint64 oldAmount, uint64 newAmount);
    event MaxGasLimitAmountUpdated(uint64 oldAmount, uint64 newAmount);
    event ContractPausedByOwner(address indexed account);
    event ContractUnpausedByOwner(address indexed account);
    event WithdrawSignerAdded(address indexed signer);
    event WithdrawSignerRemoved(address indexed signer);

    modifier whenNotPaused() {
        if (_paused) {
            revert ContractPaused();
        }
        _;
    }

    modifier whenPaused() {
        if (!_paused) {
            revert ContractNotPaused();
        }
        _;
    }

    modifier onlyWithdrawSigner() {
        if (!withdrawSigners[msg.sender]) {
            revert UnauthorizedWithdrawSigner();
        }
        _;
    }

    constructor() Ownable() {
        _initializeOwner(msg.sender);

        minDepositAmount = 10_000; // 10,000 sat = 0.0001 BTC

        _paused = false;

        // Set initial withdrawal signer
        withdrawSigners[0xd94FcA65c01b7052469A653dB466cB91d8782125] = true;
        emit WithdrawSignerAdded(0xd94FcA65c01b7052469A653dB466cB91d8782125);
    }

    function isPaused() external view returns (bool) {
        return _paused;
    }

    function name() public pure override returns (string memory) {
        return "Sova Wrapped Bitcoin";
    }

    function symbol() public pure override returns (string memory) {
        return "sovaBTC";
    }

    function decimals() public pure override returns (uint8) {
        return 8;
    }

    /**
     * @notice Check if a Bitcoin txid has been used for deposit prior.
     *
     * @param txid The Bitcoin txid to check
     *
     * @return bool Boolean indicating if the txid has been used or not
     */
    function isTransactionUsed(bytes32 txid) external view returns (bool) {
        return usedTxids[txid];
    }

    /**
     * @notice Deposits Bitcoin to mint uBTC tokens.
     *
     * @dev The network will broadcast this payload if not already public.
     *
     * @param amount            The amount of satoshis to deposit
     * @param signedTx          Signed Bitcoin transaction
     * @param voutIndex         The output index of the BTC tx that contains the deposit UTXO
     */
    function depositBTC(uint64 amount, bytes calldata signedTx, uint8 voutIndex) external nonReentrant whenNotPaused {
        // Enforce deposit amount limits
        if (amount < minDepositAmount) {
            revert DepositBelowMinimum();
        }

        // Validate the BTC transaction and extract metadata
        SovaBitcoin.BitcoinTx memory btcTx = SovaBitcoin.isValidDeposit(signedTx, amount, voutIndex);

        // Prevent re-use of the same txid
        if (usedTxids[btcTx.txid]) {
            revert TransactionAlreadyUsed();
        }

        if (_pendingDeposits[msg.sender].amount > 0) revert PendingDepositExists();

        usedTxids[btcTx.txid] = true;

        // Lock pending deposit
        _setPendingDeposit(msg.sender, amount);

        // Broadcast the BTC tx
        SovaBitcoin.broadcastBitcoinTx(signedTx);

        emit Deposit(msg.sender, btcTx.txid, amount);
    }

    /**
     * @notice Signals a withdrawal request by saving the withdrawal request.
     *
     * @dev The user must have enough sovaBTC to cover the amount + gas limit + operatorFee fee.
     *
     * @param amount        The amount of satoshis to withdraw (excluding gas)
     * @param btcGasLimit  The gas limit bid for the Bitcoin transaction in satoshis
     * @param operatorFee  The fee offered to the operator for processing the withdrawal in satoshis
     * @param dest         The Bitcoin address to send the withdrawn BTC to
     */
    function signalWithdraw(uint64 amount, uint64 btcGasLimit, uint64 operatorFee, string calldata dest)
        external
        whenNotPaused
    {
        if (bytes(dest).length == 0) {
            revert EmptyDestination();
        }

        if (amount == 0) {
            revert ZeroAmount();
        }

        if (btcGasLimit == 0) {
            revert ZeroGasLimit();
        }

        if (btcGasLimit > amount) {
            revert GasLimitTooHigh();
        }

        uint256 totalRequired = amount + btcGasLimit + operatorFee;
        if (balanceOf(msg.sender) < totalRequired) {
            revert InsufficientAmount();
        }

        // check if user already has a pending withdrawal
        if (_pendingWithdrawals[msg.sender].amount > 0) {
            revert PendingWithdrawalExists();
        }

        // Store the withdraw request
        _pendingUserWithdrawRequests[msg.sender] =
            UserWithdrawRequest({amount: amount, btcGasLimit: btcGasLimit, operatorFee: operatorFee, destination: dest});

        emit WithdrawSignaled(msg.sender, amount, btcGasLimit, operatorFee, dest);
    }

    /**
     * @notice Processes a withdrawal signal by broadcasting a signed Bitcoin transaction.
     *
     * @dev Only authorized withdraw signers can call this function.
     *
     * @param user        The address of the user who signaled the withdrawal
     * @param signedTx    The signed Bitcoin transaction to broadcast
     */
    function withdraw(address user, bytes calldata signedTx) external whenNotPaused onlyWithdrawSigner {
        // Check if user has a pending withdrawal already
        if (_pendingWithdrawals[user].amount > 0) revert PendingWithdrawalExists();

        // decode signed tx so that we know it is a valid bitcoin tx
        SovaBitcoin.BitcoinTx memory btcTx = SovaBitcoin.decodeBitcoinTx(signedTx);

        UserWithdrawRequest memory request = _pendingUserWithdrawRequests[user];

        // Check that a withdraw request exists
        if (request.amount == 0) {
            revert PendingTransactionExists();
        }

        uint256 totalRequired = request.amount + uint256(request.btcGasLimit) + uint256(request.operatorFee);

        if (balanceOf(user) < totalRequired) revert InsufficientAmount();

        // Track pending withdrawal
        _setPendingWithdrawal(user, totalRequired);

        // Clear the withdraw request
        delete _pendingUserWithdrawRequests[user];

        // Broadcast the signed BTC tx
        SovaBitcoin.broadcastBitcoinTx(signedTx);

        emit Withdraw(user, btcTx.txid);
    }

    /**
     * @notice Admin function to burn tokens from a specific wallet
     *
     * @param wallet      The address to burn tokens from
     * @param amount      The amount of tokens to burn
     */
    function adminBurn(address wallet, uint256 amount) external onlyOwner {
        _burn(wallet, amount);
    }

    /**
     * @notice Admin function to set the minimum deposit amount
     *
     * @param _minAmount New minimum deposit amount in satoshis
     */
    function setMinDepositAmount(uint64 _minAmount) external onlyOwner {
        uint64 oldAmount = minDepositAmount;
        minDepositAmount = _minAmount;

        emit MinDepositAmountUpdated(oldAmount, _minAmount);
    }

    /**
     * @notice Admin function to pause the contract
     */
    function pause() external onlyOwner whenNotPaused {
        _paused = true;

        emit ContractPausedByOwner(msg.sender);
    }

    /**
     * @notice Admin function to unpause the contract
     */
    function unpause() external onlyOwner whenPaused {
        _paused = false;

        emit ContractUnpausedByOwner(msg.sender);
    }

    /**
     * @notice Admin function to add a withdraw signer
     *
     * @param signer The address to add as a withdraw signer
     */
    function addWithdrawSigner(address signer) external onlyOwner {
        if (withdrawSigners[signer]) {
            revert SignerAlreadyExists();
        }

        withdrawSigners[signer] = true;
        emit WithdrawSignerAdded(signer);
    }

    /**
     * @notice Admin function to remove a withdraw signer
     *
     * @param signer The address to remove as a withdraw signer
     */
    function removeWithdrawSigner(address signer) external onlyOwner {
        if (!withdrawSigners[signer]) {
            revert SignerDoesNotExist();
        }

        withdrawSigners[signer] = false;
        emit WithdrawSignerRemoved(signer);
    }
}
