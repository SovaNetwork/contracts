import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { metaMask, walletConnect, coinbaseWallet, injected } from 'wagmi/connectors';

// Define the chains we support
export const chains = [baseSepolia] as const;

// Create wagmi config
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    metaMask(),
    coinbaseWallet({
      appName: 'SovaBTC',
      appLogoUrl: '/logo.svg',
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
    }),
    injected(),
  ],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
  },
});

// Export chain information
export const BLOCK_EXPLORER_URLS = {
  [baseSepolia.id]: 'https://sepolia.basescan.org',
} as const;

export function getBlockExplorerUrl(chainId: number) {
  return BLOCK_EXPLORER_URLS[chainId as keyof typeof BLOCK_EXPLORER_URLS] || '';
}

export function getBlockExplorerTxUrl(chainId: number, txHash: string) {
  const baseUrl = getBlockExplorerUrl(chainId);
  return baseUrl ? `${baseUrl}/tx/${txHash}` : '';
}

export function getBlockExplorerAddressUrl(chainId: number, address: string) {
  const baseUrl = getBlockExplorerUrl(chainId);
  return baseUrl ? `${baseUrl}/address/${address}` : '';
}