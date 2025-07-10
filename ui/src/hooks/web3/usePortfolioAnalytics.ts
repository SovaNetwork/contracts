import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { type Address } from 'viem';
import { formatUnits } from 'viem';

import { useActiveNetwork } from './useActiveNetwork';
import { useTokenRedemption } from './useTokenRedemption';
import { useStaking } from './useStaking';
import { useAdvancedRedemptionAnalytics } from './useAdvancedRedemptionAnalytics';
import { ERC20_ABI, SovaBTCOFTABI } from '@/contracts/abis';
import { formatTokenAmount } from '@/lib/formatters';

export interface PortfolioAsset {
  symbol: string;
  name: string;
  address: Address;
  networkId: number;
  networkName: string;
  balance: bigint;
  value: number; // USD value
  decimals: number;
  price: number; // USD price per token
  change24h: number; // 24h price change percentage
  allocation: number; // Portfolio allocation percentage
}

export interface NetworkDistribution {
  networkId: number;
  networkName: string;
  totalValue: number;
  assets: PortfolioAsset[];
  percentage: number;
}

export interface HistoricalDataPoint {
  timestamp: number;
  totalValue: number;
  sovaBTCBalance: bigint;
  stakedAmount: bigint;
  redemptionAmount: bigint;
  totalRewards: bigint;
  portfolioReturn: number;
  sharpeRatio: number;
  volatility: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  bestDay: number;
  worstDay: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  // Yield metrics
  totalYield: number;
  yieldAPR: number;
  stakingRewards: bigint;
  redemptionRewards: bigint;
  // Risk-adjusted metrics
  calmarRatio: number;
  sortinoRatio: number;
  informationRatio: number;
}

export interface RiskMetrics {
  volatility: number;
  beta: number;
  alpha: number;
  valueAtRisk: number; // 95% VaR
  conditionalVaR: number; // Expected shortfall
  maxDrawdown: number;
  downsideDeviation: number;
  correlationMatrix: Record<string, number>;
  riskScore: number; // 0-100 scale
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  concentrationRisk: number;
  liquidityRisk: number;
  // Network-specific risks
  bridgeRisk: number;
  smartContractRisk: number;
  impermanentLossRisk: number;
}

export interface PortfolioData {
  totalValue: number;
  totalAssets: number;
  networks: NetworkDistribution[];
  assets: PortfolioAsset[];
  // Position breakdown
  liquidBalance: bigint;
  stakedBalance: bigint;
  pendingRedemptions: bigint;
  totalRewards: bigint;
  // Allocation breakdown
  allocationByAsset: Record<string, number>;
  allocationByNetwork: Record<string, number>;
  allocationByStrategy: Record<string, number>;
}

interface UsePortfolioAnalyticsProps {
  userAddress?: Address;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  enabled?: boolean;
}

interface UsePortfolioAnalyticsReturn {
  portfolioData: PortfolioData | null;
  historicalData: HistoricalDataPoint[];
  riskMetrics: RiskMetrics | null;
  performanceMetrics: PerformanceMetrics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePortfolioAnalytics({
  userAddress,
  timeRange = '30d',
  enabled = true,
}: UsePortfolioAnalyticsProps = {}): UsePortfolioAnalyticsReturn {
  const { address: connectedAddress } = useAccount();
  const effectiveAddress = userAddress || connectedAddress;
  
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getContractAddress } = useActiveNetwork();
  
  // Get data from existing hooks
  const redemptionAnalytics = useAdvancedRedemptionAnalytics({ 
    userAddress: effectiveAddress 
  });

  const { 
    stakingPools, 
    stakingAnalytics 
  } = useStaking({ 
    userAddress: effectiveAddress 
  });

  // Get balances across all networks
  const balanceQueries = useMemo(() => {
    if (!effectiveAddress) return [];
    
    return [
      { chainId: 84532, chainName: 'Base Sepolia' },
      { chainId: 11155420, chainName: 'Optimism Sepolia' },
      { chainId: 11155111, chainName: 'Ethereum Sepolia' },
    ];
  }, [effectiveAddress]);

  // Get current network balances
  const { data: sovaBTCBalance } = useBalance({
    address: effectiveAddress,
    token: getContractAddress('sovaBTC'),
  });

  const { data: sovaTokenBalance } = useBalance({
    address: effectiveAddress,
    token: getContractAddress('sovaToken'),
  });

