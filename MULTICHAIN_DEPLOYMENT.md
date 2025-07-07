# SovaBTC Multi-Chain Deployment Guide

This guide covers deploying the SovaBTC protocol to multiple testnets for testing the multi-chain functionality.

## Supported Networks

- **Ethereum Sepolia** (Chain ID: 11155111)
- **Optimism Sepolia** (Chain ID: 11155420)
- **Base Sepolia** (Chain ID: 84532) - Already deployed

## Prerequisites

1. **Private Key**: Ensure your private key is set in `.env`
2. **Testnet ETH**: You need ETH on each target network
3. **Forge**: Make sure Foundry is installed and updated

## Environment Setup

Create a `.env` file in the project root:

```bash
# Your private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Optional: RPC URLs (will use public RPCs if not specified)
ETHEREUM_SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
OPTIMISM_SEPOLIA_RPC=https://sepolia.optimism.io
```

## Deployment Commands

### Deploy to Ethereum Sepolia

```bash
forge script script/DeployMultiChain.s.sol:DeployMultiChainSovaBTC \
  --rpc-url sepolia \
  --broadcast \
  --verify \
  -vvvv
```

Alternative with custom RPC:
```bash
forge script script/DeployMultiChain.s.sol:DeployMultiChainSovaBTC \
  --rpc-url https://sepolia.infura.io/v3/YOUR_INFURA_KEY \
  --broadcast \
  --verify \
  -vvvv
```

### Deploy to Optimism Sepolia

```bash
forge script script/DeployMultiChain.s.sol:DeployMultiChainSovaBTC \
  --rpc-url https://sepolia.optimism.io \
  --broadcast \
  --verify \
  -vvvv
```

## What Gets Deployed

**Each deployment includes everything you need for testing:**

### Protocol Contracts
1. **SovaBTC** - Main wrapped Bitcoin token
2. **SOVAToken** - Protocol reward token (1M initial supply)
3. **TokenWhitelist** - Manages supported tokens
4. **CustodyManager** - Handles custody operations
5. **SovaBTCWrapper** - Main wrapping contract
6. **RedemptionQueue** - Handles redemption delays
7. **SovaBTCStaking** - Staking rewards system

### Test Tokens (Automatically Minted to Deployer)
1. **Test WBTC** - 8 decimals, 1000 tokens minted to deployer
2. **Test LBTC** - 8 decimals, 1000 tokens minted to deployer  
3. **Test USDC** - 6 decimals, 100,000 tokens minted to deployer

**Note**: The deployment script automatically mints test tokens to your address, so you'll have tokens to test with immediately after deployment!

### Configuration
- Test tokens added to whitelist
- Deployer set as custodian
- Wrapper connected to redemption queue
- Proper minter roles configured

## Post-Deployment Steps

### 1. Update Frontend Configuration

After each deployment, update `ui/src/contracts/addresses.ts` with the new contract addresses. The deployment script outputs TypeScript-ready code you can copy-paste.

Example for Ethereum Sepolia (Chain ID 11155111):
```typescript
11155111: {
  // ... existing config
  contracts: {
    sovaBTC: '0x...',
    sovaToken: '0x...',
    tokenWhitelist: '0x...',
    custodyManager: '0x...',
    wrapper: '0x...',
    redemptionQueue: '0x...',
    staking: '0x...',
  },
  supportedTokens: {
    WBTC: { address: '0x...', name: 'Test Wrapped Bitcoin', symbol: 'WBTC', decimals: 8 },
    LBTC: { address: '0x...', name: 'Test Liquid Bitcoin', symbol: 'LBTC', decimals: 8 },
    USDC: { address: '0x...', name: 'Test USD Coin', symbol: 'USDC', decimals: 6 },
  },
},
```

### 2. Verify Contracts

If verification fails during deployment, manually verify:

```bash
# Verify each contract
forge verify-contract <CONTRACT_ADDRESS> <CONTRACT_NAME> \
  --chain-id <CHAIN_ID> \
  --constructor-args $(cast abi-encode "constructor(...)" ...)
```

### 3. Test Multi-Chain Functionality

1. Start the frontend: `cd ui && npm run dev`
2. Test network switching in the navigation
3. Test wrapping on different networks
4. Test redemption queue on different networks
5. Verify admin panel works across networks

### 4. Mint Additional Test Tokens (Optional)

If you need more test tokens or want to distribute tokens to other addresses:

