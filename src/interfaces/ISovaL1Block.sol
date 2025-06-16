// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

interface ISovaL1Block {
    /// @notice Returns the contract version.
    function version() external pure returns (string memory);

    /// @notice Updates the Bitcoin block values.
    /// @param _blockHeight      Current Bitcoin block height.
    /// @param _blockHash        Bitcoin blockhash from 6 blocks back.
    function setBitcoinBlockData(uint64 _blockHeight, bytes32 _blockHash) external;
}
