'use client'

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import { useAdminAccess } from '@/hooks/web3/use-admin-access'
import { ContractManagement } from '@/components/admin/contract-management'
import { UserManagement } from '@/components/admin/user-management'
import { ProtocolStats } from '@/components/admin/protocol-stats'
import { RedemptionManagement } from '@/components/admin/redemption-management'
import { TokenWhitelistManager } from '@/components/admin/token-whitelist-manager'
import { EmergencyControls } from '@/components/admin/emergency-controls'
import { 
  Shield, 
  AlertTriangle, 
  Settings, 
  Users, 
  BarChart3,
  Cog,
  Lock
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
  }
}

export default function AdminPage() {
  const { isAdmin, isSuperAdmin } = useAdminAccess()

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-defi-red-500/20 border-2 border-defi-red-500/30 flex items-center justify-center">
            <Lock className="h-12 w-12 text-defi-red-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Access Denied</h1>
            <p className="text-lg text-slate-400">
              You don't have administrator privileges to access this page.
            </p>
          </div>
          <Card className="defi-card border-defi-red-500/30 bg-defi-red-500/5 max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-defi-red-400" />
              <p className="text-sm text-slate-400">
                This page is restricted to contract owners and authorized administrators only.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="p-3 rounded-xl bg-defi-red-500/20 border border-defi-red-500/30"
            >
              <Shield className="h-8 w-8 text-defi-red-400" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">Admin Portal</h1>
              <p className="text-lg text-slate-400">
                {isSuperAdmin ? 'Super Administrator' : 'Administrator'} Dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-defi-red-400">
            <AlertTriangle className="h-4 w-4" />
            <span>Use caution - these actions affect the entire protocol</span>
          </div>
        </motion.div>

        {/* Protocol Stats Overview */}
        <motion.div variants={itemVariants}>
          <Suspense fallback={<ProtocolStatsSkeleton />}>
            <ProtocolStats />
          </Suspense>
        </motion.div>

        {/* Management Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contract Management */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="defi-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="h-5 w-5 text-defi-blue-400" />
                <h2 className="text-xl font-bold text-white">Contract Management</h2>
              </div>
              <Suspense fallback={<div>Loading...</div>}>
                <ContractManagement />
              </Suspense>
            </div>

            <div className="defi-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <Cog className="h-5 w-5 text-defi-purple-400" />
                <h2 className="text-xl font-bold text-white">Token Whitelist</h2>
              </div>
              <Suspense fallback={<div>Loading...</div>}>
                <TokenWhitelistManager />
              </Suspense>
            </div>
          </motion.div>

          {/* User & Operations Management */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="defi-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-5 w-5 text-defi-green-400" />
                <h2 className="text-xl font-bold text-white">User Management</h2>
              </div>
              <Suspense fallback={<div>Loading...</div>}>
                <UserManagement />
              </Suspense>
            </div>

            <div className="defi-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="h-5 w-5 text-defi-pink-400" />
                <h2 className="text-xl font-bold text-white">Redemption Queue</h2>
              </div>
              <Suspense fallback={<div>Loading...</div>}>
                <RedemptionManagement />
              </Suspense>
            </div>
          </motion.div>
        </div>

        {/* Emergency Controls */}
        {isSuperAdmin && (
          <motion.div variants={itemVariants}>
            <div className="defi-card border-2 border-defi-red-500/30 bg-defi-red-500/5 p-6">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="h-5 w-5 text-defi-red-400" />
                <h2 className="text-xl font-bold text-defi-red-300">Emergency Controls</h2>
              </div>
              <Suspense fallback={<div>Loading...</div>}>
                <EmergencyControls />
              </Suspense>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

function ProtocolStatsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="defi-card p-6 space-y-3">
          <div className="h-4 w-20 bg-slate-700/50 rounded shimmer" />
          <div className="h-8 w-24 bg-slate-700/50 rounded shimmer" />
          <div className="h-3 w-16 bg-slate-700/50 rounded shimmer" />
        </div>
      ))}
    </div>
  )
} 