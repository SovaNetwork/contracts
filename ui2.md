# SovaBTC Web3 Integration Implementation Guide

## Overview
This guide focuses on implementing the actual Web3 functionality to make the SovaBTC frontend interact with real smart contracts. We'll add contract interactions, transaction handling, real-time data fetching, and proper error handling.

## Prerequisites
- Frontend UI structure already built
- SovaBTC contracts deployed on Base Sepolia (using clean deployment script)
- Contract addresses and ABIs available
- No legacy TokenWrapper - using SovaBTCWrapper only

IMPORTANT - ALL UI CODE is in /ui/sovabtc-front

---

## Phase 1: Contract Integration Foundation

### Task 1: Contract ABIs and Configuration Setup
**Goal**: Set up contract ABIs, addresses, and type-safe contract interactions

**Files to Create/Modify**:
```
src/
├── contracts/
│   ├── abis/
│   │   ├── SovaBTC.json
│   │   ├── SovaBTCWrapper.json
│   │   ├── TokenWhitelist.json
│   │   ├── RedemptionQueue.json
│   │   ├── SovaBTCStaking.json
│   │   ├── SOVAToken.json
│   │   ├── CustodyManager.json
│   │   └── ERC20.json
│   ├── addresses.ts
│   ├── utils.ts
│   └── types.ts
├── config/
│   ├── contracts.ts
│   └── chains.ts
└── lib/
    └── contract-utils.ts
```

**Implementation Steps**:

1. **Export Contract ABIs**:
```typescript
// contracts/abis/SovaBTC.json
// Copy the full ABI from your deployed contract
export const SOVABTC_ABI = [
  // ... full ABI array
] as const;
```

2. **Contract Addresses Configuration**:
```typescript
// contracts/addresses.ts
import { baseSepolia } from 'viem/chains';

export const CONTRACT_ADDRESSES = {
  [baseSepolia.id]: {
    SOVABTC: '0x...' as `0x${string}`,
    SOVA_TOKEN: '0x...' as `0x${string}`,
    WRAPPER: '0x...' as `0x${string}`, // SovaBTCWrapper
    TOKEN_WHITELIST: '0x...' as `0x${string}`,
    CUSTODY_MANAGER: '0x...' as `0x${string}`,
    REDEMPTION_QUEUE: '0x...' as `0x${string}`,
    STAKING: '0x...' as `0x${string}`,
    // Test tokens
    WBTC_TEST: '0x...' as `0x${string}`,
    LBTC_TEST: '0x...' as `0x${string}`,
    USDC_TEST: '0x...' as `0x${string}`,
  },
} as const;
```

3. **Type-Safe Contract Configuration**:
```typescript
// config/contracts.ts
import { getContract } from 'viem';
import { usePublicClient, useWalletClient } from 'wagmi';
import { SOVABTC_ABI } from '@/contracts/abis/SovaBTC.json';
import { SOVABTC_WRAPPER_ABI } from '@/contracts/abis/SovaBTCWrapper.json';
import { CONTRACT_ADDRESSES } from '@/contracts/addresses';

export function useContracts(chainId: number) {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];

  return {
    sovaBTC: getContract({
      address: addresses.SOVABTC,
      abi: SOVABTC_ABI,
      client: { public: publicClient, wallet: walletClient },
    }),
    wrapper: getContract({
      address: addresses.WRAPPER,
      abi: SOVABTC_WRAPPER_ABI,
      client: { public: publicClient, wallet: walletClient },
    }),
    // ... other contracts
  };
}
```

**Acceptance Criteria**:
- ✅ All contract ABIs properly imported and typed
- ✅ Contract addresses configured for all supported chains
- ✅ Type-safe contract hooks created
- ✅ Environment variables for contract addresses set up
- ✅ Contract utility functions created

---

### Task 2: Real Token Balance and Allowance Fetching
**Goal**: Implement real ERC-20 token balance and allowance reading

**Files to Create/Modify**:
```
src/
├── hooks/
│   ├── use-token-balance.ts
│   ├── use-token-allowance.ts
│   ├── use-token-info.ts
│   └── use-multi-chain-balances.ts
└── lib/
    └── token-utils.ts
```

**Implementation Steps**:

