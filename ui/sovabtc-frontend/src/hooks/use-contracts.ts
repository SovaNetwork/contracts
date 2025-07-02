import { useAccount, useChainId, useReadContract, useWriteContract } from 'wagmi'
import { Address } from 'viem'
import { contractAddresses, contractABIs } from '@/config/contracts'
import { useCallback, useMemo } from 'react'

// Hook to get contract addresses for current chain
export function useContractAddresses() {
  const chainId = useChainId()
  return useMemo(() => {
    return contractAddresses[chainId as keyof typeof contractAddresses] || contractAddresses[84532] // fallback to Base Sepolia
  }, [chainId])
}

// Hook for SovaBTC contract interactions
export function useSovaBTC() {
  const addresses = useContractAddresses()
  const { address } = useAccount()
  
  // Read balance
  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useReadContract({
    address: addresses.sovaBTC,
    abi: contractABIs.sovaBTC,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })
  
  // Read allowance for wrapper contract
  const { data: allowance, isLoading: allowanceLoading, refetch: refetchAllowance } = useReadContract({
    address: addresses.sovaBTC,
    abi: contractABIs.sovaBTC,
    functionName: 'allowance',
    args: address ? [address, addresses.wrapper] : undefined,
    query: {
      enabled: !!address,
    },
  })
  
  const { writeContract: approve, isPending: isApproving } = useWriteContract()
  const { writeContract: transfer, isPending: isTransferring } = useWriteContract()
  
  // Approve wrapper contract
  const approveWrapper = useCallback((amount: bigint) => {
    approve({
      address: addresses.sovaBTC,
      abi: contractABIs.sovaBTC,
      functionName: 'approve',
      args: [addresses.wrapper, amount],
    })
  }, [approve, addresses])
  
  // Transfer tokens
  const transferTokens = useCallback((to: Address, amount: bigint) => {
    transfer({
      address: addresses.sovaBTC,
      abi: contractABIs.sovaBTC,
      functionName: 'transfer',
      args: [to, amount],
    })
  }, [transfer, addresses])
  
  return {
    balance: balance as bigint | undefined,
    allowance: allowance as bigint | undefined,
    balanceLoading,
    allowanceLoading,
    isApproving,
    isTransferring,
    approveWrapper,
    transferTokens,
    refetchBalance,
    refetchAllowance,
  }
}

// Hook for Wrapper contract interactions
export function useWrapper() {
  const addresses = useContractAddresses()
  
  // Read whitelisted tokens
  const { data: whitelistedTokens, isLoading: tokensLoading, refetch: refetchTokens } = useReadContract({
    address: addresses.wrapper,
    abi: contractABIs.wrapper,
    functionName: 'getWhitelistedTokens',
  })
  
  // Check if token is whitelisted
  const useIsTokenWhitelisted = (tokenAddress?: Address) => {
    return useReadContract({
      address: addresses.wrapper,
      abi: contractABIs.wrapper,
      functionName: 'isTokenWhitelisted',
      args: tokenAddress ? [tokenAddress] : undefined,
      query: {
        enabled: !!tokenAddress,
      },
    })
  }
  
  const { writeContract: deposit, isPending: isDepositing } = useWriteContract()
  
  // Deposit tokens
  const depositTokens = useCallback((token: Address, amount: bigint) => {
    deposit({
      address: addresses.wrapper,
      abi: contractABIs.wrapper,
      functionName: 'deposit',
      args: [token, amount],
    })
  }, [deposit, addresses])
  
  return {
    whitelistedTokens: whitelistedTokens as Address[] | undefined,
    tokensLoading,
    isDepositing,
    depositTokens,
    refetchTokens,
    useIsTokenWhitelisted,
  }
}

// Hook for Staking contract interactions
export function useStaking() {
  const addresses = useContractAddresses()
  const { address } = useAccount()
  
  // Read user rewards
  const { data: rewards, isLoading: rewardsLoading, refetch: refetchRewards } = useReadContract({
    address: addresses.staking,
    abi: contractABIs.staking,
    functionName: 'getRewards',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })
  
  const { writeContract: stake, isPending: isStaking } = useWriteContract()
  const { writeContract: unstake, isPending: isUnstaking } = useWriteContract()
  
  // Stake tokens
  const stakeTokens = useCallback((amount: bigint) => {
    stake({
      address: addresses.staking,
      abi: contractABIs.staking,
      functionName: 'stake',
      args: [amount],
    })
  }, [stake, addresses])
  
  // Unstake tokens
  const unstakeTokens = useCallback((amount: bigint) => {
    unstake({
      address: addresses.staking,
      abi: contractABIs.staking,
      functionName: 'unstake',
      args: [amount],
    })
  }, [unstake, addresses])
  
  return {
    rewards: rewards as bigint | undefined,
    rewardsLoading,
    isStaking,
    isUnstaking,
    stakeTokens,
    unstakeTokens,
    refetchRewards,
  }
}

// Hook for ERC20 token interactions
export function useERC20(tokenAddress?: Address) {
  const { address } = useAccount()
  
  // Read token balance
  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useReadContract({
    address: tokenAddress,
    abi: contractABIs.erc20,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!(tokenAddress && address),
    },
  })
  
  // Read token decimals
  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: contractABIs.erc20,
    functionName: 'decimals',
    query: {
      enabled: !!tokenAddress,
    },
  })
  
  // Read token symbol
  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: contractABIs.erc20,
    functionName: 'symbol',
    query: {
      enabled: !!tokenAddress,
    },
  })
  
  // Read token name
  const { data: name } = useReadContract({
    address: tokenAddress,
    abi: contractABIs.erc20,
    functionName: 'name',
    query: {
      enabled: !!tokenAddress,
    },
  })
  
  // Read allowance for wrapper contract
  const useAllowance = (spender?: Address) => {
    return useReadContract({
      address: tokenAddress,
      abi: contractABIs.erc20,
      functionName: 'allowance',
      args: address && spender ? [address, spender] : undefined,
      query: {
        enabled: !!(tokenAddress && address && spender),
      },
    })
  }
  
  const { writeContract: approve, isPending: isApproving } = useWriteContract()
  
  // Approve spender
  const approveSpender = useCallback((spender: Address, amount: bigint) => {
    if (!tokenAddress) return
    
    approve({
      address: tokenAddress,
      abi: contractABIs.erc20,
      functionName: 'approve',
      args: [spender, amount],
    })
  }, [approve, tokenAddress])
  
  return {
    balance: balance as bigint | undefined,
    decimals: decimals as number | undefined,
    symbol: symbol as string | undefined,
    name: name as string | undefined,
    balanceLoading,
    isApproving,
    approveSpender,
    refetchBalance,
    useAllowance,
  }
}

// Hook to get all contract addresses and check if they're properly configured
export function useContractStatus() {
  const chainId = useChainId()
  const addresses = useContractAddresses()
  
  const isConfigured = useMemo(() => {
    return addresses.sovaBTC !== '0x0000000000000000000000000000000000000000' &&
           addresses.wrapper !== '0x0000000000000000000000000000000000000000'
  }, [addresses])
  
  return {
    addresses,
    chainId,
    isConfigured,
    supportedChain: chainId in contractAddresses,
  }
} 