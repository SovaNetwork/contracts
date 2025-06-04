// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

interface ISovaL1Block {
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
}
