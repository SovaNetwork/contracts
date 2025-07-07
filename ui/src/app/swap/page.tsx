import { UnifiedSwapInterface } from '@/components/wrap/UnifiedSwapInterface';

export default function SwapPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-4">
          Universal Swap
        </h1>
        <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
          Swap tokens and bridge across networks seamlessly. Wrap Bitcoin-backed tokens into sovaBTC, 
          unwrap them back to underlying assets, or bridge sovaBTC across different blockchains.
        </p>
      </div>

      {/* Main Swap Interface */}
      <div className="flex justify-center">
        <UnifiedSwapInterface />
      </div>

      {/* Information Cards */}
      <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="defi-card p-6">
          <h3 className="text-lg font-semibold mb-3 text-green-400">🔄 Token Wrapping</h3>
          <p className="text-sm text-foreground/70">
            Convert Bitcoin-backed tokens (WBTC, LBTC, USDC) into sovaBTC for unified Bitcoin exposure
            across the DeFi ecosystem.
          </p>
        </div>
        
        <div className="defi-card p-6">
          <h3 className="text-lg font-semibold mb-3 text-yellow-400">🔓 Token Unwrapping</h3>
          <p className="text-sm text-foreground/70">
            Redeem sovaBTC back to underlying tokens. Note: Unwrapping has a 10-day delay queue 
            for security purposes.
          </p>
        </div>
        
        <div className="defi-card p-6">
          <h3 className="text-lg font-semibold mb-3 text-purple-400">🌉 Cross-Chain Bridging</h3>
          <p className="text-sm text-foreground/70">
            Bridge sovaBTC between Ethereum, Base, Optimism, and other supported networks 
            using LayerZero technology.
          </p>
        </div>
      </div>

      {/* Network Status */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-card/50 border border-border/50 rounded-lg">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-foreground/70">
            Multi-chain protocol active on Ethereum, Base, and Optimism testnets
          </span>
        </div>
      </div>
    </div>
  );
} 