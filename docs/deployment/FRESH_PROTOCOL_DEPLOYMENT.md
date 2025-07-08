# Fresh SovaBTC Protocol Deployment from Scratch

## 🎯 Deployment Overview

**Target Networks**: Base Sepolia (84532) & Optimism Sepolia (11155420)  
**Deployment Type**: Complete Protocol Suite with Real LayerZero OFT  
**Deployment Date**: `[FILL IN DATE]`  
**Deployer Address**: `[FILL IN YOUR ADDRESS]`  
**New Private Key**: ✅ Fresh deployment with new deployer

---

## 📋 Pre-Deployment Checklist

### **Network Requirements**
- [ ] Have sufficient ETH on Base Sepolia (~0.15 ETH recommended)
- [ ] Have sufficient ETH on Optimism Sepolia (~0.15 ETH recommended)
- [ ] Verified `PRIVATE_KEY` environment variable is set
- [ ] Compiled contracts successfully (`forge build`)
- [ ] Reviewed deployment scripts

### **Contract Verification**
- [ ] Verified all contracts compile without errors
- [ ] Confirmed LayerZero dependencies are available
- [ ] Checked contract size limits (<24KB)

---

## 🚀 Complete Deployment Instructions

### **Phase 1: Deploy Complete Protocol Suite**

#### **Step 1.1: Deploy on Base Sepolia**
```bash
# Set network to Base Sepolia
export RPC_URL="https://sepolia.base.org"

# Deploy complete protocol suite
forge script script/DeployCompleteProtocol.s.sol:DeployCompleteProtocol \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify \
    --etherscan-api-key $BASESCAN_API_KEY

# Save the output - you'll need all contract addresses
```

**Base Sepolia Deployment Results**: `[FILL AFTER DEPLOYMENT]`

#### **Step 1.2: Deploy on Optimism Sepolia**
```bash
# Set network to Optimism Sepolia
export RPC_URL="https://sepolia.optimism.io"

# Deploy complete protocol suite
forge script script/DeployCompleteProtocol.s.sol:DeployCompleteProtocol \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify \
    --etherscan-api-key $OPTIMISM_ETHERSCAN_API_KEY

# Save the output - you'll need all contract addresses
```

**Optimism Sepolia Deployment Results**: `[FILL AFTER DEPLOYMENT]`

### **Phase 2: Configure LayerZero Cross-Chain**

#### **Step 2.1: Set Environment Variables**
```bash
# Set the deployed OFT addresses from Phase 1
export BASE_SEPOLIA_OFT_ADDRESS="[BASE_SEPOLIA_SOVABTC_OFT_ADDRESS]"
export OPTIMISM_SEPOLIA_OFT_ADDRESS="[OPTIMISM_SEPOLIA_SOVABTC_OFT_ADDRESS]"
```

#### **Step 2.2: Configure Base Sepolia Peers**
```bash
export RPC_URL="https://sepolia.base.org"

forge script script/ConfigureFreshOFTPeers.s.sol:ConfigureFreshOFTPeers \
    --rpc-url $RPC_URL \
    --broadcast
```

#### **Step 2.3: Configure Optimism Sepolia Peers**
```bash
export RPC_URL="https://sepolia.optimism.io"

forge script script/ConfigureFreshOFTPeers.s.sol:ConfigureFreshOFTPeers \
    --rpc-url $RPC_URL \
    --broadcast
```

### **Phase 3: Test Protocol Functionality**

#### **Step 3.1: Test Cross-Chain Transfers**
```bash
# Test Base → Optimism
export RPC_URL="https://sepolia.base.org"
forge script script/TestCrossChain.s.sol:TestCrossChain --rpc-url $RPC_URL

# Test Optimism → Base
export RPC_URL="https://sepolia.optimism.io"
forge script script/TestCrossChain.s.sol:TestCrossChain --rpc-url $RPC_URL
```

#### **Step 3.2: Test Wrapper Functionality**
```bash
# Test token wrapping on Base Sepolia
export RPC_URL="https://sepolia.base.org"
forge script script/TestFullProtocolFlow.s.sol:TestFullProtocolFlow --rpc-url $RPC_URL

# Test token wrapping on Optimism Sepolia
export RPC_URL="https://sepolia.optimism.io"
forge script script/TestFullProtocolFlow.s.sol:TestFullProtocolFlow --rpc-url $RPC_URL
```

---

## 📊 Final Contract Addresses

### **Base Sepolia (Chain ID: 84532)**

| Contract | Address | Status | Verified |
|----------|---------|--------|----------|
| **SovaBTC OFT** | `[FILL IN]` | ⏳ | ⏳ |
| **SOVA Token** | `[FILL IN]` | ⏳ | ⏳ |
| **TokenWhitelist** | `[FILL IN]` | ⏳ | ⏳ |
| **CustodyManager** | `[FILL IN]` | ⏳ | ⏳ |
| **SovaBTCWrapper** | `[FILL IN]` | ⏳ | ⏳ |
| **RedemptionQueue** | `[FILL IN]` | ⏳ | ⏳ |
| **SovaBTCStaking** | `[FILL IN]` | ⏳ | ⏳ |
| **Mock WBTC** | `[FILL IN]` | ⏳ | ⏳ |
| **Mock LBTC** | `[FILL IN]` | ⏳ | ⏳ |
| **Mock USDC** | `[FILL IN]` | ⏳ | ⏳ |

