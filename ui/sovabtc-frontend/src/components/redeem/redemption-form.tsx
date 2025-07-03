'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { baseSepolia } from 'viem/chains';

import { Button } from '../ui/button';
import { TransactionStatus } from '../transactions/transaction-status';
import { QueueStatus } from './queue-status';
import { useTokenBalance } from '../../hooks/use-token-balance';
import { useRedemptionRequest } from '../../hooks/use-redemption-request';
import { useRedemptionStatus } from '../../hooks/use-redemption-status';
import { CONTRACT_ADDRESSES, TOKEN_CONFIGS } from '../../contracts/addresses';

interface TokenOption {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
}

export function RedemptionForm() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const [selectedToken, setSelectedToken] = useState<TokenOption>();
  const [amount, setAmount] = useState('');

  // Initialize with WBTC by default
  useEffect(() => {
    if (chainId === baseSepolia.id && !selectedToken) {
      const wbtcConfig = TOKEN_CONFIGS[baseSepolia.id].WBTC;
      setSelectedToken({
        address: wbtcConfig.address,
        symbol: wbtcConfig.symbol,
        name: wbtcConfig.name,
        decimals: wbtcConfig.decimals,
      });
    }
  }, [chainId, selectedToken]);

  // Get contract addresses for current chain
  const queueAddress = chainId === baseSepolia.id 
    ? CONTRACT_ADDRESSES[baseSepolia.id].REDEMPTION_QUEUE
    : undefined;

  const sovaBTCAddress = chainId === baseSepolia.id 
    ? CONTRACT_ADDRESSES[baseSepolia.id].SOVABTC
    : undefined;

  // Real contract data
  const sovaBTCBalance = useTokenBalance(sovaBTCAddress || '0x0');
  const redemptionRequest = useRedemptionRequest();
  const redemptionStatus = useRedemptionStatus(queueAddress || '0x0');

  // Available tokens for redemption
  const availableTokens: TokenOption[] = chainId === baseSepolia.id 
    ? [
        TOKEN_CONFIGS[baseSepolia.id].WBTC,
        TOKEN_CONFIGS[baseSepolia.id].LBTC,
        TOKEN_CONFIGS[baseSepolia.id].USDC,
      ]
    : [];

  // Validate input amount
  const isValidAmount = amount && 
    Number(amount) > 0 && 
    Number(amount) <= Number(sovaBTCBalance.formattedBalance);

  // Check if user can submit a new redemption
  const canSubmitRedemption = !redemptionStatus.hasPendingRedemption;

  // Handle successful redemption request
  useEffect(() => {
    if (redemptionRequest.isSuccess) {
      console.log('Redemption request successful!');
      sovaBTCBalance.refetch(); // Refresh sovaBTC balance
      redemptionStatus.refetch(); // Refresh redemption status
      setAmount(''); // Clear form
    }
  }, [redemptionRequest.isSuccess, sovaBTCBalance, redemptionStatus]);

  const handleSubmitRedemption = async () => {
    if (!selectedToken || !amount || !queueAddress) return;
    
    try {
      await redemptionRequest.requestRedemption(
        queueAddress,
        selectedToken.address,
        amount,
        8 // SovaBTC decimals
      );
    } catch (error) {
      console.error('Redemption request failed:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Redeem Tokens</h2>
          <div className="text-center p-8">
            <p className="text-gray-600">Please connect your wallet to redeem tokens</p>
          </div>
        </div>
      </div>
    );
  }

  if (chainId !== baseSepolia.id) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Redeem Tokens</h2>
          <div className="text-center p-8">
            <p className="text-gray-600">Please switch to Base Sepolia network</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Redemption Form */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Redeem SovaBTC</h2>
        
        <div className="space-y-6">
          {/* Current Balance Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Your SovaBTC Balance</h3>
            <div className="flex justify-between items-center">
              <span className="text-lg font-mono">
                {sovaBTCBalance.isLoading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  sovaBTCBalance.displayBalance
                )} sovaBTC
              </span>
              {!canSubmitRedemption && (
                <span className="text-sm text-orange-600 font-medium">
                  Redemption pending
                </span>
              )}
            </div>
          </div>

          {/* Redemption Form */}
          {canSubmitRedemption ? (
            <>
              {/* Token Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Redeem To Token
                </label>
                <select
                  value={selectedToken?.address || ''}
                  onChange={(e) => {
                    const tokenConfig = availableTokens.find(t => t.address === e.target.value);
                    setSelectedToken(tokenConfig);
                    setAmount(''); // Reset amount when changing tokens
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {availableTokens.map((token) => (
                    <option key={token.address} value={token.address}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              {selectedToken && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SovaBTC Amount to Redeem
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      step="any"
                      min="0"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-sm text-gray-500">sovaBTC</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>Available: {sovaBTCBalance.displayBalance}</span>
                    <button
                      onClick={() => setAmount(sovaBTCBalance.formattedBalance)}
                      className="text-blue-600 hover:underline"
                      disabled={sovaBTCBalance.isLoading}
                    >
                      Max
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {selectedToken && (
                <div className="space-y-3">
                  <Button
                    onClick={handleSubmitRedemption}
                    disabled={redemptionRequest.isPending || redemptionRequest.isConfirming || !isValidAmount}
                    className="w-full"
                    size="lg"
                  >
                    {redemptionRequest.isPending && 'Waiting for signature...'}
                    {redemptionRequest.isConfirming && 'Confirming redemption...'}
                    {!redemptionRequest.isPending && !redemptionRequest.isConfirming && 
                      `Queue Redemption for ${selectedToken.symbol}`
                    }
                  </Button>

                  {/* Input validation message */}
                  {amount && !isValidAmount && (
                    <p className="text-sm text-red-600">
                      {Number(amount) <= 0 
                        ? 'Amount must be greater than 0'
                        : 'Insufficient sovaBTC balance'
                      }
                    </p>
                  )}
                </div>
              )}

              {/* Transaction Status */}
              {redemptionRequest.hash && (
                <TransactionStatus 
                  hash={redemptionRequest.hash}
                  type="Redemption Request"
                  onSuccess={() => console.log('Redemption request completed')}
                  onError={(error) => console.error('Redemption request failed:', error)}
                />
              )}

              {/* Information */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-medium text-orange-900 mb-2">How redemption works:</h3>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>1. Submit redemption request with your sovaBTC</li>
                  <li>2. Wait for the security queue period to complete</li>
                  <li>3. Fulfill your redemption to receive the selected token</li>
                  <li>4. Redemption includes any applicable exchange rates</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="text-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-2">Redemption Already Pending</h3>
              <p className="text-yellow-800 text-sm">
                You already have a pending redemption. Please wait for it to complete before submitting a new one.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Queue Status */}
      <QueueStatus 
        queueAddress={queueAddress || '0x0'}
        onFulfillmentSuccess={() => {
          sovaBTCBalance.refetch();
          redemptionStatus.refetch();
        }}
      />
    </div>
  );
}