'use client'

import { useReadContract, useAccount } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { SOVABTC_ABI, TOKEN_WHITELIST_ABI } from '@/contracts/abis'
import { baseSepolia } from 'viem/chains'
import { useMemo } from 'react'

export function useAdminAccess() {
  const { address } = useAccount()
  
  // Check if user is owner of main contracts
  const { data: sovaBTCOwner } = useReadContract({
    address: CONTRACT_ADDRESSES[baseSepolia.id].SOVABTC,
    abi: SOVABTC_ABI,
    functionName: 'owner',
  })
  
  const { data: whitelistOwner } = useReadContract({
    address: CONTRACT_ADDRESSES[baseSepolia.id].TOKEN_WHITELIST,
    abi: TOKEN_WHITELIST_ABI,
    functionName: 'owner',
  })

  const isAdmin = useMemo(() => {
    if (!address) return false
    return address === sovaBTCOwner || address === whitelistOwner
  }, [address, sovaBTCOwner, whitelistOwner])

  const isSuperAdmin = useMemo(() => {
    if (!address) return false
    return address === sovaBTCOwner
  }, [address, sovaBTCOwner])

  return {
    isAdmin,
    isSuperAdmin,
    sovaBTCOwner,
    whitelistOwner,
  }
} 