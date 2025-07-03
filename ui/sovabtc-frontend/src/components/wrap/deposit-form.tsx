'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { useTokenBalance } from '@/hooks/use-token-balance';
import { useTokenAllowance } from '@/hooks/use-token-allowance';
import { useTokenApproval } from '@/hooks/use-token-approval';
import { useWrapperDeposit } from '@/hooks/use-wrapper-deposit';
import { CONTRACT_ADDRESSES, TOKEN_METADATA } from '@/contracts/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

export function DepositForm() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [amount, setAmount] = useState('');
  
  // Get contract addresses for current chain
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  
  // Available test tokens
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
  const tokenBalance = useTokenBalance(selectedToken as `0x${string}`);
  const tokenAllowance = useTokenAllowance(
    selectedToken as `0x${string}`,
    addresses?.WRAPPER as `0x${string}`,
    selectedTokenInfo?.decimals
  );
  
  // Real transactions
  const approval = useTokenApproval();
  const deposit = useWrapperDeposit();

  // Calculate if approval is needed
  const needsApproval = amount && selectedTokenInfo && tokenBalance.decimals
    ? tokenAllowance.needsApproval(parseUnits(amount, selectedTokenInfo.decimals))
    : false;

  // Validate amount input
  const isValidAmount = amount && 
    Number(amount) > 0 && 
    Number(amount) <= Number(tokenBalance.formattedBalance);

  // Handle successful transactions
  useEffect(() => {
    if (approval.isSuccess) {
      console.log('Approval successful, refreshing allowance');
      tokenAllowance.refetch();
    }
  }, [approval.isSuccess, tokenAllowance]);

  useEffect(() => {
    if (deposit.isSuccess) {
      console.log('Deposit successful, refreshing balances');
      tokenBalance.refetch();
      setAmount('');
    }
  }, [deposit.isSuccess, tokenBalance]);

  const handleApprove = async () => {
    if (!selectedToken || !amount || !selectedTokenInfo) return;
    
    try {
      await approval.approve(
        selectedToken as `0x${string}`,
        addresses?.WRAPPER as `0x${string}`,
        amount,
        selectedTokenInfo.decimals,
        false // Use exact approval for better security
      );
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleDeposit = async () => {
    if (!selectedToken || !amount || !selectedTokenInfo) return;
    
    try {
      await deposit.deposit(
        selectedToken as `0x${string}`,
        amount,
        selectedTokenInfo.decimals
      );
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  const getButtonText = () => {
    if (approval.isPending) return 'Waiting for signature...';
    if (approval.isConfirming) return 'Confirming approval...';
    if (deposit.isPending) return 'Waiting for signature...';
    if (deposit.isConfirming) return 'Confirming deposit...';
    if (needsApproval) return `Approve ${selectedTokenInfo?.symbol}`;
    return 'Deposit';
  };

  const getButtonAction = () => {
    return needsApproval ? handleApprove : handleDeposit;
  };

  const isButtonDisabled = 
    !isValidAmount || 
    approval.isPending || 
    approval.isConfirming || 
    deposit.isPending || 
    deposit.isConfirming ||
    tokenBalance.isLoading ||
    tokenAllowance.isLoading;

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <p className="text-lg font-medium">Wallet Not Connected</p>
            <p className="text-sm text-muted-foreground">Please connect your wallet to deposit tokens</p>
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
    <Card>
      <CardHeader>
        <CardTitle>Deposit Tokens</CardTitle>
        <CardDescription>
          Deposit BTC-pegged tokens to receive sovaBTC
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Token Selection */}
        <div className="space-y-2">
          <Label htmlFor="token-select">Token</Label>
          <Select value={selectedToken} onValueChange={setSelectedToken}>
            <SelectTrigger>
              <SelectValue placeholder="Select a token" />
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
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-20"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-sm text-muted-foreground">
                {selectedTokenInfo?.symbol}
              </span>
            </div>
          </div>
          
          {/* Balance Display */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Balance: {tokenBalance.isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin inline" />
              ) : (
                `${tokenBalance.displayBalance} ${selectedTokenInfo?.symbol}`
              )}
            </span>
            <button
              type="button"
              onClick={() => setAmount(tokenBalance.formattedBalance)}
              className="text-primary hover:underline"
              disabled={tokenBalance.isLoading}
            >
              Max
            </button>
          </div>
        </div>

        {/* Allowance Status */}
        {selectedToken && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span>Allowance:</span>
              <span>
                {tokenAllowance.isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : tokenAllowance.isInfiniteAllowance ? (
                  <span className="text-green-600 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Unlimited
                  </span>
                ) : (
                  `${tokenAllowance.displayAllowance} ${selectedTokenInfo?.symbol}`
                )}
              </span>
            </div>
          </div>
        )}

        {/* Transaction Button */}
        <Button
          onClick={getButtonAction()}
          disabled={isButtonDisabled}
          className="w-full"
          size="lg"
        >
          {(approval.isPending || approval.isConfirming || deposit.isPending || deposit.isConfirming) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {getButtonText()}
        </Button>

        {/* Transaction Status */}
        {(approval.hash || deposit.hash) && (
          <div className="space-y-2">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {approval.hash && !deposit.hash ? 'Approval' : 'Deposit'} Transaction
                </span>
                <a
                  href={`https://sepolia.basescan.org/tx/${approval.hash || deposit.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center text-sm"
                >
                  View on Explorer
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {approval.isConfirming || deposit.isConfirming ? (
                  <span className="flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Confirming...
                  </span>
                ) : approval.isSuccess || deposit.isSuccess ? (
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
        )}

        {/* Error Display */}
        {(approval.error || deposit.error) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {approval.error?.message || deposit.error?.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}