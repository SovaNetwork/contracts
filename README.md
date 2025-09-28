# Sova Contracts

This repository contains the predeploy contracts for the Sova Network. This repo serves as the source of truth for on chain deployments.

The Sova Network enables smart contracts to directly interact with the Bitcoin blockchain. Smart contract interaction is done through the use of custom precompiles and predeployed contracts. These features allow smart contracts to safely broadcast BTC transactions, decode BTC payloads, get BTC block height. As the network matures this feature set will continue to expand.

## Details

The Sova precompiles provide built-in Bitcoin transaction validation, broadcast capabilities, and UTXO management with safeguards against double-spending and replay attacks. These features power the SovaBTC.sol predeploy contract and are available to any developer through the SovaBitcoin.sol library. Our goal is to make it as easy as possible to add native Bitcoin functionality to your Sova smart contracts.

## Contracts

- **SovaL1Block** `0x2100000000000000000000000000000000000015`
- **SovaBTC** `0x2100000000000000000000000000000000000020`
- **SovaBitcoin** - Library for Bitcoin precompile interactions.
- **UBTC20** - Base contract extending ERC20 with pending transaction states and Bitcoin finality. Prevents transfers during pending Bitcoin operations and handles deferred accounting for cross-chain finalization.

## Deployed Bytecode verification

Generate the deployed byte code locally to verify the predeploy contract code used on the Sova Network.

```shell
# SovaBTC.sol
forge inspect src/SovaBTC.sol:SovaBTC deployedBytecode

# SovaL1Block.sol
forge inspect src/SovaL1Block.sol:SovaL1Block deployedBytecode
```
