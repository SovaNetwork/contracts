// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "solady/auth/Ownable.sol";
import "solady/tokens/WETH.sol";

import "./lib/SovaBitcoin.sol";

/**
 * @title Universal Bitcoin Token (uBTC)
 * @author Sova Labs
 * @notice Bitcoin meets ERC20. Bitcoin meets composability.
 *
 * @custom:predeploy 0x2100000000000000000000000000000000000020
 */
contract uBTC is WETH, Ownable {
    /// @notice Fixed withdrawal fee in satoshis (0.01 BTC)
    ///
    /// TODO(powvt): This should be a value set by the user? System contract?
    uint256 public constant WITHDRAWAL_FEE = 1000000;

    error InsufficientDeposit();
    error InsufficientInput();
    error InsufficientAmount();
    error UnsignedInput();
    error InvalidLocktime();
    error BroadcastFailure();
    error AmountTooBig();

    event Deposit(bytes32 txid, uint256 amount);
    event Withdraw(bytes32 txid, uint256 amount);

    constructor() WETH() Ownable() {
        _initializeOwner(msg.sender);
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
     * @notice Overrides the standard WETH deposit method. Always reverts.
     */
    function deposit() public payable override {
        revert("uBTC: must deposit with native BTC");
    }

    /**
     * @notice Overrides the WETH withdraw method. Always reverts.
     */
    function withdraw(uint256) public pure override {
        revert("uBTC: must use withdraw with destination");
    }

    /**
     * @notice Deposits Bitcoin to mint uBTC tokens
     *
     * @param amount            The amount of satoshis to deposit
     * @param signedTx          Signed Bitcoin transaction
     */
    function depositBTC(uint256 amount, bytes calldata signedTx) public {
        // Input validations
        if (amount >= type(uint64).max) {
            revert AmountTooBig();
        }

        // Validate if the transaction is a network deposit and get the decoded tx
        SovaBitcoin.BitcoinTx memory btcTx = SovaBitcoin.isDepositBtc(signedTx, amount);

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
     * @notice Withdraws Bitcoin by burning uBTC tokens
     *
     * @param amount            The amount of satoshis to withdraw
     * @param btcBlockHeight    The current Bitcoin block height for reference
     * @param dest              The destination Bitcoin address
     */
    function withdraw(uint64 amount, uint32 btcBlockHeight, string calldata dest) public {
        // Validate user has enough balance for both amount and fee
        uint256 totalRequired = uint256(amount) + WITHDRAWAL_FEE;
        if (balanceOf(msg.sender) < totalRequired) {
            revert InsufficientAmount();
        }

        _burn(msg.sender, totalRequired);

        // Ask the network to send the BTC to the destination address
        bytes memory signedTx = SovaBitcoin.createAndSignBitcoinTx(address(this), amount, btcBlockHeight, dest);

        // Decode signed bitcoin tx
        SovaBitcoin.BitcoinTx memory btcTx = SovaBitcoin.decodeBitcoinTx(signedTx);

        // Broadcast signed BTC tx
        SovaBitcoin.broadcastBitcoinTx(signedTx);

        emit Withdraw(btcTx.txid, amount);
    }

    /**
     * @notice Administrative function to burn tokens from a specific wallet
     *
     * @param wallet      The address to burn tokens from
     * @param amount      The amount of tokens to burn
     */
    function adminBurn(address wallet, uint256 amount) public onlyOwner {
        _burn(wallet, amount);
    }
}
