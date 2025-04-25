// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/**
 * @title SovaBitcoin Library
 * @author Sova Protocol Team
 * @notice A comprehensive library for Bitcoin integration with EVM chains
 * @dev This library provides a bridge between Bitcoin transactions and EVM smart contracts
 * through the Sova Protocol's Bitcoin precompiles at a fixed address
 */
library SovaBitcoin {
    /// @dev Address of the Bitcoin precompile contract
    address private constant BTC_PRECOMPILE = address(0x999);

    /// @dev Function selectors for the Bitcoin precompile
    bytes4 private constant BROADCAST_BYTES = 0x00000001;
    bytes4 private constant DECODE_BYTES = 0x00000002;
    bytes4 private constant CHECKSIG_BYTES = 0x00000003;
    bytes4 private constant BTC_DEPOSIT_ADDR_BYTES = 0x00000004;
    bytes4 private constant CREATE_AND_SIGN_BYTES = 0x00000005;

    /**
     * @notice Structure representing a Bitcoin transaction output
     * @dev Maps to Bitcoin's transaction output structure
     * @param addr The Bitcoin address in string format
     * @param value The amount of satoshis
     * @param script The output script in bytes
     */
    struct Output {
        string addr;
        uint256 value;
        bytes script;
    }

    /**
     * @notice Structure representing a Bitcoin transaction input
     * @dev Maps to Bitcoin's transaction input structure
     * @param prevTxHash The hash of the previous transaction
     * @param outputIndex The index of the output being spent
     * @param scriptSig The signature script
     * @param witness The witness data for segwit transactions
     */
    struct Input {
        bytes32 prevTxHash;
        uint32 outputIndex;
        bytes scriptSig;
        bytes[] witness;
    }

    /**
     * @notice Structure representing a full Bitcoin transaction
     * @dev Core structure used throughout the library
     * @param txid The transaction ID (hash)
     * @param outputs Array of transaction outputs
     * @param inputs Array of transaction inputs
     * @param locktime The transaction's locktime
     */
    struct BitcoinTx {
        bytes32 txid;
        Output[] outputs;
        Input[] inputs;
        uint256 locktime;
    }

    error PrecompileCallFailed();
    error InvalidOutput(string expected, string actual);
    error InsufficientDeposit();
    error InsufficientInput();
    error InvalidLocktime();

    /**
     * @notice Decodes a raw Bitcoin transaction into a structured format
     * @dev Calls the BTC_PRECOMPILE with the DECODE_BYTES selector
     * @param signedTx The raw signed Bitcoin transaction
     * @return A structured BitcoinTx object containing the decoded transaction data
     */
    function decodeBitcoinTx(bytes memory signedTx) internal view returns (BitcoinTx memory) {
        (bool success, bytes memory returndata) = BTC_PRECOMPILE.staticcall(abi.encodePacked(DECODE_BYTES, signedTx));
        if (!success) revert PrecompileCallFailed();
        return abi.decode(returndata, (BitcoinTx));
    }

    /**
     * @notice Verifies the signatures in a Bitcoin transaction
     * @dev Calls the BTC_PRECOMPILE with the CHECKSIG_BYTES selector
     * @param signedTx The raw signed Bitcoin transaction
     * @return Boolean indicating whether all signatures in the transaction are valid
     */
    function checkSignature(bytes calldata signedTx) internal view returns (bool) {
        (bool success,) = BTC_PRECOMPILE.staticcall(abi.encodePacked(CHECKSIG_BYTES, signedTx));
        return success;
    }

    /**
     * @notice Gets the Bitcoin deposit address for the current network
     * @dev Calls the BTC_PRECOMPILE with the BTC_DEPOSIT_ADDR_BYTES selector
     * @return The Bitcoin address as bytes that should receive deposits
     */
    function getBtcNetworkReceive() internal returns (bytes memory) {
        (bool success, bytes memory returndata) = BTC_PRECOMPILE.call(abi.encodePacked(BTC_DEPOSIT_ADDR_BYTES));
        if (!success) revert PrecompileCallFailed();
        return returndata;
    }

    /**
     * @notice Broadcasts a signed Bitcoin transaction to the Bitcoin network
     * @dev Calls the BTC_PRECOMPILE with the BROADCAST_BYTES selector
     * @param signedTx The raw signed Bitcoin transaction to broadcast
     */
    function broadcastBitcoinTx(bytes memory signedTx) internal {
        (bool success,) = BTC_PRECOMPILE.call(abi.encodePacked(BROADCAST_BYTES, signedTx));
        if (!success) revert PrecompileCallFailed();
    }

    /**
     * @notice Creates and signs a Bitcoin transaction
     * @dev Calls the BTC_PRECOMPILE with the CREATE_AND_SIGN_BYTES selector
     * @param signer The address of the entity signing the transaction
     * @param amount The amount in satoshis to send
     * @param blockHeight The Bitcoin block height for reference
     * @param destinationAddress The destination Bitcoin address
     * @return The raw signed Bitcoin transaction
     */
    function createAndSignBitcoinTx(address signer, uint64 amount, uint64 blockHeight, string memory destinationAddress)
        internal
        returns (bytes memory)
    {
        bytes memory inputData = abi.encode(CREATE_AND_SIGN_BYTES, signer, amount, blockHeight, destinationAddress);

        (bool success, bytes memory returndata) = BTC_PRECOMPILE.call(inputData);
        if (!success) revert PrecompileCallFailed();

        return returndata;
    }

    /**
     * @notice Validates a Bitcoin transaction for deposit purposes and returns the decoded transaction
     * @dev Performs a series of checks on the transaction structure and content:
     *      1. Verifies the transaction has between 1 and 3 outputs
     *      2. Confirms the first output value meets the minimum amount
     *      3. Ensures the transaction has at least one input
     *      4. Validates the locktime is not in the future
     *      5. Checks that the first output address matches the network's receive address
     * 
     * @param signedTx The raw signed Bitcoin transaction
     * @param amount The minimum expected amount in satoshis
     * @return btcTx The decoded Bitcoin transaction if all validations pass
     */
    function isDepositBtc(bytes memory signedTx, uint256 amount) internal returns (BitcoinTx memory) {
        BitcoinTx memory btcTx = decodeBitcoinTx(signedTx);

        if (btcTx.outputs.length < 1 || btcTx.outputs.length > 3 || btcTx.outputs[0].value < amount) {
            revert InsufficientDeposit();
        }

        if (btcTx.inputs.length < 1) {
            revert InsufficientInput();
        }

        if (btcTx.locktime > block.timestamp) {
            revert InvalidLocktime();
        }

        bytes memory recipientBtcAddress = getBtcNetworkReceive();

        if (keccak256(recipientBtcAddress) != keccak256(bytes(btcTx.outputs[0].addr))) {
            revert InvalidOutput(btcTx.outputs[0].addr, string(recipientBtcAddress));
        }

        return btcTx;
    }
}
