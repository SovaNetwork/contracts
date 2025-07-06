'use client';

import { ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { connectorsForWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import {
  injectedWallet,
  rainbowWallet,
  walletConnectWallet,
  coinbaseWallet,
  metaMaskWallet,
} from '@rainbow-me/rainbowkit/wallets';

import '@rainbow-me/rainbowkit/styles.css';
import { CHAIN_ID, NETWORK_CONFIG } from '@/contracts/addresses';

// Configure supported wallets
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        rainbowWallet,
        injectedWallet,
      ],
    },
    {
      groupName: 'Other',
      wallets: [
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: 'SovaBTC Protocol',
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id',
  }
);

// Create Wagmi configuration
const config = createConfig({
  connectors,
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(NETWORK_CONFIG.rpcUrl),
  },
  ssr: true,
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

// RainbowKit theme configuration
const rainbowKitTheme = {
  blurs: {
    modalOverlay: 'blur(4px)',
  },
  colors: {
    accentColor: '#8B5CF6',
    accentColorForeground: 'white',
    actionButtonBorder: 'rgba(255, 255, 255, 0.04)',
    actionButtonBorderMobile: 'rgba(255, 255, 255, 0.08)',
    actionButtonSecondaryBackground: 'rgba(255, 255, 255, 0.08)',
    closeButton: 'rgba(224, 232, 255, 0.6)',
    closeButtonBackground: 'rgba(255, 255, 255, 0.08)',
    connectButtonBackground: '#8B5CF6',
    connectButtonBackgroundError: '#FF6B6B',
    connectButtonInnerBackground: 'linear-gradient(0deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.15))',
    connectButtonText: 'white',
    connectButtonTextError: 'white',
    connectionIndicator: '#30E000',
    downloadBottomCardBackground: 'linear-gradient(126deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05))',
    downloadTopCardBackground: 'linear-gradient(126deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05))',
    error: '#FF6B6B',
    generalBorder: 'rgba(255, 255, 255, 0.08)',
    generalBorderDim: 'rgba(255, 255, 255, 0.04)',
    menuItemBackground: 'rgba(224, 232, 255, 0.1)',
    modalBackdrop: 'rgba(0, 0, 0, 0.5)',
    modalBackground: '#1a1b23',
    modalBorder: 'rgba(255, 255, 255, 0.08)',
    modalText: 'white',
    modalTextDim: 'rgba(224, 232, 255, 0.7)',
    modalTextSecondary: 'rgba(255, 255, 255, 0.6)',
    profileAction: 'rgba(224, 232, 255, 0.1)',
    profileActionHover: 'rgba(224, 232, 255, 0.2)',
    profileForeground: 'rgba(224, 232, 255, 0.05)',
    selectedOptionBorder: 'rgba(139, 92, 246, 0.3)',
    standby: '#FFD23F',
  },
  fonts: {
    body: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  },
  radii: {
    actionButton: '12px',
    connectButton: '12px',
    menuButton: '12px',
    modal: '16px',
    modalMobile: '16px',
  },
  shadows: {
    connectButton: '0 4px 12px rgba(139, 92, 246, 0.15)',
    dialog: '0 8px 32px rgba(0, 0, 0, 0.32)',
    profileDetailsAction: '0 2px 6px rgba(37, 41, 46, 0.04)',
    selectedOption: '0 2px 6px rgba(139, 92, 246, 0.24)',
    selectedWallet: '0 2px 6px rgba(139, 92, 246, 0.24)',
    walletLogo: '0 2px 16px rgba(0, 0, 0, 0.16)',
  },
};

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={rainbowKitTheme}
          appInfo={{
            appName: 'SovaBTC Protocol',
            learnMoreUrl: 'https://docs.sovabtc.com',
          }}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Export the config for use in other parts of the app
export { config as wagmiConfig };
export { queryClient };

// Helper function to check if we're on the correct network
export function isCorrectNetwork(chainId: number | undefined): boolean {
  return chainId === CHAIN_ID;
}

// Helper function to get the network name
export function getNetworkName(chainId: number | undefined): string {
  if (chainId === baseSepolia.id) {
    return baseSepolia.name;
  }
  return 'Unknown Network';
}

// Helper function to get the block explorer URL
export function getBlockExplorerUrl(chainId: number | undefined): string {
  if (chainId === baseSepolia.id) {
    return baseSepolia.blockExplorers.default.url;
  }
  return '';
} 