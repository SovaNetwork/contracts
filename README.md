# Sova Contracts

This repository contains both the predeploy contracts for the Sova Network and the SovaBTC wrapper system for EVM networks.

## Sova Network Predeployments

The Sova Network enables smart contracts to directly interact with the Bitcoin blockchain through custom precompiles and predeployed contracts. This feature set allows smart contracts to broadcast transactions, decode payloads, verify signatures, get block height and more!

### Predeploy Contracts
- **SovaL1Block** (`0x2100000000000000000000000000000000000015`) - Bitcoin state tracking
- **SovaBTC** (`0x2100000000000000000000000000000000000020`) - Bitcoin-backed ERC20 token
- **SovaBitcoin** - Library for Bitcoin precompile interactions
- **UBTC20** - Abstract base contract extending ERC20 with pending transaction states and slot locking

## SovaBTC Wrapper System

A comprehensive Bitcoin wrapping and staking system that extends Sova Network's capabilities to EVM networks like Ethereum and Base.

### Key Features

- **1:1 Bitcoin Wrapping**: Deposit wrapped BTC variants (WBTC, cbBTC, tBTC) and mint SovaBTC tokens
- **Admin-Controlled Whitelist**: Configurable list of supported wrapped Bitcoin tokens
- **Redemption Queue**: Time-delayed redemption system for enhanced security
- **Dual Token Staking**: Stake SovaBTC to earn SOVA, stake SOVA to earn SovaBTC
- **Cross-Rewards System**: Enhanced rewards for users staking both tokens
- **Upgradeable Architecture**: UUPS proxy pattern for future improvements

### Wrapper System Contracts

1. **SovaBTCToken** (`src/wrapper/SovaBTCToken.sol`) - ERC-20 token representing wrapped Bitcoin (8 decimals)
2. **SovaBTCWrapper** (`src/wrapper/SovaBTCWrapper.sol`) - Main wrapper contract handling deposits and redemptions
3. **DualTokenStaking** (`src/staking/DualTokenStaking.sol`) - Staking system for SovaBTC and SOVA tokens

### Supported Networks

- Ethereum Mainnet
- Base
- Sova Network (future integration)

## Quick Start

### Prerequisites

- [Foundry](https://getfoundry.sh/)
- Node.js and npm
- Git

### Installation

```bash
git clone <repository-url>
cd sova-contracts
make setup
```

### Configuration

1. Copy `.env.example` to `.env`
2. Fill in your configuration:
   - `PRIVATE_KEY`: Deployer private key
   - `OWNER_ADDRESS`: Contract owner address
   - `SOVA_TOKEN_ADDRESS`: SOVA token address
   - Network RPC URLs and API keys

### Testing

```bash
# Run all tests
make test

# Run specific test suites
make test-wrapper
make test-staking

# Generate coverage report
make coverage
```

### Deployment

```bash
# Deploy to Sepolia testnet
make deploy-sepolia

# Deploy to Ethereum mainnet  
make deploy-mainnet

# Deploy to Base
make deploy-base
```

## Build

```shell
# Build the project
forge build
```

## Deployed Bytecode Verification

Generate the deployed byte code locally to verify the predeploy contract code used on the Sova Network.

```shell
# SovaBTC.sol
forge inspect src/SovaBTC.sol:SovaBTC deployedBytecode

# SovaL1Block.sol
forge inspect src/SovaL1Block.sol:SovaL1Block deployedBytecode
```

## Development Commands

The project includes a comprehensive Makefile with common development tasks:

```bash
make help          # Show all available commands
make build         # Build contracts
make test          # Run tests
make deploy        # Deploy contracts
make format        # Format code
make gas-report    # Generate gas usage report
```

For detailed usage instructions, deployment guides, and API documentation, see the full documentation in the project files.
