'use client';

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { type Address } from 'viem';

// Admin Role Configuration
export type AdminRole = 'super_admin' | 'custodian' | 'protocol_admin' | 'emergency_admin';

export interface AdminConfig {
  address: Address;
  roles: AdminRole[];
  permissions: string[];
}

// Authorized Admin Addresses with Role-Based Access
export const AUTHORIZED_ADMINS: AdminConfig[] = [
  {
    address: '0x6182051f545E673b54119800126d8802E3Da034b',
    roles: ['super_admin', 'custodian', 'protocol_admin', 'emergency_admin'],
    permissions: [
      'view_dashboard',
      'manage_whitelist',
      'emergency_pause',
      'emergency_unpause',
      'fulfill_redemptions',
      'manage_custodians',
      'view_analytics',
      'export_data',
      'system_config',
      'protocol_upgrade'
    ]
  },
  // Add more admins as needed
];

export interface AdminAuthState {
  isAdmin: boolean;
  roles: AdminRole[];
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasRole: (role: AdminRole) => boolean;
  adminConfig: AdminConfig | null;
}

export function useAdminAuth(): AdminAuthState {
  const { address, isConnected } = useAccount();

  const adminState = useMemo((): AdminAuthState => {
    if (!isConnected || !address) {
      return {
        isAdmin: false,
        roles: [],
        permissions: [],
        hasPermission: () => false,
        hasRole: () => false,
        adminConfig: null,
      };
    }

    // Find admin configuration for current address
    const adminConfig = AUTHORIZED_ADMINS.find(
      admin => admin.address.toLowerCase() === address.toLowerCase()
    );

    if (!adminConfig) {
      return {
        isAdmin: false,
        roles: [],
        permissions: [],
        hasPermission: () => false,
        hasRole: () => false,
        adminConfig: null,
      };
    }

    return {
      isAdmin: true,
      roles: adminConfig.roles,
      permissions: adminConfig.permissions,
      hasPermission: (permission: string) => adminConfig.permissions.includes(permission),
      hasRole: (role: AdminRole) => adminConfig.roles.includes(role),
      adminConfig,
    };
  }, [address, isConnected]);

  return adminState;
}

// Permission helpers
export const ADMIN_PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  MANAGE_WHITELIST: 'manage_whitelist',
  EMERGENCY_PAUSE: 'emergency_pause',
  EMERGENCY_UNPAUSE: 'emergency_unpause',
  FULFILL_REDEMPTIONS: 'fulfill_redemptions',
  MANAGE_CUSTODIANS: 'manage_custodians',
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data',
  SYSTEM_CONFIG: 'system_config',
  PROTOCOL_UPGRADE: 'protocol_upgrade',
} as const;

export type AdminPermission = typeof ADMIN_PERMISSIONS[keyof typeof ADMIN_PERMISSIONS]; 