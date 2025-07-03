// Import your existing ABIs
import SovaBTCABI from './SovaBTC.abi.json';
import SOVATokenABI from './SOVAToken.abi.json';
import SovaBTCWrapperABI from './SovaBTCWrapper.abi.json';
import TokenWhitelistABI from './TokenWhitelist.abi.json';
import CustodyManagerABI from './CustodyManager.abi.json';
import RedemptionQueueABI from './RedemptionQueue.abi.json';
import SovaBTCStakingABI from './SovaBTCStaking.abi.json';

// Export with proper typing
export const SOVABTC_ABI = SovaBTCABI as const;
export const SOVA_TOKEN_ABI = SOVATokenABI as const;
export const SOVABTC_WRAPPER_ABI = SovaBTCWrapperABI as const;
export const TOKEN_WHITELIST_ABI = TokenWhitelistABI as const;
export const CUSTODY_MANAGER_ABI = CustodyManagerABI as const;
export const REDEMPTION_QUEUE_ABI = RedemptionQueueABI as const;
export const SOVABTC_STAKING_ABI = SovaBTCStakingABI as const;

export const ABIS = {
  SOVABTC: SOVABTC_ABI,
  SOVA_TOKEN: SOVA_TOKEN_ABI,
  WRAPPER: SOVABTC_WRAPPER_ABI,
  TOKEN_WHITELIST: TOKEN_WHITELIST_ABI,
  CUSTODY_MANAGER: CUSTODY_MANAGER_ABI,
  REDEMPTION_QUEUE: REDEMPTION_QUEUE_ABI,
  STAKING: SOVABTC_STAKING_ABI,
} as const;