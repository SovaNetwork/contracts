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
import { componentStyles, designSystem } from '../../lib/design-system';
import { ArrowRight, Coins, Shield, ExternalLink } from 'lucide-react';

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
      <div className={`${componentStyles.card.elevated} p-6`}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Coins className="h-5 w-5 text-white" />
          </div>
          <h2 className={`${designSystem.typography.h3} text-slate-900`}>Wrap Tokens</h2>
        </div>
        <div className="text-center py-8">
          <ExternalLink className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Please connect your wallet to deposit tokens</p>
        </div>
      </div>
    );
  }

  if (chainId !== baseSepolia.id) {
    return (
      <div className={`${componentStyles.card.elevated} p-6`}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Coins className="h-5 w-5 text-white" />
          </div>
          <h2 className={`${designSystem.typography.h3} text-slate-900`}>Wrap Tokens</h2>
        </div>
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Please switch to Base Sepolia network</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${componentStyles.card.elevated} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Coins className="h-5 w-5 text-white" />
          </div>
          <h2 className={`${designSystem.typography.h3} text-slate-900`}>Wrap Tokens</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Step 1 of 3</p>
          <p className="text-sm font-medium text-slate-700">Deposit Assets</p>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Token Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Select Token to Wrap
          </label>
          <div className="relative">
            <select
              value={selectedToken?.address || ''}
              onChange={(e) => {
                const tokenConfig = availableTokens.find(t => t.address === e.target.value);
                setSelectedToken(tokenConfig);
                setAmount(''); // Reset amount when changing tokens
              }}
              className={`${componentStyles.input.base} w-full p-4 text-slate-900 font-medium`}
            >
              {availableTokens.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <ArrowRight className="h-4 w-4 text-slate-400 rotate-90" />
            </div>
          </div>
        </div>

        {/* Amount Input */}
        {selectedToken && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Amount to Wrap
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${componentStyles.input.base} w-full p-4 pr-24 text-lg font-medium text-slate-900`}
                step="any"
                min="0"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-600">{selectedToken.symbol}</span>
                <div className="w-6 h-6 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {selectedToken.symbol.slice(0, 2)}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600">Balance:</span>
                {tokenBalance.isLoading ? (
                  <div className="w-16 h-4 bg-slate-200 rounded animate-pulse"></div>
                ) : (
                  <span className="text-sm font-medium text-slate-900">{tokenBalance.displayBalance}</span>
                )}
              </div>
              <button
                onClick={() => setAmount(tokenBalance.formattedBalance)}
                className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                disabled={tokenBalance.isLoading}
              >
                Max
              </button>
            </div>
          </div>
        )}

        {/* Preview Section */}
        {selectedToken && amount && isValidAmount && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200/60">
            <h4 className="font-medium text-slate-900 mb-3">Transaction Preview</h4>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-slate-600">You deposit:</span>
                <span className="font-medium text-slate-900">{amount} {selectedToken.symbol}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <div className="flex items-center space-x-2">
                <span className="text-slate-600">You receive:</span>
                <span className="font-medium text-slate-900">~{amount} sovaBTC</span>
              </div>
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
                variant="secondary"
                size="lg"
                className="w-full"
                isLoading={approval.isPending || approval.isConfirming}
              >
                {!approval.isPending && !approval.isConfirming && 
                  `Approve ${selectedToken.symbol}`
                }
              </Button>
            ) : (
              <Button
                onClick={handleDeposit}
                disabled={deposit.isPending || deposit.isConfirming || !isValidAmount}
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={deposit.isPending || deposit.isConfirming}
              >
                {!deposit.isPending && !deposit.isConfirming && 'Wrap to sovaBTC'}
              </Button>
            )}

            {/* Input validation message */}
            {amount && !isValidAmount && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm text-red-700 font-medium">
                  {Number(amount) <= 0 
                    ? 'Amount must be greater than 0'
                    : 'Insufficient balance'
                  }
                </p>
              </div>
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
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200/60 rounded-lg p-5">
          <div className="flex items-center space-x-2 mb-3">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">How Token Wrapping Works</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Select Asset</p>
                  <p className="text-xs text-slate-600">Choose WBTC, LBTC, or USDC to wrap</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Approve Contract</p>
                  <p className="text-xs text-slate-600">Allow the wrapper to spend your tokens</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Wrap Tokens</p>
                  <p className="text-xs text-slate-600">Receive sovaBTC at 1:1 exchange rate</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-green-600">4</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Earn & Use</p>
                  <p className="text-xs text-slate-600">Stake for rewards or use in DeFi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}