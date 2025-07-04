import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { metaMask, coinbaseWallet, injected } from 'wagmi/connectors';

// Define the chains we support
export const chains = [baseSepolia] as const;

// Create wagmi config without WalletConnect to avoid SSR issues
// WalletConnect will be handled by Rainbow Kit if needed
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    metaMask(),
    coinbaseWallet({
      appName: 'SovaBTC',
      appLogoUrl: '/logo.svg',
    }),
    injected(),
  ],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
  },
  ssr: true, // Enable SSR support
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