// Application Constants - SovaBTC Protocol

// Application Info
export const APP_NAME = 'SovaBTC Protocol';
export const APP_DESCRIPTION = 'Decentralized Bitcoin Infrastructure on Base';
export const APP_VERSION = '1.0.0';

// Network Configuration
export const SUPPORTED_CHAIN_IDS = [84532] as const; // Base Sepolia
export const DEFAULT_CHAIN_ID = 84532;

// Token Configuration
export const TOKEN_DECIMALS = {
  SOVABTC: 8,
  SOVA: 18,
  WBTC: 8,
  LBTC: 8,
  USDC: 6,
  ETH: 18,
} as const;

// Transaction Configuration
export const DEFAULT_SLIPPAGE = 0.5; // 0.5%
export const MAX_SLIPPAGE = 5; // 5%
export const MIN_SLIPPAGE = 0.1; // 0.1%

// Staking Configuration
export const STAKING_LOCK_PERIODS = [
  { days: 0, multiplier: 1.0, label: 'No Lock' },
  { days: 7, multiplier: 1.1, label: '7 Days' },
  { days: 30, multiplier: 1.25, label: '30 Days' },
  { days: 90, multiplier: 1.5, label: '90 Days' },
  { days: 180, multiplier: 1.75, label: '180 Days' },
  { days: 365, multiplier: 2.0, label: '1 Year' },
] as const;

// Redemption Configuration
export const REDEMPTION_DELAY_SECONDS = 10 * 24 * 60 * 60; // 10 days
export const REDEMPTION_DELAY_DAYS = 10;

// UI Configuration
export const MOBILE_BREAKPOINT = 768;
export const TABLET_BREAKPOINT = 1024;
export const DESKTOP_BREAKPOINT = 1280;

// Animation Configuration
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Polling Intervals (in milliseconds)
export const POLLING_INTERVALS = {
  FAST: 5000,      // 5 seconds
  NORMAL: 10000,   // 10 seconds
  SLOW: 30000,     // 30 seconds
  BLOCK: 12000,    // 12 seconds (Base block time)
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  STALE_TIME: 5 * 60 * 1000,    // 5 minutes
  GC_TIME: 10 * 60 * 1000,      // 10 minutes
  REFETCH_INTERVAL: 30 * 1000,   // 30 seconds
} as const;

// Minimum Values
export const MINIMUM_VALUES = {
  DEPOSIT_BTC: 0.001,      // 0.001 BTC
  DEPOSIT_USD: 10,         // $10 USD
  STAKE_SOVA: 1,           // 1 SOVA
  REDEEM_BTC: 0.0001,      // 0.0001 BTC
} as const;

// Maximum Values
export const MAXIMUM_VALUES = {
  DEPOSIT_BTC: 1000,       // 1000 BTC
  STAKE_SOVA: 1000000,     // 1M SOVA
  REDEEM_BTC: 1000,        // 1000 BTC
} as const;

// Gas Configuration
export const GAS_LIMITS = {
  APPROVE: 50000n,
  DEPOSIT: 200000n,
  WITHDRAW: 200000n,
  STAKE: 150000n,
  UNSTAKE: 150000n,
  CLAIM_REWARDS: 100000n,
  REDEEM: 250000n,
  FULFILL_REDEMPTION: 300000n,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  AMOUNT_TOO_LOW: 'Amount is below minimum',
  AMOUNT_TOO_HIGH: 'Amount is above maximum',
  INVALID_AMOUNT: 'Please enter a valid amount',
  TRANSACTION_FAILED: 'Transaction failed',
  NETWORK_ERROR: 'Network error occurred',
  APPROVAL_REQUIRED: 'Token approval required',
  UNSUPPORTED_TOKEN: 'Token not supported',
  SLIPPAGE_TOO_HIGH: 'Slippage too high',
  DEADLINE_EXCEEDED: 'Transaction deadline exceeded',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  TRANSACTION_CONFIRMED: 'Transaction confirmed',
  APPROVAL_SUCCESSFUL: 'Approval successful',
  DEPOSIT_SUCCESSFUL: 'Deposit successful',
  WITHDRAWAL_SUCCESSFUL: 'Withdrawal successful',
  STAKE_SUCCESSFUL: 'Stake successful',
  UNSTAKE_SUCCESSFUL: 'Unstake successful',
  CLAIM_SUCCESSFUL: 'Rewards claimed successfully',
  REDEEM_SUCCESSFUL: 'Redemption requested',
  FULFILL_SUCCESSFUL: 'Redemption fulfilled',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'sovabtc-theme',
  SLIPPAGE: 'sovabtc-slippage',
  TRANSACTION_HISTORY: 'sovabtc-tx-history',
  USER_PREFERENCES: 'sovabtc-preferences',
  CACHE_VERSION: 'sovabtc-cache-version',
} as const;

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 10000,          // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,       // 1 second
} as const;

