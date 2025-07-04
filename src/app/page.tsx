'use client'

import React from 'react'

export default function HomePage() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      <div className="text-center space-y-6">
        <h1 className="text-5xl md:text-6xl font-bold gradient-text leading-tight">
          Next-Gen Bitcoin DeFi
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Wrap, stake, and earn with Bitcoin-backed tokens. Professional DeFi experience 
          with institutional-grade security and transparency.
        </p>
        <div className="defi-card p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-white mb-4">Welcome to SovaBTC</h2>
          <p className="text-slate-300">
            The modern DeFi protocol is loading. Connect your wallet to get started.
          </p>
        </div>
      </div>
    </div>
  )
}