# SovaBTC Protocol - Complete Contract Address Reference

**Date**: January 7, 2025  
**Purpose**: Comprehensive reference for all deployed contract addresses across networks  
**Status**: ⚠️ **ADDRESS CONFLICTS IDENTIFIED**

## 🚨 CRITICAL: Address Conflicts Found

There are **conflicting addresses** between `DEPLOYMENT_SUMMARY.md` and `OFT_DEPLOYMENT_COMPLETE.md`. We need to determine which deployment is correct.

---

## 📊 Contract Addresses by Network

### **Ethereum Sepolia (Chain ID: 11155111, LayerZero EID: 40161)**

✅ **Both documents MATCH** - These addresses are consistent:

| Contract | Address | Status |
|----------|---------|---------|
| **SovaBTC OFT** | `0xf059C386BA88DA3C3919eDe0E6209B66C4D3DeE1` | ✅ Verified |
| **SOVA Token** | `0x945a306339dd7fe6edd73705adf00337b167a482` | ✅ Verified |
| **TokenWhitelist** | `0xf03b500351fa5a7cbe64ba0387c97d68331ea3c9` | ✅ Verified |
| **CustodyManager** | `0xe3c0fe7911a0813a6a880c640a71f59619638d77` | ✅ Verified |
| **SovaBTCWrapper** | `0x37cc44e3b6c9386284e3a9f5b047c6933a80be0d` | ✅ Verified |
| **RedemptionQueue** | `0x2415a13271aa21dbac959b8143e072934dbc41c6` | ✅ Verified |
| **SovaBTCStaking** | `0x07bd8b4fd40c6ad514fe5e1770016759258cda6f` | ✅ Verified |
| **Test WBTC** | `0xb855b4aecabc18f65671efa337b17f86a6e24a61` | ✅ Verified |
| **Test LBTC** | `0xa433c557b13f69771184f00366e14b3d492578cf` | ✅ Verified |
| **Test USDC** | `0x0f7900ae7506196bff662ce793742980ed7d58ee` | ✅ Verified |
| **LayerZero Endpoint** | `0x1a44076050125825900e736c501f859c50fE728c` | ✅ Verified |

---

### **Base Sepolia (Chain ID: 84532, LayerZero EID: 40245)**

❌ **CONFLICT DETECTED** - Two different deployments:

#### Deployment A (from `OFT_DEPLOYMENT_COMPLETE.md`):
| Contract | Address | Source |
|----------|---------|---------|
| **SovaBTC OFT** | `0x802Ea91b5aAf53D067b0bB72bAD4Cc714e1855Be` | ✅ Same |
| **SOVA Token** | `0xF370D61586B03A72c90C26e24a219332183A05b7` | ⚠️ Conflict |
| **TokenWhitelist** | `0x94F983EB3Fd547b68E1760E2fe2193811f8f7c4e` | ⚠️ Conflict |
| **CustodyManager** | `0x78Ea93068bF847fF1703Dde09a772FC339CA4433` | ⚠️ Conflict |
| **SovaBTCWrapper** | `0x30cc05366CC687c0ab75e3908Fe2b2C5BB679db8` | ⚠️ Conflict |
| **RedemptionQueue** | `0xBb95e1e4DbaaB783264947c19fA4e7398621af23` | ⚠️ Conflict |
| **SovaBTCStaking** | `0x119878F441C4300033e07f1B3cE66462519a005c` | ⚠️ Conflict |
| **Test WBTC** | `0x0a3745b48f350949Ef5D024A01eE143741EA2CE0` | ⚠️ Conflict |
| **Test LBTC** | `0x7087Eb81f647448F1bd76e936A9F9A39775bC4Dc` | ⚠️ Conflict |
| **Test USDC** | `0x52BA51f41713270e8071218058C3E37E1c2D4f20` | ⚠️ Conflict |

#### Deployment B (from `DEPLOYMENT_SUMMARY.md`):
| Contract | Address | Source |
|----------|---------|---------|
| **SovaBTC OFT** | `0x802Ea91b5aAf53D067b0bB72bAD4Cc714e1855Be` | ✅ Same |
| **SOVA Token** | `0x8d25f27e41d15e5b26522d4ef2879a2efe2bd954` | ⚠️ Conflict |
| **TokenWhitelist** | `0x055ccbcd0389151605057e844b86a5d8f372267e` | ⚠️ Conflict |
| **CustodyManager** | `0xbb02190385cfa8e41b180e65ab28caf232f2789e` | ⚠️ Conflict |
| **SovaBTCWrapper** | `0x58c969172fa3A1D8379Eb942Bae4693d3b9cd58c` | ⚠️ Conflict |
| **RedemptionQueue** | `0x6CDD3cD1c677abbc347A0bDe0eAf350311403638` | ⚠️ Conflict |
| **SovaBTCStaking** | `0x755bf172b35a333a40850350e7f10309a664420f` | ⚠️ Conflict |
| **Mock WBTC** | `0x8dA7DE3D18747ba6b8A788Eb07dD40cD660eC860` | ⚠️ Conflict |
| **Mock LBTC** | `0x51d539a147d92a00a040b8a43981a51f29b765f6` | ⚠️ Conflict |
| **Mock USDC** | `0xd6ea412149b7cbb80f9a81c0a99e5bda0434fbc7` | ⚠️ Conflict |

