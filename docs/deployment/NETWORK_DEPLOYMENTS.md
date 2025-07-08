# SovaBTC Protocol - Network Deployments

**Last Updated**: January 7, 2025  
**Status**: Production Ready - OFT Enabled  
**Version**: v2.0 (LayerZero OFT Integration Complete)

---

## 🌐 **ACTIVE TESTNET DEPLOYMENTS**

### **Ethereum Sepolia (Chain ID: 11155111)**
**LayerZero EID**: 40161  
**RPC**: https://sepolia.infura.io/v3/YOUR_KEY  
**Explorer**: https://sepolia.etherscan.io  

| Contract | Address | Status |
|----------|---------|---------|
| **SovaBTC OFT** | `0xf059C386BA88DA3C3919eDe0E6209B66C4D3DeE1` | ✅ Active |
| **SOVA Token** | `0x945a306339dd7fe6edd73705adf00337b167a482` | ✅ Active |
| **TokenWhitelist** | `0xf03b500351fa5a7cbe64ba0387c97d68331ea3c9` | ✅ Active |
| **CustodyManager** | `0xe3c0fe7911a0813a6a880c640a71f59619638d77` | ✅ Active |
| **Wrapper** | `0x37cc44e3b6c9386284e3a9f5b047c6933a80be0d` | ✅ Active |
| **RedemptionQueue** | `0x2415a13271aa21dbac959b8143e072934dbc41c6` | ✅ Active |
| **Staking** | `0x07bd8b4fd40c6ad514fe5e1770016759258cda6f` | ✅ Active |

**Test Tokens:**
- **WBTC**: `0xb855b4aecabc18f65671efa337b17f86a6e24a61` (8 decimals)
- **LBTC**: `0xa433c557b13f69771184f00366e14b3d492578cf` (8 decimals)  
- **USDC**: `0x0f7900ae7506196bff662ce793742980ed7d58ee` (6 decimals)

---

### **Base Sepolia (Chain ID: 84532)**
**LayerZero EID**: 40245  
**RPC**: https://sepolia.base.org  
**Explorer**: https://sepolia.basescan.org  

| Contract | Address | Status |
|----------|---------|---------|
| **SovaBTC OFT** | `0x802Ea91b5aAf53D067b0bB72bAD4Cc714e1855Be` | ✅ Active |
| **SOVA Token** | `0xF370D61586B03A72c90C26e24a219332183A05b7` | ✅ Active |
| **TokenWhitelist** | `0x94F983EB3Fd547b68E1760E2fe2193811f8f7c4e` | ✅ Active |
| **CustodyManager** | `0x78Ea93068bF847fF1703Dde09a772FC339CA4433` | ✅ Active |
| **Wrapper** | `0xA73550548804cFf5dD23F1C67e360C3a22433f53` | ✅ Active (OFT-Compatible) |
| **RedemptionQueue** | `0xBb95e1e4DbaaB783264947c19fA4e7398621af23` | ✅ Active |
| **Staking** | `0x119878F441C4300033e07f1B3cE66462519a005c` | ✅ Active |

**Test Tokens:**
- **WBTC**: `0x0a3745b48f350949Ef5D024A01eE143741EA2CE0` (8 decimals)
- **LBTC**: `0x7087Eb81f647448F1bd76e936A9F9A39775bC4Dc` (8 decimals)
- **USDC**: `0x52BA51f41713270e8071218058C3E37E1c2D4f20` (6 decimals)

---

### **Optimism Sepolia (Chain ID: 11155420)**
**LayerZero EID**: 40232  
**RPC**: https://sepolia.optimism.io  
**Explorer**: https://sepolia-optimism.etherscan.io  

| Contract | Address | Status |
|----------|---------|---------|
| **SovaBTC OFT** | `0x00626Ed5FE6Bf77Ae13BEa79e304CF6A5554903b` | ✅ Active |
| **SOVA Token** | `0xb21dD6c1E73288C03f8f2Ec0A896F2cCC5590cBa` | ✅ Active |
| **TokenWhitelist** | `0x319501B1da942abA28854Dd573cd088CBd0bDF4C` | ✅ Active |
| **CustodyManager** | `0xCdBFaB2F5760d320C7c4024A5e676248ba956c7D` | ✅ Active |
| **Wrapper** | `0xd6ea412149B7cbb80f9A81c0a99e5BDa0434fBC7` | ✅ Active (OFT-Compatible) |
| **RedemptionQueue** | `0x205B8115068801576901A544e96E4C051834FBe4` | ✅ Active |
| **Staking** | `0xeA52f7F6a12199bc112a2E00CEB1ddDB26aB3fe2` | ✅ Active |

**Test Tokens:**
- **WBTC**: `0x412Bd95e843b7982702F12b8De0a5d414B482653` (8 decimals)
- **LBTC**: `0xf059C386BA88DA3C3919eDe0E6209B66C4D3DeE1` (8 decimals)
- **USDC**: `0x576BDBf8fE1a11c097c3FBba20162522Cd84cDA6` (6 decimals)

