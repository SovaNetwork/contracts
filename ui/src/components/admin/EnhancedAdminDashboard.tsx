'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Settings, 
  Activity, 
  List, 
  AlertTriangle,
  BarChart3,
  Users,
  Download,
  Eye,
  Lock
} from 'lucide-react';

import { useAdminAuth, ADMIN_PERMISSIONS } from '@/hooks/web3/useAdminAuth';
import { ProtocolHealthDashboard } from './ProtocolHealthDashboard';
import { WhitelistManagement } from './WhitelistManagement';
import { EmergencyControls } from './EmergencyControls';
import { CustodianDashboard } from './CustodianDashboard';
import { AdvancedAnalytics } from './AdvancedAnalytics';
import { WhitelistOwnership } from './WhitelistOwnership';
import { cn } from '@/lib/utils';

type AdminTab = 'overview' | 'health' | 'whitelist' | 'emergency' | 'custodian' | 'analytics' | 'ownership';

interface AdminTabConfig {
  id: AdminTab;
  title: string;
  icon: React.ReactNode;
  description: string;
  requiredPermission: string;
  component: React.ComponentType;
}

const adminTabs: AdminTabConfig[] = [
  {
    id: 'overview',
    title: 'Overview',
    icon: <Activity className="w-5 h-5" />,
    description: 'Protocol overview and quick stats',
    requiredPermission: ADMIN_PERMISSIONS.VIEW_DASHBOARD,
    component: ProtocolHealthDashboard,
  },
  {
    id: 'health',
    title: 'Health Monitoring',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Real-time protocol health metrics',
    requiredPermission: ADMIN_PERMISSIONS.VIEW_ANALYTICS,
    component: ProtocolHealthDashboard,
  },
  {
    id: 'whitelist',
    title: 'Whitelist Management',
    icon: <List className="w-5 h-5" />,
    description: 'Manage approved tokens',
    requiredPermission: ADMIN_PERMISSIONS.MANAGE_WHITELIST,
    component: WhitelistManagement,
  },
  {
    id: 'ownership',
    title: 'Ownership Management',
    icon: <Shield className="w-5 h-5" />,
    description: 'Manage contract ownership and permissions',
    requiredPermission: ADMIN_PERMISSIONS.VIEW_DASHBOARD,
    component: WhitelistOwnership,
  },
  {
    id: 'emergency',
    title: 'Emergency Controls',
    icon: <AlertTriangle className="w-5 h-5" />,
    description: 'Critical protocol controls',
    requiredPermission: ADMIN_PERMISSIONS.EMERGENCY_PAUSE,
    component: EmergencyControls,
  },
  {
    id: 'custodian',
    title: 'Custodian Operations',
    icon: <Users className="w-5 h-5" />,
    description: 'Redemption fulfillment',
    requiredPermission: ADMIN_PERMISSIONS.FULFILL_REDEMPTIONS,
    component: CustodianDashboard,
  },
  {
    id: 'analytics',
    title: 'Advanced Analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Comprehensive protocol analytics and insights',
    requiredPermission: ADMIN_PERMISSIONS.VIEW_ANALYTICS,
    component: AdvancedAnalytics,
  },
];

interface AdminHeaderProps {
  adminConfig: any;
  activeTab: AdminTab;
  availableTabs: AdminTabConfig[];
  onTabChange: (tab: AdminTab) => void;
}

function AdminHeader({ adminConfig, activeTab, availableTabs, onTabChange }: AdminHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Enhanced Admin Panel</h1>
          <p className="text-foreground/60 mt-1">
            Comprehensive protocol management and monitoring
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
            <Shield className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">
              Admin Connected
            </span>
          </div>
          
          <div className="text-sm text-foreground/60">
            <span className="font-medium">Roles:</span> {adminConfig.roles.join(', ')}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-card/50 p-1 rounded-lg border border-border/30">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all",
              activeTab === tab.id
                ? "bg-defi-purple text-white shadow-lg"
                : "text-foreground/60 hover:text-foreground hover:bg-card/80"
            )}
          >
            {tab.icon}
            <span>{tab.title}</span>
          </button>
        ))}
      </div>
      
      {/* Tab Description */}
      <div className="defi-card p-4 bg-card/30">
        <p className="text-foreground/70">
          {availableTabs.find(t => t.id === activeTab)?.description}
        </p>
      </div>
    </div>
  );
}

function AccessDenied({ address }: { address: string }) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="defi-card p-8 text-center">
        <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold gradient-text mb-4">Access Denied</h1>
        <p className="text-foreground/60 mb-4">
          Your wallet address is not authorized for admin access.
        </p>
        <p className="text-sm text-foreground/40 mb-6">
          Connected Address: {address}
        </p>
        <p className="text-sm text-foreground/40">
          Contact the protocol administrator to request admin access.
        </p>
      </div>
    </div>
  );
}

function ConnectWallet() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="defi-card p-8 text-center">
        <Shield className="w-16 h-16 text-defi-purple mx-auto mb-4" />
        <h1 className="text-3xl font-bold gradient-text mb-4">Enhanced Admin Panel</h1>
        <p className="text-foreground/60 mb-6">
          Connect your wallet to access administrative functions
        </p>
        <ConnectButton />
      </div>
    </div>
  );
}

export function EnhancedAdminDashboard() {
  const { address, isConnected } = useAccount();
  const { isAdmin, hasPermission, adminConfig } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Filter tabs based on user permissions
  const availableTabs = adminTabs.filter(tab => 
    hasPermission(tab.requiredPermission)
  );

  // Authentication checks
  if (!isConnected) {
    return <ConnectWallet />;
  }

  if (!isAdmin || !adminConfig) {
    return <AccessDenied address={address!} />;
  }

  // Get the active component
  const ActiveComponent = availableTabs.find(t => t.id === activeTab)?.component || ProtocolHealthDashboard;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Admin Header with Navigation */}
      <AdminHeader
        adminConfig={adminConfig}
        activeTab={activeTab}
        availableTabs={availableTabs}
        onTabChange={setActiveTab}
      />

      {/* Active Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <ActiveComponent />
      </motion.div>

      {/* Admin Info Footer */}
      <div className="mt-12 defi-card p-4 bg-card/30">
        <div className="flex items-center justify-between text-sm text-foreground/60">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Admin: {adminConfig.address.slice(0, 6)}...{adminConfig.address.slice(-4)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Permissions: {adminConfig.permissions.length}</span>
            </div>
          </div>
          
          <div className="text-xs text-foreground/40">
            SovaBTC Enhanced Admin Panel v2.0
          </div>
        </div>
      </div>
    </div>
  );
} 