1. **Token Balance Hook**:
```typescript
// hooks/use-token-balance.ts
import { useReadContract, useAccount, useChainId } from 'wagmi';
import { ERC20_ABI } from '@/contracts/abis/ERC20.json';
import { formatUnits } from 'viem';

export function useTokenBalance(tokenAddress: `0x${string}`) {
  const { address } = useAccount();
  const chainId = useChainId();

  const { data: balance, isLoading, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address && !!tokenAddress,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });

  const formattedBalance = balance && decimals 
    ? formatUnits(balance, decimals)
    : '0';

  return {
    balance: balance || 0n,
    formattedBalance,
    decimals: decimals || 18,
    isLoading,
    error,
    refetch,
  };
}
```

2. **Token Allowance Hook**:
```typescript
// hooks/use-token-allowance.ts
import { useReadContract, useAccount } from 'wagmi';
import { ERC20_ABI } from '@/contracts/abis/ERC20.json';

export function useTokenAllowance(
  tokenAddress: `0x${string}`,
  spenderAddress: `0x${string}`
) {
  const { address } = useAccount();

  const { data: allowance, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address!, spenderAddress],
    query: {
      enabled: !!address && !!tokenAddress && !!spenderAddress,
      refetchInterval: 10000,
    },
  });

  return {
    allowance: allowance || 0n,
    hasAllowance: (allowance || 0n) > 0n,
    isLoading,
    refetch,
  };
}
```

3. **Multi-Chain Balance Aggregation**:
```typescript
// hooks/use-multi-chain-balances.ts
import { useAccount } from 'wagmi';
import { baseSepolia, sepolia } from 'viem/chains';
import { useTokenBalance } from './use-token-balance';
import { CONTRACT_ADDRESSES } from '@/contracts/addresses';

export function useMultiChainSovaBTCBalances() {
  const { address } = useAccount();
  
  const baseBalance = useTokenBalance(CONTRACT_ADDRESSES[baseSepolia.id].SOVABTC);
  const sepoliaBalance = useTokenBalance(CONTRACT_ADDRESSES[sepolia.id].SOVABTC);

  const totalBalance = BigInt(baseBalance.balance) + BigInt(sepoliaBalance.balance);

  return {
    balances: {
      [baseSepolia.id]: baseBalance,
      [sepolia.id]: sepoliaBalance,
    },
    totalBalance,
    totalFormatted: formatUnits(totalBalance, 8), // SovaBTC has 8 decimals
    isLoading: baseBalance.isLoading || sepoliaBalance.isLoading,
  };
}
```

**Acceptance Criteria**:
- ✅ Real token balances displayed from contracts
- ✅ Allowances properly checked before transactions
- ✅ Multi-chain balance aggregation working
- ✅ Auto-refresh balances every 5-10 seconds
- ✅ Loading and error states handled

---

## Phase 2: Transaction Implementation

### Task 3: Token Approval and Deposit Transactions
**Goal**: Implement real ERC-20 approvals and wrapper contract deposits

**Files to Create/Modify**:
```
src/
├── hooks/
│   ├── use-token-approval.ts
│   ├── use-wrapper-deposit.ts
│   └── use-transaction-status.ts
├── components/
│   ├── transactions/
│   │   ├── approval-button.tsx
│   │   ├── deposit-button.tsx
│   │   └── transaction-modal.tsx
└── lib/
    └── transaction-utils.ts
```

**Implementation Steps**:

1. **Token Approval Hook**:
```typescript
// hooks/use-token-approval.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ERC20_ABI } from '@/contracts/abis/ERC20.json';
import { parseUnits } from 'viem';

export function useTokenApproval() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (
    tokenAddress: `0x${string}`,
    spenderAddress: `0x${string}`,
    amount: string,
    decimals: number
  ) => {
    const parsedAmount = parseUnits(amount, decimals);
    
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spenderAddress, parsedAmount],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
```

2. **Wrapper Deposit Hook**:
```typescript
// hooks/use-wrapper-deposit.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { SOVABTC_WRAPPER_ABI } from '@/contracts/abis/SovaBTCWrapper.json';
import { parseUnits } from 'viem';
import { useContracts } from '@/config/contracts';

export function useWrapperDeposit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = async (
    tokenAddress: `0x${string}`,
    amount: string,
    tokenDecimals: number,
    wrapperAddress: `0x${string}`
  ) => {
    const parsedAmount = parseUnits(amount, tokenDecimals);
    
    writeContract({
      address: wrapperAddress,
      abi: SOVABTC_WRAPPER_ABI,
      functionName: 'deposit',
      args: [tokenAddress, parsedAmount],
    });
  };

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
```

