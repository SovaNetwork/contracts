'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { baseSepolia } from 'viem/chains';

import { Button } from '../ui/button';
import { TransactionStatus } from '../transactions/transaction-status';
import { useTokenBalance } from '../../hooks/use-token-balance';
import { useTokenAllowance } from '../../hooks/use-token-allowance';
import { useTokenApproval } from '../../hooks/use-token-approval';
import { useWrapperDeposit } from '../../hooks/use-wrapper-deposit';
import { CONTRACT_ADDRESSES, TOKEN_CONFIGS } from '../../contracts/addresses';

interface TokenOption {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
}

export function DepositForm() {
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

  // Get contract data for current chain
  const wrapperAddress = chainId === baseSepolia.id 
    ? CONTRACT_ADDRESSES[baseSepolia.id].WRAPPER
    : undefined;

  // Real contract data
  const tokenBalance = useTokenBalance(selectedToken?.address || '0x0');
  const tokenAllowance = useTokenAllowance(
    selectedToken?.address || '0x0',
    wrapperAddress || '0x0'
  );
  
  // Real transactions
  const approval = useTokenApproval();
  const deposit = useWrapperDeposit();

  // Available tokens for current chain
  const availableTokens: TokenOption[] = chainId === baseSepolia.id 
    ? [
        TOKEN_CONFIGS[baseSepolia.id].WBTC,
        TOKEN_CONFIGS[baseSepolia.id].LBTC,
        TOKEN_CONFIGS[baseSepolia.id].USDC,
      ]
    : [];

  // Calculate if approval is needed
  const needsApproval = selectedToken && amount && tokenBalance.decimals
    ? tokenAllowance.allowance < parseUnits(amount, tokenBalance.decimals)
    : false;

  // Validate input amount
  const isValidAmount = amount && 
    Number(amount) > 0 && 
    Number(amount) <= Number(tokenBalance.formattedBalance);

  // Handle successful transactions
  useEffect(() => {
    if (approval.isSuccess) {
      console.log('Approval successful!');
      tokenAllowance.refetch(); // Refresh allowance
    }
  }, [approval.isSuccess, tokenAllowance]);

  useEffect(() => {
    if (deposit.isSuccess) {
      console.log('Deposit successful!');
      tokenBalance.refetch(); // Refresh balance
      setAmount(''); // Clear form
    }
  }, [deposit.isSuccess, tokenBalance]);

  const handleApprove = async () => {
    if (!selectedToken || !amount || !wrapperAddress) return;
    
    try {
      await approval.approve(
        selectedToken.address,
        wrapperAddress,
        amount,
        selectedToken.decimals
      );
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleDeposit = async () => {
    if (!selectedToken || !amount || !wrapperAddress) return;
    
    try {
      await deposit.deposit(
        wrapperAddress,
        selectedToken.address,
        amount,
        selectedToken.decimals
      );
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Wrap Tokens</h2>
        <div className="text-center p-8">
          <p className="text-gray-600">Please connect your wallet to deposit tokens</p>
        </div>
      </div>
    );
  }

  if (chainId !== baseSepolia.id) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Wrap Tokens</h2>
        <div className="text-center p-8">
          <p className="text-gray-600">Please switch to Base Sepolia network</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Wrap Tokens</h2>
      
      <div className="space-y-6">
        {/* Token Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Token
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
              Amount
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
                <span className="text-sm text-gray-500">{selectedToken.symbol}</span>
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>
                Balance: {tokenBalance.isLoading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  tokenBalance.displayBalance
                )}
              </span>
              <button
                onClick={() => setAmount(tokenBalance.formattedBalance)}
                className="text-blue-600 hover:underline"
                disabled={tokenBalance.isLoading}
              >
                Max
              </button>
            </div>
          </div>
        )}

        {/* Transaction Buttons */}
        {selectedToken && (
          <div className="space-y-3">
            {needsApproval ? (
              <Button
                onClick={handleApprove}
                disabled={approval.isPending || approval.isConfirming || !isValidAmount}
                className="w-full"
              >
                {approval.isPending && 'Waiting for signature...'}
                {approval.isConfirming && 'Confirming approval...'}
                {!approval.isPending && !approval.isConfirming && 
                  `Approve ${selectedToken.symbol}`
                }
              </Button>
            ) : (
              <Button
                onClick={handleDeposit}
                disabled={deposit.isPending || deposit.isConfirming || !isValidAmount}
                className="w-full"
              >
                {deposit.isPending && 'Waiting for signature...'}
                {deposit.isConfirming && 'Confirming deposit...'}
                {!deposit.isPending && !deposit.isConfirming && 'Deposit & Wrap'}
              </Button>
            )}

            {/* Input validation message */}
            {amount && !isValidAmount && (
              <p className="text-sm text-red-600">
                {Number(amount) <= 0 
                  ? 'Amount must be greater than 0'
                  : 'Insufficient balance'
                }
              </p>
            )}
          </div>
        )}

        {/* Transaction Status */}
        {(approval.hash || deposit.hash) && (
          <div className="space-y-2">
            {approval.hash && (
              <TransactionStatus 
                hash={approval.hash}
                type="Approval"
                onSuccess={() => console.log('Approval completed')}
                onError={(error) => console.error('Approval failed:', error)}
              />
            )}
            {deposit.hash && (
              <TransactionStatus 
                hash={deposit.hash}
                type="Deposit"
                onSuccess={() => console.log('Deposit completed')}
                onError={(error) => console.error('Deposit failed:', error)}
              />
            )}
          </div>
        )}

        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. Select a supported token (WBTC, LBTC, or USDC)</li>
            <li>2. Approve the wrapper contract to spend your tokens</li>
            <li>3. Deposit tokens to receive sovaBTC at current exchange rate</li>
            <li>4. Use sovaBTC in DeFi or stake for rewards</li>
          </ul>
        </div>
      </div>
    </div>
  );
}