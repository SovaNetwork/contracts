'use client';


import { useAccount, useReadContract } from 'wagmi';
import { type Address, erc20Abi } from 'viem';
import { useActiveNetwork } from '@/hooks/web3/useActiveNetwork';
import { useTokenWrapping } from '@/hooks/web3/useTokenWrapping';
import { formatTokenAmount, parseTokenAmount } from '@/lib/formatters';

interface ApprovalDebuggerProps {
  selectedToken: {
    symbol: string;
    address: string;
    decimals: number;
  } | null;
  amount: string;
}

export function ApprovalDebugger({ selectedToken, amount }: ApprovalDebuggerProps) {
  const { address: userAddress, isConnected } = useAccount();
  const { getContractAddress, activeChainId, walletChainId } = useActiveNetwork();
  const wrapperAddress = getContractAddress('wrapper');
  
  // Parse amount
  const amountWei = amount && selectedToken ? parseTokenAmount(amount, selectedToken.decimals) : 0n;
  
  // Get current allowance using the same hook as the main component
  const { useTokenAllowance } = useTokenWrapping({ userAddress });
  const { data: currentAllowance, isLoading: isLoadingAllowance, error: allowanceError } = useTokenAllowance(selectedToken?.address as Address);
  
  // Manual allowance check
  const { data: manualAllowance, isLoading: isLoadingManual, error: manualError } = useReadContract({
    address: selectedToken?.address as Address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: userAddress && selectedToken?.address && wrapperAddress ? [userAddress, wrapperAddress] : undefined,
    query: {
      enabled: Boolean(userAddress && selectedToken?.address && wrapperAddress),
    },
  });

  const needsApproval = currentAllowance !== undefined && amountWei > 0n ? currentAllowance < amountWei : false;

  return (
    <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg space-y-3">
      <h3 className="text-red-300 font-bold">🐛 Approval Debug Panel</h3>
      
      {/* Network Info */}
      <div className="text-xs space-y-1">
        <div className="text-blue-300 font-semibold">📡 Network Info:</div>
        <div>Active Chain ID: {activeChainId}</div>
        <div>Wallet Chain ID: {walletChainId}</div>
        <div>Connected: {isConnected ? '✅' : '❌'}</div>
        <div>Wrapper Address: {wrapperAddress || '❌ UNDEFINED'}</div>
      </div>

      {/* Token Info */}
      <div className="text-xs space-y-1">
        <div className="text-green-300 font-semibold">🪙 Token Info:</div>
        <div>Selected Token: {selectedToken?.symbol || '❌ None'}</div>
        <div>Token Address: {selectedToken?.address || '❌ UNDEFINED'}</div>
        <div>Token Decimals: {selectedToken?.decimals || 'N/A'}</div>
      </div>

      {/* User Info */}
      <div className="text-xs space-y-1">
        <div className="text-purple-300 font-semibold">👤 User Info:</div>
        <div>User Address: {userAddress || '❌ UNDEFINED'}</div>
        <div>Amount Input: {amount || '❌ Empty'}</div>
        <div>Amount Wei: {amountWei.toString()}</div>
      </div>

      {/* Allowance Info */}
      <div className="text-xs space-y-1">
        <div className="text-yellow-300 font-semibold">🔐 Allowance Info:</div>
        <div>Hook Allowance: {isLoadingAllowance ? '⏳ Loading...' : currentAllowance?.toString() || '❌ UNDEFINED'}</div>
        <div>Manual Allowance: {isLoadingManual ? '⏳ Loading...' : manualAllowance?.toString() || '❌ UNDEFINED'}</div>
        <div>Hook Error: {allowanceError?.message || '✅ None'}</div>
        <div>Manual Error: {manualError?.message || '✅ None'}</div>
        <div className="text-yellow-400 font-bold">Is Max Uint256: {currentAllowance?.toString() === '115792089237316195423570985008687907853269984665640564039457584007913129639935' ? '🚨 YES (Infinite Approval!)' : '❌ No'}</div>
      </div>

      {/* Detailed Allowance Query Info */}
      <div className="text-xs space-y-1">
        <div className="text-red-300 font-semibold">🔍 ALLOWANCE QUERY DETAILS:</div>
        <div>Token Contract: {selectedToken?.address || '❌ UNDEFINED'}</div>
        <div>Owner (You): {userAddress || '❌ UNDEFINED'}</div>
        <div>Spender (Wrapper): {wrapperAddress || '❌ UNDEFINED'}</div>
        <div>Query: allowance({userAddress?.slice(0,6)}...{userAddress?.slice(-4)}, {wrapperAddress?.slice(0,6)}...{wrapperAddress?.slice(-4)})</div>
        <div className="text-red-400">⚠️ This query should return 0 for first-time use!</div>
      </div>

      {/* Logic Check */}
      <div className="text-xs space-y-1">
        <div className="text-orange-300 font-semibold">🧮 Logic Check:</div>
        <div>Needs Approval: {needsApproval ? '✅ YES' : '❌ NO'}</div>
        <div>Allowance {'<'} Amount: {currentAllowance !== undefined && amountWei > 0n ? (currentAllowance < amountWei ? '✅ YES' : '❌ NO') : '❓ Cannot determine'}</div>
        <div>Current: {currentAllowance?.toString() || 'undefined'}</div>
        <div>Required: {amountWei.toString()}</div>
      </div>

      {/* Required Values Check */}
      <div className="text-xs space-y-1">
        <div className="text-pink-300 font-semibold">✅ Requirements Check:</div>
        <div>User Address: {userAddress ? '✅' : '❌ MISSING'}</div>
        <div>Token Address: {selectedToken?.address ? '✅' : '❌ MISSING'}</div>
        <div>Wrapper Address: {wrapperAddress ? '✅' : '❌ MISSING'}</div>
        <div>Amount {'>'} 0: {amountWei > 0n ? '✅' : '❌ MISSING'}</div>
        <div>All Required: {userAddress && selectedToken?.address && wrapperAddress && amountWei > 0n ? '✅ YES' : '❌ NO'}</div>
      </div>

      {/* Expected Addresses for Current Network */}
      <div className="text-xs space-y-1">
        <div className="text-cyan-300 font-semibold">📋 Expected Addresses:</div>
        {activeChainId === 84532 && (
          <>
            <div>Base Sepolia Wrapper: 0x7a08aF83566724F59D81413f3bD572E58711dE7b</div>
            <div>Base Sepolia WBTC: 0x10E8116eBA84981A7959a1158e03eE19c0Ad41f2</div>
            <div>Using Correct Wrapper: {wrapperAddress?.toLowerCase() === '0x7a08aF83566724F59D81413f3bD572E58711dE7b'.toLowerCase() ? '✅' : '❌'}</div>
            <div>Using Correct WBTC: {selectedToken?.address?.toLowerCase() === '0x10E8116eBA84981A7959a1158e03eE19c0Ad41f2'.toLowerCase() ? '✅' : '❌'}</div>
          </>
        )}
        {activeChainId === 11155420 && (
          <>
            <div>OP Sepolia Wrapper: 0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d</div>
            <div>OP Sepolia WBTC: 0x6f5249F8507445F1F0178eD162097bc4a262404E</div>
            <div>Using Correct Wrapper: {wrapperAddress?.toLowerCase() === '0x43a8a1FF7b7bC32aCbcCA638b2b40CADf45CD82d'.toLowerCase() ? '✅' : '❌'}</div>
            <div>Using Correct WBTC: {selectedToken?.address?.toLowerCase() === '0x6f5249F8507445F1F0178eD162097bc4a262404E'.toLowerCase() ? '✅' : '❌'}</div>
          </>
        )}
      </div>

      {/* Investigation Tools */}
      {currentAllowance?.toString() === '115792089237316195423570985008687907853269984665640564039457584007913129639935' && (
        <div className="text-xs space-y-1 border-t border-red-600 pt-2">
          <div className="text-red-300 font-semibold">🚨 INFINITE APPROVAL DETECTED!</div>
          <div className="text-red-400">Someone has already approved this token with max allowance.</div>
          <div className="text-yellow-300">To verify, check these links:</div>
          <div className="space-y-1">
            {activeChainId === 84532 && userAddress && selectedToken?.address && wrapperAddress && (
              <>
                <a 
                  href={`https://sepolia.basescan.org/token/${selectedToken.address}?a=${userAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline block"
                >
                  📈 Check Token Transfers
                </a>
                <a 
                  href={`https://sepolia.basescan.org/address/${userAddress}#tokentxns`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline block"
                >
                  📋 Check Your Approval History
                </a>
                <div className="text-orange-300 text-xs mt-1">
                  ✅ Look for "Approve" transactions to {wrapperAddress?.slice(0,6)}...{wrapperAddress?.slice(-4)}
                </div>
              </>
            )}
                     </div>
         </div>
       )}

      {/* Force Wrap Button for Testing */}
      {currentAllowance && amountWei > 0n && selectedToken && userAddress && wrapperAddress && (
        <div className="text-xs space-y-2 border-t border-green-600 pt-2">
          <div className="text-green-300 font-semibold">🧪 TESTING TOOLS:</div>
          <div className="text-green-400">Since approval exists, try force wrapping:</div>
          <button
            onClick={() => {
              console.log('🚨 FORCE WRAP ATTEMPT:', {
                tokenAddress: selectedToken.address,
                amount: amountWei.toString(),
                userAddress,
                wrapperAddress,
                note: 'Bypassing UI logic to test wrap directly'
              });
              
              // Call the wrapper contract directly via console for debugging
              window.alert(`Check console - Force wrap attempt logged.\n\nToken: ${selectedToken.symbol}\nAmount: ${amountWei.toString()}\nWrapper: ${wrapperAddress}`);
            }}
            className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
          >
            🔧 Debug: Log Wrap Parameters
          </button>
          <div className="text-green-300 text-xs">
            This logs the exact parameters that should be used for wrapping
          </div>
        </div>
      )}
      </div>
    );
  } 