3. **Integrated Deposit Component**:
```typescript
// components/wrap/deposit-form.tsx
'use client';

import { useState } from 'react';
import { useTokenBalance } from '@/hooks/use-token-balance';
import { useTokenAllowance } from '@/hooks/use-token-allowance';
import { useTokenApproval } from '@/hooks/use-token-approval';
import { useWrapperDeposit } from '@/hooks/use-wrapper-deposit';
import { Button } from '@/components/ui/button';
import { parseUnits, formatUnits } from 'viem';

export function DepositForm() {
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  
  const tokenBalance = useTokenBalance(selectedToken as `0x${string}`);
  const tokenAllowance = useTokenAllowance(
    selectedToken as `0x${string}`,
    WRAPPER_ADDRESS
  );
  
  const approval = useTokenApproval();
  const deposit = useWrapperDeposit();

  const needsApproval = amount && tokenAllowance.allowance < parseUnits(amount, tokenBalance.decimals);

  const handleApprove = async () => {
    if (!selectedToken || !amount) return;
    
    await approval.approve(
      selectedToken as `0x${string}`,
      WRAPPER_ADDRESS,
      amount,
      tokenBalance.decimals
    );
  };

  const handleDeposit = async () => {
    if (!selectedToken || !amount) return;
    
    await deposit.deposit(
      selectedToken as `0x${string}`,
      amount,
      tokenBalance.decimals,
      WRAPPER_ADDRESS
    );
  };

  return (
    <div className="space-y-4">
      {/* Token selector and amount input */}
      
      <div className="space-y-2">
        {needsApproval ? (
          <Button 
            onClick={handleApprove}
            disabled={approval.isPending || approval.isConfirming}
            className="w-full"
          >
            {approval.isPending || approval.isConfirming 
              ? 'Approving...' 
              : `Approve ${selectedTokenSymbol}`
            }
          </Button>
        ) : (
          <Button
            onClick={handleDeposit}
            disabled={deposit.isPending || deposit.isConfirming || !amount}
            className="w-full"
          >
            {deposit.isPending || deposit.isConfirming 
              ? 'Depositing...' 
              : 'Deposit'
            }
          </Button>
        )}
      </div>

      {/* Transaction status display */}
      {(approval.hash || deposit.hash) && (
        <TransactionStatus 
          hash={approval.hash || deposit.hash}
          type={approval.hash ? 'approval' : 'deposit'}
        />
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- ✅ Real ERC-20 token approvals working
- ✅ Wrapper contract deposit transactions executing
- ✅ Two-step flow (approve → deposit) implemented
- ✅ Transaction status tracking with confirmations
- ✅ Error handling for failed transactions
- ✅ Balance updates after successful transactions

---

### Task 4: Redemption Queue Integration
**Goal**: Implement real redemption request and fulfillment functionality

**Files to Create/Modify**:
```
src/
├── hooks/
│   ├── use-redemption-request.ts
│   ├── use-redemption-status.ts
│   ├── use-fulfillment.ts
│   └── use-redemption-queue.ts
└── components/
    └── redeem/
        ├── redemption-form.tsx
        ├── queue-status.tsx
        └── fulfill-button.tsx
```

**Implementation Steps**:

1. **Redemption Request Hook**:
```typescript
// hooks/use-redemption-request.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { REDEMPTION_QUEUE_ABI } from '@/contracts/abis/RedemptionQueue.json';
import { parseUnits } from 'viem';

