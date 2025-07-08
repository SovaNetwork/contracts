# SovaBTC Wrap Issue Debug Guide

**Date**: January 7, 2025  
**Issue**: Wrap failing with "Insufficient allowance" and wrong amounts/addresses

## 🔍 **DEBUG CHECKLIST**

### **1. Network State Verification**

First, let's verify which network you're actually on:

```bash
# Check current network in MetaMask
# Compare with frontend display

# Test contract existence on both networks
cast code 0x30cc05366cc687c0ab75e3908Fe2b2C5BB679db8 --rpc-url https://sepolia.base.org | head -1
cast code 0xd2A7029baCCd24799ba497174859580Cd25e4E7F --rpc-url https://sepolia.optimism.io | head -1
```

### **2. Amount Conversion Testing**

Test the parseTokenAmount function:

```javascript
// In browser console, test amount parsing:
import { parseUnits } from 'viem';

console.log('5 WBTC (8 decimals):', parseUnits('5', 8).toString());
// Expected: 500000000 (5 * 10^8)

console.log('Your error amount:', BigInt('0x2540be400').toString());
// Shows: 10000000000 (100 WBTC)

console.log('Difference:', BigInt('0x2540be400') / parseUnits('5', 8));
// Should show the multiplier error
```

### **3. Frontend State Inspection**

Open browser DevTools and check:

```javascript
// Check active network state
console.log('Active Chain ID:', window.wagmi?.state?.chainId);
console.log('Connected Chain:', window.ethereum?.chainId);

// Check contract addresses being used
// Look for useActiveNetwork hook state in React DevTools
```

### **4. Step-by-Step Test Protocol**

#### **Test 1: Network Detection**
1. Open wrap interface
2. Check top-right network indicator  
3. Open browser console
4. Look for logs showing:
   - `activeChainId`
   - `wrapperAddress` 
   - `tokenAddress`

#### **Test 2: Amount Parsing**
1. Input "5" in amount field
2. Check browser console for logs:
   - `userInput: "5"`
   - `parsedAmount: "500000000"` (should be 5 * 10^8)
   - `contractCall amount` (should match parsed)

#### **Test 3: Contract Address Resolution**
1. Switch to OP Sepolia
2. Check logs for wrapper address
3. Should show: `0xd2A7029baCCd24799ba497174859580Cd25e4E7F`
4. NOT: `0x30cc05366cc687c0ab75e3908Fe2b2C5BB679db8`

## 🔧 **FIXES TO APPLY**

### **Fix 1: Force Network State Refresh**

Add this debug code to the wrap interface:

```typescript
// Add to WrapInterface.tsx after useActiveNetwork call
useEffect(() => {
  console.log('🌐 NETWORK DEBUG:', {
    activeChainId,
    wrapperAddress,
    selectedTokenAddress: selectedToken?.address,
    userConnectedChain: walletChainId,
    networkMismatch: isNetworkMismatch
  });
}, [activeChainId, wrapperAddress, selectedToken, walletChainId, isNetworkMismatch]);
```

### **Fix 2: Force Amount Logging**

Update amount parsing with detailed logging:

```typescript
const amountWei = useMemo(() => {
  if (!amount || !selectedToken) return 0n;
  
  console.log('🔄 PARSING AMOUNT:', {
    userInput: amount,
    tokenSymbol: selectedToken.symbol,
    tokenDecimals: selectedToken.decimals,
    tokenAddress: selectedToken.address
  });
  
  const parsed = parseTokenAmount(amount, selectedToken.decimals);
  
  console.log('✅ PARSED RESULT:', {
    input: amount,
    expectedWei: `${amount} * 10^${selectedToken.decimals}`,
    actualWei: parsed.toString(),
    verification: parsed.toString() === (BigInt(amount.replace('.', '')) * (10n ** BigInt(selectedToken.decimals - amount.split('.')[1]?.length || 0))).toString()
  });
  
  return parsed;
}, [amount, selectedToken]);
```

