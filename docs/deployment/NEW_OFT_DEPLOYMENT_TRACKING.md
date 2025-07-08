# New LayerZero OFT Deployment Tracking

## 🎯 Deployment Status

**Target Networks**: Base Sepolia (84532) & Optimism Sepolia (11155420)  
**Deployment Date**: `[FILL IN DATE]`  
**Deployer Address**: `[FILL IN YOUR ADDRESS]`

---

## 📋 Pre-Deployment Checklist

- [ ] Have sufficient ETH on Base Sepolia (~0.05 ETH recommended)
- [ ] Have sufficient ETH on Optimism Sepolia (~0.05 ETH recommended)  
- [ ] Verified `PRIVATE_KEY` environment variable is set
- [ ] Compiled contracts successfully
- [ ] Reviewed deployment scripts

---

## 🚀 Step-by-Step Deployment Instructions

### **Phase 1: Deploy New LayerZero OFT Contracts**

#### **Step 1.1: Deploy on Base Sepolia**
```bash
# Set network to Base Sepolia
export RPC_URL="https://sepolia.base.org"

# Deploy SovaBTC OFT
forge script script/DeployRealSovaBTCOFT.s.sol:DeployRealSovaBTCOFT \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify

# Record the deployed address below:
```

**Base Sepolia SovaBTC OFT Address**: `[FILL AFTER DEPLOYMENT]`

#### **Step 1.2: Deploy on Optimism Sepolia**
```bash
# Set network to Optimism Sepolia  
export RPC_URL="https://sepolia.optimism.io"

# Deploy SovaBTC OFT
forge script script/DeployRealSovaBTCOFT.s.sol:DeployRealSovaBTCOFT \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify

# Record the deployed address below:
```

**Optimism Sepolia SovaBTC OFT Address**: `[FILL AFTER DEPLOYMENT]`

### **Phase 2: Update Configuration Scripts**

#### **Step 2.1: Update Peer Configuration Script**
Edit `script/ConfigureNewOFTPeers.s.sol` and update the following addresses:

```solidity
// Line ~40-50: Update these addresses
networks[1] = NetworkConfig({
    chainId: 84532,
    layerZeroEid: BASE_SEPOLIA_EID,
    oftAddress: [BASE_SEPOLIA_OFT_ADDRESS], // UPDATE HERE
    name: "Base Sepolia"
});

networks[2] = NetworkConfig({
    chainId: 11155420,
    layerZeroEid: OPTIMISM_SEPOLIA_EID,
    oftAddress: [OPTIMISM_SEPOLIA_OFT_ADDRESS], // UPDATE HERE
    name: "Optimism Sepolia"
});
```

#### **Step 2.2: Update Wrapper Configuration Script**
Edit `script/UpdateWrappersForNewOFT.s.sol` and update the `getNewOFTAddress` function:

```solidity
// Line ~180-190: Update these addresses
function getNewOFTAddress(uint256 chainId) internal pure returns (address) {
    if (chainId == 84532) {
        return [BASE_SEPOLIA_OFT_ADDRESS]; // UPDATE HERE
    } else if (chainId == 11155420) {
        return [OPTIMISM_SEPOLIA_OFT_ADDRESS]; // UPDATE HERE
    }
    // ...
}
```

### **Phase 3: Configure LayerZero Peers**

#### **Step 3.1: Configure Base Sepolia Peers**
```bash
export RPC_URL="https://sepolia.base.org"

forge script script/ConfigureNewOFTPeers.s.sol:ConfigureNewOFTPeers \
    --rpc-url $RPC_URL \
    --broadcast
```

#### **Step 3.2: Configure Optimism Sepolia Peers**  
```bash
export RPC_URL="https://sepolia.optimism.io"

forge script script/ConfigureNewOFTPeers.s.sol:ConfigureNewOFTPeers \
    --rpc-url $RPC_URL \
    --broadcast
```

### **Phase 4: Update Wrapper Contracts**

#### **Step 4.1: Update Base Sepolia Wrappers**
```bash
export RPC_URL="https://sepolia.base.org"

forge script script/UpdateWrappersForNewOFT.s.sol:UpdateWrappersForNewOFT \
    --rpc-url $RPC_URL \
    --broadcast
```

#### **Step 4.2: Update Optimism Sepolia Wrappers**
```bash
export RPC_URL="https://sepolia.optimism.io"

forge script script/UpdateWrappersForNewOFT.s.sol:UpdateWrappersForNewOFT \
    --rpc-url $RPC_URL \
    --broadcast
```

### **Phase 5: Test Cross-Chain Functionality**

#### **Step 5.1: Test Base → Optimism Transfer**
```bash
export RPC_URL="https://sepolia.base.org"

forge script script/TestCrossChain.s.sol:TestCrossChain \
    --rpc-url $RPC_URL
```

#### **Step 5.2: Test Optimism → Base Transfer**
```bash
export RPC_URL="https://sepolia.optimism.io"

forge script script/TestCrossChain.s.sol:TestCrossChain \
    --rpc-url $RPC_URL
```

---

## 📊 Final Contract Addresses

### **Base Sepolia (Chain ID: 84532)**

