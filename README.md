# Sova Contracts

This repository contains the predeploy contracts for the Sova Network.

The Sova Network enables smart contract to directly interact with the Bitcoin blockchain. This interaction is done through the use of custom precompiles and predeployed contracts. This feature set allows smart contract to do things like broadcast transactions, decode payloads, verify signatures, get block height and more!

## Details

The Sova precompiles provide built-in Bitcoin transaction validation, broadcast capabilities, and UTXO management with safeguards against double-spending and replay attacks. These features power the SovaBTC.sol predeploy contract and are available to any developer through the SovaBitcoin.sol library. Our goal is to make it as easy as possible to add native Bitcoin functionality to your Sova smart contracts.

## Contracts
- **SovaL1Block** (`0x2100000000000000000000000000000000000015`) - Bitcoin state tracking
- **SovaBTC** (`0x2100000000000000000000000000000000000020`) - Bitcoin-backed ERC20 token
- **SovaBitcoin** - Library for Bitcoin precompile interactions
- **UBTC20** - Abstract base contract extending ERC20 with pending transaction states and slot locking. Prevents transfers during pending Bitcoin operations and handles deferred accounting for cross-chain finalization.

## Build

```shell
# Build the project
forge build
```

## Deployed Bytecode verification

Generate the deployed byte code locally to verify the predeploy contract code used on the Sova Network.

```shell
# uBTC.sol
forge inspect src/UBTC.sol:UBTC deployedBytecode

# SovaL1Block.sol
forge inspect src/SovaL1Block.sol:SovaL1Block deployedBytecode
```