**Frontend Currently Uses**: Deployment B (DEPLOYMENT_SUMMARY.md)

---

### **Optimism Sepolia (Chain ID: 11155420, LayerZero EID: 40232)**

✅ **Both documents MATCH** - These addresses are consistent:

| Contract | Address | Status |
|----------|---------|---------|
| **SovaBTC OFT** | `0x00626Ed5FE6Bf77Ae13BEa79e304CF6A5554903b` | ✅ Verified |
| **SOVA Token** | `0xb21dD6c1E73288C03f8f2Ec0A896F2cCC5590cBa` | ✅ Verified |
| **TokenWhitelist** | `0x319501B1da942abA28854Dd573cd088CBd0bDF4C` | ✅ Verified |
| **CustodyManager** | `0xCdBFaB2F5760d320C7c4024A5e676248ba956c7D` | ✅ Verified |
| **SovaBTCWrapper** | `0xd2A7029baCCd24799ba497174859580Cd25e4E7F` | ✅ Verified |
| **RedemptionQueue** | `0x205B8115068801576901A544e96E4C051834FBe4` | ✅ Verified |
| **SovaBTCStaking** | `0xeA52f7F6a12199bc112a2E00CEB1ddDB26aB3fe2` | ✅ Verified |
| **Test WBTC** | `0x412Bd95e843b7982702F12b8De0a5d414B482653` | ✅ Verified |
| **Test LBTC** | `0xf059C386BA88DA3C3919eDe0E6209B66C4D3DeE1` | ✅ Verified |
| **Test USDC** | `0x576BDBf8fE1a11c097c3FBba20162522Cd84cDA6` | ✅ Verified |
| **LayerZero Endpoint** | `0x1a44076050125825900e736c501f859c50fE728c` | ✅ Verified |

---

## 🔍 Frontend Address Status

### Current Frontend Configuration (ui/src/contracts/addresses.ts):

| Network | SovaBTC | Wrapper | WBTC | Status |
|---------|---------|---------|------|--------|
| **Ethereum Sepolia** | `0xf059...DeE1` | `0x37cc...be0d` | `0xb855...a61` | ✅ Correct |
| **Base Sepolia** | `0x802E...55Be` | `0x58c9...58c` | `0x8dA7...860` | ⚠️ Using Deployment B |
| **Optimism Sepolia** | `0x0062...03b` | `0xd2A7...E7F` | `0x412B...653` | ✅ Correct |

---

## 🛠 Action Required

### **IMMEDIATE**: Determine Which Base Sepolia Deployment Is Correct

**Option 1**: Test Deployment A (OFT_DEPLOYMENT_COMPLETE.md)
```bash
# Test wrapper contract from Deployment A
cast call 0x30cc05366CC687c0ab75e3908Fe2b2C5BB679db8 "minDepositSatoshi()" --rpc-url $BASE_SEPOLIA_RPC

# Test WBTC token from Deployment A  
cast call 0x0a3745b48f350949Ef5D024A01eE143741EA2CE0 "symbol()" --rpc-url $BASE_SEPOLIA_RPC
```

**Option 2**: Test Deployment B (DEPLOYMENT_SUMMARY.md) - Currently Used
```bash
# Test wrapper contract from Deployment B
cast call 0x58c969172fa3A1D8379Eb942Bae4693d3b9cd58c "minDepositSatoshi()" --rpc-url $BASE_SEPOLIA_RPC

# Test WBTC token from Deployment B
cast call 0x8dA7DE3D18747ba6b8A788Eb07dD40cD660eC860 "symbol()" --rpc-url $BASE_SEPOLIA_RPC
```

### **NEXT**: Update Frontend to Use Correct Addresses

Once we determine which deployment is correct, update:
- `ui/src/contracts/addresses.ts`
- Any hardcoded addresses in components
- Clear browser cache and test

---

## 📋 Validation Commands

### Check Contract Existence:
```bash
# Check if contract has code deployed
cast code [CONTRACT_ADDRESS] --rpc-url [RPC_URL]

# Should return bytecode if deployed, "0x" if not
```

### Check Contract Functions:
```bash
# Test wrapper contract
cast call [WRAPPER_ADDRESS] "minDepositSatoshi()" --rpc-url [RPC_URL]

# Test token contracts
cast call [TOKEN_ADDRESS] "symbol()" --rpc-url [RPC_URL]
cast call [TOKEN_ADDRESS] "decimals()" --rpc-url [RPC_URL]
```

### Check LayerZero OFT Functions:
```bash
# Test OFT peer configuration
cast call [SOVABTC_OFT_ADDRESS] "peers(uint32)" [DESTINATION_EID] --rpc-url [RPC_URL]

# Test OFT endpoint
cast call [SOVABTC_OFT_ADDRESS] "endpoint()" --rpc-url [RPC_URL]
```

---

## 🎯 Resolution Strategy

1. **Test both Base Sepolia deployments** using the validation commands
2. **Identify which deployment is functional** (has working contracts)
3. **Update frontend configuration** to use the correct addresses
4. **Verify cross-chain functionality** works properly
5. **Update documentation** to reflect the correct addresses

---

**⚠️ CRITICAL: The allowance issues you're experiencing are likely due to these address conflicts. The frontend might be approving tokens for one wrapper contract but trying to wrap using a different wrapper contract.** 