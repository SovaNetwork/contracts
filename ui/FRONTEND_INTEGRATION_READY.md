# 🎉 SovaBTC Protocol - Frontend Integration Ready

**Generated: January 7, 2025**

The SovaBTC protocol has been **fully deployed and configured** on both Base Sepolia and Optimism Sepolia testnets. All contracts are verified, configured, and ready for frontend integration.

## ✅ **What's Ready**

### **Complete Protocol Deployment**
- ✅ **All contracts deployed** on both networks
- ✅ **All contracts verified** on block explorers
- ✅ **All permissions configured** (minters, approvals, etc.)
- ✅ **All ABIs extracted** and ready for use
- ✅ **Cross-chain functionality** with real LayerZero OFT
- ✅ **Test tokens deployed** and configured

### **Frontend Integration Assets**
- ✅ **Complete ABI collection** in `src/contracts/`
- ✅ **TypeScript types** with proper Address typing
- ✅ **Centralized contract addresses** by network
- ✅ **Helper functions** for chain validation
- ✅ **Wagmi-ready** contract integration

---

## 📁 **Available Files**

### **Contract ABIs**
```
src/contracts/
├── SovaBTCOFT.abi.json          // Main LayerZero OFT contract (37KB)
├── SovaBTCWrapper.abi.json      // Token wrapping contract
├── TokenWhitelist.abi.json      // Approved tokens management
├── CustodyManager.abi.json      // Asset custody management
├── RedemptionQueue.abi.json     // Multi-token redemption system
├── SOVAToken.abi.json           // SOVA governance token
├── SovaBTCStaking.abi.json      // Staking rewards contract
├── MockERC20BTC.abi.json        // Test tokens (WBTC, LBTC, USDC)
└── abis/
    └── index.ts                 // Centralized ABI exports
```

### **Integration Helper**
```typescript
// Easy import for all contracts
import { 
  ABIS, 
  ADDRESSES, 
  getContractAddresses,
  isSupportedChain 
} from '@/contracts/abis';

// Get addresses for current chain
const addresses = getContractAddresses(84532); // Base Sepolia
const addresses = getContractAddresses(11155420); // Optimism Sepolia
```

---

## 🌐 **Network Support**

### **Base Sepolia (Chain ID: 84532)**
- **Network**: Base Sepolia Testnet
- **RPC**: `https://sepolia.base.org`
- **Explorer**: `https://sepolia.basescan.org`
- **Faucet**: `https://faucet.quicknode.com/base/sepolia`

### **Optimism Sepolia (Chain ID: 11155420)**
- **Network**: Optimism Sepolia Testnet  
- **RPC**: `https://sepolia.optimism.io`
- **Explorer**: `https://sepolia-optimism.etherscan.io`
- **Faucet**: `https://faucet.quicknode.com/optimism/sepolia`

---

## 📋 **Contract Addresses**

### **Base Sepolia (84532)**
```typescript
sovaBTCOFT: '0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d'
sovaBTCWrapper: '0x7a08aF83566724F59D81413f3bD572E58711dE7b'
tokenWhitelist: '0x3793FaA1bD71258336c877427b105B2E74e8C030'
custodyManager: '0xe9781E85F6A55E76624fed62530AB75c53Db10C6'
redemptionQueue: '0xdD4284D33fFf9cBbe4c852664cB0496830ca46Ab'
sovaToken: '0x69041baA897687Cb16bCD57368110FfA2C8B3E63'
sovaBTCStaking: '0x5646F20B47a6E969c735c0592D002fe3067235fc'
mockWBTC: '0x10E8116eBA84981A7959a1158e03eE19c0Ad41f2'
mockLBTC: '0xf6E78618CA4bAA67259970039F49e215f15820FE'
mockUSDC: '0x0C19b539bc7C323Bec14C0A153B21D1295A42e38'
```

