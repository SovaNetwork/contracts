'use client';

import React from 'react';
import { TrendingUp, Award, Clock, DollarSign } from 'lucide-react';
import { Button } from '../ui/button';
import { TransactionStatus } from '../transactions/transaction-status';
import { useStakingPools } from '../../hooks/use-staking-pools';
import { useClaimRewards } from '../../hooks/use-claim-rewards';

interface RewardsDisplayProps {
  stakingAddress: `0x${string}`;
  onRewardsClaimed?: () => void;
}

export function RewardsDisplay({ stakingAddress, onRewardsClaimed }: RewardsDisplayProps) {
  const stakingData = useStakingPools(stakingAddress);
  const claimRewards = useClaimRewards();

  const handleClaimRewards = async () => {
    try {
      await claimRewards.claimRewards(stakingAddress);
    } catch (error) {
      console.error('Claim rewards failed:', error);
    }
  };

  // Handle successful reward claim
  React.useEffect(() => {
    if (claimRewards.isSuccess) {
      stakingData.refetch();
      if (onRewardsClaimed) {
        onRewardsClaimed();
      }
    }
  }, [claimRewards.isSuccess, stakingData, onRewardsClaimed]);

  const hasEarnedRewards = Number(stakingData.displayEarnedRewards) > 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-6">Staking Rewards</h3>
      
      <div className="space-y-6">
        {/* Rewards Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* APY */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">APY</span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {stakingData.isLoading ? (
                <span className="animate-pulse">--</span>
              ) : (
                `${stakingData.apy.toFixed(1)}%`
              )}
            </p>
          </div>

          {/* Earned Rewards */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Earned</span>
            </div>
            <p className="text-lg font-bold text-blue-700">
              {stakingData.isLoadingRewards ? (
                <span className="animate-pulse">--</span>
              ) : (
                `${stakingData.displayEarnedRewards} SOVA`
              )}
            </p>
          </div>

          {/* Your Stake */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Staked</span>
            </div>
            <p className="text-lg font-bold text-purple-700">
              {stakingData.isLoadingStaked ? (
                <span className="animate-pulse">--</span>
              ) : (
                `${stakingData.displayStakedAmount} sovaBTC`
              )}
            </p>
          </div>

          {/* Rewards Status */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Status</span>
            </div>
            <p className="text-sm font-bold text-orange-700">
              {stakingData.isRewardsActive ? (
                <>Active<br />
                <span className="text-xs">{stakingData.timeRemainingFormatted}</span></>
              ) : (
                'Ended'
              )}
            </p>
          </div>
        </div>

        {/* Pool Statistics */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Pool Statistics</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Staked:</span>
              <span className="font-mono">{stakingData.displayTotalSupply} sovaBTC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reward Rate:</span>
              <span className="font-mono">
                {Number(stakingData.rewardRate) > 0 
                  ? `${(Number(stakingData.rewardRate) * 86400).toFixed(0)} SOVA/day`
                  : '0 SOVA/day'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Claim Rewards Section */}
        {hasEarnedRewards && (
          <div className="border border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-green-900">Claimable Rewards</h4>
                <p className="text-sm text-green-700">
                  You have {stakingData.displayEarnedRewards} SOVA tokens ready to claim
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleClaimRewards}
              disabled={claimRewards.isPending || claimRewards.isConfirming}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {claimRewards.isPending && 'Waiting for signature...'}
              {claimRewards.isConfirming && 'Confirming claim...'}
              {!claimRewards.isPending && !claimRewards.isConfirming && 'Claim Rewards'}
            </Button>

            {claimRewards.hash && (
              <div className="mt-3">
                <TransactionStatus 
                  hash={claimRewards.hash}
                  type="Claim Rewards"
                  onSuccess={() => console.log('Rewards claimed successfully')}
                  onError={(error) => console.error('Claim failed:', error)}
                />
              </div>
            )}
          </div>
        )}

        {/* No Rewards Message */}
        {!hasEarnedRewards && Number(stakingData.displayStakedAmount) > 0 && (
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No rewards earned yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Rewards accrue over time based on your staked amount
            </p>
          </div>
        )}

        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How Staking Rewards Work</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Stake sovaBTC to earn SOVA token rewards</li>
            <li>• Rewards are distributed continuously while staking</li>
            <li>• APY depends on total staked amount and reward rate</li>
            <li>• Claim rewards anytime without unstaking</li>
            <li>• Use "Exit" to unstake all and claim rewards in one transaction</li>
          </ul>
        </div>
      </div>
    </div>
  );
}