### **Fix 3: Force Contract Address Validation**

Add contract address validation:

```typescript
const handleWrap = async () => {
  console.log('🚀 WRAP EXECUTION DEBUG:', {
    network: activeChainId,
    expectedWrapperForNetwork: getContractAddress('wrapper'),
    selectedTokenAddress: selectedToken?.address,
    userAmount: amount,
    parsedAmount: amountWei.toString(),
    needsApproval,
    currentAllowance: currentAllowance?.toString()
  });
  
  // Validate we're using correct addresses
  const expectedWrapper = getContractAddress('wrapper');
  console.log('🎯 ADDRESS VALIDATION:', {
    expectedWrapperForCurrentNetwork: expectedWrapper,
    isCorrectNetwork: expectedWrapper && expectedWrapper.toLowerCase() !== '0x30cc05366cc687c0ab75e3908fe2b2c5bb679db8'.toLowerCase()
  });
  
  // Continue with existing wrap logic...
};
```

## 🧪 **MANUAL TESTING STEPS**

### **Test A: Clear All Cache**
1. Close browser completely
2. Reopen and go to wrap page
3. Connect wallet fresh
4. Switch to OP Sepolia explicitly
5. Try small amount first (0.1 WBTC)

### **Test B: Direct Contract Validation**
```bash
# Check if you're really on OP Sepolia
cast call 0xd2A7029baCCd24799ba497174859580Cd25e4E7F "minDepositSatoshi()" --rpc-url https://sepolia.optimism.io

# Check your WBTC balance on OP Sepolia  
cast call 0x412Bd95e843b7982702F12b8De0a5d414B482653 "balanceOf(address)" YOUR_ADDRESS --rpc-url https://sepolia.optimism.io

# Check your allowance to OP Sepolia wrapper
cast call 0x412Bd95e843b7982702F12b8De0a5d414B482653 "allowance(address,address)" YOUR_ADDRESS 0xd2A7029baCCd24799ba497174859580Cd25e4E7F --rpc-url https://sepolia.optimism.io
```

### **Test C: Amount Conversion Verification**
```bash
# Test amount conversion manually
node -e "
const { parseUnits } = require('viem');
console.log('5 WBTC in wei:', parseUnits('5', 8).toString());
console.log('Your error amount:', BigInt('0x2540be400').toString());
console.log('Ratio:', BigInt('0x2540be400') / parseUnits('5', 8));
"
```

## ❌ **KNOWN BAD STATES**

If you see these in logs, it's wrong:

```javascript
// BAD - Wrong wrapper for OP Sepolia
wrapperAddress: '0x30cc05366cc687c0ab75e3908Fe2b2C5BB679db8'

// BAD - Wrong amount for 5 WBTC
parsedAmount: '10000000000' 

// BAD - Wrong token address for OP Sepolia
tokenAddress: '0x0a3745b48f350949Ef5D024A01eE143741EA2CE0'
```

## ✅ **CORRECT VALUES FOR OP SEPOLIA**

```javascript
// GOOD - Correct wrapper for OP Sepolia  
wrapperAddress: '0xd2A7029baCCd24799ba497174859580Cd25e4E7F'

// GOOD - Correct amount for 5 WBTC (8 decimals)
parsedAmount: '500000000'

// GOOD - Correct WBTC address for OP Sepolia
tokenAddress: '0x412Bd95e843b7982702F12b8De0a5d414B482653'
```

## 🎯 **IMMEDIATE ACTION PLAN**

1. **Apply Fix 1, 2, 3** above to get detailed logging
2. **Clear browser cache completely**
3. **Test with small amount first** (0.1 WBTC)
4. **Check logs for network/amount/address mismatches**
5. **Report back with exact log output**

This will help us identify if it's:
- A network detection bug  
- An amount conversion bug
- A contract address caching issue
- Or a combination of all three 