export function useRedemptionRequest() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const requestRedemption = async (
    tokenAddress: `0x${string}`,
    sovaAmount: string,
    queueAddress: `0x${string}`
  ) => {
    const parsedAmount = parseUnits(sovaAmount, 8); // SovaBTC has 8 decimals
    
    writeContract({
      address: queueAddress,
      abi: REDEMPTION_QUEUE_ABI,
      functionName: 'redeem',
      args: [tokenAddress, parsedAmount],
    });
  };

  return {
    requestRedemption,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
```

2. **Redemption Status Hook**:
```typescript
// hooks/use-redemption-status.ts
import { useReadContract, useAccount } from 'wagmi';
import { REDEMPTION_QUEUE_ABI } from '@/contracts/abis/RedemptionQueue.json';

export function useRedemptionStatus(queueAddress: `0x${string}`) {
  const { address } = useAccount();

  const { data: redemptionRequest, isLoading, refetch } = useReadContract({
    address: queueAddress,
    abi: REDEMPTION_QUEUE_ABI,
    functionName: 'pendingRedemptions',
    args: [address!],
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });

  const { data: redemptionDelay } = useReadContract({
    address: queueAddress,
    abi: REDEMPTION_QUEUE_ABI,
    functionName: 'redemptionDelay',
  });

  const isReady = redemptionRequest && redemptionDelay
    ? Date.now() / 1000 >= Number(redemptionRequest.requestTime) + Number(redemptionDelay)
    : false;

  const timeRemaining = redemptionRequest && redemptionDelay
    ? Math.max(0, (Number(redemptionRequest.requestTime) + Number(redemptionDelay)) - Date.now() / 1000)
    : 0;

  return {
    redemptionRequest,
    redemptionDelay: Number(redemptionDelay || 0),
    isReady,
    timeRemaining,
    isLoading,
    refetch,
  };
}
```

3. **Fulfillment Hook**:
```typescript
// hooks/use-fulfillment.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { REDEMPTION_QUEUE_ABI } from '@/contracts/abis/RedemptionQueue.json';

export function useFulfillment() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const fulfillRedemption = async (
    userAddress: `0x${string}`,
    queueAddress: `0x${string}`
  ) => {
    writeContract({
      address: queueAddress,
      abi: REDEMPTION_QUEUE_ABI,
      functionName: 'fulfillRedemption',
      args: [userAddress],
    });
  };

  return {
    fulfillRedemption,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
```

**Acceptance Criteria**:
- ✅ Real redemption requests submitted to queue contract
- ✅ Queue status and countdown timers working
- ✅ Fulfillment transactions executing when ready
- ✅ Real-time status updates for pending redemptions
- ✅ Error handling for queue-related failures

---

### Task 5: LayerZero Cross-Chain Bridge Integration
**Goal**: Implement real LayerZero OFT bridging functionality (when cross-chain is needed)

**Note**: This task can be skipped initially since we're focusing on Base Sepolia deployment. Implement when you need cross-chain functionality.

**Files to Create/Modify**:
```
src/
├── hooks/
│   ├── use-bridge-quote.ts
│   ├── use-bridge-send.ts
│   ├── use-bridge-status.ts
│   └── use-layerzero-config.ts
├── lib/
│   └── layerzero-utils.ts
└── components/
    └── bridge/
        ├── bridge-form.tsx
        ├── fee-display.tsx
        └── bridge-tracker.tsx
```

**Acceptance Criteria**:
- ✅ Real LayerZero fee quotes from contracts (when OFT deployed)
- ✅ Cross-chain token transfers executing
- ✅ Bridge transaction status tracking
- ✅ Proper LayerZero chain ID mapping
- ✅ Error handling for bridge failures

**Implementation Notes**:
This can be implemented later when you deploy SovaBTCOFT contracts for cross-chain functionality.

---

### Task 6: Staking Implementation
**Goal**: Implement real staking contract interactions

**Files to Create/Modify**:
```
src/
├── hooks/
│   ├── use-staking-pools.ts
│   ├── use-stake.ts
│   ├── use-unstake.ts
│   ├── use-claim-rewards.ts
│   └── use-staking-stats.ts
└── components/
    └── staking/
        ├── stake-form.tsx
        ├── rewards-display.tsx
        └── pool-stats.tsx
```

**Implementation Steps**:

1. **Staking Pool Data Hook**:
```typescript
// hooks/use-staking-pools.ts
import { useReadContract, useAccount } from 'wagmi';
import { STAKING_ABI } from '@/contracts/abis/SovaBTCStaking.json';

export function useStakingPools(stakingAddress: `0x${string}`) {
  const { address } = useAccount();

  const { data: stakedAmount } = useReadContract({
    address: stakingAddress,
    abi: STAKING_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address, refetchInterval: 10000 },
  });

  const { data: earnedRewards } = useReadContract({
    address: stakingAddress,
    abi: STAKING_ABI,
    functionName: 'earned',
    args: [address!],
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const { data: rewardRate } = useReadContract({
    address: stakingAddress,
    abi: STAKING_ABI,
    functionName: 'rewardRate',
  });

  const { data: totalSupply } = useReadContract({
    address: stakingAddress,
    abi: STAKING_ABI,
    functionName: 'totalSupply',
  });

  // Calculate APY based on reward rate and total supply
  const apy = rewardRate && totalSupply && totalSupply > 0n
    ? (Number(rewardRate) * 365 * 24 * 3600 * 100) / Number(totalSupply)
    : 0;

  return {
    stakedAmount: stakedAmount || 0n,
    earnedRewards: earnedRewards || 0n,
    rewardRate: rewardRate || 0n,
    totalSupply: totalSupply || 0n,
    apy,
  };
}
```

2. **Stake Hook**:
```typescript
// hooks/use-stake.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { STAKING_ABI } from '@/contracts/abis/SovaBTCStaking.json';
import { parseUnits } from 'viem';

export function useStake() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const stake = async (
    stakingAddress: `0x${string}`,
    amount: string
  ) => {
    const parsedAmount = parseUnits(amount, 8); // SovaBTC decimals
    
    writeContract({
      address: stakingAddress,
      abi: STAKING_ABI,
      functionName: 'stake',
      args: [parsedAmount],
    });
  };

  return {
    stake,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
```

3. **Claim Rewards Hook**:
```typescript
// hooks/use-claim-rewards.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { STAKING_ABI } from '@/contracts/abis/SovaBTCStaking.json';

export function useClaimRewards() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimRewards = async (stakingAddress: `0x${string}`) => {
    writeContract({
      address: stakingAddress,
      abi: STAKING_ABI,
      functionName: 'getReward',
    });
  };

  return {
    claimRewards,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
```

**Acceptance Criteria**:
- ✅ Real staking amounts and rewards displayed
- ✅ Stake/unstake transactions working
- ✅ Reward claiming functionality
- ✅ APY calculations from contract data
- ✅ Real-time reward accrual display

---

### Task 7: Bitcoin Withdrawal on Sova Chain
**Goal**: Implement immediate BTC withdrawal using Sova's Bitcoin precompile (when Sova integration is ready)

**Note**: This task can be implemented later when Sova chain integration is needed. For now, focus on the Base Sepolia ecosystem.

**Files to Create/Modify**:
```
src/
├── hooks/
│   ├── use-btc-withdraw.ts
│   ├── use-btc-balance.ts
│   └── use-btc-transaction-status.ts
└── components/
    └── btc-withdraw/
        ├── btc-withdrawal-form.tsx
        └── btc-transaction-tracker.tsx
```

**Acceptance Criteria**:
- ✅ BTC withdrawal only available on Sova chain
- ✅ Bitcoin address validation implemented
- ✅ Real Bitcoin transaction creation via precompile
- ✅ Transaction status tracking on Bitcoin network
- ✅ Error handling for invalid addresses/amounts

**Implementation Notes**:
This feature will be implemented when Sova chain integration is ready and the Bitcoin precompile is available.

---

## Phase 3: Real-Time Data and State Management

### Task 8: Event Listening and Real-Time Updates
**Goal**: Implement contract event listening for real-time UI updates

**Files to Create/Modify**:
```
src/
├── hooks/
│   ├── use-contract-events.ts
│   ├── use-transaction-history.ts
│   └── use-real-time-balances.ts
├── lib/
│   └── event-utils.ts
└── stores/
    └── transaction-store.ts
```

**Implementation Steps**:

1. **Contract Events Hook**:
```typescript
// hooks/use-contract-events.ts
import { useWatchContractEvent, useAccount } from 'wagmi';
import { WRAPPER_ABI } from '@/contracts/abis/SovaBTCWrapper.json';
import { useTransactionStore } from '@/stores/transaction-store';

export function useContractEvents() {
  const { address } = useAccount();
  const { addTransaction } = useTransactionStore();

  // Watch for TokenWrapped events
  useWatchContractEvent({
    address: WRAPPER_ADDRESS,
    abi: WRAPPER_ABI,
    eventName: 'TokenWrapped',
    args: { user: address },
    onLogs(logs) {
      logs.forEach((log) => {
        addTransaction({
          hash: log.transactionHash,
          type: 'wrap',
          status: 'confirmed',
          timestamp: Date.now(),
          amount: log.args.sovaAmount,
          token: log.args.token,
        });
      });
    },
  });

  // Watch for TokenUnwrapped events
  useWatchContractEvent({
    address: WRAPPER_ADDRESS,
    abi: WRAPPER_ABI,
    eventName: 'TokenUnwrapped',
    args: { user: address },
    onLogs(logs) {
      logs.forEach((log) => {
        addTransaction({
          hash: log.transactionHash,
          type: 'unwrap',
          status: 'confirmed',
          timestamp: Date.now(),
          amount: log.args.sovaAmount,
          token: log.args.token,
        });
      });
    },
  });

  // Watch for RedemptionQueued events
  useWatchContractEvent({
    address: REDEMPTION_QUEUE_ADDRESS,
    abi: REDEMPTION_QUEUE_ABI,
    eventName: 'RedemptionQueued',
    args: { user: address },
    onLogs(logs) {
      logs.forEach((log) => {
        addTransaction({
          hash: log.transactionHash,
          type: 'redemption_queued',
          status: 'pending',
          timestamp: Date.now(),
          amount: log.args.sovaAmount,
          token: log.args.token,
          fulfillmentTime: log.args.fulfillmentTime,
        });
      });
    },
  });
}
```

2. **Transaction Store (Zustand)**:
```typescript
// stores/transaction-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Transaction {
  hash: string;
  type: 'wrap' | 'unwrap' | 'bridge' | 'stake' | 'unstake' | 'redemption_queued' | 'redemption_fulfilled';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  amount?: bigint;
  token?: string;
  fromChain?: number;
  toChain?: number;
  fulfillmentTime?: bigint;
}

interface TransactionStore {
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (hash: string, updates: Partial<Transaction>) => void;
  getTransactionsByType: (type: Transaction['type']) => Transaction[];
  clearTransactions: () => void;
}

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      
      addTransaction: (tx) =>
        set((state) => ({
          transactions: [tx, ...state.transactions].slice(0, 100), // Keep last 100
        })),
      
      updateTransaction: (hash, updates) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.hash === hash ? { ...tx, ...updates } : tx
          ),
        })),
      
      getTransactionsByType: (type) =>
        get().transactions.filter((tx) => tx.type === type),
      
      clearTransactions: () => set({ transactions: [] }),
    }),
    {
      name: 'sovabtc-transactions',
    }
  )
);
```

3. **Real-Time Balance Updates**:
```typescript
// hooks/use-real-time-balances.ts
import { useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useTransactionStore } from '@/stores/transaction-store';
import { useTokenBalance } from './use-token-balance';