```bash
# First, update script/MintTestTokens.s.sol with deployed token addresses
# Then mint additional tokens:

# Ethereum Sepolia
forge script script/MintTestTokens.s.sol:MintTestTokens \
  --rpc-url sepolia \
  --broadcast -vv

# Optimism Sepolia
forge script script/MintTestTokens.s.sol:MintTestTokens \
  --rpc-url https://sepolia.optimism.io \
  --broadcast -vv

# Base Sepolia (if needed)
forge script script/MintTestTokens.s.sol:MintTestTokens \
  --rpc-url https://sepolia.base.org \
  --broadcast -vv
```

To mint to additional addresses, edit the script and uncomment the test user sections.

### 5. Alternative: Use Existing Testnet Tokens (Advanced)

If you prefer to use existing testnet tokens instead of deploying new ones:

**Ethereum Sepolia Tokens:**
- WETH: `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14`
- USDC: Various faucet tokens available

**Optimism Sepolia Tokens:**
- WETH: `0x4200000000000000000000000000000000000006`
- USDC: Various test tokens available

You would need to:
1. Find existing test token addresses
2. Update the `TokenWhitelist` contract to include them
3. Update your frontend configuration
4. Use testnet faucets to get these tokens

## Troubleshooting

### Common Issues

1. **Insufficient Gas**: Increase gas limit if deployment fails
2. **RPC Issues**: Use alternative RPC URLs if public ones fail
3. **Verification Failures**: Verify manually after deployment
4. **Network Mismatch**: Ensure wallet is on correct network

### Gas Estimation

Approximate gas costs for full deployment:
- **Ethereum Sepolia**: ~8-12M gas
- **Optimism Sepolia**: ~4-6M gas (cheaper than Ethereum)

### Alternative Deployment (Per Contract)

If full deployment fails, deploy contracts individually:

```bash
# Deploy just the core protocol
forge create src/SovaBTC.sol:SovaBTC --rpc-url sepolia --private-key $PRIVATE_KEY

# Deploy with constructor args
forge create src/SovaBTCWrapper.sol:SovaBTCWrapper \
  --rpc-url sepolia \
  --private-key $PRIVATE_KEY \
  --constructor-args $SOVABTC_ADDRESS $WHITELIST_ADDRESS $CUSTODY_ADDRESS 10000
```

## Testing Multi-Chain Features

After deployment to multiple networks:

### Frontend Testing
1. Switch between networks in the nav bar
2. Verify balances load for each network
3. Test wrapping on different networks
4. Create redemptions on different networks
5. Test admin panel functionality across networks

### Contract Interaction Testing
```bash
# Test on Ethereum Sepolia
cast call $SOVABTC_ADDRESS "totalSupply()" --rpc-url sepolia

# Test on Optimism Sepolia  
cast call $SOVABTC_ADDRESS "totalSupply()" --rpc-url https://sepolia.optimism.io
```

## Security Considerations

1. **Test Networks Only**: These deployments are for testing only
2. **Custodian Role**: Deployer is set as custodian for testing
3. **Test Tokens**: Use only test tokens, not real assets
4. **Private Key**: Keep your private key secure

## Quick Start Workflow

Here's the complete workflow to get multi-chain testing working:

### Step 1: Deploy Protocol
```bash
# Deploy to Ethereum Sepolia
forge script script/DeployMultiChain.s.sol:DeployMultiChainSovaBTC \
  --rpc-url sepolia --broadcast --verify -vvvv

# Deploy to Optimism Sepolia  
forge script script/DeployMultiChain.s.sol:DeployMultiChainSovaBTC \
  --rpc-url https://sepolia.optimism.io --broadcast --verify -vvvv
```

### Step 2: Update Frontend
Copy the TypeScript output from deployment logs to `ui/src/contracts/addresses.ts`

### Step 3: Start Testing
```bash
cd ui && npm run dev
```

**You'll immediately have test tokens to work with!** The deployment automatically mints:
- 1000 WBTC to your address
- 1000 LBTC to your address  
- 100,000 USDC to your address

### Step 4: Test Multi-Chain Features
1. Switch networks in the nav bar
2. Test wrapping tokens on each network
3. Create redemptions on different networks
4. Test admin functionality across chains

### Step 5: Need More Tokens?
Run the minting script (after updating addresses):
```bash
forge script script/MintTestTokens.s.sol:MintTestTokens \
  --rpc-url [NETWORK_RPC] --broadcast -vv
```

## Next Steps

1. Deploy to both Ethereum Sepolia and Optimism Sepolia
2. Update frontend configuration
3. Test multi-chain functionality thoroughly
4. Prepare for mainnet deployment with proper security measures 