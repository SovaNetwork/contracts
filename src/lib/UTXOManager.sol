// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin-contracts/utils/structs/EnumerableSet.sol";

abstract contract UTXOManager {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    struct UTXO {
        bytes32 txid;
        uint32 vout;
        uint64 amount;
    }

    EnumerableSet.Bytes32Set private spendableUTXOs;
    mapping(bytes32 => UTXO) public utxos;

    event UTXOAdded(bytes32 indexed utxoId, bytes32 txid, uint32 vout, uint64 amount);
    event UTXOSpent(bytes32 indexed utxoId);

    error UTXOAlreadyExists(bytes32 utxoId);
    error UTXONotFound(bytes32 utxoId);

    /// @notice Adds a new UTXO to the set of spendable UTXOs.
    /// @param txid The transaction ID of the UTXO.
    /// @param vout The output index within the transaction.
    /// @param amount The value of the UTXO in satoshis.
    function addUTXO(bytes32 txid, uint32 vout, uint64 amount) external {
        bytes32 utxoId = keccak256(abi.encodePacked(txid, vout));
        if (spendableUTXOs.contains(utxoId)) {
            revert UTXOAlreadyExists(utxoId);
        }

        utxos[utxoId] = UTXO(txid, vout, amount);
        spendableUTXOs.add(utxoId);

        emit UTXOAdded(utxoId, txid, vout, amount);
    }

    /// @notice Spends the specified UTXO and removes it from the set.
    /// @param txid The transaction ID of the UTXO.
    /// @param vout The output index within the transaction.
    function spendUTXO(bytes32 txid, uint32 vout) external {
        bytes32 utxoId = keccak256(abi.encodePacked(txid, vout));
        if (!spendableUTXOs.remove(utxoId)) {
            revert UTXONotFound(utxoId);
        }

        delete utxos[utxoId];

        emit UTXOSpent(utxoId);
    }

    /// @notice Retrieves spendable UTXOs up to the requested amount.
    /// @param amount The minimum amount required.
    /// @return result An array of UTXOs meeting or exceeding the requested amount.
    function getSpendableUTXOs(uint64 amount, uint64 btcGasFee) external view returns (UTXO[] memory) {
        uint64 totalAmount = 0;
        uint256 count = 0;

        // First pass: count the number of UTXOs we need
        for (uint256 i = 0; i < spendableUTXOs.length(); i++) {
            bytes32 utxoId = spendableUTXOs.at(i);
            UTXO memory utxo = utxos[utxoId];
            totalAmount += utxo.amount;
            count++;

            if (totalAmount >= amount + btcGasFee) break;
        }

        // Initialize the result array with the correct size
        UTXO[] memory result = new UTXO[](count);

        // Reset variables for second pass
        totalAmount = 0;
        count = 0;

        // Second pass: populate the result array
        for (uint256 i = 0; i < spendableUTXOs.length(); i++) {
            bytes32 utxoId = spendableUTXOs.at(i);
            UTXO memory utxo = utxos[utxoId];
            result[count] = utxo;
            totalAmount += utxo.amount;
            count++;

            if (totalAmount >= amount + btcGasFee) break;
        }

        return result;
    }
}