// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "@solady/auth/Ownable.sol";
import "@solady/utils/ReentrancyGuard.sol";
import "@solady/tokens/ERC20.sol";

import "./interfaces/IUBTC.sol";

import "./lib/SovaBitcoin.sol";

/**
 * @custom:proxied true
 * @custom:predeploy 0x2100000000000000000000000000000000000020
 *
 * @title Universal Bitcoin Token (uBTC)
 * @author Sova Labs
 *
 * Bitcoin meets ERC20. Bitcoin meets composability.
 */
contract UBTC is ERC20, IUBTC, Ownable, ReentrancyGuard {
    /// @notice Minimum deposit amount in satoshis
    uint64 public minDepositAmount;

    /// @notice Maximum deposit amount in satoshis
    uint64 public maxDepositAmount;

    /// @notice Gas limit must not exceed 0.5 BTC (50,000,000 sats)
    uint64 public maxGasLimitAmount;

    /// @notice Pause state of the contract
    bool private _paused;

    error InsufficientDeposit();
    error InsufficientInput();
    error InsufficientAmount();
    error UnsignedInput();
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

    event Deposit(bytes32 txid, uint256 amount);
    event Withdraw(bytes32 txid, uint256 amount);
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

    function name() public view virtual override returns (string memory) {
        return "Universal Bitcoin";
    }

    function symbol() public view virtual override returns (string memory) {
        return "uBTC";
    }

    function decimals() public view virtual override returns (uint8) {
        return 8;
    }

    /**
     * @notice Deposits Bitcoin to mint uBTC tokens.
     *
     * @dev The network will always broadcast this payload if not already public.
     *
     * @param amount            The amount of satoshis to deposit
     * @param signedTx          Signed Bitcoin transaction
     */
    function depositBTC(uint64 amount, bytes calldata signedTx) external nonReentrant whenNotPaused {
        // Check deposit limits
        if (amount < minDepositAmount) {
            revert DepositBelowMinimum();
        }
        if (amount > maxDepositAmount) {
            revert DepositAboveMaximum();
        }

        // Validate if the transaction is a network deposit and get the decoded tx
        SovaBitcoin.BitcoinTx memory btcTx = SovaBitcoin.isValidDeposit(signedTx, amount);

        // Check if signature is valid and the inputs are unspent
        if (!SovaBitcoin.checkSignature(signedTx)) {
            revert UnsignedInput();
        }

        _mint(msg.sender, amount);

        // Broadcast signed btc tx
        SovaBitcoin.broadcastBitcoinTx(signedTx);

        emit Deposit(btcTx.txid, amount);
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
    function withdraw(uint64 amount, uint64 btcGasLimit, uint32 btcBlockHeight, string calldata dest)
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

        // Gas limit must not exceed 0.5 BTC (50,000,000 sats)
        if (btcGasLimit > maxGasLimitAmount) {
            revert GasLimitTooHigh();
        }

        // Validate users balance is high enough to cover the amount and max possible gas to be used
        uint256 totalRequired = amount + btcGasLimit;
        if (balanceOf(msg.sender) < totalRequired) {
            revert InsufficientAmount();
        }

        _burn(msg.sender, totalRequired);

        bytes memory inputData =
            abi.encode(SovaBitcoin.UBTC_SIGN_TX_BYTES, msg.sender, amount, btcGasLimit, btcBlockHeight, dest);

        // This call will set the slot locks for this contract until the slot resolution is done. Then the
        // slot updates will either take place or be reverted.
        (bool success, bytes memory returndata) = SovaBitcoin.BTC_PRECOMPILE.call(inputData);
        if (!success) revert SovaBitcoin.PrecompileCallFailed();

        bytes32 btcTxid = bytes32(returndata);

        emit Withdraw(btcTxid, amount);
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
