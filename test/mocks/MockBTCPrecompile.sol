// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MockBTCPrecompile
/// @notice Minimal mock that emulates the behaviour of the Bitcoin precompile used by SovaBitcoin.
///         The contract responds to four low-level selector calls which the library issues via
///         `staticcall`/`call` using `abi.encodePacked(selector, data)` payloads. For testing purposes
///         we only return deterministic, hard-coded values that satisfy SovaBitcoin's validation logic.
///
///         Selectors (see `SovaBitcoin.sol`):
///           0x00000001 – `BROADCAST_BYTES`
///           0x00000002 – `DECODE_BYTES`
///           0x00000003 – `ADDRESS_CONVERT_LEADING_BYTES`
///           0x00000004 – `UBTC_SIGN_TX_BYTES`
contract MockBTCPrecompile {
    /* -------------------------------------------------------------------------- */
    /*                                   Types                                    */
    /* -------------------------------------------------------------------------- */

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

    /* -------------------------------------------------------------------------- */
    /*                                 Mock setup                                 */
    /* -------------------------------------------------------------------------- */

    uint256 public mockOutputs = 1;
    uint256 public mockValue;
    uint256 public mockInputs = 1;
    uint256 public mockLocktime = 0;
    string public mockAddress;
    bool public precompileFails = false;

    function setMockOutputs(uint256 num) external {
        mockOutputs = num;
    }

    function setMockValue(uint256 val) external {
        mockValue = val;
    }

    function setMockInputs(uint256 num) external {
        mockInputs = num;
    }

    function setMockLocktime(uint256 time) external {
        mockLocktime = time;
    }

    function setMockAddress(string calldata addr) external {
        mockAddress = addr;
    }

    function setPrecompileFails(bool fails) external {
        precompileFails = fails;
    }

    function reset() external {
        mockOutputs = 1;
        mockValue = 0;
        mockInputs = 1;
        mockLocktime = 0;
        mockAddress = "";
        precompileFails = false;
    }

    /* -------------------------------------------------------------------------- */
    /*                                 Constants                                  */
    /* -------------------------------------------------------------------------- */

    bytes4 private constant BROADCAST_BYTES = 0x00000001;
    bytes4 private constant DECODE_BYTES = 0x00000002;
    bytes4 private constant ADDRESS_CONVERT_LEADING_BYTES = 0x00000003;
    bytes4 private constant UBTC_SIGN_TX_BYTES = 0x00000004;

    // Fixed mock deposit address used for both `DECODE_BYTES` and `ADDRESS_CONVERT_LEADING_BYTES` paths.
    string private constant MOCK_DEPOSIT_ADDRESS = "mockDepositAddress";

    /* -------------------------------------------------------------------------- */
    /*                                Fallback                                    */
    /* -------------------------------------------------------------------------- */

    /// @notice Handle all calls made via the raw selectors defined above.
    /// @dev The SovaBitcoin library interacts with this contract *only* through
    ///      low-level `call/staticcall`, so we implement the logic in `fallback`.
    fallback(bytes calldata data) external returns (bytes memory) {
        if (precompileFails) {
            revert();
        }

        // Extract the 4-byte selector from calldata.
        bytes4 selector;
        assembly {
            // Right-shift to isolate the first 4 bytes of calldata.
            selector := shr(224, calldataload(0))
        }

        if (selector == BROADCAST_BYTES) {
            // Do nothing – considered successful broadcast (no return data required).
            return "";
        }

        if (selector == DECODE_BYTES) {
            // Return a minimally-valid BitcoinTx whose first output `value` mirrors the `amount`
            // embedded by the test in the first 32 bytes of `signedTx`.
            // The library only checks: outputs length, value equality, inputs length, locktime.
            uint256 amount;
            assembly {
                // Skip selector – load next 32 bytes which our tests encode as `amount`.
                amount := calldataload(4)
            }
            return _encodeTx(mockValue > 0 ? mockValue : amount);
        }

        if (selector == ADDRESS_CONVERT_LEADING_BYTES) {
            // Always return the same mock deposit address (bytes representation of the string).
            return bytes(MOCK_DEPOSIT_ADDRESS);
        }

        if (selector == UBTC_SIGN_TX_BYTES) {
            // Return a constant txid (bytes32) for withdraw flow.
            return abi.encode(bytes32(uint256(0xabc123)));
        }

        // Any other selector – just succeed with empty bytes.
        return "";
    }

    /* -------------------------------------------------------------------------- */
    /*                               Internal helpers                             */
    /* -------------------------------------------------------------------------- */

    /// @dev Builds and ABI-encodes a minimal `BitcoinTx` struct for the DECODE_BYTES path.
    function _encodeTx(uint256 amount) private view returns (bytes memory) {
        Output[] memory outputs = new Output[](mockOutputs);
        if (mockOutputs > 0) {
            outputs[0] = Output({
                addr: bytes(mockAddress).length > 0 ? mockAddress : MOCK_DEPOSIT_ADDRESS,
                value: mockValue > 0 ? mockValue : amount,
                script: ""
            });
        }

        Input[] memory inputs = new Input[](mockInputs);
        if (mockInputs > 0) {
            inputs[0] =
                Input({prevTxHash: bytes32(uint256(0x1)), outputIndex: 0, scriptSig: "", witness: new bytes[](0)});
        }

        BitcoinTx memory btcTx =
            BitcoinTx({txid: bytes32(amount), outputs: outputs, inputs: inputs, locktime: mockLocktime});

        return abi.encode(btcTx);
    }
} 