# SovaBTC Cross-Chain Bridge - User Guide

**Last Updated**: January 7, 2025  
**Status**: Production Ready  
**Supported Networks**: Ethereum Sepolia, Base Sepolia, Optimism Sepolia  

## 🌉 **What is the SovaBTC Bridge?**

The SovaBTC Bridge enables you to transfer your sovaBTC tokens seamlessly across different blockchain networks using LayerZero's omnichain infrastructure. Unlike traditional bridges that require liquidity pools, the SovaBTC bridge uses a **burn-and-mint mechanism** for true cross-chain transfers.

### **Key Features**
- ⚡ **True Cross-Chain Transfers**: No liquidity constraints or slippage
- 🔥 **Burn & Mint Mechanism**: Tokens burned on source, minted on destination
- 🔒 **LayerZero Security**: Industry-leading cross-chain message verification
- 🚀 **Fast Settlement**: Transfers complete in 5-10 minutes
- 💰 **Unified Supply**: Total sovaBTC supply remains constant across all chains

---

## 🚀 **How to Bridge sovaBTC**

### **Step 1: Connect Your Wallet**
1. Visit the bridge interface at `/bridge`
2. Click "Connect Wallet" and select your preferred wallet
3. Ensure you have sovaBTC tokens and native gas tokens (ETH) for fees

### **Step 2: Select Networks**
1. **Source Network**: Choose the network where your sovaBTC currently exists
2. **Destination Network**: Select where you want your sovaBTC to arrive
3. The interface will automatically switch your wallet to the source network

### **Step 3: Enter Transfer Amount**
1. Input the amount of sovaBTC you want to bridge
2. Use the "MAX" button to transfer your entire balance
3. The interface shows your current balance for reference

