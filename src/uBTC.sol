// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "solady/auth/Ownable.sol";
import "solady/tokens/WETH.sol";

import "./lib/SovaBitcoin.sol";

/**
 * @title Universal Bitcoin Token (uBTC)
 * @author Sova Labs
 *
 * Bitcoin meets ERC20. Bitcoin meets composability.
 *
 * @custom:predeploy 0x2100000000000000000000000000000000000020
 */
contract uBTC is WETH, Ownable {
    error InsufficientDeposit();
    error InsufficientInput();
    error InsufficientAmount();
    error UnsignedInput();
    error InvalidLocktime();
    error BroadcastFailure();
    error AmountTooBig();

    /**
     * @notice Events
     */
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
     * @notice Withdraws Bitcoin by burning uBTC tokens
     *
     * @param amount            The amount of satoshis to withdraw
     * @param btcGasLimit       Specified gas limit for the Bitcoin transaction (in satoshis)
     * @param btcBlockHeight    The current Bitcoin block height for indexing purposes
     * @param dest              The destination Bitcoin address (bech32)
     */
    function withdraw(uint64 amount, uint64 btcGasLimit, uint32 btcBlockHeight, string calldata dest) public {
        // TODO(powvt): Add more input validation

        // Validate users balance is high enough to cover the amount and max possible gas to be used
        uint256 totalRequired = uint256(amount) + btcGasLimit;
        if (balanceOf(msg.sender) < totalRequired) {
            revert InsufficientAmount();
        }

        _burn(msg.sender, totalRequired);

        // Ask the network to send the BTC to the destination address
        //
        // NOTE(powvt): Call this valueSpend instead? we cant return the signed payload here since not every
        // operator can call the signing service for this deposit address. The sending entity
        // is responsible for making sure the gas fee is high enough that it gets included in
        // the the next bitcoin block. This function should do the broadcasting for the caller.
        //
        // This call will set the slot locks for this contract until the slot resolution is done. Then the
        // slot updates will either take place or be reverted.
        bytes memory btcTxid =
            SovaBitcoin.vaultSpend(SovaBitcoin.UBTC_ADDRESS, amount, btcGasLimit, btcBlockHeight, dest);

        emit Withdraw(bytes32(btcTxid), amount);
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
