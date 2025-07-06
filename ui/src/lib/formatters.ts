import { formatUnits, parseUnits } from 'viem';

// Format token amounts with proper decimals
export function formatTokenAmount(
  amount: bigint | string,
  decimals: number,
  maxDecimals: number = 6
): string {
  const value = typeof amount === 'string' ? BigInt(amount) : amount;
  const formatted = formatUnits(value, decimals);
  const num = parseFloat(formatted);
  
  if (num === 0) return '0';
  
  // For very small numbers, show more decimals
  if (num < 0.001) {
    return num.toFixed(8);
  }
  
  // For small numbers, show up to maxDecimals
  if (num < 1) {
    return num.toFixed(maxDecimals);
  }
  
  // For larger numbers, show fewer decimals
  if (num >= 1000) {
    return num.toFixed(2);
  }
  
  return num.toFixed(Math.min(maxDecimals, 4));
}

// Format token amount with symbol
export function formatTokenAmountWithSymbol(
  amount: bigint | string,
  decimals: number,
  symbol: string,
  maxDecimals: number = 6
): string {
  const formatted = formatTokenAmount(amount, decimals, maxDecimals);
  return `${formatted} ${symbol}`;
}

// Parse token amount from string input
export function parseTokenAmount(
  amount: string,
  decimals: number
): bigint {
  try {
    return parseUnits(amount, decimals);
  } catch (error) {
    console.error('Error parsing token amount:', error);
    return BigInt(0);
  }
}

// Format APY percentage
export function formatAPY(apy: number | string): string {
  const value = typeof apy === 'string' ? parseFloat(apy) : apy;
  
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K%';
  }
  
  if (value >= 100) {
    return value.toFixed(0) + '%';
  }
  
  return value.toFixed(2) + '%';
}

// Format BTC amounts (8 decimals)
export function formatBTC(amount: bigint | string): string {
  return formatTokenAmount(amount, 8, 8);
}

// Format ETH amounts (18 decimals)
export function formatETH(amount: bigint | string): string {
  return formatTokenAmount(amount, 18, 6);
}

// Format USDC amounts (6 decimals)
export function formatUSDC(amount: bigint | string): string {
  return formatTokenAmount(amount, 6, 2);
}

// Format SOVA amounts (18 decimals)
export function formatSOVA(amount: bigint | string): string {
  return formatTokenAmount(amount, 18, 6);
}

// Format gas price in gwei
export function formatGasPrice(gasPrice: bigint): string {
  const gwei = formatUnits(gasPrice, 9);
  return `${parseFloat(gwei).toFixed(2)} gwei`;
}

// Format gas limit
export function formatGasLimit(gasLimit: bigint): string {
  return gasLimit.toLocaleString();
}

// Format transaction fee
export function formatTransactionFee(
  gasUsed: bigint,
  gasPrice: bigint,
  ethPriceUSD?: number
): string {
  const feeInEth = formatUnits(gasUsed * gasPrice, 18);
  const feeNum = parseFloat(feeInEth);
  
  if (ethPriceUSD) {
    const feeInUSD = feeNum * ethPriceUSD;
    return `${feeNum.toFixed(6)} ETH (~$${feeInUSD.toFixed(2)})`;
  }
  
  return `${feeNum.toFixed(6)} ETH`;
}

// Format block number
export function formatBlockNumber(blockNumber: bigint): string {
  return blockNumber.toLocaleString();
}

// Format timestamp to relative time
export function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

// Format staking rewards
export function formatStakingRewards(
  rewards: bigint,
  decimals: number,
  symbol: string
): string {
  const formatted = formatTokenAmount(rewards, decimals, 6);
  return `${formatted} ${symbol}`;
}

// Format staking period
export function formatStakingPeriod(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  return 'Less than 1 hour';
}

// Format pool TVL
export function formatTVL(tvl: bigint | number): string {
  const value = typeof tvl === 'bigint' ? Number(formatUnits(tvl, 18)) : tvl;
  
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  
  return `$${value.toFixed(2)}`;
}

// Format redemption queue position
export function formatQueuePosition(position: number, total: number): string {
  return `${position.toLocaleString()} of ${total.toLocaleString()}`;
}

// Format redemption delay
export function formatRedemptionDelay(delayInSeconds: number): string {
  const days = Math.floor(delayInSeconds / (24 * 60 * 60));
  const hours = Math.floor((delayInSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((delayInSeconds % (60 * 60)) / 60);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ${hours}h ${minutes}m`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes}m`;
}

// Format percentage change
export function formatPercentageChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

// Format liquidity
export function formatLiquidity(
  token0Amount: bigint,
  token1Amount: bigint,
  token0Decimals: number,
  token1Decimals: number,
  token0Symbol: string,
  token1Symbol: string
): string {
  const amount0 = formatTokenAmount(token0Amount, token0Decimals, 4);
  const amount1 = formatTokenAmount(token1Amount, token1Decimals, 4);
  
  return `${amount0} ${token0Symbol} / ${amount1} ${token1Symbol}`;
}

// Format yield
export function formatYield(yieldAmount: bigint, decimals: number): string {
  const formatted = formatTokenAmount(yieldAmount, decimals, 6);
  return `${formatted}`;
}

// Format health factor
export function formatHealthFactor(healthFactor: bigint): string {
  const formatted = formatUnits(healthFactor, 18);
  const num = parseFloat(formatted);
  
  if (num >= 10) {
    return '10+';
  }
  
  return num.toFixed(2);
}

// Format slippage
export function formatSlippage(slippage: number): string {
  return `${slippage.toFixed(2)}%`;
}

// Format price impact
export function formatPriceImpact(impact: number): string {
  const sign = impact >= 0 ? '+' : '';
  return `${sign}${impact.toFixed(2)}%`;
} 