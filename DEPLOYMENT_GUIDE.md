# SovaBTC Real LayerZero OFT - Deployment Guide

**🚨 CRITICAL: This replaces the FAKE LayerZero implementation with a REAL one!**

## **The Problem We're Solving**

The current `src/SovaBTCOFT.sol` is a **mock implementation** that:
- ❌ Only burns tokens locally (no cross-chain messages)
- ❌ Emits fake events 
- ❌ Creates fake GUIDs
- ❌ **NO ACTUAL LAYERZERO INTEGRATION**

**This is why transactions don't appear in LayerZero explorer!**

---

## **The Solution: Real LayerZero V2 OFT**

We've built `src/SovaBTCRealOFT.sol` - a proper LayerZero V2 OFT that:
- ✅ Actually inherits from LayerZero's OFT contract
- ✅ Sends real cross-chain messages
- ✅ Burns on source, mints on destination
- ✅ Transactions will appear in LayerZero explorer
- ✅ 100% compatible with existing wrapper contracts

---

## **Prerequisites**

### 1. Environment Setup

Create a `.env` file:
```bash
# Your private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# RPC URLs (optional - we have public fallbacks)
ETH_SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_KEY
BASE_SEPOLIA_RPC=https://sepolia.base.org
OP_SEPOLIA_RPC=https://sepolia.optimism.io
ARB_SEPOLIA_RPC=https://sepolia.arbitrum.io/rpc

# Etherscan API keys for verification
ETHERSCAN_API_KEY=your_etherscan_key
BASESCAN_API_KEY=your_basescan_key
OPSCAN_API_KEY=your_optimism_etherscan_key
ARBISCAN_API_KEY=your_arbiscan_key
```

### 2. Install Dependencies

```bash
# Install LayerZero V2 packages
npm install @layerzerolabs/oft-evm @layerzerolabs/lz-definitions @layerzerolabs/toolbox-hardhat

# Update forge dependencies
forge install
forge update
```

### 3. Testnet Funds

