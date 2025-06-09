# Sova Contracts

This repository contains the predeploy contracts for the Sova Network.

The Sova Network enables smart contract to directly interact with the Bitcoin blockchain. This interaction is done through the use of custom precompiles and predeployed contracts. This feature set allows smart contract to do things like broadcast transactions, decode payloads, verify signatures, get block height and more!

## Details

The Sova precompiles come with built-in safeguards against double-spending, payload verification, current block info, and more! These features are put to work in the `uBTC.sol` native Bitcoin wrapper contract or you can use them yourself by importing `SovaBitcoin.sol`. Our goal is to make it as easy as possible to add Bitcoin composability to your Sova smart contracts.

## Predeploy Contracts
- **SovaL1Block**: Provides information about the state on Bitcoin
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
