// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

interface ISovaBTC {
    /// @notice Bitcoin-specific functions
    function depositBTC(uint64 amount, bytes calldata signedTx, uint8 voutIndex) external;
    function withdraw(uint64 amount, uint64 btcGasLimit, uint64 btcBlockHeight, string calldata dest) external;
    function isTransactionUsed(bytes32 txid) external view returns (bool);
    function isPaused() external view returns (bool);

    /// @notice Admin functions
    function adminBurn(address wallet, uint256 amount) external;
    function setMinDepositAmount(uint64 _minAmount) external;
    function setMaxDepositAmount(uint64 _maxAmount) external;
    function setMaxGasLimitAmount(uint64 _maxGasLimitAmount) external;
    function pause() external;
    function unpause() external;
}