export function useRealTimeBalances() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { transactions } = useTransactionStore();
  
  // Get all relevant token balances
  const sovaBTCBalance = useTokenBalance(CONTRACT_ADDRESSES[chainId]?.SOVABTC);
  const wbtcBalance = useTokenBalance(WBTC_ADDRESS);
  
  // Refresh balances when new transactions are detected
  useEffect(() => {
    const recentTx = transactions.find(tx => 
      tx.timestamp > Date.now() - 30000 && tx.status === 'confirmed'
    );
    
    if (recentTx) {
      sovaBTCBalance.refetch();
      wbtcBalance.refetch();
    }
  }, [transactions, sovaBTCBalance, wbtcBalance]);

  return {
    sovaBTCBalance,
    wbtcBalance,
    // ... other balances
  };
}
```

**Acceptance Criteria**:
- ✅ Real-time event listening for all contract interactions
- ✅ Transaction history stored and persisted locally
- ✅ Balance updates triggered by confirmed transactions
- ✅ UI updates automatically reflect blockchain state
- ✅ Event data properly parsed and typed

---

### Task 9: Error Handling and User Feedback
**Goal**: Implement comprehensive error handling and user notifications

**Files to Create/Modify**:
```
src/
├── components/
│   ├── ui/
│   │   ├── toast.tsx
│   │   ├── error-boundary.tsx
│   │   └── transaction-status.tsx
├── hooks/
│   ├── use-error-handler.ts
│   └── use-toast-notifications.ts
└── lib/
    └── error-utils.ts
