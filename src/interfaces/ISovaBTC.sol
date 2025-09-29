// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

interface ISovaBTC {
    function depositBTC(uint64 amount, bytes calldata signedTx, uint8 voutIndex) external;
    function signalWithdraw(uint64 amount, uint64 btcGasLimit, uint64 operatorFee, string calldata dest) external;
    function withdraw(address user, bytes calldata signedTx, uint64 amount, uint64 btcGasLimit, uint64 operatorFee)
        external;
    function isTransactionUsed(bytes32 txid) external view returns (bool);
    function isPaused() external view returns (bool);

    /// @notice Admin functions
    function adminBurn(address wallet, uint256 amount) external;
    function setMinDepositAmount(uint64 _minAmount) external;
    function pause() external;
    function unpause() external;
    function addWithdrawSigner(address signer) external;
    function removeWithdrawSigner(address signer) external;
}