You need native tokens (ETH) on each network:
- **Ethereum Sepolia**: Get ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
- **Base Sepolia**: Get ETH from [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)  
- **Optimism Sepolia**: Get ETH from [Optimism Faucet](https://app.optimism.io/faucet)
- **Arbitrum Sepolia**: Get ETH from [Arbitrum Faucet](https://faucet.arbitrum.io/)

---

## **Deployment Steps**

### Step 1: Compile Contracts

```bash
# Compile all contracts
forge build

# Check contract sizes (should be under 24KB)
forge build --sizes
```

### Step 2: Deploy to Each Network

Deploy the complete protocol to each network:

#### **Base Sepolia**
```bash
forge script script/DeployRealOFTComplete.s.sol \
  --rpc-url base_sepolia_public \
  --broadcast \
  --verify \
  -vvvv
```

#### **Optimism Sepolia**
```bash
forge script script/DeployRealOFTComplete.s.sol \
  --rpc-url optimism_sepolia_public \
  --broadcast \
  --verify \
  -vvvv
```

#### **Ethereum Sepolia**
```bash
forge script script/DeployRealOFTComplete.s.sol \
  --rpc-url ethereum_sepolia \
  --broadcast \
  --verify \
  -vvvv
```

#### **Arbitrum Sepolia** (Optional)
```bash
forge script script/DeployRealOFTComplete.s.sol \
  --rpc-url arbitrum_sepolia_public \
  --broadcast \
  --verify \
  -vvvv
```

### Step 3: Save Contract Addresses

After each deployment, copy the contract addresses from the script output and save them. The script will output frontend-ready configuration.

### Step 4: Configure LayerZero Peers

**CRITICAL**: You must configure peers between networks for cross-chain transfers to work.

1. **Update `script/ConfigureOFTPeers.s.sol`** with your deployed addresses:

```solidity
function setUp() public {
    // Update these with your deployed addresses
    oftAddresses[11155111] = 0xYourEthereumSepoliaOFTAddress;
    oftAddresses[84532] = 0xYourBaseSepoliaOFTAddress;
    oftAddresses[11155420] = 0xYourOptimismSepoliaOFTAddress;
    oftAddresses[421614] = 0xYourArbitrumSepoliaOFTAddress;
}
```

2. **Run peer configuration on each network:**

```bash
# Configure peers on Base Sepolia
forge script script/ConfigureOFTPeers.s.sol \
  --rpc-url base_sepolia_public \
  --broadcast

# Configure peers on Optimism Sepolia  
forge script script/ConfigureOFTPeers.s.sol \
  --rpc-url optimism_sepolia_public \
  --broadcast

# Configure peers on Ethereum Sepolia
forge script script/ConfigureOFTPeers.s.sol \
  --rpc-url ethereum_sepolia \
  --broadcast
```

---

## **Verification**

### Check Deployment
```bash
# Check contract exists and has code
cast code 0xYourOFTAddress --rpc-url base_sepolia_public

# Check LayerZero endpoint is set correctly
cast call 0xYourOFTAddress "endpoint()" --rpc-url base_sepolia_public

# Should return: 0x1a44076050125825900e736c501f859c50fE728c
```

### Check Peer Configuration
```bash
# Check if peers are configured (should NOT be 0x0000...)
cast call 0xYourBaseOFT "peers(uint32)" 40232 --rpc-url base_sepolia_public
```

### Test Wrapper Integration  
```bash
# Check if wrapper is authorized minter
cast call 0xYourOFTAddress "minters(address)" 0xYourWrapperAddress --rpc-url base_sepolia_public

# Should return: true
```

---

## **Frontend Integration**

### 1. Update Contract Addresses

Update `ui/src/contracts/addresses.ts` with your deployed addresses (the script outputs the exact format):

```typescript
export const CHAIN_CONFIGS = {
  84532: { // Base Sepolia
    contracts: {
      sovaBTC: '0xYourBaseSepoliaOFT',
      // ... other contracts
    },
    layerZero: { 
      endpoint: '0x1a44076050125825900e736c501f859c50fE728c', 
      eid: 40245 
    }
  },
  // ... other networks
};
```

### 2. Update Contract ABIs

The new OFT contract may have different ABI. Update:
- `ui/src/contracts/abis/SovaBTC.abi.json` with the new OFT ABI

---

## **Testing Cross-Chain Transfers**

### 1. Get Test Tokens

The deployment script automatically mints test tokens to your address:
- **Test WBTC**: 1000 tokens (8 decimals)
- **Test LBTC**: 1000 tokens (8 decimals)  
- **Test USDC**: 100,000 tokens (6 decimals)

### 2. Test Wrapper Flow

```bash
# 1. Approve test WBTC to wrapper
cast send 0xTestWBTC "approve(address,uint256)" 0xWrapperAddress 100000000 \
  --rpc-url base_sepolia_public --private-key $PRIVATE_KEY

# 2. Wrap test WBTC for sovaBTC
cast send 0xWrapperAddress "deposit(address,uint256)" 0xTestWBTC 100000000 \
  --rpc-url base_sepolia_public --private-key $PRIVATE_KEY

# 3. Check sovaBTC balance
cast call 0xOFTAddress "balanceOf(address)" $YOUR_ADDRESS \
  --rpc-url base_sepolia_public
```

### 3. Test Cross-Chain Bridge

Use the frontend or LayerZero CLI to test actual cross-chain transfers:

```bash
# Quote fees for cross-chain transfer
cast call 0xOFTAddress "quoteSend((uint32,bytes32,uint256,uint256,bytes,bytes),bool)" \
  "(40232,0x000000000000000000000000$YOUR_ADDRESS,50000000,50000000,0x,0x)" false \
  --rpc-url base_sepolia_public

# Execute cross-chain transfer (Base → Optimism)
# Use the frontend bridge interface for easier testing
```

---

## **Key Differences from Fake Implementation**

| Feature | Fake OFT (Current) | Real OFT (New) |
|---------|-------------------|-----------------|
| **LayerZero Integration** | ❌ None | ✅ Real LayerZero V2 |
| **Cross-Chain Messages** | ❌ Fake events only | ✅ Real messages sent |
| **Burn/Mint Mechanism** | ❌ Local only | ✅ True cross-chain |
| **LayerZero Explorer** | ❌ No transactions | ✅ Visible transactions |
| **Contract Size** | Large | Optimized (<24KB) |
| **Wrapper Compatible** | ✅ Yes | ✅ Yes (same interface) |

---

## **Troubleshooting**

### Contract Size Too Large
```bash
# Use size profile for maximum optimization
forge build --profile size

# Check individual contract sizes
forge build --sizes
```

### Dependency Issues
```bash
# Clean and reinstall
forge clean
rm -rf lib/
forge install

# Update remappings if needed
forge remappings > remappings.txt
```

### LayerZero Peer Errors
```bash
# Check if peers are set correctly
cast call 0xOFTAddress "peers(uint32)" 40232 --rpc-url base_sepolia_public

# Should return the bytes32 address of the destination OFT
```

### Cross-Chain Transfer Fails
1. **Check balances**: Ensure you have enough sovaBTC
2. **Check peers**: Ensure peers are configured on both networks  
3. **Check fees**: Use quoteSend to get required fees
4. **Check LayerZero explorer**: Real transfers will appear there

---

## **Security Notes**

1. **Private Keys**: Never commit private keys to git
2. **Test Networks**: Always test on testnets first
3. **Contract Verification**: Always verify contracts on block explorers
4. **Peer Configuration**: Double-check peer addresses before configuring
5. **Frontend Testing**: Test complete user flows before public release

---

## **Success Criteria**

✅ **Contracts Deploy**: All contracts deploy successfully under 24KB  
✅ **Verification**: All contracts verified on block explorers  
✅ **Wrapper Works**: Users can wrap WBTC/LBTC → sovaBTC  
✅ **Cross-Chain**: sovaBTC can bridge between networks  
✅ **LayerZero Explorer**: Transactions appear in LayerZero scan  
✅ **Frontend Integration**: UI works with new contracts  

---

## **Next Steps After Deployment**

1. **Clean up old addresses** from all documentation
2. **Update frontend** with new contract addresses  
3. **Test complete user flows** (wrap → bridge → redeem)
4. **Document mainnet preparation** when ready

**🎉 You'll finally have a REAL LayerZero OFT bridge that actually works!** 