'use client';

import { useEffect, useState } from 'react';
import { useReadContract, usePublicClient } from 'wagmi';
import { type Address, erc20Abi } from 'viem';
import { formatTokenAmount } from '@/lib/formatters';

interface RealTimeAllowanceCheckerProps {
  tokenAddress: Address;
  spenderAddress: Address;
  userAddress: Address;
  requiredAmount: bigint;
  tokenSymbol: string;
  tokenDecimals: number;
}

export function RealTimeAllowanceChecker({
  tokenAddress,
  spenderAddress,
  userAddress,
  requiredAmount,
  tokenSymbol,
  tokenDecimals,
}: RealTimeAllowanceCheckerProps) {
  const [manualAllowance, setManualAllowance] = useState<bigint | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const publicClient = usePublicClient();

  // Hook-based allowance check (auto-refetches)
  const {
    data: hookAllowance,
    isLoading: isLoadingHook,
    refetch: refetchHook,
  } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [userAddress, spenderAddress],
    query: {
      refetchInterval: 3000, // Every 3 seconds
    },
  });

  // Manual allowance check
  const checkManualAllowance = async () => {
    if (!publicClient) return;
    
    setIsChecking(true);
    try {
      const allowance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [userAddress, spenderAddress],
      });
      
      setManualAllowance(allowance);
      setLastChecked(new Date());
      
      console.log('🔍 MANUAL ALLOWANCE CHECK RESULT:', {
        tokenAddress,
        spenderAddress,
        userAddress,
        allowance: allowance.toString(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ MANUAL ALLOWANCE CHECK FAILED:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Auto-check on mount
  useEffect(() => {
    checkManualAllowance();
  }, [tokenAddress, spenderAddress, userAddress]);

  const isAllowanceSufficient = (allowance: bigint | undefined) => {
    if (!allowance || requiredAmount === 0n) return false;
    return allowance >= requiredAmount;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="text-red-200">
        <div className="font-bold">Real-time Allowance Monitoring</div>
        <div className="text-xs opacity-75">
          Token: {tokenSymbol} | Required: {formatTokenAmount(requiredAmount, tokenDecimals)} {tokenSymbol}
        </div>
      </div>

      {/* Hook-based Check */}
      <div className="bg-blue-900/30 p-3 rounded border border-blue-600">
        <div className="text-blue-300 font-bold mb-1">🔗 Hook-based Check (Auto-refresh)</div>
        <div className="text-xs space-y-1">
          <div>Allowance: {isLoadingHook ? 'Loading...' : hookAllowance?.toString() || 'N/A'}</div>
          <div>Formatted: {hookAllowance ? formatTokenAmount(hookAllowance, tokenDecimals) : '0.00'} {tokenSymbol}</div>
          <div>Status: {hookAllowance ? (isAllowanceSufficient(hookAllowance) ? '✅ Sufficient' : '❌ Insufficient') : 'Unknown'}</div>
          <button 
            onClick={() => refetchHook()}
            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            disabled={isLoadingHook}
          >
            Refresh Hook
          </button>
        </div>
      </div>

      {/* Manual Check */}
      <div className="bg-orange-900/30 p-3 rounded border border-orange-600">
        <div className="text-orange-300 font-bold mb-1">⚡ Manual Check (Direct RPC)</div>
        <div className="text-xs space-y-1">
          <div>Allowance: {manualAllowance?.toString() || 'Not checked'}</div>
          <div>Formatted: {manualAllowance ? formatTokenAmount(manualAllowance, tokenDecimals) : '0.00'} {tokenSymbol}</div>
          <div>Status: {manualAllowance ? (isAllowanceSufficient(manualAllowance) ? '✅ Sufficient' : '❌ Insufficient') : 'Unknown'}</div>
          <div>Last Checked: {lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}</div>
          <button 
            onClick={checkManualAllowance}
            className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
            disabled={isChecking}
          >
            {isChecking ? 'Checking...' : 'Manual Check'}
          </button>
        </div>
      </div>

      {/* Comparison */}
      <div className="bg-purple-900/30 p-3 rounded border border-purple-600">
        <div className="text-purple-300 font-bold mb-1">🔍 Comparison Analysis</div>
        <div className="text-xs space-y-1">
          <div>Hook vs Manual Match: {
            hookAllowance && manualAllowance 
              ? (hookAllowance === manualAllowance ? '✅ Match' : '❌ Mismatch') 
              : 'Pending...'
          }</div>
          <div>Hook Value: {hookAllowance?.toString() || 'N/A'}</div>
          <div>Manual Value: {manualAllowance?.toString() || 'N/A'}</div>
          <div>Required: {requiredAmount.toString()}</div>
          <div>Ratio: {
            (hookAllowance || manualAllowance) && requiredAmount > 0n 
              ? `${(Number(hookAllowance || manualAllowance) / Number(requiredAmount)).toFixed(2)}x`
              : 'N/A'
          }</div>
        </div>
      </div>

      {/* Contract Info */}
      <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
        <div className="text-gray-300 font-bold mb-1">📋 Contract Details</div>
        <div className="text-xs space-y-1 break-all">
          <div>Token: {tokenAddress}</div>
          <div>Spender: {spenderAddress}</div>
          <div>User: {userAddress}</div>
          <div>Decimals: {tokenDecimals}</div>
        </div>
      </div>

      {/* Warning */}
      {hookAllowance && manualAllowance && hookAllowance !== manualAllowance && (
        <div className="bg-red-900/30 p-3 rounded border border-red-600">
          <div className="text-red-300 font-bold">⚠️ DATA MISMATCH DETECTED</div>
          <div className="text-xs text-red-200">
            Hook and manual checks are returning different values. This could indicate:
            <ul className="list-disc list-inside mt-1">
              <li>Stale cache data</li>
              <li>RPC inconsistency</li>
              <li>Recent transaction not confirmed</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 