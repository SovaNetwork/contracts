import { useAccount, useReadContract, useChainId } from 'wagmi'
import { CONTRACT_ADDRESSES, isSupportedChain } from '@/config/contracts'

const OWNABLE_ABI = [
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

export function useAdmin() {
  const { address } = useAccount()
  const chainId = useChainId()

  // Get contract addresses for current chain
  const contractAddresses = isSupportedChain(chainId) 
    ? CONTRACT_ADDRESSES[chainId]
    : CONTRACT_ADDRESSES[84532] // Fallback to Base Sepolia

  // Check if user is owner of wrapper contract
  const { data: wrapperOwner } = useReadContract({
    address: contractAddresses.WRAPPER,
    abi: OWNABLE_ABI,
    functionName: 'owner',
  })

  // Check if user is owner of staking contract
  const { data: stakingOwner } = useReadContract({
    address: contractAddresses.STAKING,
    abi: OWNABLE_ABI,
    functionName: 'owner',
  })

  const isWrapperOwner = address && wrapperOwner === address
  const isStakingOwner = address && stakingOwner === address
  const isAdmin = isWrapperOwner || isStakingOwner

  return {
    isAdmin,
    isWrapperOwner,
    isStakingOwner,
    wrapperOwner,
    stakingOwner,
  }
} 