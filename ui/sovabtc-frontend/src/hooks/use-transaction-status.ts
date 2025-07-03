import { useWaitForTransactionReceipt } from 'wagmi';
import { getBlockExplorerTxUrl } from '../config/wagmi';
import { useChainId } from 'wagmi';

export type TransactionStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

export interface TransactionState {
  status: TransactionStatus;
  hash?: `0x${string}`;
  explorerUrl?: string;
  confirmations?: number;
  error?: Error;
}

export function useTransactionStatus(hash?: `0x${string}`): TransactionState {
  const chainId = useChainId();
  
  const { 
    data: receipt, 
    isLoading: isConfirming, 
    isSuccess, 
    error 
  } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  });

  const getStatus = (): TransactionStatus => {
    if (!hash) return 'idle';
    if (error) return 'error';
    if (isSuccess && receipt) return 'success';
    if (isConfirming) return 'confirming';
    return 'pending';
  };

  const explorerUrl = hash ? getBlockExplorerTxUrl(chainId, hash) : undefined;

  return {
    status: getStatus(),
    hash,
    explorerUrl,
    confirmations: receipt?.blockNumber ? 1 : 0,
    error: error || undefined,
  };
}

export function getTransactionStatusText(status: TransactionStatus, type?: string): string {
  const action = type || 'Transaction';
  
  switch (status) {
    case 'idle':
      return 'Ready';
    case 'pending':
      return `${action} pending...`;
    case 'confirming':
      return `Confirming ${action.toLowerCase()}...`;
    case 'success':
      return `${action} successful!`;
    case 'error':
      return `${action} failed`;
    default:
      return 'Unknown status';
  }
}

export function getTransactionStatusColor(status: TransactionStatus): string {
  switch (status) {
    case 'idle':
      return 'text-gray-500';
    case 'pending':
    case 'confirming':
      return 'text-blue-500';
    case 'success':
      return 'text-green-500';
    case 'error':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}