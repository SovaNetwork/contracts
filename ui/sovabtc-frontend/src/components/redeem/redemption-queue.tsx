'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { useTokenBalance } from '@/hooks/use-token-balance';
import { useTokenAllowance } from '@/hooks/use-token-allowance';
import { useTokenApproval } from '@/hooks/use-token-approval';
import { useRedemptionRequest } from '@/hooks/use-redemption-request';
import { useRedemptionStatus } from '@/hooks/use-redemption-status';
import { useRedemptionFulfillment } from '@/hooks/use-redemption-fulfillment';
import { CONTRACT_ADDRESSES, TOKEN_METADATA } from '@/contracts/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, ExternalLink, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';

export function RedemptionQueue() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [amount, setAmount] = useState('');
  
  // Get contract addresses for current chain
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  
  // Available test tokens for redemption
  const testTokens = [
    { address: addresses?.WBTC_TEST, ...TOKEN_METADATA.WBTC },
    { address: addresses?.LBTC_TEST, ...TOKEN_METADATA.LBTC },
    { address: addresses?.USDC_TEST, ...TOKEN_METADATA.USDC },
  ].filter(token => token.address);

  // Set default token
  useEffect(() => {
    if (testTokens.length > 0 && !selectedToken) {
      setSelectedToken(testTokens[0].address!);
    }
  }, [testTokens, selectedToken]);

  // Get selected token info
  const selectedTokenInfo = testTokens.find(token => token.address === selectedToken);
  
  // Real contract data
  const sovaBTCBalance = useTokenBalance(addresses?.SOVABTC as `0x${string}`);
  const sovaBTCAllowance = useTokenAllowance(
    addresses?.SOVABTC as `0x${string}`,
    addresses?.REDEMPTION_QUEUE as `0x${string}`,
    8 // SovaBTC decimals
  );
  
  // Redemption status
  const redemptionStatus = useRedemptionStatus();
  
  // Real transactions
  const approval = useTokenApproval();
  const redemptionRequest = useRedemptionRequest();
  const fulfillment = useRedemptionFulfillment();

  // Calculate if approval is needed for SovaBTC
  const needsApproval = amount && sovaBTCBalance.decimals
    ? sovaBTCAllowance.needsApproval(parseUnits(amount, 8))
    : false;

  // Validate amount input
  const isValidAmount = amount && 
    Number(amount) > 0 && 
    Number(amount) <= Number(sovaBTCBalance.formattedBalance);

  // Handle successful transactions
  useEffect(() => {
    if (approval.isSuccess) {
      console.log('SovaBTC approval successful, refreshing allowance');
      sovaBTCAllowance.refetch();
    }
  }, [approval.isSuccess, sovaBTCAllowance]);

  useEffect(() => {
    if (redemptionRequest.isSuccess) {
      console.log('Redemption request successful, refreshing status');
      redemptionStatus.refetch();
      sovaBTCBalance.refetch();
      setAmount('');
    }
  }, [redemptionRequest.isSuccess, redemptionStatus, sovaBTCBalance]);

  useEffect(() => {
    if (fulfillment.isSuccess) {
      console.log('Redemption fulfillment successful, refreshing status');
      redemptionStatus.refetch();
      sovaBTCBalance.refetch();
    }
  }, [fulfillment.isSuccess, redemptionStatus, sovaBTCBalance]);

  const handleApprove = async () => {
    if (!amount) return;
    
    try {
      await approval.approve(
        addresses?.SOVABTC as `0x${string}`,
        addresses?.REDEMPTION_QUEUE as `0x${string}`,
        amount,
        8, // SovaBTC decimals
        false
      );
    } catch (error) {
      console.error('SovaBTC approval failed:', error);
    }
  };

  const handleRequestRedemption = async () => {
    if (!selectedToken || !amount) return;
    
    try {
      await redemptionRequest.requestRedemption(
        selectedToken as `0x${string}`,
        amount
      );
    } catch (error) {
      console.error('Redemption request failed:', error);
    }
  };

  const handleFulfillRedemption = async () => {
    try {
      await fulfillment.fulfillMyRedemption();
    } catch (error) {
      console.error('Redemption fulfillment failed:', error);
    }
  };

  const getButtonText = () => {
    if (approval.isPending) return 'Waiting for signature...';
    if (approval.isConfirming) return 'Confirming approval...';
    if (redemptionRequest.isPending) return 'Waiting for signature...';
    if (redemptionRequest.isConfirming) return 'Confirming request...';
    if (needsApproval) return 'Approve sovaBTC';
    return 'Request Redemption';
  };

  const getButtonAction = () => {
    return needsApproval ? handleApprove : handleRequestRedemption;
  };

  const isButtonDisabled = 
    !isValidAmount || 
    approval.isPending || 
    approval.isConfirming || 
    redemptionRequest.isPending || 
    redemptionRequest.isConfirming ||
    sovaBTCBalance.isLoading ||
    sovaBTCAllowance.isLoading ||
    redemptionStatus.hasActiveRedemption;

  // Calculate progress for countdown
  const progressPercentage = redemptionStatus.redemptionDelay > 0 
    ? Math.max(0, 100 - (redemptionStatus.timeRemaining / redemptionStatus.redemptionDelay) * 100)
    : 0;

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <p className="text-lg font-medium">Wallet Not Connected</p>
            <p className="text-sm text-muted-foreground">Please connect your wallet to manage redemptions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!addresses) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unsupported network. Please switch to Base Sepolia.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Redemption Status */}
      {redemptionStatus.hasActiveRedemption && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Active Redemption</span>
              <Badge variant={redemptionStatus.isReady ? "default" : "secondary"}>
                {redemptionStatus.isReady ? "Ready" : "Pending"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Your redemption is {redemptionStatus.isReady ? 'ready for fulfillment' : 'in the queue'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Amount</Label>
                <p className="text-lg font-semibold">
                  {redemptionStatus.redemptionData?.formattedAmount} sovaBTC
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Target Token</Label>
                <p className="text-lg font-semibold">
                  {redemptionStatus.tokenMetadata?.symbol}
                </p>
              </div>
            </div>

            {!redemptionStatus.isReady && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Time Remaining</span>
                  <span className="font-mono">{redemptionStatus.formattedTimeRemaining}</span>
                </div>
                <Progress value={progressPercentage} className="w-full" />
              </div>
            )}

            {redemptionStatus.isReady && (
              <Button
                onClick={handleFulfillRedemption}
                disabled={fulfillment.isPending || fulfillment.isConfirming}
                className="w-full"
                size="lg"
              >
                {fulfillment.isPending || fulfillment.isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {fulfillment.isPending ? 'Waiting for signature...' : 'Confirming fulfillment...'}
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Fulfill Redemption
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Request New Redemption */}
      {!redemptionStatus.hasActiveRedemption && (
        <Card>
          <CardHeader>
            <CardTitle>Request Redemption</CardTitle>
            <CardDescription>
              Queue a redemption of sovaBTC for underlying tokens
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Target Token Selection */}
            <div className="space-y-2">
              <Label htmlFor="token-select">Target Token</Label>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target token" />
                </SelectTrigger>
                <SelectContent>
                  {testTokens.map((token) => (
                    <SelectItem key={token.address} value={token.address!}>
                      <div className="flex items-center space-x-2">
                        <span>{token.symbol}</span>
                        <span className="text-sm text-muted-foreground">({token.name})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">sovaBTC Amount</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-24"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-sm text-muted-foreground">sovaBTC</span>
                </div>
              </div>
              
              {/* Balance Display */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Balance: {sovaBTCBalance.isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin inline" />
                  ) : (
                    `${sovaBTCBalance.displayBalance} sovaBTC`
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setAmount(sovaBTCBalance.formattedBalance)}
                  className="text-primary hover:underline"
                  disabled={sovaBTCBalance.isLoading}
                >
                  Max
                </button>
              </div>
            </div>

            {/* Allowance Status */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span>sovaBTC Allowance:</span>
                <span>
                  {sovaBTCAllowance.isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : sovaBTCAllowance.isInfiniteAllowance ? (
                    <span className="text-green-600 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Unlimited
                    </span>
                  ) : (
                    `${sovaBTCAllowance.displayAllowance} sovaBTC`
                  )}
                </span>
              </div>
            </div>

            {/* Queue Delay Info */}
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Redemptions have a {Math.floor(redemptionStatus.redemptionDelay / 3600)} hour queue delay for security.
              </AlertDescription>
            </Alert>

            {/* Transaction Button */}
            <Button
              onClick={getButtonAction()}
              disabled={isButtonDisabled}
              className="w-full"
              size="lg"
            >
              {(approval.isPending || approval.isConfirming || redemptionRequest.isPending || redemptionRequest.isConfirming) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {getButtonText()}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Transaction Status */}
      {(approval.hash || redemptionRequest.hash || fulfillment.hash) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {fulfillment.hash ? 'Fulfillment' : redemptionRequest.hash ? 'Redemption Request' : 'Approval'} Transaction
                  </span>
                  <a
                    href={`https://sepolia.basescan.org/tx/${fulfillment.hash || redemptionRequest.hash || approval.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center text-sm"
                  >
                    View on Explorer
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {(approval.isConfirming || redemptionRequest.isConfirming || fulfillment.isConfirming) ? (
                    <span className="flex items-center">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Confirming...
                    </span>
                  ) : (approval.isSuccess || redemptionRequest.isSuccess || fulfillment.isSuccess) ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Confirmed
                    </span>
                  ) : (
                    'Pending confirmation'
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {(approval.error || redemptionRequest.error || fulfillment.error) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {approval.error?.message || redemptionRequest.error?.message || fulfillment.error?.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}