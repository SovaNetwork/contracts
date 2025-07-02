import { useAccount, useReadContract, useChainId } from 'wagmi'
import { contractAddresses } from '@/config/contracts'

const OWNABLE_ABI = [
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

export function useIsOwner() {
  const { address } = useAccount()
  const chainId = useChainId()
  
  const wrapperAddress = contractAddresses[chainId as keyof typeof contractAddresses]?.wrapper

  const { data: owner, isLoading } = useReadContract({
    address: wrapperAddress,
    abi: OWNABLE_ABI,
    functionName: 'owner',
    query: {
      enabled: !!address && !!wrapperAddress,
    },
  })

  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase()

  return {
    isOwner: !!isOwner,
    isLoading,
    owner,
  }
} 