```

**Implementation Steps**:

1. **Error Handler Hook**:
```typescript
// hooks/use-error-handler.ts
import { useToast } from '@/hooks/use-toast';
import { parseError } from '@/lib/error-utils';

export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = (error: unknown, context?: string) => {
    const parsedError = parseError(error);
    
    toast({
      title: 'Transaction Failed',
      description: parsedError.message,
      variant: 'destructive',
    });

    // Log to analytics if needed
    console.error(`Error in ${context}:`, parsedError);
  };

  const handleSuccess = (message: string, txHash?: string) => {
    toast({
      title: 'Success!',
      description: message,
      action: txHash ? (
        <a 
          href={`${BLOCK_EXPLORER_URL}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          View Transaction
        </a>
      ) : undefined,
    });
  };

  return { handleError, handleSuccess };
}
```

2. **Error Parsing Utility**:
```typescript
// lib/error-utils.ts
export interface ParsedError {
  message: string;
  code?: string;
  type: 'user_rejected' | 'insufficient_funds' | 'contract_error' | 'network_error' | 'unknown';
}

export function parseError(error: unknown): ParsedError {
  if (typeof error === 'string') {
    return { message: error, type: 'unknown' };
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as any).message;
    
    // User rejected transaction
    if (message.includes('User rejected') || message.includes('denied')) {
      return {
        message: 'Transaction was rejected by user',
        type: 'user_rejected',
      };
    }
    
    // Insufficient funds
    if (message.includes('insufficient funds') || message.includes('exceeds balance')) {
      return {
        message: 'Insufficient balance for this transaction',
        type: 'insufficient_funds',
      };
    }
    
    // Contract-specific errors
    if (message.includes('TokenNotAllowed')) {
      return {
        message: 'This token is not whitelisted for deposits',
        type: 'contract_error',
      };
    }
    
    if (message.includes('InsufficientReserve')) {
      return {
        message: 'Insufficient reserve for redemption. Please try again later.',
        type: 'contract_error',
      };
    }
    
    if (message.includes('RedemptionNotReady')) {
      return {
        message: 'Redemption is not ready yet. Please wait for the queue period to complete.',
        type: 'contract_error',
      };
    }
    
    // Network errors
    if (message.includes('network') || message.includes('RPC')) {
      return {
        message: 'Network error. Please check your connection and try again.',
        type: 'network_error',
      };
    }
    
    return {
      message: message,
      type: 'unknown',
    };
  }

  return {
    message: 'An unknown error occurred',
    type: 'unknown',
  };
}
```

3. **Transaction Status Component**:
```typescript
// components/ui/transaction-status.tsx
'use client';

import { useWaitForTransactionReceipt } from 'wagmi';
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransactionStatusProps {
  hash: `0x${string}`;
  type: string;
  onSuccess?: () => void;
  onError?: () => void;
}

export function TransactionStatus({ hash, type, onSuccess, onError }: TransactionStatusProps) {
  const { data: receipt, isLoading, error } = useWaitForTransactionReceipt({
    hash,
  });

  React.useEffect(() => {
    if (receipt && onSuccess) {
      onSuccess();
    }
    if (error && onError) {
      onError();
    }
  }, [receipt, error, onSuccess, onError]);

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (error) return <XCircle className="h-4 w-4 text-red-500" />;
    if (receipt) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return null;
  };

  const getStatusText = () => {
    if (isLoading) return `${type} transaction pending...`;
    if (error) return `${type} transaction failed`;
    if (receipt) return `${type} transaction confirmed!`;
    return '';
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <span className="text-sm">{getStatusText()}</span>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        asChild
      >
        <a
          href={`${BLOCK_EXPLORER_URL}/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View
        </a>
      </Button>
    </div>
  );
}
```

**Acceptance Criteria**:
- ✅ User-friendly error messages for all failure scenarios
- ✅ Success notifications with transaction links
- ✅ Loading states during transaction processing
- ✅ Retry mechanisms for failed transactions
- ✅ Error categorization and appropriate responses

---

### Task 10: Performance Optimization and Caching
**Goal**: Optimize app performance with proper caching and data management

**Files to Create/Modify**:
```
src/
├── hooks/
│   ├── use-optimistic-updates.ts
│   └── use-cached-data.ts
├── lib/
│   ├── cache-utils.ts
│   └── performance-utils.ts
└── components/
    └── providers/
        └── react-query-provider.tsx
```

**Implementation Steps**:

1. **React Query Configuration**:
```typescript
// components/providers/react-query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes
            retry: 3,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

2. **Optimistic Updates Hook**:
```typescript
// hooks/use-optimistic-updates.ts
import { useQueryClient } from '@tanstack/react-query';
import { useAccount, useChainId } from 'wagmi';

export function useOptimisticUpdates() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const chainId = useChainId();

  const updateBalanceOptimistically = (
    tokenAddress: string,
    amount: bigint,
    operation: 'add' | 'subtract'
  ) => {
    const queryKey = ['tokenBalance', tokenAddress, address, chainId];
    
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData;
      
      const newBalance = operation === 'add' 
        ? oldData.balance + amount
        : oldData.balance - amount;
        
      return {
        ...oldData,
        balance: newBalance,
        formattedBalance: formatUnits(newBalance, oldData.decimals),
      };
    });
  };

  const invalidateBalances = () => {
    queryClient.invalidateQueries({
      queryKey: ['tokenBalance'],
    });
  };

  return {
    updateBalanceOptimistically,
    invalidateBalances,
  };
}
```

3. **Cached Contract Data Hook**:
```typescript
// hooks/use-cached-data.ts
import { useQuery } from '@tanstack/react-query';
import { usePublicClient, useChainId } from 'wagmi';

export function useCachedContractData() {
  const publicClient = usePublicClient();
  const chainId = useChainId();

  // Cache whitelisted tokens (changes rarely)
  const { data: whitelistedTokens } = useQuery({
    queryKey: ['whitelistedTokens', chainId],
    queryFn: async () => {
      // Fetch from contract
      const tokens = await publicClient?.readContract({
        address: WRAPPER_ADDRESS,
        abi: WRAPPER_ABI,
        functionName: 'getAllowedTokens',
      });
      return tokens || [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!publicClient,
  });

  // Cache redemption delay (rarely changes)
  const { data: redemptionDelay } = useQuery({
    queryKey: ['redemptionDelay', chainId],
    queryFn: async () => {
      const delay = await publicClient?.readContract({
        address: REDEMPTION_QUEUE_ADDRESS,
        abi: REDEMPTION_QUEUE_ABI,
        functionName: 'redemptionDelay',
      });
      return Number(delay || 0);
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!publicClient,
  });

  return {
    whitelistedTokens,
    redemptionDelay,
  };
}
```

**Acceptance Criteria**:
- ✅ Proper React Query caching implemented
- ✅ Optimistic UI updates for better UX
- ✅ Appropriate cache invalidation strategies
- ✅ Performance monitoring and optimization
- ✅ Reduced unnecessary contract calls

---

## Implementation Summary

### Updated Cursor Command

Give Cursor this command to implement the Web3 functionality:

```
The SovaBTC contracts are deployed on Base Sepolia and ABIs are ready. Implement the Web3 functionality following the Web3 Integration Guide.

We have these deployed contracts:
- SovaBTC.sol (main token)
- SovaBTCWrapper.sol (main wrapper)  
- RedemptionQueue.sol (queued redemptions)
- SovaBTCStaking.sol (staking rewards)
- SOVAToken.sol (reward token)
- TokenWhitelist.sol (approved tokens)
- CustodyManager.sol (security controls)

The contract ABIs are in src/contracts/abis/ and addresses are configured in src/contracts/addresses.ts

Start with Phase 1, Task 1: Contract ABIs and Configuration Setup.

Implement real Web3 functionality:
1. Set up type-safe contract interaction hooks using the existing ABIs
2. Implement real token balance fetching from deployed contracts
3. Add actual transaction functionality (approvals, deposits, redemptions)
4. Implement redemption queue with real countdown timers
5. Add working staking interface with live reward calculations
6. Add comprehensive error handling and transaction status tracking

Focus on making the existing UI components work with actual blockchain data from the deployed contracts. Each hook should handle loading states, errors, and real transaction flows.

Skip LayerZero bridging and Sova Bitcoin withdrawal for now - focus on core Base Sepolia functionality.

Do not proceed to the next task until the current one is fully working with real contract interactions.
```

### Key Success Metrics

After implementation, your frontend should:

- ✅ **Connect to real contracts** on Base Sepolia
- ✅ **Display actual token balances** from blockchain  
- ✅ **Execute real transactions** (approvals, deposits, etc.)
- ✅ **Handle transaction states** (pending, success, failure)
- ✅ **Listen to contract events** for real-time updates
- ✅ **Manage redemption queues** with real countdown timers
- ✅ **Provide staking functionality** with real rewards
- ✅ **Show comprehensive error handling**
- ✅ **Support multiple test tokens** (WBTC, LBTC, USDC)

### Next Steps

1. **Deploy contracts** using the clean deployment script
2. **Extract ABIs** using the provided extraction script
3. **Start with Task 1** - Get contract configuration working
4. **Test each task thoroughly** with real transactions on Base Sepolia
5. **Add proper error handling** for each interaction
6. **Implement optimistic UI updates** for better UX
7. **Add comprehensive logging** for debugging

### Future Enhancements

When ready for advanced features:
- **LayerZero Integration**: Add cross-chain bridging functionality
- **Sova Chain Integration**: Add Bitcoin withdrawal capabilities  
- **Additional Chains**: Deploy to Ethereum, Arbitrum, etc.
- **Advanced Staking**: Lock periods, boost multipliers, etc.

This integration guide transforms your UI-only frontend into a fully functional Web3 application that actually interacts with the SovaBTC protocol on Base Sepolia!