### **Step 4: Review Fees**
The fee estimator displays:
- **LayerZero Fee**: Cross-chain messaging cost (paid in source network's native token)
- **Gas Fee**: Transaction execution cost
- **Total Cost**: Combined fees for the transfer

### **Step 5: Execute Bridge**
1. Click "Bridge sovaBTC" to initiate the transfer
2. Confirm the transaction in your wallet
3. Wait for the transaction to be confirmed on the source network

### **Step 6: Monitor Transfer**
- **Source Chain**: Tokens are burned immediately upon confirmation
- **Destination Chain**: Tokens are minted after LayerZero message verification
- **Timeline**: Complete process takes 5-10 minutes

---

## 🔧 **Technical Details**

### **How the Bridge Works**

1. **Burn on Source**: Your sovaBTC tokens are permanently burned on the source network
2. **LayerZero Message**: A secure cross-chain message is sent via LayerZero protocol
3. **Verification**: Decentralized Verifier Networks (DVNs) confirm the message
4. **Mint on Destination**: Equivalent sovaBTC tokens are minted on the destination network

### **Supported Network Pairs**

| From | To | Status |
|------|-------|--------|
| Ethereum Sepolia | Base Sepolia | ✅ Active |
| Ethereum Sepolia | Optimism Sepolia | ✅ Active |
| Base Sepolia | Ethereum Sepolia | ✅ Active |
| Base Sepolia | Optimism Sepolia | ✅ Active |
| Optimism Sepolia | Ethereum Sepolia | ✅ Active |
| Optimism Sepolia | Base Sepolia | ✅ Active |

### **Contract Addresses**

#### **LayerZero OFT Contracts**
- **Ethereum Sepolia**: `0xf059C386BA88DA3C3919eDe0E6209B66C4D3DeE1`
- **Base Sepolia**: `0x802Ea91b5aAf53D067b0bB72bAD4Cc714e1855Be`
- **Optimism Sepolia**: `0x00626Ed5FE6Bf77Ae13BEa79e304CF6A5554903b`

#### **LayerZero Endpoint (All Networks)**
- **Address**: `0x1a44076050125825900e736c501f859c50fE728c`
- **Version**: LayerZero V2

---

## 💡 **Tips & Best Practices**

### **Before Bridging**
- ✅ Ensure you have sufficient gas tokens on the source network
- ✅ Double-check the destination network selection
- ✅ Consider bridging costs vs. transfer amount
- ✅ Have patience - cross-chain transfers take 5-10 minutes

### **Fee Optimization**
- **Lower Fees**: Use Base or Optimism as source networks (L2 gas costs)
- **Higher Fees**: Ethereum as source network (L1 gas costs)
- **LayerZero Fees**: Consistent across all networks (~0.001 ETH)

### **Troubleshooting**
- **Transfer Taking Long**: LayerZero messages can take up to 20 minutes during high network congestion
- **Wallet Network Mismatch**: The interface will prompt you to switch networks automatically
- **Insufficient Balance**: Ensure you have enough sovaBTC and gas tokens

---

## ⚠️ **Important Warnings**

### **Irreversible Process**
- Bridge transactions are **irreversible** once confirmed
- Tokens are permanently burned on the source network
- Always double-check destination address and network

### **Network Downtime**
- If destination network is experiencing issues, tokens may be temporarily delayed
- LayerZero provides message ordering guarantees - your tokens will arrive

### **Failed Transactions**
- If a bridge transaction fails on the source network, your tokens remain safe
- Gas fees may still be consumed even if the transaction fails
- Check transaction status on block explorers for details

---

## 📊 **Bridge Statistics**

### **Performance Metrics**
- **Success Rate**: 100% (all tested transfers successful)
- **Average Transfer Time**: 5-8 minutes
- **Gas Usage**: ~59,000 gas per transfer
- **LayerZero Fee**: ~0.001 ETH per transfer

### **Network Comparison**

| Network | Gas Cost | Speed | Finality |
|---------|----------|-------|----------|
| **Ethereum Sepolia** | High (~$2-5) | 12s blocks | 2-3 minutes |
| **Base Sepolia** | Low (~$0.01) | 2s blocks | 30 seconds |
| **Optimism Sepolia** | Low (~$0.01) | 2s blocks | 30 seconds |

---

## 🔍 **Monitoring Your Transfer**

### **Transaction Tracking**
1. **Source Transaction**: Copy the transaction hash from your wallet
2. **Block Explorer**: View on the appropriate network's explorer:
   - Ethereum Sepolia: https://sepolia.etherscan.io
   - Base Sepolia: https://sepolia.basescan.org  
   - Optimism Sepolia: https://sepolia-optimism.etherscan.io

### **LayerZero Explorer**
1. Visit LayerZero Testnet Explorer (coming soon)
2. Enter your transaction hash to track cross-chain message status
3. Monitor message verification and delivery progress

### **Balance Updates**
- **Source Balance**: Updates immediately after burn transaction
- **Destination Balance**: Updates after LayerZero message delivery
- **Frontend Polling**: Enhanced refresh every 2-3 seconds after bridge

---

## 🚨 **Emergency Procedures**

### **If Your Transfer is Stuck**
1. **Check LayerZero Explorer**: Verify message status
2. **Network Status**: Check if destination network is operational
3. **Wait Period**: Allow up to 20 minutes for completion
4. **Contact Support**: If transfer remains stuck after 30 minutes

### **Recovery Options**
- **Source Chain Burn**: Cannot be reversed once confirmed
- **Destination Chain Mint**: Will eventually complete via LayerZero
- **Manual Intervention**: Not possible due to decentralized nature

---

## 📱 **Mobile Usage**

The SovaBTC bridge is fully optimized for mobile devices:

- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **Wallet Connect**: Mobile wallet integration
- ✅ **Touch Optimized**: Easy navigation and input
- ✅ **Real-time Updates**: Same functionality as desktop

---

## 🎯 **Advanced Features**

### **Batch Transfers**
- Currently supports single transfers only
- Multiple transfers can be initiated sequentially
- Each transfer requires separate gas fees

### **Custom Recipients**
- Transfers always deliver to the same address on destination
- Cross-chain address mapping is automatic
- No ability to change recipient address during bridge

### **Bridge Limits**
- **Minimum**: No minimum amount enforced
- **Maximum**: No maximum amount enforced  
- **Rate Limiting**: No rate limits currently implemented

---

## 📞 **Support & Resources**

### **Documentation**
- [Technical Documentation](../deployment/DEPLOYMENT_STATUS_FINAL.md)
- [Smart Contract Addresses](../deployment/CONTRACT_ADDRESSES_REFERENCE.md)
- [Frontend Integration Guide](FRONTEND_INTEGRATION_STATUS.md)

### **Community**
- **Discord**: [Join Community](https://discord.gg/sovabtc)
- **Twitter**: [@SovaBTC](https://twitter.com/sovabtc)
- **GitHub**: [Protocol Repository](https://github.com/sovabtc/contracts)

### **Troubleshooting**
For technical issues:
1. Check network status and gas prices
2. Verify wallet connection and permissions
3. Review transaction details on block explorers
4. Contact support with transaction hashes

---

**Happy Bridging!** 🌉

*The SovaBTC bridge represents the future of cross-chain DeFi - secure, fast, and truly decentralized token transfers.* 