// External URLs
export const EXTERNAL_URLS = {
  DOCS: 'https://docs.sovabtc.com',
  TWITTER: 'https://twitter.com/sovabtc',
  DISCORD: 'https://discord.gg/sovabtc',
  GITHUB: 'https://github.com/sovabtc',
  MEDIUM: 'https://medium.com/@sovabtc',
  TERMS: 'https://sovabtc.com/terms',
  PRIVACY: 'https://sovabtc.com/privacy',
  HELP: 'https://help.sovabtc.com',
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  STAKING_ENABLED: true,
  REDEMPTION_ENABLED: true,
  ADVANCED_CHARTS: true,
  MOBILE_APP_PROMO: false,
  GOVERNANCE_BETA: false,
  CROSS_CHAIN_BETA: false,
} as const;

// Chart Configuration
export const CHART_CONFIG = {
  COLORS: {
    PRIMARY: '#8B5CF6',
    SECONDARY: '#EC4899',
    ACCENT: '#3B82F6',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    GRID: '#374151',
    TEXT: '#9CA3AF',
  },
  RESPONSIVE: [
    { breakpoint: 768, width: 300, height: 200 },
    { breakpoint: 1024, width: 500, height: 300 },
    { breakpoint: 1280, width: 700, height: 400 },
  ],
} as const;

// Social Media
export const SOCIAL_LINKS = {
  TWITTER: 'https://twitter.com/sovabtc',
  DISCORD: 'https://discord.gg/sovabtc',
  TELEGRAM: 'https://t.me/sovabtc',
  GITHUB: 'https://github.com/sovabtc',
  MEDIUM: 'https://medium.com/@sovabtc',
} as const;

// Analytics Events
export const ANALYTICS_EVENTS = {
  WALLET_CONNECTED: 'wallet_connected',
  WALLET_DISCONNECTED: 'wallet_disconnected',
  DEPOSIT_INITIATED: 'deposit_initiated',
  DEPOSIT_COMPLETED: 'deposit_completed',
  WITHDRAWAL_INITIATED: 'withdrawal_initiated',
  WITHDRAWAL_COMPLETED: 'withdrawal_completed',
  STAKE_INITIATED: 'stake_initiated',
  STAKE_COMPLETED: 'stake_completed',
  UNSTAKE_INITIATED: 'unstake_initiated',
  UNSTAKE_COMPLETED: 'unstake_completed',
  REDEMPTION_INITIATED: 'redemption_initiated',
  REDEMPTION_COMPLETED: 'redemption_completed',
  PAGE_VIEW: 'page_view',
  TRANSACTION_ERROR: 'transaction_error',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// Toast Configuration
export const TOAST_CONFIG = {
  DURATION: {
    SHORT: 3000,
    NORMAL: 5000,
    LONG: 8000,
  },
  POSITION: 'top-right',
  MAX_TOASTS: 3,
} as const;

// Wallet Configuration
export const WALLET_CONFIG = {
  AUTO_CONNECT: true,
  CACHE_PROVIDER: true,
  THEME: 'dark',
  MODAL_SIZE: 'compact',
} as const;

// Development Configuration
export const DEV_CONFIG = {
  ENABLE_DEVTOOLS: process.env.NODE_ENV === 'development',
  MOCK_DATA: process.env.NODE_ENV === 'development',
  LOG_LEVEL: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
} as const;

// Type Definitions
export type ChainId = typeof SUPPORTED_CHAIN_IDS[number];
export type TokenSymbol = keyof typeof TOKEN_DECIMALS;
export type StakingLockPeriod = typeof STAKING_LOCK_PERIODS[number];
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
export type SuccessMessageKey = keyof typeof SUCCESS_MESSAGES;
export type StorageKey = keyof typeof STORAGE_KEYS;
export type FeatureFlag = keyof typeof FEATURE_FLAGS;
export type AnalyticsEvent = keyof typeof ANALYTICS_EVENTS;
export type NotificationType = keyof typeof NOTIFICATION_TYPES; 