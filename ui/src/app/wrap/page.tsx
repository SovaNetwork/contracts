'use client';

import { BidirectionalWrapInterface } from '@/components/wrap/BidirectionalWrapInterface';

export default function WrapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Page Header */}
      <div className="container mx-auto px-4 pt-8 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Wrap Bitcoin</span>
          </h1>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Convert your Bitcoin-backed tokens into sovaBTC and join the Base ecosystem. 
            Get started by selecting a token and entering the amount you&apos;d like to wrap.
          </p>
        </div>

        {/* Wrap Interface */}
        <BidirectionalWrapInterface />

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="defi-card p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-defi-purple to-defi-pink mx-auto mb-4 flex items-center justify-center">
              <span className="text-lg font-bold">1</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Select Token</h3>
            <p className="text-foreground/70 text-sm">
              Choose from WBTC, LBTC, or USDC to wrap into sovaBTC
            </p>
          </div>

          <div className="defi-card p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-defi-pink to-defi-blue mx-auto mb-4 flex items-center justify-center">
              <span className="text-lg font-bold">2</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Approve & Wrap</h3>
            <p className="text-foreground/70 text-sm">
              Approve the contract to spend your tokens, then execute the wrap
            </p>
          </div>

          <div className="defi-card p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-defi-blue to-defi-purple mx-auto mb-4 flex items-center justify-center">
              <span className="text-lg font-bold">3</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Receive sovaBTC</h3>
            <p className="text-foreground/70 text-sm">
              Get sovaBTC tokens that you can stake, trade, or redeem later
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 gradient-text">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            <div className="defi-card p-6">
              <h3 className="font-semibold mb-2">What is sovaBTC?</h3>
              <p className="text-foreground/70 text-sm">
                sovaBTC is a wrapped Bitcoin token on Base that represents Bitcoin-backed assets. 
                It allows you to use Bitcoin in DeFi applications while maintaining exposure to Bitcoin&apos;s price.
              </p>
            </div>

            <div className="defi-card p-6">
              <h3 className="font-semibold mb-2">Which tokens can I wrap?</h3>
              <p className="text-foreground/70 text-sm">
                You can wrap WBTC (Wrapped Bitcoin), LBTC (Liquid Bitcoin), and USDC. 
                All supported tokens are converted to sovaBTC at market rates.
              </p>
            </div>

            <div className="defi-card p-6">
              <h3 className="font-semibold mb-2">Are there any fees?</h3>
              <p className="text-foreground/70 text-sm">
                The protocol may charge small fees for wrapping services. 
                You&apos;ll also pay gas fees for the blockchain transactions (approval and wrap).
              </p>
            </div>

            <div className="defi-card p-6">
              <h3 className="font-semibold mb-2">Can I unwrap my sovaBTC?</h3>
              <p className="text-foreground/70 text-sm">
                Yes! You can redeem your sovaBTC back to the underlying tokens through our 
                redemption queue system, which has a 10-day waiting period for security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 