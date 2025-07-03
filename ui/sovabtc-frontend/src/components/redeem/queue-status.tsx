'use client';

import React from 'react';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { TransactionStatus } from '../transactions/transaction-status';
import { useRedemptionStatus } from '../../hooks/use-redemption-status';
import { useFulfillment } from '../../hooks/use-fulfillment';
import { useAccount } from 'wagmi';

interface QueueStatusProps {
  queueAddress: `0x${string}`;
  onFulfillmentSuccess?: () => void;
}

export function QueueStatus({ queueAddress, onFulfillmentSuccess }: QueueStatusProps) {
  const { address } = useAccount();
  const redemptionStatus = useRedemptionStatus(queueAddress);
  const fulfillment = useFulfillment();

  const handleFulfill = async () => {
    if (!address) return;
    
    try {
      await fulfillment.fulfillOwnRedemption(queueAddress, address);
    } catch (error) {
      console.error('Fulfillment failed:', error);
    }
  };

  // Handle successful fulfillment
  React.useEffect(() => {
    if (fulfillment.isSuccess) {
      redemptionStatus.refetch();
      if (onFulfillmentSuccess) {
        onFulfillmentSuccess();
      }
    }
  }, [fulfillment.isSuccess, redemptionStatus, onFulfillmentSuccess]);

  if (!redemptionStatus.hasPendingRedemption) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Redemption Queue</h3>
        <div className="text-center p-8">
          <p className="text-gray-600">No pending redemptions</p>
          <p className="text-sm text-gray-500 mt-2">
            Submit a redemption request to see it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Redemption Queue Status</h3>
      
      <div className="space-y-6">
        {/* Redemption Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Your Redemption Request</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">SovaBTC Amount:</p>
              <p className="font-mono">{redemptionStatus.formattedSovaAmount}</p>
            </div>
            <div>
              <p className="text-gray-600">Will Receive:</p>
              <p className="font-mono">{redemptionStatus.formattedTokenAmount}</p>
            </div>
          </div>
        </div>

        {/* Status Display */}
        <div className="flex items-center space-x-3 p-4 border rounded-lg">
          {redemptionStatus.isReady ? (
            <>
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-green-700">Ready for Fulfillment!</p>
                <p className="text-sm text-green-600">Your redemption can now be processed</p>
              </div>
            </>
          ) : (
            <>
              <Clock className="h-6 w-6 text-blue-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-blue-700">Queue Period Active</p>
                <p className="text-sm text-blue-600">
                  Time remaining: {redemptionStatus.timeRemainingFormatted}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Queue Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-900 mb-2">About the Queue System</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Redemptions have a {Math.floor(redemptionStatus.redemptionDelay / 3600)}h queue period for security</li>
                <li>• Once ready, you can fulfill your redemption to receive tokens</li>
                <li>• Your tokens are reserved during the queue period</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {redemptionStatus.isReady && (
          <div className="space-y-3">
            <Button
              onClick={handleFulfill}
              disabled={fulfillment.isPending || fulfillment.isConfirming}
              className="w-full"
              size="lg"
            >
              {fulfillment.isPending && 'Waiting for signature...'}
              {fulfillment.isConfirming && 'Confirming fulfillment...'}
              {!fulfillment.isPending && !fulfillment.isConfirming && 'Fulfill Redemption'}
            </Button>

            {fulfillment.hash && (
              <TransactionStatus 
                hash={fulfillment.hash}
                type="Fulfillment"
                onSuccess={() => console.log('Fulfillment completed')}
                onError={(error) => console.error('Fulfillment failed:', error)}
              />
            )}
          </div>
        )}

        {/* Progress Bar for Time Remaining */}
        {!redemptionStatus.isReady && redemptionStatus.redemptionDelay > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{Math.round(100 - (Number(redemptionStatus.timeRemaining) / redemptionStatus.redemptionDelay * 100))}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.max(0, 100 - (Number(redemptionStatus.timeRemaining) / redemptionStatus.redemptionDelay * 100))}%`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}