  // Aggregate portfolio data
  const portfolioData: PortfolioData | null = useMemo(() => {
    if (!effectiveAddress) return null;

    const assets: PortfolioAsset[] = [];
    
    // Add sovaBTC balance
    if (sovaBTCBalance) {
      assets.push({
        symbol: 'sovaBTC',
        name: 'SovaBTC',
        address: getContractAddress('sovaBTC') as Address,
        networkId: 84532, // Base Sepolia
        networkName: 'Base Sepolia',
        balance: sovaBTCBalance.value,
        value: Number(formatUnits(sovaBTCBalance.value, 8)) * 65000, // Mock BTC price
        decimals: 8,
        price: 65000,
        change24h: 2.5,
        allocation: 0,
      });
    }

    // Add SOVA token balance
    if (sovaTokenBalance) {
      assets.push({
        symbol: 'SOVA',
        name: 'SOVA Token',
        address: getContractAddress('sovaToken') as Address,
        networkId: 84532,
        networkName: 'Base Sepolia',
        balance: sovaTokenBalance.value,
        value: Number(formatUnits(sovaTokenBalance.value, 18)) * 100, // Mock SOVA price
        decimals: 18,
        price: 100,
        change24h: 5.2,
        allocation: 0,
      });
    }

    // Calculate total value
    const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
    
    // Calculate allocations
    assets.forEach(asset => {
      asset.allocation = totalValue > 0 ? (asset.value / totalValue) * 100 : 0;
    });

    // Group by network
    const networkMap = new Map<number, NetworkDistribution>();
    assets.forEach(asset => {
      if (!networkMap.has(asset.networkId)) {
        networkMap.set(asset.networkId, {
          networkId: asset.networkId,
          networkName: asset.networkName,
          totalValue: 0,
          assets: [],
          percentage: 0,
        });
      }
      const network = networkMap.get(asset.networkId)!;
      network.assets.push(asset);
      network.totalValue += asset.value;
    });

    // Calculate network percentages
    const networks = Array.from(networkMap.values());
    networks.forEach(network => {
      network.percentage = totalValue > 0 ? (network.totalValue / totalValue) * 100 : 0;
    });

    // Calculate position breakdown
    const liquidBalance = sovaBTCBalance?.value || 0n;
    const stakedBalance = stakingAnalytics.myTotalStaked || 0n;
    const pendingRedemptions = redemptionAnalytics.totalStats.totalSovaAmount || 0n;
    const totalRewards = stakingAnalytics.myTotalRewards || 0n;

    return {
      totalValue,
      totalAssets: assets.length,
      networks,
      assets,
      liquidBalance,
      stakedBalance,
      pendingRedemptions,
      totalRewards,
      allocationByAsset: assets.reduce((acc, asset) => {
        acc[asset.symbol] = asset.allocation;
        return acc;
      }, {} as Record<string, number>),
      allocationByNetwork: networks.reduce((acc, network) => {
        acc[network.networkName] = network.percentage;
        return acc;
      }, {} as Record<string, number>),
      allocationByStrategy: {
        'Liquid': totalValue > 0 ? (Number(formatUnits(liquidBalance, 8)) * 65000 / totalValue) * 100 : 0,
        'Staked': totalValue > 0 ? (Number(formatUnits(stakedBalance, 8)) * 65000 / totalValue) * 100 : 0,
        'Pending Redemption': totalValue > 0 ? (Number(formatUnits(pendingRedemptions, 8)) * 65000 / totalValue) * 100 : 0,
      },
    };
  }, [effectiveAddress, sovaBTCBalance, sovaTokenBalance, stakingAnalytics, redemptionAnalytics, getContractAddress]);

  // Calculate performance metrics
  const performanceMetrics: PerformanceMetrics | null = useMemo(() => {
    if (!portfolioData || historicalData.length === 0) return null;

    const returns = historicalData.map(point => point.portfolioReturn);
    const totalReturn = returns.reduce((sum, ret) => sum + ret, 0);
    const avgReturn = returns.length > 0 ? totalReturn / returns.length : 0;
    
    // Calculate volatility
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / Math.max(1, returns.length - 1);
    const volatility = Math.sqrt(variance);
    
    // Calculate Sharpe ratio (assuming 5% risk-free rate)
    const riskFreeRate = 0.05;
    const sharpeRatio = volatility > 0 ? (avgReturn - riskFreeRate) / volatility : 0;
    
    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = 0;
    historicalData.forEach(point => {
      if (point.totalValue > peak) {
        peak = point.totalValue;
      }
      const drawdown = peak > 0 ? (peak - point.totalValue) / peak : 0;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    });

    // Calculate win rate
    const positiveReturns = returns.filter(ret => ret > 0).length;
    const winRate = returns.length > 0 ? (positiveReturns / returns.length) * 100 : 0;

    // Calculate annualized return
    const timeMultiplier = timeRange === '7d' ? 52 : timeRange === '30d' ? 12 : timeRange === '90d' ? 4 : 1;
    const annualizedReturn = totalReturn * timeMultiplier;

    return {
      totalReturn,
      annualizedReturn,
      sharpeRatio,
      maxDrawdown,
      volatility,
      bestDay: returns.length > 0 ? Math.max(...returns) : 0,
      worstDay: returns.length > 0 ? Math.min(...returns) : 0,
      winRate,
      totalTrades: 0, // Would need transaction tracking
      profitFactor: 0, // Would need P&L calculation
      totalYield: Number(formatUnits(portfolioData.totalRewards, 18)) * 100,
      yieldAPR: stakingAnalytics.averageAPR || 0,
      stakingRewards: portfolioData.totalRewards,
      redemptionRewards: 0n,
      calmarRatio: maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0,
      sortinoRatio: 0, // Would need downside deviation calculation
      informationRatio: 0, // Would need benchmark comparison
    };
  }, [portfolioData, historicalData, timeRange, stakingAnalytics]);

