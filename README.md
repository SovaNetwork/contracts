# Sova Contracts

This repository contains the predeploy contracts for the Sova Network.

Sova smart contracts can communicate directly with Bitcoin and do things like broadcast transactions, decode payloads, verify signatures, get block height and more! 

## Details

The Sova Network provides direct communicate with Bitcoin through custom precompiles. The Sova Network uses these precompiles via predeploy contracts. These precompiles come with built-in safeguards against double-spending, payload verification, current block info, and more! These features can be witnessed in action in the `uBTC.sol` native Bitcoin wrapper contract or by importing `SovaBitcoin.sol` to add Bitcoin composability to your Sova smart contracts.

## Predeploy Contracts
- **SovaL1Block**: Provides Bitcoin block information
- **uBTC**: Native Bitcoin wrapper on the Sova Network

### Libraries
- **SovaBitcoin**: Sova network utilities

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
