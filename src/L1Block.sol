// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

library Constants {
    /// @notice The address that represents the system caller responsible for L1 attributes
    ///         transactions.
    address internal constant DEPOSITOR_ACCOUNT = 0xDeaDDEaDDeAdDeAdDEAdDEaddeAddEAdDEAd0001;
}

/// @custom:proxied true
/// @custom:predeploy 0x2100000000000000000000000000000000000015
/// @title BitcoinBlock
/// @notice The BitcoinBlock predeploy gives users access to information about the last known Bitcoin block.
///         Values within this contract are updated once per Sova block and can only be
///         set by the "depositor" account, a special system address. Depositor account transactions
///         are created by the protocol whenever we include a new Bitcoin block reference.
contract L1Block {
    /// @notice Address of the special depositor account.
    function DEPOSITOR_ACCOUNT() public pure returns (address addr_) {
        addr_ = Constants.DEPOSITOR_ACCOUNT;
    }

    /// @notice The latest Bitcoin block number known by the Sova system.
    uint256 public blockHeight;

    /// @notice The latest Bitcoin block timestamp.
    uint256 public blockTimestamp;

    /// @notice The latest Bitcoin network difficulty.
    uint256 public networkDifficulty;

    /// @notice The latest Bitcoin block hash.
    bytes32 public blockHash;

    /// @notice The number of Sova blocks using the same Bitcoin block.
    uint64 public sequenceNumber;

    /// @custom:semver 1.0.0
    function version() public pure virtual returns (string memory) {
        return "1.0.0";
    }

    /// @notice Updates the Bitcoin block values.
    /// @param _blockHeight      Bitcoin block height.
    /// @param _blockTimestamp   Bitcoin block timestamp.
    /// @param _networkDifficulty Bitcoin network difficulty.
    /// @param _blockHash        Bitcoin blockhash.
    /// @param _sequenceNumber   Number of Sova blocks with this Bitcoin block.
    function setBitcoinBlockData(
        uint256 _blockHeight,
        uint256 _blockTimestamp,
        uint256 _networkDifficulty,
        bytes32 _blockHash,
        uint64 _sequenceNumber
    )
        external
    {
        require(msg.sender == DEPOSITOR_ACCOUNT(), "BitcoinBlock: only the depositor account can set Bitcoin block values");

        blockHeight = _blockHeight;
        blockTimestamp = _blockTimestamp;
        networkDifficulty = _networkDifficulty;
        blockHash = _blockHash;
        sequenceNumber = _sequenceNumber;
    }

    /// @notice Updates the Bitcoin block values with compact calldata for gas efficiency.
    /// Params are packed and passed in as raw msg.data instead of ABI to reduce calldata size.
    /// Params are expected to be in the following order:
    ///   1. _blockHeight         Bitcoin block height
    ///   2. _blockTimestamp      Bitcoin block timestamp
    ///   3. _networkDifficulty   Bitcoin network difficulty
    ///   4. _blockHash           Bitcoin blockhash
    ///   5. _sequenceNumber      Number of Sova blocks with this Bitcoin block
    function setBitcoinBlockDataCompact() public {
        _setBitcoinBlockDataCompact();
    }

    /// @notice Internal implementation of setBitcoinBlockDataCompact
    function _setBitcoinBlockDataCompact() internal {
        address depositor = DEPOSITOR_ACCOUNT();
        assembly {
            // Revert if the caller is not the depositor account.
            if xor(caller(), depositor) {
                mstore(0x00, 0x3cc50b45) // 0x3cc50b45 is the 4-byte selector of "NotDepositor()"
                revert(0x1C, 0x04) // returns the stored 4-byte selector from above
            }
            
            // Store values directly from calldata
            sstore(blockHeight.slot, calldataload(4)) // uint256
            sstore(blockTimestamp.slot, calldataload(36)) // uint256
            sstore(networkDifficulty.slot, calldataload(68)) // uint256
            sstore(blockHash.slot, calldataload(100)) // bytes32
            sstore(sequenceNumber.slot, shr(192, calldataload(132))) // uint64
        }
    }

    /// @notice Get current Bitcoin block data
    /// @return Current Bitcoin block hash, height, timestamp, and network difficulty
    function getCurrentBitcoinBlock() external view returns (
        bytes32,
        uint256,
        uint256,
        uint256
    ) {
        return (
            blockHash,
            blockHeight,
            blockTimestamp,
            networkDifficulty
        );
    }
}
