// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

interface ISovaL1Block {
    /// @notice The latest Bitcoin block number known by the Sova system.
    function currentBlockHeight() external view returns (uint64);

    /// @notice The Bitcoin block hash from 6 blocks back from current block height.
    function blockHashSixBlocksBack() external view returns (bytes32);

    /// @notice Store the last sova block the values were updated.
    function lastUpdatedBlock() external view returns (uint256);

    /// @notice Returns the contract version.
    function version() external pure returns (string memory);

    /// @notice Address of the special depositor account.
    function SYSTEM_ACCOUNT() external pure returns (address);

    /// @notice Updates the Bitcoin block values.
    /// @param _blockHeight      Current Bitcoin block height.
    /// @param _blockHash        Bitcoin blockhash from 6 blocks back.
    function setBitcoinBlockData(uint64 _blockHeight, bytes32 _blockHash) external;

    /// @notice Updates the Bitcoin block values with compact calldata for gas efficiency.
    /// Params are packed and passed in as raw msg.data instead of ABI to reduce calldata size.
    /// Params are expected to be in the following order:
    ///   1. _blockHeight         Current Bitcoin block height
    ///   2. _blockHash           Bitcoin blockhash from 6 blocks back
    function setBitcoinBlockDataCompact() external;

    /// @notice Get current Bitcoin block data
    function getL1BlockInfo() external view returns (bytes32, uint256, uint256);
}