  // Calculate risk metrics
  const riskMetrics: RiskMetrics | null = useMemo(() => {
    if (!portfolioData || historicalData.length === 0) return null;

    const returns = historicalData.map(point => point.portfolioReturn);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / Math.max(1, returns.length);
    
    // Calculate volatility
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / Math.max(1, returns.length - 1);
    const volatility = Math.sqrt(variance);
    
    // Calculate VaR (95% confidence level)
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const varIndex = Math.floor(sortedReturns.length * 0.05);
    const valueAtRisk = sortedReturns[varIndex] || 0;
    
    // Calculate conditional VaR (expected shortfall)
    const conditionalVaR = varIndex > 0 
      ? sortedReturns.slice(0, varIndex).reduce((sum, ret) => sum + ret, 0) / varIndex
      : 0;

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = 0;
    historicalData.forEach(point => {
      if (point.totalValue > peak) {
        peak = point.totalValue;
      }
      const drawdown = peak > 0 ? (peak - point.totalValue) / peak : 0;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    });

    // Calculate downside deviation
    const downsideReturns = returns.filter(ret => ret < 0);
    const downsideDeviation = downsideReturns.length > 0 
      ? Math.sqrt(downsideReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / downsideReturns.length)
      : 0;

    // Calculate concentration risk
    const concentrationRisk = Math.max(...Object.values(portfolioData.allocationByAsset));

    // Calculate overall risk score
    const riskScore = Math.min(100, Math.max(0, 
      (volatility * 100) + 
      (maxDrawdown * 50) + 
      (concentrationRisk * 0.5) + 
      Math.abs(valueAtRisk * 100)
    ));

    // Determine risk level
    let riskLevel: 'Low' | 'Medium' | 'High' | 'Very High' = 'Low';
    if (riskScore > 75) riskLevel = 'Very High';
    else if (riskScore > 50) riskLevel = 'High';
    else if (riskScore > 25) riskLevel = 'Medium';

    return {
      volatility,
      beta: 0.8, // Mock beta vs Bitcoin
      alpha: 0.02, // Mock alpha
      valueAtRisk,
      conditionalVaR,
      maxDrawdown,
      downsideDeviation,
      correlationMatrix: {
        'BTC': 0.85,
        'ETH': 0.7,
        'DeFi': 0.6,
      },
      riskScore,
      riskLevel,
      concentrationRisk,
      liquidityRisk: 15, // Mock liquidity risk score
      bridgeRisk: 20, // Mock bridge risk score
      smartContractRisk: 25, // Mock smart contract risk score
      impermanentLossRisk: 0, // No IL risk for sovaBTC
    };
  }, [portfolioData, historicalData]);

  // Generate historical data
  const generateHistoricalData = useCallback(() => {
    if (!portfolioData) return [];

    const now = Date.now();
    const timeRangeMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
    }[timeRange];

    const dataPoints = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const interval = timeRangeMs / dataPoints;

    const data: HistoricalDataPoint[] = [];
    
    for (let i = 0; i < dataPoints; i++) {
      const timestamp = now - (timeRangeMs - (i * interval));
      const baseValue = portfolioData.totalValue;
      
      // Add some realistic volatility
      const randomFactor = 0.95 + (Math.random() * 0.1); // ±5% random variation
      const trendFactor = 1 + (i / dataPoints) * 0.1; // 10% positive trend over time
      
      const totalValue = baseValue * randomFactor * trendFactor;
      const portfolioReturn = i > 0 ? (totalValue - data[i - 1].totalValue) / data[i - 1].totalValue : 0;
      
      data.push({
        timestamp,
        totalValue,
        sovaBTCBalance: portfolioData.liquidBalance,
        stakedAmount: portfolioData.stakedBalance,
        redemptionAmount: portfolioData.pendingRedemptions,
        totalRewards: portfolioData.totalRewards,
        portfolioReturn,
        sharpeRatio: 0.5 + (Math.random() * 0.5), // Mock Sharpe ratio
        volatility: 0.15 + (Math.random() * 0.1), // Mock volatility
      });
    }

    return data;
  }, [portfolioData, timeRange]);

  // Refetch function
  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate new historical data
      const newHistoricalData = generateHistoricalData();
      setHistoricalData(newHistoricalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio data');
    } finally {
      setIsLoading(false);
    }
  }, [generateHistoricalData]);

  // Initialize data
  useEffect(() => {
    if (enabled && effectiveAddress) {
      refetch();
    }
  }, [enabled, effectiveAddress, refetch]);

  return {
    portfolioData,
    historicalData,
    riskMetrics,
    performanceMetrics,
    isLoading,
    error,
    refetch,
  };
} 