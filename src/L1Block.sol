// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @custom:proxied true
/// @custom:predeploy 0x2100000000000000000000000000000000000015
/// @title L1Block
/// @notice The BitcoinBlock predeploy gives users access to information about the last known
///         Bitcoin block. Values within this contract are updated once per Sova block and can
///         only be set by the system account. State updates are made by the protocol at the
///         beginning of each Sova block.
contract L1Block {
    /// @notice The latest Bitcoin block number known by the Sova system.
    uint256 public currentBlockHeight;

    /// @notice The Bitcoin block hash from 6 blocks back from current block height.
    bytes32 public blockHashSixBlocksBack;

    /// @notice Store the last sova block the values were updated.
    uint256 public lastUpdatedBlock;

    /// @custom:semver 1.0.0
    function version() public pure virtual returns (string memory) {
        return "1.0.0";
    }

    /// @notice Address of the special depositor account.
    function SYSTEM_ACCOUNT() public pure returns (address addr_) {
        addr_ = 0xDeaDDEaDDeAdDeAdDEAdDEaddeAddEAdDEAd0001;
    }

    /// @notice Updates the Bitcoin block values.
    /// @param _blockHeight      Current Bitcoin block height.
    /// @param _blockHash        Bitcoin blockhash from 6 blocks back.
    function setBitcoinBlockData(
        uint256 _blockHeight,
        bytes32 _blockHash
    )
        external
    {
        require(msg.sender == SYSTEM_ACCOUNT(), "BitcoinBlock: only the system account can set block data");

        currentBlockHeight = _blockHeight;
        blockHashSixBlocksBack = _blockHash;
        lastUpdatedBlock = block.number;
    }

    /// @notice Updates the Bitcoin block values with compact calldata for gas efficiency.
    /// Params are packed and passed in as raw msg.data instead of ABI to reduce calldata size.
    /// Params are expected to be in the following order:
    ///   1. _blockHeight         Current Bitcoin block height
    ///   2. _blockHash           Bitcoin blockhash from 6 blocks back
    function setBitcoinBlockDataCompact() public {
        _setBitcoinBlockDataCompact();
    }

    /// @notice Internal implementation of setBitcoinBlockDataCompact
    function _setBitcoinBlockDataCompact() internal {
        address depositor = SYSTEM_ACCOUNT();
        assembly {
            // Revert if the caller is not the depositor account.
            if xor(caller(), depositor) {
                mstore(0x00, 0x3cc50b45) // 0x3cc50b45 is the 4-byte selector of "NotDepositor()"
                revert(0x1C, 0x04) // returns the stored 4-byte selector from above
            }
            
            // Store values directly from calldata
            sstore(currentBlockHeight.slot, calldataload(4)) // uint256
            sstore(blockHashSixBlocksBack.slot, calldataload(36)) // bytes32
        }
    }

    /// @notice Get current Bitcoin block data
    /// @return Current Bitcoin block hash and height
    function getL1BlockInfo() external view returns (
        bytes32,
        uint256,
        uint256
    ) {
        return (
            blockHashSixBlocksBack,
            currentBlockHeight,
            lastUpdatedBlock
        );
    }
}
