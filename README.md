# Sova Network Contracts

This repository contains the smart contracts for the Sova Network. Sova smart contracts can talk directly to Bitcoin and do things like broadcast BTC transactions, decode BTC payloads, and verify signatures. 

## Details

Sova Network provides direct chain interaction with Bitcoin through custom precompiles, with built-in safeguards against double-spending. Use these precompiles to add Bitcoin composability to your Sova smart contracts.

### Precompile Contracts
- **L1Block**: Provides Bitcoin block information
- **uBTC**: Bitcoin representation on Sova Network

### Libraries
- **SovaBitcoin**: Integration utilities

## Build and Test

```shell
# Build the project
forge build

# Run all tests
forge test
```