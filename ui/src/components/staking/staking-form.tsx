'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { 
  Loader2, 
  TrendingUp, 
  Zap, 
  AlertCircle, 
  Calculator
} from 'lucide-react'

import { useTokenBalance } from '@/hooks/web3/use-token-balance'
import { useTokenAllowance } from '@/hooks/web3/use-token-allowance'
import { useTokenApproval } from '@/hooks/web3/use-token-approval'
import { useStake } from '@/hooks/web3/use-stake'
import { useUnstake } from '@/hooks/web3/use-unstake'
import { useStakingData } from '@/hooks/web3/use-staking-data'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import { formatTokenAmount, formatUSD } from '@/lib/utils'

export default function StakingForm() {
  const { isConnected } = useAccount()
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [autoCompound, setAutoCompound] = useState(false)
  const [stakingPeriod, setStakingPeriod] = useState([30]) // days
  
  const sovaBTCAddress = CONTRACT_ADDRESSES[84532].SOVABTC
  const stakingAddress = CONTRACT_ADDRESSES[84532].STAKING
  
  // Hook calls
  const sovaBTCBalance = useTokenBalance(sovaBTCAddress)
  const stakingAllowance = useTokenAllowance(sovaBTCAddress, stakingAddress)
  const stakingData = useStakingData(stakingAddress)
  const approval = useTokenApproval()
  const stake = useStake()
  const unstake = useUnstake()
  
  // Calculate boosted APY based on staking period
  const boostedAPY = useMemo(() => {
    const baseAPY = stakingData.apy
    const periodBonus = Math.min(stakingPeriod[0] / 365 * 0.5, 0.5) // Max 50% bonus
    return baseAPY * (1 + periodBonus)
  }, [stakingData.apy, stakingPeriod])

  // Validation
  const stakeValidation = useMemo(() => {
    if (!stakeAmount || Number(stakeAmount) <= 0) {
      return { isValid: false, error: null }
    }
    
    if (Number(stakeAmount) > Number(sovaBTCBalance.formattedBalance)) {
      return { isValid: false, error: 'Insufficient SovaBTC balance' }
    }
    
    return { isValid: true, error: null }
  }, [stakeAmount, sovaBTCBalance.formattedBalance])

  const unstakeValidation = useMemo(() => {
    if (!unstakeAmount || Number(unstakeAmount) <= 0) {
      return { isValid: false, error: null }
    }
    
    const stakedBalance = formatUnits(typeof stakingData.stakedAmount === 'bigint' ? stakingData.stakedAmount : BigInt(0), 8)
    if (Number(unstakeAmount) > Number(stakedBalance)) {
      return { isValid: false, error: 'Insufficient staked balance' }
    }
    
    return { isValid: true, error: null }
  }, [unstakeAmount, stakingData.stakedAmount])

  // Check if approval is needed for staking
  const needsApproval = useMemo(() => {
    if (!stakeAmount || !stakeValidation.isValid) return false
    return stakingAllowance.hasInsufficientAllowance(stakeAmount, 8)
  }, [stakeAmount, stakeValidation.isValid, stakingAllowance])

  // Calculate potential rewards
  const potentialRewards = useMemo(() => {
    if (!stakeAmount || !stakeValidation.isValid) return { daily: 0, monthly: 0, yearly: 0 }
    
    const amount = Number(stakeAmount)
    const dailyRate = boostedAPY / 365 / 100
    const daily = amount * dailyRate
    const monthly = daily * 30
    const yearly = amount * (boostedAPY / 100)
    
    return { daily, monthly, yearly }
  }, [stakeAmount, stakeValidation.isValid, boostedAPY])

  const handleMaxStake = () => {
    setStakeAmount(sovaBTCBalance.formattedBalance)
  }

  const handleMaxUnstake = () => {
    setUnstakeAmount(formatUnits(typeof stakingData.stakedAmount === 'bigint' ? stakingData.stakedAmount : BigInt(0), 8))
  }

  const handleQuickAmount = (percentage: number) => {
    const amount = (Number(sovaBTCBalance.formattedBalance) * percentage / 100).toString()
    setStakeAmount(amount)
  }

  const handleApprove = async () => {
    if (!stakeAmount || !stakeValidation.isValid) return
    
    await approval.approve(
      sovaBTCAddress,
      stakingAddress,
      stakeAmount,
      8,
      true // Use max approval
    )
  }

  const handleStake = async () => {
    if (!stakeAmount || !stakeValidation.isValid) return
    
    await stake.stake(stakingAddress, stakeAmount)
  }

  const handleUnstake = async () => {
    if (!unstakeAmount || !unstakeValidation.isValid) return
    
    await unstake.unstake(stakingAddress, unstakeAmount)
  }

  // Reset forms after successful transactions
  useEffect(() => {
    if (stake.isSuccess) {
      setStakeAmount('')
      sovaBTCBalance.refetch()
      stakingData.refetchStaked()
    }
  }, [stake.isSuccess, sovaBTCBalance, stakingData])

  useEffect(() => {
    if (unstake.isSuccess) {
      setUnstakeAmount('')
      sovaBTCBalance.refetch()
      stakingData.refetchStaked()
    }
  }, [unstake.isSuccess, sovaBTCBalance, stakingData])

  if (!isConnected) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-12 space-y-4"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-defi-purple-500/20 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-defi-purple-400" />
        </div>
        <h3 className="text-xl font-semibold text-white">Connect Your Wallet</h3>
        <p className="text-slate-400">
          Please connect your wallet to start staking
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gradient-text">Stake SovaBTC</h2>
        <div className="flex items-center gap-2 text-sm text-defi-purple-400">
          <TrendingUp className="h-4 w-4" />
          <span>{boostedAPY.toFixed(2)}% APY</span>
        </div>
      </div>

      <Tabs defaultValue="stake" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
          <TabsTrigger value="stake" className="data-[state=active]:bg-defi-purple-500/20">
            Stake
          </TabsTrigger>
          <TabsTrigger value="unstake" className="data-[state=active]:bg-defi-blue-500/20">
            Unstake
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="stake" className="space-y-6 mt-6">
          {/* Staking Period Selector */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-slate-300">
              Staking Period (Higher periods = Higher APY)
            </Label>
            <div className="space-y-3">
              <Slider
                value={stakingPeriod}
                onValueChange={setStakingPeriod}
                max={365}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-slate-400">
                <span>1 day ({stakingData.apy.toFixed(1)}%)</span>
                <span className="font-medium text-white">
                  {stakingPeriod[0]} days ({boostedAPY.toFixed(2)}% APY)
                </span>
                <span>1 year ({(stakingData.apy * 1.5).toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-300">Amount to Stake</Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.0"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className={`h-16 text-2xl font-semibold bg-transparent border-2 pr-32 ${
                  stakeValidation.error 
                    ? 'border-defi-red-500/50 focus:border-defi-red-500' 
                    : 'border-white/20 focus:border-defi-purple-500/50'
                }`}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMaxStake}
                    disabled={sovaBTCBalance.isLoading}
                    className="h-8 px-3 text-xs font-semibold hover:bg-white/10"
                  >
                    MAX
                  </Button>
                </motion.div>
                <span className="text-sm font-medium text-slate-300">sovaBTC</span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex gap-2">
              {[25, 50, 75, 100].map((percentage) => (
                <Button
                  key={percentage}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(percentage)}
                  className="flex-1 h-8 text-xs bg-transparent border-white/20 hover:bg-white/10"
                >
                  {percentage}%
                </Button>
              ))}
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <span>Available:</span>
                {sovaBTCBalance.isLoading ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="shimmer w-16 h-3 rounded"></span>
                  </div>
                ) : (
                  <span className="font-medium">
                    {formatTokenAmount(sovaBTCBalance.balance, 8)} sovaBTC
                  </span>
                )}
              </div>
              
              {stakeAmount && stakeValidation.isValid && (
                <div className="text-slate-400">
                  ≈ {formatUSD(Number(stakeAmount) * 45000)}
                </div>
              )}
            </div>
          </div>

          {/* Auto-compound Option */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-defi-purple-500/10 border border-defi-purple-500/20">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-defi-purple-400" />
              <div>
                <p className="text-sm font-medium text-white">Auto-compound rewards</p>
                <p className="text-xs text-slate-400">Automatically restake SOVA rewards</p>
              </div>
            </div>
            <Switch
              checked={autoCompound}
              onCheckedChange={setAutoCompound}
            />
          </div>

          {/* Rewards Calculator */}
          <Card className="defi-card border-defi-purple-500/30 bg-gradient-to-r from-defi-purple-500/5 to-defi-pink-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-5 w-5 text-defi-purple-400" />
                <h3 className="font-semibold text-white">Rewards Calculator</h3>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center space-y-1">
                  <p className="text-xs text-slate-400">Daily</p>
                  <p className="text-lg font-bold text-defi-purple-400">
                    {potentialRewards.daily.toFixed(4)} SOVA
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatUSD(potentialRewards.daily * 0.1)}
                  </p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-slate-400">Monthly</p>
                  <p className="text-lg font-bold text-defi-pink-400">
                    {potentialRewards.monthly.toFixed(2)} SOVA
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatUSD(potentialRewards.monthly * 0.1)}
                  </p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-slate-400">Yearly</p>
                  <p className="text-lg font-bold text-defi-blue-400">
                    {potentialRewards.yearly.toFixed(2)} SOVA
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatUSD(potentialRewards.yearly * 0.1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {needsApproval ? (
                <motion.div
                  key="approve"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button 
                    onClick={handleApprove}
                    disabled={approval.isPending || approval.isConfirming || !stakeValidation.isValid}
                    className="w-full h-14 text-lg font-semibold bg-defi-purple-600 hover:bg-defi-purple-500"
                    size="lg"
                  >
                    {approval.isPending && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                    {approval.isConfirming && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                    {approval.isPending 
                      ? 'Waiting for signature...'
                      : approval.isConfirming 
                      ? 'Confirming approval...'
                      : 'Approve SovaBTC'
                    }
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="stake"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    onClick={handleStake}
                    disabled={stake.isPending || stake.isConfirming || !stakeValidation.isValid}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-defi-purple-600 to-defi-pink-600 hover:from-defi-purple-500 hover:to-defi-pink-500"
                    size="lg"
                  >
                    {stake.isPending && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                    {stake.isConfirming && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                    {stake.isPending 
                      ? 'Waiting for signature...'
                      : stake.isConfirming 
                      ? 'Confirming stake...'
                      : 'Stake SovaBTC'
                    }
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Validation Error */}
            <AnimatePresence>
              {stakeValidation.error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-sm text-defi-red-400 bg-defi-red-500/10 border border-defi-red-500/20 rounded-lg p-3"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{stakeValidation.error}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </TabsContent>
        
        <TabsContent value="unstake" className="space-y-6 mt-6">
          {/* Unstake Amount Input */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-300">Amount to Unstake</Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.0"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                className={`h-16 text-2xl font-semibold bg-transparent border-2 pr-32 ${
                  unstakeValidation.error 
                    ? 'border-defi-red-500/50 focus:border-defi-red-500' 
                    : 'border-white/20 focus:border-defi-blue-500/50'
                }`}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMaxUnstake}
                    className="h-8 px-3 text-xs font-semibold hover:bg-white/10"
                  >
                    MAX
                  </Button>
                </motion.div>
                <span className="text-sm font-medium text-slate-300">sovaBTC</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <span>Staked:</span>
                <span className="font-medium">
                  {formatTokenAmount(typeof stakingData.stakedAmount === 'bigint' ? stakingData.stakedAmount : BigInt(0), 8)} sovaBTC
                </span>
              </div>
            </div>
          </div>

          {/* Unstaking Warning */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-defi-blue-500/10 border border-defi-blue-500/20">
            <AlertCircle className="h-5 w-5 text-defi-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-defi-blue-300">Unstaking Information</p>
              <p className="text-xs text-slate-400 mt-1">
                Unstaking will stop reward accrual immediately. Consider claiming rewards first.
              </p>
            </div>
          </div>

          <Button
            onClick={handleUnstake}
            disabled={unstake.isPending || unstake.isConfirming || !unstakeValidation.isValid}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-defi-blue-600 to-defi-purple-600 hover:from-defi-blue-500 hover:to-defi-purple-500"
            size="lg"
          >
            {unstake.isPending && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
            {unstake.isConfirming && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
            {unstake.isPending 
              ? 'Waiting for signature...'
              : unstake.isConfirming 
              ? 'Confirming unstake...'
              : 'Unstake SovaBTC'
            }
          </Button>

          {/* Validation Error */}
          <AnimatePresence>
            {unstakeValidation.error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-sm text-defi-red-400 bg-defi-red-500/10 border border-defi-red-500/20 rounded-lg p-3"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{unstakeValidation.error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
} 