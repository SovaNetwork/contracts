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
import { useStake } from '../../hooks/use-stake';
import { useUnstake } from '../../hooks/use-unstake';
import { useStakingPools } from '../../hooks/use-staking-pools';
import { CONTRACT_ADDRESSES } from '../../contracts/addresses';

type ActionType = 'stake' | 'unstake';

export function StakeForm() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const [actionType, setActionType] = useState<ActionType>('stake');
  const [amount, setAmount] = useState('');

  // Get contract addresses for current chain
  const stakingAddress = chainId === baseSepolia.id 
    ? CONTRACT_ADDRESSES[baseSepolia.id].STAKING
    : undefined;

  const sovaBTCAddress = chainId === baseSepolia.id 
    ? CONTRACT_ADDRESSES[baseSepolia.id].SOVABTC
    : undefined;

  // Real contract data
  const sovaBTCBalance = useTokenBalance(sovaBTCAddress || '0x0');
  const stakingData = useStakingPools(stakingAddress || '0x0');
  const tokenAllowance = useTokenAllowance(
    sovaBTCAddress || '0x0',
    stakingAddress || '0x0'
  );
  
  // Real transactions
  const approval = useTokenApproval();
  const stake = useStake();
  const unstake = useUnstake();

  // Calculate if approval is needed for staking
  const needsApproval = actionType === 'stake' && amount && sovaBTCBalance.decimals
    ? tokenAllowance.allowance < parseUnits(amount, sovaBTCBalance.decimals)
    : false;

  // Validate input amount
  const maxAmount = actionType === 'stake' 
    ? sovaBTCBalance.formattedBalance 
    : stakingData.formattedStakedAmount;

  const isValidAmount = amount && 
    Number(amount) > 0 && 
    Number(amount) <= Number(maxAmount);

  // Handle successful transactions
  useEffect(() => {
    if (approval.isSuccess) {
      console.log('Approval successful!');
      tokenAllowance.refetch(); // Refresh allowance
    }
  }, [approval.isSuccess, tokenAllowance]);

  useEffect(() => {
    if (stake.isSuccess) {
      console.log('Stake successful!');
      sovaBTCBalance.refetch(); // Refresh sovaBTC balance
      stakingData.refetch(); // Refresh staking data
      setAmount(''); // Clear form
    }
  }, [stake.isSuccess, sovaBTCBalance, stakingData]);

  useEffect(() => {
    if (unstake.isSuccess) {
      console.log('Unstake successful!');
      sovaBTCBalance.refetch(); // Refresh sovaBTC balance
      stakingData.refetch(); // Refresh staking data
      setAmount(''); // Clear form
    }
  }, [unstake.isSuccess, sovaBTCBalance, stakingData]);

  const handleApprove = async () => {
    if (!amount || !stakingAddress || !sovaBTCAddress) return;
    
    try {
      await approval.approve(
        sovaBTCAddress,
        stakingAddress,
        amount,
        sovaBTCBalance.decimals
      );
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleStake = async () => {
    if (!amount || !stakingAddress) return;
    
    try {
      await stake.stake(stakingAddress, amount, 8); // SovaBTC decimals
    } catch (error) {
      console.error('Stake failed:', error);
    }
  };

  const handleUnstake = async () => {
    if (!amount || !stakingAddress) return;
    
    try {
      await unstake.unstake(stakingAddress, amount, 8); // SovaBTC decimals
    } catch (error) {
      console.error('Unstake failed:', error);
    }
  };

  const handleUnstakeAll = async () => {
    if (!stakingAddress) return;
    
    try {
      await unstake.unstakeAll(stakingAddress);
    } catch (error) {
      console.error('Unstake all failed:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Stake SovaBTC</h2>
        <div className="text-center p-8">
          <p className="text-gray-600">Please connect your wallet to stake tokens</p>
        </div>
      </div>
    );
  }

  if (chainId !== baseSepolia.id) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Stake SovaBTC</h2>
        <div className="text-center p-8">
          <p className="text-gray-600">Please switch to Base Sepolia network</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Stake SovaBTC</h2>
      
      <div className="space-y-6">
        {/* Action Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => {
              setActionType('stake');
              setAmount('');
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              actionType === 'stake'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Stake
          </button>
          <button
            onClick={() => {
              setActionType('unstake');
              setAmount('');
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              actionType === 'unstake'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Unstake
          </button>
        </div>

        {/* Balance Display */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Your Balances</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Wallet sovaBTC:</p>
              <p className="font-mono">
                {sovaBTCBalance.isLoading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  sovaBTCBalance.displayBalance
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Staked sovaBTC:</p>
              <p className="font-mono">
                {stakingData.isLoadingStaked ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  stakingData.displayStakedAmount
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to {actionType === 'stake' ? 'Stake' : 'Unstake'}
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
            <span>
              Available: {actionType === 'stake' ? sovaBTCBalance.displayBalance : stakingData.displayStakedAmount}
            </span>
            <button
              onClick={() => setAmount(maxAmount)}
              className="text-blue-600 hover:underline"
              disabled={sovaBTCBalance.isLoading || stakingData.isLoadingStaked}
            >
              Max
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {actionType === 'stake' ? (
            <>
              {needsApproval ? (
                <Button
                  onClick={handleApprove}
                  disabled={approval.isPending || approval.isConfirming || !isValidAmount}
                  className="w-full"
                >
                  {approval.isPending && 'Waiting for signature...'}
                  {approval.isConfirming && 'Confirming approval...'}
                  {!approval.isPending && !approval.isConfirming && 'Approve sovaBTC'}
                </Button>
              ) : (
                <Button
                  onClick={handleStake}
                  disabled={stake.isPending || stake.isConfirming || !isValidAmount}
                  className="w-full"
                >
                  {stake.isPending && 'Waiting for signature...'}
                  {stake.isConfirming && 'Confirming stake...'}
                  {!stake.isPending && !stake.isConfirming && 'Stake SovaBTC'}
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                onClick={handleUnstake}
                disabled={unstake.isPending || unstake.isConfirming || !isValidAmount}
                className="w-full"
                variant="outline"
              >
                {unstake.isPending && 'Waiting for signature...'}
                {unstake.isConfirming && 'Confirming unstake...'}
                {!unstake.isPending && !unstake.isConfirming && 'Unstake Amount'}
              </Button>
              
              {Number(stakingData.displayStakedAmount) > 0 && (
                <Button
                  onClick={handleUnstakeAll}
                  disabled={unstake.isPending || unstake.isConfirming}
                  className="w-full"
                  variant="destructive"
                >
                  {unstake.isPending && 'Waiting for signature...'}
                  {unstake.isConfirming && 'Confirming exit...'}
                  {!unstake.isPending && !unstake.isConfirming && 'Exit (Unstake All + Claim)'}
                </Button>
              )}
            </>
          )}

          {/* Input validation message */}
          {amount && !isValidAmount && (
            <p className="text-sm text-red-600">
              {Number(amount) <= 0 
                ? 'Amount must be greater than 0'
                : `Insufficient ${actionType === 'stake' ? 'wallet' : 'staked'} balance`
              }
            </p>
          )}
        </div>

        {/* Transaction Status */}
        {(approval.hash || stake.hash || unstake.hash) && (
          <div className="space-y-2">
            {approval.hash && (
              <TransactionStatus 
                hash={approval.hash}
                type="Approval"
                onSuccess={() => console.log('Approval completed')}
                onError={(error) => console.error('Approval failed:', error)}
              />
            )}
            {stake.hash && (
              <TransactionStatus 
                hash={stake.hash}
                type="Stake"
                onSuccess={() => console.log('Stake completed')}
                onError={(error) => console.error('Stake failed:', error)}
              />
            )}
            {unstake.hash && (
              <TransactionStatus 
                hash={unstake.hash}
                type="Unstake"
                onSuccess={() => console.log('Unstake completed')}
                onError={(error) => console.error('Unstake failed:', error)}
              />
            )}
          </div>
        )}

        {/* Information */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-medium text-purple-900 mb-2">Staking Benefits:</h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Earn SOVA token rewards for staking sovaBTC</li>
            <li>• APY calculated based on current reward rate and pool size</li>
            <li>• Claim rewards anytime without unstaking</li>
            <li>• No lock-up period - unstake anytime</li>
            <li>• Use "Exit" to unstake all and claim rewards in one transaction</li>
          </ul>
        </div>
      </div>
    </div>
  );
}