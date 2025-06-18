// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

/**
 * @title SovaBitcoin
 * @author Sova Labs
 *
 * A library for integrating with Bitcoin precompiles on Sova.
 */
library SovaBitcoin {
    /// @notice Bitcoin precompile address
    address public constant BTC_PRECOMPILE = address(0x999);

    /// @notice Bitcoin context contract address
    address public constant SOVA_L1_BLOCK_ADDRESS = 0x2100000000000000000000000000000000000015;
    /// @notice Native Bitcoin wrapper address
    address public constant UBTC_ADDRESS = 0x2100000000000000000000000000000000000020;

    /// @notice Bitcoin locktime threshold
    /// @dev Below this value locktime is interpreted as block number, otherwise as timestamp.
    /// @dev https://github.com/bitcoin/bitcoin/blob/084eee029199a741c58e5537b332bd8360a1bdc3/src/script/script.h#L47
    uint256 public constant LOCKTIME_THRESHOLD = 500000000;

    /// @notice Bitcoin precompile selectors
    bytes4 public constant BROADCAST_BYTES = 0x00000001;
    bytes4 public constant DECODE_BYTES = 0x00000002;
    bytes4 public constant CHECKSIG_BYTES = 0x00000003;
    bytes4 public constant ADDRESS_CONVERT_LEADING_BYTES = 0x00000004;
    bytes4 public constant UBTC_SIGN_TX_BYTES = 0x00000005;

    struct Output {
        string addr;
        uint256 value;
        bytes script;
    }

    struct Input {
        bytes32 prevTxHash;
        uint32 outputIndex;
        bytes scriptSig;
        bytes[] witness;
    }

    struct BitcoinTx {
        bytes32 txid;
        Output[] outputs;
        Input[] inputs;
        uint256 locktime;
    }

    error PrecompileCallFailed();
    error InvalidOutput(string expected, string actual);
    error InvalidDeposit();
    error InvalidAmount();
    error InsufficientInput();
    error InvalidLocktime();

    /// @custom:semver 0.1.0-beta.1
    function version() public pure returns (string memory) {
        return "0.1.0-beta.1";
    }

    /**
     * @notice Decodes a raw Bitcoin transaction into a structured format
     *
     * @param signedTx          The raw signed Bitcoin transaction
     *
     * @return BitcoinTx        Object containing the decoded transaction data
     */
    function decodeBitcoinTx(bytes memory signedTx) internal view returns (BitcoinTx memory) {
        (bool success, bytes memory returndata) = BTC_PRECOMPILE.staticcall(abi.encodePacked(DECODE_BYTES, signedTx));
        if (!success) revert PrecompileCallFailed();
        return abi.decode(returndata, (BitcoinTx));
    }

    /**
     * @notice Verifies the signatures in a Bitcoin transaction
     *
     * @param signedTx       The raw signed Bitcoin transaction
     *
     * @return success       Boolean indicating if payload is valid
     */
    function checkSignature(bytes calldata signedTx) internal view returns (bool success) {
        (success,) = BTC_PRECOMPILE.staticcall(abi.encodePacked(CHECKSIG_BYTES, signedTx));
    }

    /**
     * @notice Retrieves the unique deposit address for the corresponding EVM address
     *
     * @param addr             The EVM address to convert
     *
     * @return returnData      The Bitcoin deposit address in bytes format
     */
    function convertToBtcAddress(address addr) internal returns (bytes memory) {
        (bool success, bytes memory returnData) =
            BTC_PRECOMPILE.call(abi.encodePacked(ADDRESS_CONVERT_LEADING_BYTES, addr));
        if (!success) revert PrecompileCallFailed();
        return returnData;
    }

    /**
     * @notice Broadcasts a signed Bitcoin transaction to the Bitcoin network
     *
     * @param signedTx         The raw signed Bitcoin transaction to broadcast
     */
    function broadcastBitcoinTx(bytes memory signedTx) internal {
        (bool success,) = BTC_PRECOMPILE.call(abi.encodePacked(BROADCAST_BYTES, signedTx));
        if (!success) revert PrecompileCallFailed();
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
     * @param signedTx          The raw signed Bitcoin transaction
     * @param amount            The minimum expected amount in satoshis
     *
     * @return btcTx            The decoded Bitcoin transaction
     */
    function isValidDeposit(bytes memory signedTx, uint256 amount) internal returns (BitcoinTx memory) {
        BitcoinTx memory btcTx = decodeBitcoinTx(signedTx);

        if (btcTx.outputs.length < 1 || btcTx.outputs.length > 3) {
            revert InvalidDeposit();
        }

        if (btcTx.outputs[0].value != amount) {
            revert InvalidAmount();
        }

        if (btcTx.inputs.length < 1) {
            revert InsufficientInput();
        }

        if (btcTx.locktime > block.timestamp) {
            revert InvalidLocktime();
        }

        // Locktime validation, only allow timestamp-based locktimes or zero
        if (btcTx.locktime != 0) {
            if (btcTx.locktime < LOCKTIME_THRESHOLD) {
                // Reject all block-number based locktimes
                revert InvalidLocktime();
            }

            // Validate timestamp-based locktime
            if (btcTx.locktime > block.timestamp) {
                revert InvalidLocktime();
            }
        }

        // Recover the callers unique bitcoin deposit address
        bytes memory convertedBtcAddress = SovaBitcoin.convertToBtcAddress(msg.sender);

        if (keccak256(convertedBtcAddress) != keccak256(bytes(btcTx.outputs[0].addr))) {
            revert InvalidOutput(btcTx.outputs[0].addr, string(convertedBtcAddress));
        }

        return btcTx;
    }
}
