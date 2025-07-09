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

    /// @notice Maximum deposit amount in satoshis
    uint64 public maxDepositAmount;

    /// @notice Maximum gas limit amount in satoshis
    uint64 public maxGasLimitAmount;

    /// @notice Pause state of the contract
    bool private _paused;

    /// @notice Mapping to track Bitcoin txids that have been used for deposits
    mapping(bytes32 => bool) private usedTxids;

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

    event Deposit(address caller, bytes32 txid, uint256 amount);
    event Withdraw(address caller, bytes32 txid, uint256 amount);
    event MinDepositAmountUpdated(uint64 oldAmount, uint64 newAmount);
    event MaxDepositAmountUpdated(uint64 oldAmount, uint64 newAmount);
    event MaxGasLimitAmountUpdated(uint64 oldAmount, uint64 newAmount);
    event ContractPausedByOwner(address indexed account);
    event ContractUnpausedByOwner(address indexed account);

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

    constructor() Ownable() {
        _initializeOwner(msg.sender);

        minDepositAmount = 10_000; // (starts at 10,000 sats)
        maxDepositAmount = 100_000_000_000; // (starts at 1000 BTC = 100 billion sats)
        maxGasLimitAmount = 50_000_000; // (starts at 0.5 BTC = 50,000,000 sats)
        _paused = false;
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
        if (amount > maxDepositAmount) {
            revert DepositAboveMaximum();
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
     * @notice Withdraws Bitcoin by burning uBTC tokens. Then triggering the signing, and broadcasting
     *         of a Bitcoin transaction.
     *
     * @dev For obvious reasons the UBTC_SIGN_TX_BYTES precompile is a sensitive endpoint. It is enforced
     *      in the execution client that only this contract can all that precompile functionality.
     * @dev The hope is that in the future more SIGN_TX_BYTES endpoints can be added to the network
     *      and the backends are controlled by 3rd party signer entities.
     *
     * @param amount            The amount of satoshis to withdraw
     * @param btcGasLimit       Specified gas limit for the Bitcoin transaction (in satoshis)
     * @param btcBlockHeight    The current BTC block height. This is used to source spendable Bitcoin UTXOs
     * @param dest              The destination Bitcoin address (bech32)
     */
    function withdraw(uint64 amount, uint64 btcGasLimit, uint64 btcBlockHeight, string calldata dest)
        external
        nonReentrant
        whenNotPaused
    {
        // Input validation
        if (amount == 0) {
            revert ZeroAmount();
        }

        if (btcGasLimit == 0) {
            revert ZeroGasLimit();
        }

        if (btcGasLimit > maxGasLimitAmount) {
            revert GasLimitTooHigh();
        }

        uint256 totalRequired = amount + btcGasLimit;
        if (balanceOf(msg.sender) < totalRequired) {
            revert InsufficientAmount();
        }

        if (_pendingWithdrawals[msg.sender].amount > 0) revert PendingWithdrawalExists();

        // Track pending withdrawal
        _setPendingWithdrawal(msg.sender, totalRequired);

        // Call Bitcoin precompile to construct the BTC tx and lock the slot
        bytes memory inputData = abi.encode(msg.sender, amount, btcGasLimit, btcBlockHeight, dest);

        bytes32 btcTxid = SovaBitcoin.vaultSpend(inputData);

        emit Withdraw(msg.sender, btcTxid, amount);
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
        if (_minAmount >= maxDepositAmount) {
            revert InvalidDepositLimits();
        }

        uint64 oldAmount = minDepositAmount;
        minDepositAmount = _minAmount;

        emit MinDepositAmountUpdated(oldAmount, _minAmount);
    }

    /**
     * @notice Admin function to set the maximum deposit amount
     *
     * @param _maxAmount New maximum deposit amount in satoshis
     */
    function setMaxDepositAmount(uint64 _maxAmount) external onlyOwner {
        if (_maxAmount <= minDepositAmount) {
            revert InvalidDepositLimits();
        }

        uint64 oldAmount = maxDepositAmount;
        maxDepositAmount = _maxAmount;

        emit MaxDepositAmountUpdated(oldAmount, _maxAmount);
    }

    /**
     * @notice Admin function to set the maximum gas limit amount
     *
     * @param _maxGasLimitAmount New maximum gas limit amount in satoshis
     */
    function setMaxGasLimitAmount(uint64 _maxGasLimitAmount) external onlyOwner {
        if (_maxGasLimitAmount == 0) {
            revert ZeroAmount();
        }

        uint64 oldAmount = maxGasLimitAmount;
        maxGasLimitAmount = _maxGasLimitAmount;

        emit MaxGasLimitAmountUpdated(oldAmount, _maxGasLimitAmount);
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
}