### **Optimism Sepolia (Chain ID: 11155420)**

| Contract | Address | Status | Verified |
|----------|---------|--------|----------|
| **SovaBTC OFT** | `[FILL IN]` | ⏳ | ⏳ |
| **SOVA Token** | `[FILL IN]` | ⏳ | ⏳ |
| **TokenWhitelist** | `[FILL IN]` | ⏳ | ⏳ |
| **CustodyManager** | `[FILL IN]` | ⏳ | ⏳ |
| **SovaBTCWrapper** | `[FILL IN]` | ⏳ | ⏳ |
| **RedemptionQueue** | `[FILL IN]` | ⏳ | ⏳ |
| **SovaBTCStaking** | `[FILL IN]` | ⏳ | ⏳ |
| **Mock WBTC** | `[FILL IN]` | ⏳ | ⏳ |
| **Mock LBTC** | `[FILL IN]` | ⏳ | ⏳ |
| **Mock USDC** | `[FILL IN]` | ⏳ | ⏳ |

---

## ⚙️ Protocol Configuration

### **LayerZero Network Details**

| Network | Chain ID | LayerZero EID | Endpoint Address |
|---------|----------|---------------|------------------|
| Base Sepolia | 84532 | 40245 | `0x6EDCE65403992e310A62460808c4b910D972f10f` |
| Optimism Sepolia | 11155420 | 40232 | `0x6EDCE65403992e310A62460808c4b910D972f10f` |

### **Protocol Configuration Status**

- [ ] **Minter Permissions**: Wrapper and RedemptionQueue added as SovaBTC OFT minters
- [ ] **Token Whitelist**: All test tokens added to whitelist
- [ ] **Redemption Queue**: Connected to wrapper contract
- [ ] **Staking Pool**: Initial SOVA staking pool created
- [ ] **Test Tokens**: Minted to deployer for testing

### **Cross-Chain Configuration Status**

- [ ] Base Sepolia → Optimism Sepolia peer configured
- [ ] Optimism Sepolia → Base Sepolia peer configured
- [ ] Cross-chain transfers tested successfully
- [ ] LayerZero explorer shows message delivery

---

## 🧪 Testing Checklist

### **Core Contract Functionality**
- [ ] SovaBTC OFT deployed on Base Sepolia
- [ ] SovaBTC OFT deployed on Optimism Sepolia  
- [ ] All supporting contracts deployed on both networks
- [ ] Contract verification successful on both networks
- [ ] Owner permissions configured correctly

### **Protocol Integration**
- [ ] Wrapper can mint sovaBTC tokens
- [ ] RedemptionQueue can burn sovaBTC tokens
- [ ] Token deposits work through wrapper
- [ ] Redemption queue processes redemptions
- [ ] Staking pools accept deposits
- [ ] Test tokens can be wrapped/unwrapped

### **Cross-Chain Functionality**
- [ ] LayerZero peers configured on both networks
- [ ] Cross-chain transfer Base → Optimism successful
- [ ] Cross-chain transfer Optimism → Base successful
- [ ] LayerZero explorer shows successful deliveries
- [ ] Token balances correct after cross-chain transfers

---

## 📱 Frontend Integration Configuration

After successful deployment, update your frontend configuration:

### **Base Sepolia Configuration**
```typescript
export const BASE_SEPOLIA_ADDRESSES = {
  SOVABTC_OFT: '[BASE_SEPOLIA_SOVABTC_OFT_ADDRESS]',
  SOVA_TOKEN: '[BASE_SEPOLIA_SOVA_TOKEN_ADDRESS]',
  TOKEN_WHITELIST: '[BASE_SEPOLIA_TOKEN_WHITELIST_ADDRESS]',
  CUSTODY_MANAGER: '[BASE_SEPOLIA_CUSTODY_MANAGER_ADDRESS]',
  WRAPPER: '[BASE_SEPOLIA_WRAPPER_ADDRESS]',
  REDEMPTION_QUEUE: '[BASE_SEPOLIA_REDEMPTION_QUEUE_ADDRESS]',
  STAKING: '[BASE_SEPOLIA_STAKING_ADDRESS]',
  MOCK_WBTC: '[BASE_SEPOLIA_MOCK_WBTC_ADDRESS]',
  MOCK_LBTC: '[BASE_SEPOLIA_MOCK_LBTC_ADDRESS]',
  MOCK_USDC: '[BASE_SEPOLIA_MOCK_USDC_ADDRESS]',
} as const;
```

