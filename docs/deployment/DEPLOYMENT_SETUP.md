# SovaBTC LayerZero OFT Deployment Setup Guide

## Prerequisites

Before deploying the LayerZero OFT protocol, you need to set up your deployment environment. Follow these steps:

## 1. Environment Variables Setup

Create a `.env` file in the project root (contracts directory) with the following variables:

```bash
# Copy this template and fill in your values
cp .env.example .env  # If .env.example exists
# OR create .env manually with content below:

# Private Key for deployment (use a test wallet, not your main wallet)
PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000

# RPC URLs for each testnet
ETH_SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
OP_SEPOLIA_RPC=https://opt-sepolia.g.alchemy.com/v2/YOUR_API_KEY
BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ARB_SEPOLIA_RPC=https://arb-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Alternative free RPC URLs (if you don't have Alchemy/Infura)
# ETH_SEPOLIA_RPC=https://rpc.sepolia.org
# OP_SEPOLIA_RPC=https://sepolia.optimism.io
# BASE_SEPOLIA_RPC=https://sepolia.base.org
# ARB_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc

# Etherscan API keys for contract verification (optional but recommended)
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
BASESCAN_API_KEY=YOUR_BASESCAN_API_KEY
ARBISCAN_API_KEY=YOUR_ARBISCAN_API_KEY
OPSCAN_API_KEY=YOUR_OPTIMISTIC_ETHERSCAN_API_KEY

# For backwards compatibility with existing Base Sepolia deployment
BASE_SEPOLIA_RPC_URL=${BASE_SEPOLIA_RPC}
```

## 2. Get Required Resources

### A. Private Key
- Create a **new test wallet** (never use your main wallet)
- Export the private key (64 characters, no 0x prefix)
- Fund it with testnet ETH on all networks you plan to deploy to

### B. Testnet ETH
You need testnet ETH on all target networks:

- **Ethereum Sepolia**: https://faucet.sepolia.dev/
- **Optimism Sepolia**: https://app.optimism.io/faucet
- **Base Sepolia**: https://faucet.quicknode.com/base/sepolia
- **Arbitrum Sepolia**: https://faucet.quicknode.com/arbitrum/sepolia

**Recommended amount**: 0.5 ETH per network (contract deployment is gas-intensive)

### C. RPC URLs
Choose one option:

**Option 1: Free Public RPCs (May be slower/less reliable)**
```bash
ETH_SEPOLIA_RPC=https://rpc.sepolia.org
OP_SEPOLIA_RPC=https://sepolia.optimism.io
BASE_SEPOLIA_RPC=https://sepolia.base.org
ARB_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
```

**Option 2: Alchemy (Recommended - Free tier available)**
1. Sign up at https://alchemy.com
2. Create apps for each network
3. Use format: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

**Option 3: Infura**
1. Sign up at https://infura.io
2. Create endpoints for each network

### D. Etherscan API Keys (Optional)
For contract verification (highly recommended):
- Ethereum: https://etherscan.io/apis
- Base: https://basescan.org/apis
- Arbitrum: https://arbiscan.io/apis
- Optimism: https://optimistic.etherscan.io/apis

## 3. Verify Environment Setup

Run this test to verify your environment is configured correctly:

```bash
# Test RPC connections
forge script script/TestCrossChain.s.sol:TestNetworkConnections --rpc-url $ETH_SEPOLIA_RPC
forge script script/TestCrossChain.s.sol:TestNetworkConnections --rpc-url $OP_SEPOLIA_RPC
forge script script/TestCrossChain.s.sol:TestNetworkConnections --rpc-url $BASE_SEPOLIA_RPC
forge script script/TestCrossChain.s.sol:TestNetworkConnections --rpc-url $ARB_SEPOLIA_RPC

# Test deployer account has funds
cast balance $DEPLOYER_ADDRESS --rpc-url $ETH_SEPOLIA_RPC
cast balance $DEPLOYER_ADDRESS --rpc-url $OP_SEPOLIA_RPC
cast balance $DEPLOYER_ADDRESS --rpc-url $BASE_SEPOLIA_RPC
cast balance $DEPLOYER_ADDRESS --rpc-url $ARB_SEPOLIA_RPC
```

## 4. LayerZero Configuration

The deployment scripts are pre-configured with LayerZero V2 testnet endpoints:

| Network | Chain ID | LayerZero EID | Endpoint |
|---------|----------|---------------|----------|
| Ethereum Sepolia | 11155111 | 40161 | 0x1a44076050125825900e736c501f859c50fE728c |
| Optimism Sepolia | 11155420 | 40232 | 0x1a44076050125825900e736c501f859c50fE728c |
| Base Sepolia | 84532 | 40245 | 0x1a44076050125825900e736c501f859c50fE728c |
| Arbitrum Sepolia | 421614 | 40231 | 0x1a44076050125825900e736c501f859c50fE728c |

These are automatically used by the deployment scripts.

## 5. Quick Setup Commands

```bash
# 1. Set up environment (if you have the template)
cp .env.example .env
# Edit .env with your values

# 2. Install dependencies (if not already done)
forge install

# 3. Compile contracts
forge build

# 4. Test single network deployment (Base Sepolia)
forge script script/DeployOFT.s.sol --rpc-url $BASE_SEPOLIA_RPC --broadcast --verify

# 5. Deploy to all networks
forge script script/DeployOFT.s.sol --rpc-url $ETH_SEPOLIA_RPC --broadcast --verify
forge script script/DeployOFT.s.sol --rpc-url $OP_SEPOLIA_RPC --broadcast --verify
forge script script/DeployOFT.s.sol --rpc-url $ARB_SEPOLIA_RPC --broadcast --verify
```

## 6. Troubleshooting

### Common Issues:

**"Private key not found"**
- Make sure your .env file exists and PRIVATE_KEY is set
- Private key should be 64 characters without 0x prefix

**"Insufficient funds for gas"**
- Get more testnet ETH from faucets
- Check balance with: `cast balance YOUR_ADDRESS --rpc-url $NETWORK_RPC`

**"RPC connection failed"**
- Check your RPC URL is correct
- Try alternative RPC endpoints
- Check if the network is experiencing issues

**"Contract verification failed"**
- Make sure you have the correct Etherscan API key
- Some networks may have verification delays

## Next Steps

Once your environment is set up:

1. **Deploy to single network first** (Base Sepolia recommended)
2. **Verify deployment works** and contracts are verified
3. **Deploy to other networks** using the same pattern
4. **Configure cross-chain peers** using ConfigurePeers.s.sol
5. **Test cross-chain transfers** using TestCrossChain.s.sol
6. **Update frontend** with new contract addresses

## Security Notes

- **Never use your main wallet** for deployments
- **Test wallets only** - use separate keys for each environment
- **Keep private keys secure** - never commit .env to git
- **Verify all contract addresses** before using in production
- **Test thoroughly** on testnets before any mainnet deployment 