---

## 🔄 **LAYERZERO CROSS-CHAIN CONFIGURATION**

### **Peer Connections (Bidirectional)**
All networks are configured as trusted peers for cross-chain transfers:

| Source Network | Destination Network | Status |
|----------------|-------------------|---------|
| Ethereum Sepolia ↔ Base Sepolia | Both Directions | ✅ Configured |
| Ethereum Sepolia ↔ Optimism Sepolia | Both Directions | ✅ Configured |
| Base Sepolia ↔ Optimism Sepolia | Both Directions | ✅ Configured |

### **LayerZero Endpoints**
All networks use LayerZero V2 endpoint: `0x1a44076050125825900e736c501f859c50fE728c`

---

## 🚨 **CRITICAL FIXES APPLIED (Jan 7, 2025)**

### **Wrapper Contract Issues Resolved**
**Problem**: Original wrapper contracts pointed to old sovaBTC contracts instead of new OFT contracts, causing "insufficient allowance" errors.

**Solution**: Deployed new OFT-compatible wrapper contracts:
- **Base Sepolia**: `0xA73550548804cFf5dD23F1C67e360C3a22433f53` → Points to OFT `0x802Ea...`
- **OP Sepolia**: `0xd6ea412149B7cbb80f9A81c0a99e5BDa0434fBC7` → Points to OFT `0x00626...`

### **Minter Permissions Fixed**
- ✅ New wrapper contracts set as minters on respective OFT contracts
- ✅ Frontend updated to use new wrapper addresses
- ✅ All token wrapping functionality restored

---

## 📋 **DEPLOYMENT VERIFICATION CHECKLIST**

For any new network deployment, verify:

### **Contract Deployment**
- [ ] SovaBTC OFT deployed with correct LayerZero endpoint
- [ ] Supporting contracts (TokenWhitelist, CustodyManager, etc.) deployed
- [ ] Wrapper contract deployed pointing to **OFT contract** (not old sovaBTC)
- [ ] RedemptionQueue deployed pointing to **OFT contract**

### **Configuration**
- [ ] Wrapper set as minter on OFT contract
- [ ] RedemptionQueue set as minter on OFT contract (if needed)
- [ ] Test tokens deployed and whitelisted
- [ ] LayerZero peers configured for cross-chain functionality

### **Frontend Integration**
- [ ] Contract addresses added to `ui/src/contracts/addresses.ts`
- [ ] Network configuration added to chain configs
- [ ] Token addresses match deployed test tokens

### **Testing**
- [ ] Token wrapping works (no "insufficient allowance" errors)
- [ ] Cross-chain bridging functional
- [ ] Redemption queue processes requests
- [ ] Staking functionality operational

---

## 🔧 **DEPLOYMENT SCRIPTS REFERENCE**

### **Full Protocol Deployment**
```bash
# Deploy complete OFT protocol on any supported network
forge script script/DeployOFT.s.sol:DeployOFTProtocol --rpc-url $RPC_URL --broadcast
```

### **New Wrapper (OFT-Compatible)**
```bash
# Deploy wrapper pointing to OFT contract
forge script script/DeployNewWrapper.s.sol:DeployNewWrapper --rpc-url $RPC_URL --broadcast
```

### **Minter Configuration**
```bash
# Set wrapper as minter on OFT contract
forge script script/SetWrapperMinter.s.sol:SetWrapperMinter --rpc-url $RPC_URL --broadcast
```

### **LayerZero Peer Configuration**
```bash
# Configure cross-chain peers
forge script script/ConfigurePeers.s.sol:ConfigurePeers --rpc-url $RPC_URL --broadcast
```

---

## 🚀 **PLANNED MAINNET DEPLOYMENTS**

### **Target Networks**
- **Ethereum Mainnet** (Chain ID: 1)
- **Base Mainnet** (Chain ID: 8453)
- **Optimism Mainnet** (Chain ID: 10)
- **Arbitrum One** (Chain ID: 42161)

### **Production Tokens**
- **WBTC**: Real Wrapped Bitcoin addresses
- **LBTC**: Real Lombard Staked Bitcoin addresses  
- **USDC**: Real USD Coin addresses

---

## 📞 **SUPPORT & REFERENCES**

### **Key Documentation**
- Frontend Integration: `ui/src/contracts/addresses.ts`
- Contract ABIs: `ui/src/contracts/abis/`
- Deployment Scripts: `script/`

### **Important Notes**
1. **Always deploy wrapper contracts pointing to OFT contracts, not legacy sovaBTC**
2. **Verify minter permissions are set correctly after deployment**
3. **Test wrapping functionality before marking deployment complete**
4. **Update frontend configuration with new addresses**

---

**✅ Current Status**: All testnet deployments fully operational with OFT cross-chain functionality 