### **Optimism Sepolia Configuration**
```typescript
export const OPTIMISM_SEPOLIA_ADDRESSES = {
  SOVABTC_OFT: '[OPTIMISM_SEPOLIA_SOVABTC_OFT_ADDRESS]',
  SOVA_TOKEN: '[OPTIMISM_SEPOLIA_SOVA_TOKEN_ADDRESS]',
  TOKEN_WHITELIST: '[OPTIMISM_SEPOLIA_TOKEN_WHITELIST_ADDRESS]',
  CUSTODY_MANAGER: '[OPTIMISM_SEPOLIA_CUSTODY_MANAGER_ADDRESS]',
  WRAPPER: '[OPTIMISM_SEPOLIA_WRAPPER_ADDRESS]',
  REDEMPTION_QUEUE: '[OPTIMISM_SEPOLIA_REDEMPTION_QUEUE_ADDRESS]',
  STAKING: '[OPTIMISM_SEPOLIA_STAKING_ADDRESS]',
  MOCK_WBTC: '[OPTIMISM_SEPOLIA_MOCK_WBTC_ADDRESS]',
  MOCK_LBTC: '[OPTIMISM_SEPOLIA_MOCK_LBTC_ADDRESS]',
  MOCK_USDC: '[OPTIMISM_SEPOLIA_MOCK_USDC_ADDRESS]',
} as const;
```

---

## 🔍 Contract Verification Commands

### **Base Sepolia Verification**
```bash
# If auto-verification failed, manually verify contracts
forge verify-contract [CONTRACT_ADDRESS] src/SovaBTCOFT.sol:SovaBTCOFT \
    --chain-id 84532 \
    --etherscan-api-key $BASESCAN_API_KEY \
    --constructor-args $(cast abi-encode "constructor(string,string,address,address)" "Sova Bitcoin" "sovaBTC" "0x6EDCE65403992e310A62460808c4b910D972f10f" "[YOUR_DEPLOYER_ADDRESS]")
```

### **Optimism Sepolia Verification**
```bash
# If auto-verification failed, manually verify contracts
forge verify-contract [CONTRACT_ADDRESS] src/SovaBTCOFT.sol:SovaBTCOFT \
    --chain-id 11155420 \
    --etherscan-api-key $OPTIMISM_ETHERSCAN_API_KEY \
    --constructor-args $(cast abi-encode "constructor(string,string,address,address)" "Sova Bitcoin" "sovaBTC" "0x6EDCE65403992e310A62460808c4b910D972f10f" "[YOUR_DEPLOYER_ADDRESS]")
```

---

## 🚨 Important Notes

### **Critical Success Factors**
1. **Complete Output Recording**: Save all deployment outputs to fill in addresses
2. **Environment Variables**: Set OFT addresses before peer configuration
3. **Sequential Deployment**: Deploy on both networks before configuring peers
4. **Gas Management**: Monitor gas usage and have sufficient ETH reserves
5. **Contract Verification**: Verify all contracts for transparency

### **Common Issues & Solutions**
- **Out of Gas**: Increase gas limit or reduce contract size
- **Verification Failures**: Use manual verification commands above
- **Peer Configuration Errors**: Ensure correct addresses in environment variables
- **Cross-Chain Test Failures**: Verify LayerZero endpoints and peer configuration

---

## 📝 Deployment Log

### **Base Sepolia Deployment**
**Date**: `[FILL IN]`  
**Transaction Hash**: `[FILL IN]`  
**Gas Used**: `[FILL IN]`  
**ETH Cost**: `[FILL IN]`  
**Issues**: `[FILL IN ANY ISSUES]`

### **Optimism Sepolia Deployment**
**Date**: `[FILL IN]`  
**Transaction Hash**: `[FILL IN]`  
**Gas Used**: `[FILL IN]`  
**ETH Cost**: `[FILL IN]`  
**Issues**: `[FILL IN ANY ISSUES]`

### **Peer Configuration**
**Date**: `[FILL IN]`  
**Base Sepolia Config**: `[SUCCESS/FAILURE]`  
**Optimism Sepolia Config**: `[SUCCESS/FAILURE]`  
**Cross-Chain Test**: `[SUCCESS/FAILURE]`

---

## ✅ Completion Checklist

### **Phase 1: Deployment**
- [ ] Base Sepolia complete protocol deployment
- [ ] Optimism Sepolia complete protocol deployment  
- [ ] All contracts verified on block explorers
- [ ] Contract addresses recorded

### **Phase 2: Configuration**
- [ ] LayerZero peers configured on Base Sepolia
- [ ] LayerZero peers configured on Optimism Sepolia
- [ ] Cross-chain transfers tested successfully
- [ ] Protocol functionality verified

### **Phase 3: Integration**
- [ ] Frontend configuration updated
- [ ] Documentation updated with new addresses
- [ ] Test tokens available for development
- [ ] Staking pools operational

**✅ DEPLOYMENT COMPLETE**: `[CHECK WHEN DONE]`

---

## 🎉 What You've Achieved

With this deployment, you now have:

✅ **Complete Protocol Suite** - All contracts deployed fresh  
✅ **Real LayerZero OFT** - Actual cross-chain functionality  
✅ **Dual Network Support** - Base Sepolia + Optimism Sepolia  
✅ **Test Infrastructure** - Mock tokens and testing tools  
✅ **Staking System** - SOVA rewards and staking pools  
✅ **Production Ready** - Verified contracts and full functionality  

**Your protocol is now ready for frontend integration and user testing!** 