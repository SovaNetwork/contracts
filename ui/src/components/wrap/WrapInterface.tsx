'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ArrowDown, ExternalLink } from 'lucide-react';
import { type Address } from 'viem';

import { TokenSelector } from './TokenSelector';
import { AmountInput } from './AmountInput';
import { useNetworkTokens, useActiveNetwork } from '@/hooks/web3/useActiveNetwork';
import { getExplorerUrl } from '@/contracts/addresses';
import { useTokenBalance } from '@/hooks/web3/useTokenBalance';
import { useTokenWrapping } from '@/hooks/web3/useTokenWrapping';
import { formatTokenAmount, parseTokenAmount } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { RealTimeAllowanceChecker } from './RealTimeAllowanceChecker';

export function WrapInterface() {
  const { address, isConnected } = useAccount();
  
  // Get network-aware tokens and contract addresses
  const { tokens } = useNetworkTokens();
  const { getContractAddress, activeChainId, walletChainId, isNetworkMismatch } = useActiveNetwork();
  const wrapperAddress = getContractAddress('wrapper');
  
  // EMERGENCY NETWORK DEBUG - Add this at the top of component
  useEffect(() => {
    const checkActualNetwork = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const networkName = chainId === '0x1b59c' ? 'OP Sepolia' : 
                             chainId === '0x14a34' ? 'Base Sepolia' :
                             chainId === '0xaa36a7' ? 'Ethereum Sepolia' : 
                             'Unknown';
          
          console.log('🚨 EMERGENCY NETWORK DEBUG:', {
            rawChainId: chainId,
            decimalChainId: parseInt(chainId, 16),
            networkName,
            expectedOPSepolia: 11155420,
            expectedBaseSepolia: 84532,
            actuallyOn: parseInt(chainId, 16) === 11155420 ? 'OP Sepolia ✅' : 
                        parseInt(chainId, 16) === 84532 ? 'Base Sepolia ⚠️' : 'Other',
            wrapperBeingUsed: wrapperAddress,
            expectedOPWrapper: '0xd2A7029baCCd24799ba497174859580Cd25e4E7F',
            expectedBaseWrapper: '0x30cc05366CC687c0ab75e3908Fe2b2C5BB679db8',
            isUsingCorrectWrapper: wrapperAddress?.toLowerCase() === 
              (parseInt(chainId, 16) === 11155420 ? '0xd2A7029baCCd24799ba497174859580Cd25e4E7F' : '0x30cc05366CC687c0ab75e3908Fe2b2C5BB679db8').toLowerCase()
          });
        } catch (error) {
          console.error('Failed to check network:', error);
        }
      }
    };
    
    checkActualNetwork();
  }, [wrapperAddress]);

  // Debug logging for network state
  useEffect(() => {
    console.log('🌐 NETWORK DEBUG (WrapInterface):', {
      activeChainId,
      walletChainId,
      wrapperAddress,
      isNetworkMismatch,
      expectedOPWrapper: '0xd2A7029baCCd24799ba497174859580Cd25e4E7F',
      expectedBaseWrapper: '0x30cc05366CC687c0ab75e3908Fe2b2C5BB679db8',
      isUsingCorrectWrapper: wrapperAddress?.toLowerCase() !== '0x30cc05366cc687c0ab75e3908fe2b2c5bb679db8'.toLowerCase()
    });
  }, [activeChainId, walletChainId, wrapperAddress, isNetworkMismatch]);

  // Component state
  const [selectedToken, setSelectedToken] = useState<typeof tokens[number] | null>(null);
  const [amount, setAmount] = useState('');

  // Debug logging for token selection
  useEffect(() => {
    if (selectedToken) {
      console.log('🪙 TOKEN SELECTED:', {
        symbol: selectedToken.symbol,
        address: selectedToken.address,
        decimals: selectedToken.decimals,
        expectedOPWBTC: '0x412Bd95e843b7982702F12b8De0a5d414B482653',
        expectedBaseWBTC: '0x0a3745b48f350949Ef5D024A01eE143741EA2CE0',
        isCorrectForNetwork: activeChainId === 11155420 ? 
          selectedToken.address.toLowerCase() === '0x412Bd95e843b7982702F12b8De0a5d414B482653'.toLowerCase() :
          activeChainId === 84532 ?
          selectedToken.address.toLowerCase() === '0x0a3745b48f350949Ef5D024A01eE143741EA2CE0'.toLowerCase() :
          'Unknown network'
      });
    }
  }, [selectedToken, activeChainId]);

  // Get user's token balance
  const { balance: tokenBalance, refetch: refetchBalance } = useTokenBalance({
    tokenAddress: selectedToken?.address as Address,
    accountAddress: address,
  });

  // Get wrapping hook with integrated approval
  const {
    executeWrapWithApproval,
    executeWrapWithForceApproval,
    validateWrap,
    estimateOutput,
    minimumDeposit,
    overallStatus,
    isApproving,
    isWrapping,
    isWrapConfirmed,
    useTokenAllowance,
    convertToSatoshis,
    error: wrapError,
    wrapHash,
  } = useTokenWrapping({
    userAddress: address,
  });

  // Get current allowance for the selected token
  const { data: currentAllowance } = useTokenAllowance(selectedToken?.address as Address);

  // Parse amount to bigint for calculations
  const amountWei = useMemo(() => {
    if (!amount || !selectedToken) return 0n;
    try {
      console.log('🔍 AMOUNT PARSING DEBUG (ENHANCED):', {
        userInput: amount,
        tokenSymbol: selectedToken.symbol,
        tokenDecimals: selectedToken.decimals,
        step: 'before parseTokenAmount'
      });
      
      const parsed = parseTokenAmount(amount, selectedToken.decimals);
      
      // Enhanced verification
      const expectedForWBTC = amount === '5' && selectedToken.decimals === 8 ? 500000000n : null;
      const actuallyGot = parsed;
      const isExpectedAmount = expectedForWBTC ? actuallyGot === expectedForWBTC : 'N/A';
      
      console.log('✅ AMOUNT PARSING RESULT (ENHANCED):', {
        userInput: amount,
        tokenSymbol: selectedToken.symbol,
        tokenDecimals: selectedToken.decimals,
        parsedAmount: parsed.toString(),
        expectedForWBTC_5: expectedForWBTC?.toString() || 'N/A',
        isCorrectAmount: isExpectedAmount,
        multiplierTest: amount === '5' ? `5 * 10^${selectedToken.decimals} = ${5 * Math.pow(10, selectedToken.decimals)}` : 'N/A',
        actualVsExpected: expectedForWBTC ? `Got ${parsed.toString()} vs Expected ${expectedForWBTC.toString()}` : 'N/A'
      });
      
      return parsed;
    } catch (error) {
      console.error('❌ AMOUNT PARSING ERROR:', error);
      return 0n;
    }
  }, [amount, selectedToken]);

  // Check if approval is needed for current amount
  const needsApproval = useMemo(() => {
    if (!selectedToken || !amountWei || amountWei === 0n || !currentAllowance) return false;
    return currentAllowance < amountWei;
  }, [selectedToken, amountWei, currentAllowance]);

  // Validate the wrap transaction (UPDATED FOR SATOSHIS)
  const wrapValidation = useMemo(() => {
    if (!selectedToken || !amountWei) {
      return { isValid: false, error: 'Please enter an amount' };
    }
    return validateWrap(selectedToken.address as Address, amountWei, Number(selectedToken.decimals));
  }, [selectedToken, amountWei, validateWrap]);

  // Estimate output sovaBTC amount
  const estimatedOutput = useMemo(() => {
    if (!selectedToken || !amountWei || amountWei === 0n) return 0n;
    return estimateOutput(amountWei, selectedToken.decimals);
  }, [selectedToken, amountWei, estimateOutput]);

  // Handle wrap execution (includes approval if needed) - UPDATED FOR SATOSHIS
  const handleWrap = async () => {
    if (!selectedToken || !amountWei || !wrapValidation.isValid) return;

    try {
      const satoshiAmount = convertToSatoshis(amountWei, Number(selectedToken.decimals));
      
      console.log('🚀 WRAP EXECUTION DEBUG (COMPREHENSIVE):', {
        // Network info
        activeChainId,
        walletChainId,
        networkName: activeChainId === 11155420 ? 'OP Sepolia' : activeChainId === 84532 ? 'Base Sepolia' : 'Unknown',
        
        // Contract addresses
        wrapperAddress,
        expectedOPWrapper: '0xd2A7029baCCd24799ba497174859580Cd25e4E7F',
        expectedBaseWrapper: '0x30cc05366CC687c0ab75e3908Fe2b2C5BB679db8',
        isUsingRightWrapper: activeChainId === 11155420 ? 
          wrapperAddress?.toLowerCase() === '0xd2A7029baCCd24799ba497174859580Cd25e4E7F'.toLowerCase() :
          activeChainId === 84532 ?
          wrapperAddress?.toLowerCase() === '0x30cc05366CC687c0ab75e3908Fe2b2C5BB679db8'.toLowerCase() :
          'Unknown network',
        
        // Token info
        tokenSymbol: selectedToken.symbol,
        tokenAddress: selectedToken.address,
        tokenDecimals: selectedToken.decimals,
        expectedOPWBTC: '0x412Bd95e843b7982702F12b8De0a5d414B482653',
        expectedBaseWBTC: '0x0a3745b48f350949Ef5D024A01eE143741EA2CE0',
        isUsingRightToken: activeChainId === 11155420 ? 
          selectedToken.address.toLowerCase() === '0x412Bd95e843b7982702F12b8De0a5d414B482653'.toLowerCase() :
          activeChainId === 84532 ?
          selectedToken.address.toLowerCase() === '0x0a3745b48f350949Ef5D024A01eE143741EA2CE0'.toLowerCase() :
          'Unknown network',
        
        // Amount info
        userInputAmount: amount,
        parsedTokenAmount: amountWei.toString(),
        convertedSatoshiAmount: satoshiAmount.toString(),
        expectedFor5WBTC: '500000000',
        isAmountCorrect: amount === '5' && selectedToken.decimals === 8 ? amountWei.toString() === '500000000' : 'N/A',
        
        // Approval info
        currentAllowance: currentAllowance?.toString() || '0',
        needsApproval,
        
        // Critical validation
        willFailDueToWrongWrapper: activeChainId === 11155420 && wrapperAddress?.toLowerCase() === '0x30cc05366CC687c0ab75e3908Fe2b2C5BB679db8'.toLowerCase(),
        willFailDueToWrongAmount: amount === '5' && selectedToken.decimals === 8 && amountWei.toString() !== '500000000'
      });
      
      // CRITICAL: Stop execution if we detect wrong wrapper
      if (activeChainId === 11155420 && wrapperAddress?.toLowerCase() === '0x30cc05366CC687c0ab75e3908Fe2b2C5BB679db8'.toLowerCase()) {
        console.error('🚨 CRITICAL: Using Base Sepolia wrapper on OP Sepolia! Stopping execution.');
        alert('CRITICAL ERROR: Wrong wrapper contract detected. Please refresh the page and try again.');
        return;
      }
      
      // CRITICAL: Stop execution if we detect wrong amount
      if (amount === '5' && selectedToken.decimals === 8 && amountWei.toString() !== '500000000') {
        console.error('🚨 CRITICAL: Amount conversion bug detected! Expected 500000000, got ' + amountWei.toString());
        alert('CRITICAL ERROR: Amount conversion bug detected. Please refresh the page and try again.');
        return;
      }
      
      console.log('✅ VALIDATION PASSED - Proceeding with wrap...');
      
      await executeWrapWithApproval(
        selectedToken.address as Address, 
        amountWei, // This is the token amount for approval
        Number(selectedToken.decimals), // This tells the hook how to convert to satoshis
        currentAllowance || 0n
      );
      
      // Reset form on success
      if (overallStatus === 'confirmed') {
        setAmount('');
      }
    } catch (error) {
      console.error('❌ WRAP FAILED:', error);
    }
  };

  // Emergency handler with forced approval (UPDATED FOR SATOSHIS)
  const handleForceApprovalWrap = async () => {
    if (!selectedToken || !amountWei || !wrapValidation.isValid) return;

    try {
      const satoshiAmount = convertToSatoshis(amountWei, Number(selectedToken.decimals));
      
      console.log('🚨 EMERGENCY: Starting wrap with FORCED approval (FIXED):', {
        token: selectedToken.symbol,
        tokenAmount: amountWei.toString(),
        satoshiAmount: satoshiAmount.toString(),
        currentAllowance: currentAllowance?.toString() || '0',
      });
      
      await executeWrapWithForceApproval(
        selectedToken.address as Address, 
        amountWei,
        Number(selectedToken.decimals),
        currentAllowance || 0n
      );
      
      // Reset form on success
      if (overallStatus === 'confirmed') {
        setAmount('');
      }
    } catch (error) {
      console.error('Force approval wrap failed:', error);
    }
  };

  // Handle emergency force wrap (bypasses all checks)
  const handleForceWrap = async () => {
    if (!selectedToken || !amountWei) return;

    try {
      console.log('🚨 FORCE WRAP & APPROVAL EMERGENCY:', {
        token: selectedToken.symbol,
        amount: amountWei.toString(),
        reason: 'Manual intervention due to allowance issues'
      });
      
      await executeWrapWithForceApproval(
        selectedToken.address as Address, 
        amountWei,
        Number(selectedToken.decimals),
        currentAllowance || 0n
      );
    } catch (error) {
      console.error('❌ FORCE WRAP FAILED:', error);
    }
  };

  // Check if transaction is in progress
  const isTransactionPending = isApproving || isWrapping;

  // Refetch balances after successful transactions
  useEffect(() => {
    if (isWrapConfirmed) {
      // Refetch token balances after successful wrap
      setTimeout(() => {
        refetchBalance();
      }, 2000);
    }
  }, [isWrapConfirmed, refetchBalance]);

  // Debug info for troubleshooting
  useEffect(() => {
    if (selectedToken && amountWei > 0n) {
      console.log('Wrap Interface State:', {
        selectedToken: selectedToken.symbol,
        amount: amount,
        amountWei: amountWei.toString(),
        currentAllowance: currentAllowance?.toString() || 'Loading...',
        needsApproval,
        overallStatus,
        isTransactionPending,
        validationError: wrapValidation.error,
        spenderAddress: wrapperAddress,
        tokenAddress: selectedToken.address,
      });
    }
  }, [selectedToken, amount, amountWei, currentAllowance, needsApproval, overallStatus, isTransactionPending, wrapValidation.error]);

  return (
    <div className="max-w-md mx-auto">
      <div className="defi-card p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold gradient-text mb-2">Wrap Bitcoin</h2>
          <p className="text-foreground/60">
            Convert Bitcoin-backed tokens into sovaBTC
          </p>
        </div>

        {!isConnected ? (
          /* Wallet Connection */
          <div className="text-center py-8">
            <p className="text-foreground/60 mb-4">Connect your wallet to get started</p>
            <ConnectButton />
          </div>
        ) : (
          <div className="space-y-4">
            {/* From Token Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">From</label>
              <TokenSelector
                selectedToken={selectedToken}
                onTokenSelect={setSelectedToken}
                userAddress={address}
              />
            </div>

            {/* Amount Input */}
            {selectedToken && (
              <AmountInput
                value={amount}
                onChange={setAmount}
                selectedToken={selectedToken}
                balance={tokenBalance}
                minimumAmount={minimumDeposit as bigint | undefined}
                disabled={isTransactionPending}
              />
            )}

            {/* Arrow Down */}
            {selectedToken && amount && (
              <div className="flex justify-center py-2">
                <div className="p-2 bg-card border border-border/50 rounded-full">
                  <ArrowDown className="w-5 h-5 text-foreground/60" />
                </div>
              </div>
            )}

            {/* To Token Section */}
            {selectedToken && amount && estimatedOutput > 0n && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">To</label>
                <div className="p-4 bg-card/50 border border-border/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink flex items-center justify-center text-sm font-bold">
                        sB
                      </div>
                      <div>
                        <div className="font-medium">sovaBTC</div>
                        <div className="text-sm text-foreground/60">SovaBTC</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-medium">
                        {formatTokenAmount(estimatedOutput, 8, 8)}
                      </div>
                      <div className="text-sm text-foreground/60">Estimated</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Real-time Allowance Debugging */}
            {selectedToken && address && wrapperAddress && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                <div className="text-red-300 font-bold text-lg mb-2">🔍 REAL-TIME ALLOWANCE DEBUG</div>
                <RealTimeAllowanceChecker 
                  tokenAddress={selectedToken.address as Address}
                  spenderAddress={wrapperAddress}
                  userAddress={address}
                  requiredAmount={amountWei}
                  tokenSymbol={selectedToken.symbol}
                  tokenDecimals={selectedToken.decimals}
                />
              </div>
            )}

            {/* Debug Panel (Enhanced) */}
            {selectedToken && amountWei > 0n && (
              <div className="mt-4 p-4 bg-purple-900/20 border border-purple-600 rounded-lg text-xs">
                <div className="text-purple-300 font-bold text-lg mb-2">Debug Info (SATOSHI FIXED)</div>
                
                <div className="mb-2">
                  <div className="text-purple-300 font-bold">Token: {selectedToken.symbol}</div>
                  <div>({selectedToken.address})</div>
                  <div>Spender: {wrapperAddress}</div>
                </div>
                
                <div className="mb-2">
                  <div className="text-purple-300 font-bold">Amount: {amountWei.toString()} ({formatTokenAmount(amountWei, selectedToken.decimals)} {selectedToken.symbol})</div>
                  <div>Current Allowance: {currentAllowance?.toString() || 'Loading...'} ({currentAllowance ? formatTokenAmount(currentAllowance, selectedToken.decimals) : '0.00'} {selectedToken.symbol})</div>
                  <div>Needs Approval: {needsApproval ? 'YES' : 'NO'}</div>
                  <div>Overall Status: {overallStatus}</div>
                  <div>Is Approving: {isApproving ? 'YES' : 'NO'}</div>
                  <div>Is Wrapping: {isWrapping ? 'YES' : 'NO'}</div>
                </div>

                <div className="mt-2 pt-2 border-t border-green-600">
                  <div className="text-green-300 font-bold">🎯 SATOSHI CONVERSION (THE FIX):</div>
                  <div>Token Decimals: {selectedToken.decimals}</div>
                  <div>Token Amount: {amountWei.toString()} (raw token wei)</div>
                  <div>Satoshi Amount: {convertToSatoshis(amountWei, Number(selectedToken.decimals)).toString()} (what contract gets)</div>
                  <div>Conversion: {selectedToken.decimals === 8 ? '1:1 (same)' : `scaled to 8 decimals`}</div>
                  <div className="text-green-300 text-xs mt-1">
                    ✅ Contract will receive satoshis, not token wei!
                  </div>
                </div>
                
                <div className="mt-2 pt-2 border-t border-slate-600">
                  <div className="text-yellow-300 font-bold">Allowance Analysis:</div>
                  <div>Required: {amountWei.toString()}</div>
                  <div>Available: {currentAllowance?.toString() || '0'}</div>
                  <div>Difference: {currentAllowance ? (currentAllowance - amountWei).toString() : 'N/A'}</div>
                  <div>Ratio: {currentAllowance && amountWei > 0n ? `${(Number(currentAllowance) / Number(amountWei)).toFixed(2)}x` : 'N/A'}</div>
                </div>
                
                {/* Manual Verification */}
                <div className="mt-2 pt-2 border-t border-blue-600">
                  <div className="text-blue-300 font-bold">Manual Verification:</div>
                  <div>User Input: "{amount}"</div>
                  <div>Expected Wei: {amountWei.toString()}</div>
                  <div>Actual Wei: {amountWei.toString()}</div>
                  <div>Match: {amountWei.toString() === amountWei.toString() ? '✅' : '❌'}</div>
                </div>
                
                <div className="mt-2 pt-2 border-t border-yellow-600 text-yellow-300">
                  <div>For {amount} {selectedToken.symbol} (8 decimals): Expected = {amountWei.toString()} → Contract gets {convertToSatoshis(amountWei, Number(selectedToken.decimals)).toString()} satoshis</div>
                </div>

                {/* Emergency Controls */}
                <div className="mt-2 pt-2 border-t border-red-600">
                  <div className="text-red-300 font-bold">Emergency Controls:</div>
                  <button 
                    onClick={handleForceWrap}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs mt-1"
                    disabled={isApproving || isWrapping}
                  >
                    🚨 Force Fresh Approval & Wrap
                  </button>
                  <div className="text-red-300 text-xs mt-1">
                    Use if regular wrap fails due to allowance issues
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Two-Step Flow */}
            {selectedToken && amount && (
              <div className="pt-4 space-y-3">
                {/* Step 1: Approval Button (if needed) */}
                {needsApproval && overallStatus !== 'approving' && overallStatus !== 'wrapping' && (
                  <button
                    onClick={handleWrap}
                    disabled={isTransactionPending || !wrapValidation.isValid}
                    className={cn(
                      "w-full py-4 px-6 rounded-lg font-medium transition-all duration-200",
                      isTransactionPending || !wrapValidation.isValid
                        ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                        : "bg-yellow-600 hover:bg-yellow-700 text-white hover:scale-105"
                    )}
                  >
                    🔓 Approve {selectedToken.symbol} Spending
                  </button>
                )}

                {/* Step 2: Wrap Button (after approval or if no approval needed) */}
                {(!needsApproval || overallStatus === 'approving' || overallStatus === 'wrapping') && (
                  <button
                    onClick={handleWrap}
                    disabled={isTransactionPending || !wrapValidation.isValid || (needsApproval && overallStatus !== 'approving' && overallStatus !== 'wrapping')}
                    className={cn(
                      "w-full py-4 px-6 rounded-lg font-medium transition-all duration-200",
                      isTransactionPending || !wrapValidation.isValid || (needsApproval && overallStatus !== 'approving' && overallStatus !== 'wrapping')
                        ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                        : "btn-defi text-white hover:scale-105"
                    )}
                  >
                    {overallStatus === 'approving' && `⏳ Approving ${selectedToken.symbol}...`}
                    {overallStatus === 'wrapping' && '🔄 Wrapping to sovaBTC...'}
                    {overallStatus === 'confirmed' && '✅ Wrap Successful!'}
                    {overallStatus === 'error' && '❌ Transaction Failed - Retry'}
                    {overallStatus === 'idle' && !needsApproval && '🎯 Wrap to sovaBTC'}
                  </button>
                )}
              </div>
            )}

                {/* Status Messages */}
                {overallStatus === 'approving' && (
                  <div className="mt-2 text-sm text-yellow-400 text-center">
                    ⏳ Approving token spend permissions...
                  </div>
                )}

                {overallStatus === 'wrapping' && (
                  <div className="mt-2 text-sm text-blue-400 text-center">
                    🔄 Wrapping tokens to sovaBTC...
                  </div>
                )}

                {overallStatus === 'confirmed' && (
                  <div className="mt-2 text-sm text-green-400 text-center">
                    ✅ Tokens successfully wrapped to sovaBTC!
                  </div>
                )}

            {/* Status Messages */}
            {overallStatus === 'approving' && (
              <div className="mt-2 text-sm text-yellow-400 text-center">
                ⏳ Approving token spend permissions...
              </div>
            )}

            {overallStatus === 'wrapping' && (
              <div className="mt-2 text-sm text-blue-400 text-center">
                🔄 Wrapping tokens to sovaBTC...
              </div>
            )}

            {overallStatus === 'confirmed' && (
              <div className="mt-2 text-sm text-green-400 text-center">
                ✅ Tokens successfully wrapped to sovaBTC!
              </div>
            )}

            {/* Validation Error */}
            {!wrapValidation.isValid && wrapValidation.error && (
              <div className="mt-2 text-sm text-red-400 text-center">
                {wrapValidation.error}
              </div>
            )}

            {/* Transaction Success */}
            {isWrapConfirmed && wrapHash && (
              <div className="mt-4 p-4 bg-green-900/20 border border-green-600 rounded-lg">
                <div className="text-green-300 font-bold text-lg mb-2">✅ WRAP SUCCESSFUL!</div>
                <div className="text-green-200 text-sm">
                  Transaction confirmed! Your tokens have been wrapped to sovaBTC.
                </div>
                <a
                  href={getExplorerUrl(activeChainId, wrapHash as string, 'tx')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center mt-2 text-green-400 hover:text-green-300 text-sm"
                >
                  View Transaction <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            )}

            {/* Error Display */}
            {wrapError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="text-red-400 text-sm">
                  {wrapError?.message || 'Transaction failed'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 