### **Optimism Sepolia (11155420)**
```typescript
sovaBTCOFT: '0x1b7227A7A6BcAe6c64907b1B51dD0801C3E8ba30'
sovaBTCWrapper: '0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d'
tokenWhitelist: '0xb386ef9D4C9FeF67058DBc00b31126AFE8D7600d'
custodyManager: '0x56b1F2664E5AceaBe31F64021bFF7744b7d391c7'
redemptionQueue: '0x3793FaA1bD71258336c877427b105B2E74e8C030'
sovaToken: '0xfd3CD6323c7c10d7d533D6ce86249A0c21a3A7fD'
sovaBTCStaking: '0xe9781E85F6A55E76624fed62530AB75c53Db10C6'
mockWBTC: '0x6f5249F8507445F1F0178eD162097bc4a262404E'
mockLBTC: '0xBc2945fa12bF06fC292dac00BbbaF1e52eFD5A22'
mockUSDC: '0xA57484Ac87b23668A19f388eB5812cCc5A8D1EEe'
```

---

## 🛠 **Usage Examples**

### **1. Import Contracts**
```typescript
import { ABIS, ADDRESSES, getContractAddresses } from '@/contracts/abis';
import { useReadContract, useWriteContract } from 'wagmi';

// Get addresses for current chain
const addresses = getContractAddresses(chainId);
```

### **2. Read Contract Data**
```typescript
const { data: balance } = useReadContract({
  address: addresses.sovaBTCOFT,
  abi: ABIS.SovaBTCOFT,
  functionName: 'balanceOf',
  args: [userAddress],
});
```

### **3. Write Contract Transaction**
```typescript
const { writeContract } = useWriteContract();

const handleWrap = async () => {
  writeContract({
    address: addresses.sovaBTCWrapper,
    abi: ABIS.SovaBTCWrapper,
    functionName: 'depositToken',
    args: [tokenAddress, amount],
  });
};
```

### **4. Cross-Chain Bridge**
```typescript
const { writeContract } = useWriteContract();

const handleBridge = async () => {
  writeContract({
    address: addresses.sovaBTCOFT,
    abi: ABIS.SovaBTCOFT,
    functionName: 'send',
    args: [
      {
        dstEid: 40232, // Optimism Sepolia EID
        to: userAddress,
        amountLD: amount,
        minAmountLD: minAmount,
        extraOptions: '0x',
        composeMsg: '0x',
        oftCmd: '0x'
      },
      { nativeFee: fee, lzTokenFee: 0 },
      userAddress
    ],
    value: fee,
  });
};
```

---

## 🔧 **Core Features Available**

### **Token Wrapping**
- **Supported Tokens**: WBTC, LBTC, USDC → sovaBTC
- **Contract**: SovaBTCWrapper
- **Functions**: `depositToken()`, `getExchangeRate()`

### **Cross-Chain Bridging**
- **Networks**: Base Sepolia ↔ Optimism Sepolia
- **Contract**: SovaBTCOFT (LayerZero OFT)
- **Functions**: `send()`, `quote()`, `estimateFee()`

### **Redemption System**
- **Multi-token redemption**: sovaBTC → WBTC/LBTC/USDC
- **Contract**: RedemptionQueue
- **Functions**: `requestRedemption()`, `claimRedemption()`

### **Staking & Rewards**
- **Stake**: sovaBTC for SOVA rewards
- **Contract**: SovaBTCStaking
- **Functions**: `stake()`, `unstake()`, `claimRewards()`

### **Test Tokens**
- **Mock WBTC**: 8 decimals, 1000 tokens minted
- **Mock LBTC**: 8 decimals, 1000 tokens minted  
- **Mock USDC**: 6 decimals, 10000 tokens minted

---

## 🎯 **Next Steps**

1. **Import the contracts** using the provided ABI index
2. **Connect to testnets** using the RPC endpoints
3. **Get testnet tokens** from the faucets
4. **Test core flows**: wrap → bridge → redeem → stake
5. **Implement UI components** for each feature

## 🚀 **Ready for Development!**

The protocol is **100% ready** for frontend integration. All contracts are deployed, verified, configured, and tested. The ABI files and addresses are properly structured for easy import into your React/Next.js application.

**Happy coding!** 🎉 