| Contract | Address | Status | Verified |
|----------|---------|--------|----------|
| **NEW SovaBTC OFT** | `[FILL IN]` | ⏳ | ⏳ |
| SovaBTC Wrapper | `0x58c969172fa3A1D8379Eb942Bae4693d3b9cd58c` | ✅ | ✅ |
| Redemption Queue | `0x6CDD3cD1c677abbc347A0bDe0eAf350311403638` | ✅ | ✅ |
| Token Whitelist | `0x055ccbcd0389151605057e844b86a5d8f372267e` | ✅ | ✅ |
| Custody Manager | `0xbb02190385cfa8e41b180e65ab28caf232f2789e` | ✅ | ✅ |
| SOVA Token | `0x8d25f27e41d15e5b26522d4ef2879a2efe2bd954` | ✅ | ✅ |
| SovaBTC Staking | `0x755bf172b35a333a40850350e7f10309a664420f` | ✅ | ✅ |
| Mock WBTC | `0x8dA7DE3D18747ba6b8A788Eb07dD40cD660eC860` | ✅ | ✅ |
| Mock LBTC | `0x51d539a147d92a00a040b8a43981a51f29b765f6` | ✅ | ✅ |
| Mock USDC | `0xd6ea412149b7cbb80f9a81c0a99e5bda0434fbc7` | ✅ | ✅ |

### **Optimism Sepolia (Chain ID: 11155420)**

| Contract | Address | Status | Verified |
|----------|---------|--------|----------|
| **NEW SovaBTC OFT** | `[FILL IN]` | ⏳ | ⏳ |
| SovaBTC Wrapper | `[FILL IN OR DEPLOY NEW]` | ⏳ | ⏳ |
| Redemption Queue | `[FILL IN OR DEPLOY NEW]` | ⏳ | ⏳ |
| Token Whitelist | `[FILL IN OR DEPLOY NEW]` | ⏳ | ⏳ |
| Custody Manager | `[FILL IN OR DEPLOY NEW]` | ⏳ | ⏳ |
| SOVA Token | `[FILL IN OR DEPLOY NEW]` | ⏳ | ⏳ |
| SovaBTC Staking | `[FILL IN OR DEPLOY NEW]` | ⏳ | ⏳ |
| Mock WBTC | `[DEPLOY NEW]` | ⏳ | ⏳ |
| Mock LBTC | `[DEPLOY NEW]` | ⏳ | ⏳ |
| Mock USDC | `[DEPLOY NEW]` | ⏳ | ⏳ |

---

## ⚙️ LayerZero Configuration

### **Network Details**

| Network | Chain ID | LayerZero EID | Endpoint Address |
|---------|----------|---------------|------------------|
| Base Sepolia | 84532 | 40245 | `0x6EDCE65403992e310A62460808c4b910D972f10f` |
| Optimism Sepolia | 11155420 | 40232 | `0x6EDCE65403992e310A62460808c4b910D972f10f` |

### **Peer Relationships Status**

- [ ] Base Sepolia → Optimism Sepolia peer configured
- [ ] Optimism Sepolia → Base Sepolia peer configured
- [ ] Cross-chain transfers tested successfully

---

## 🧪 Testing Checklist

### **Basic Functionality**
- [ ] OFT contract deploys successfully on Base Sepolia
- [ ] OFT contract deploys successfully on Optimism Sepolia
- [ ] Contract verification successful on both networks
- [ ] Owner permissions configured correctly
- [ ] Minter permissions added for wrapper contracts

### **LayerZero Integration**
- [ ] Peer relationships configured on Base Sepolia
- [ ] Peer relationships configured on Optimism Sepolia
- [ ] Cross-chain transfer Base → Optimism successful
- [ ] Cross-chain transfer Optimism → Base successful
- [ ] LayerZero explorer shows successful message delivery

### **Wrapper Integration**  
- [ ] Wrapper contracts can mint new OFT tokens
- [ ] Redemption queue can burn OFT tokens
- [ ] Token deposits work through wrapper
- [ ] Redemption queue processes redemptions correctly

---

## 🚨 Critical Issues to Watch

1. **Contract Size**: Ensure OFT contracts are under 24KB limit
2. **Gas Limits**: LayerZero messages may require higher gas limits
3. **Peer Configuration**: Incorrect peer setup will block cross-chain transfers
4. **Minter Permissions**: Wrapper contracts must be added as minters
5. **Address Updates**: Update all scripts with deployed addresses before configuration

---

## 📱 Frontend Integration

After successful deployment, update frontend configuration:

```typescript
// Update contract addresses in frontend
export const NEW_OFT_ADDRESSES = {
  84532: '[BASE_SEPOLIA_OFT_ADDRESS]',     // Base Sepolia
  11155420: '[OPTIMISM_SEPOLIA_OFT_ADDRESS]', // Optimism Sepolia
} as const;
```

---

## 📝 Deployment Notes

**Date**: `[FILL IN]`  
**Deployer**: `[FILL IN]`  
**Issues Encountered**: `[FILL IN ANY ISSUES]`  
**Gas Used**: `[FILL IN TOTAL GAS]`  
**Total Cost**: `[FILL IN ETH COST]`

**Additional Notes**:
```
[FILL IN ANY ADDITIONAL NOTES OR OBSERVATIONS]
```

---

## ✅ Completion Status

- [ ] Phase 1: OFT Deployment Complete
- [ ] Phase 2: Configuration Scripts Updated  
- [ ] Phase 3: LayerZero Peers Configured
- [ ] Phase 4: Wrapper Contracts Updated
- [ ] Phase 5: Cross-Chain Testing Complete
- [ ] Phase 6: Frontend Updated
- [ ] Phase 7: Documentation Updated

**Deployment Complete**: ⏳ **[CHECK WHEN DONE]** 