# Phase 1: Modern DeFi Project Setup & Foundation

## Overview
Setting up a professional DeFi frontend with modern animations and Uniswap-style design patterns.

## Project Structure
```
ui/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── wrap/
│   │   ├── redeem/
│   │   ├── stake/
│   │   └── portfolio/
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── layout/
│   │   ├── web3/
│   │   └── animations/
│   ├── contracts/
│   ├── hooks/
│   ├── lib/
│   └── config/
├── package.json
├── tailwind.config.js
└── next.config.js
```

## Step 1: Initialize Next.js Project

```bash
# Create Next.js 14 project in ui/ directory
npx create-next-app@latest ui --typescript --tailwind --eslint --app --src-dir

cd ui

# Install Web3 dependencies
npm install wagmi viem @tanstack/react-query @rainbow-me/rainbowkit
npm install @radix-ui/react-icons lucide-react
npm install zustand class-variance-authority clsx tailwind-merge
npm install framer-motion @radix-ui/react-slot

# Install shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label toast tabs dialog select badge progress
```

## Step 2: Professional DeFi Tailwind Configuration

```javascript
// tailwind.config.js
const { fontFamily } = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // DeFi Brand Colors - Professional gradient palette
        'defi-purple': {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6', // Primary
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        'defi-pink': {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899', // Secondary
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        'defi-blue': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Accent
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Success/Error colors for DeFi
        'defi-green': {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        'defi-red': {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'defi-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #3b82f6 100%)',
        'defi-gradient-soft': 'linear-gradient(135deg, #f5f3ff 0%, #fdf2f8 50%, #eff6ff 100%)',
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "bounce-gentle": "bounce-gentle 2s infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "slide-up": {
          from: { transform: "translateY(100%)", opacity: 0 },
          to: { transform: "translateY(0)", opacity: 1 },
        },
        "slide-down": {
          from: { transform: "translateY(-100%)", opacity: 0 },
          to: { transform: "translateY(0)", opacity: 1 },
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "scale-in": {
          from: { transform: "scale(0.9)", opacity: 0 },
          to: { transform: "scale(1)", opacity: 1 },
        },
        "bounce-gentle": {
          "0%, 100%": { 
            transform: "translateY(-5%)",
            animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)",
          },
          "50%": { 
            transform: "translateY(0)",
            animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
          },
        },
        "shimmer": {
          from: {
            backgroundPosition: "0 0",
          },
          to: {
            backgroundPosition: "-200% 0",
          },
        },
      },
      boxShadow: {
        'defi-glow': '0 0 20px rgba(139, 92, 246, 0.3)',
        'defi-card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'defi-card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

## Step 3: Modern CSS Variables

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
    --radius: 0.75rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    @apply bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950;
    min-height: 100vh;
  }
}

@layer components {
  /* DeFi Glass Card Effect */
  .defi-card {
    @apply backdrop-blur-xl bg-white/5 border border-white/10;
    @apply shadow-defi-card hover:shadow-defi-card-hover;
    @apply transition-all duration-300 ease-out;
  }
  
  .defi-card:hover {
    @apply bg-white/10 border-white/20;
    @apply shadow-defi-glow;
  }
  
  /* Gradient Text */
  .gradient-text {
    @apply bg-gradient-to-r from-defi-purple-400 via-defi-pink-400 to-defi-blue-400;
    @apply bg-clip-text text-transparent;
  }
  
  /* Shimmer Effect for Loading */
  .shimmer {
    background: linear-gradient(
      110deg,
      transparent 40%,
      rgba(255, 255, 255, 0.1) 50%,
      transparent 60%
    );
    background-size: 200% 100%;
    animation: shimmer 2s linear infinite;
  }
  
  /* Interactive Button Animations */
  .defi-button {
    @apply relative overflow-hidden;
    @apply transition-all duration-300 ease-out;
    @apply hover:scale-105 active:scale-95;
  }
  
  .defi-button::before {
    content: '';
    @apply absolute inset-0 bg-gradient-to-r from-defi-purple-500/20 via-defi-pink-500/20 to-defi-blue-500/20;
    @apply translate-x-[-100%] transition-transform duration-500 ease-out;
  }
  
  .defi-button:hover::before {
    @apply translate-x-[100%];
  }
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  @apply bg-slate-900/50;
}

::-webkit-scrollbar-thumb {
  @apply bg-defi-purple-500/50 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-defi-purple-500/70;
}
```

## Step 4: Wagmi Configuration

```typescript
// src/config/wagmi.ts
'use client'

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
  appName: 'SovaBTC - Modern DeFi Protocol',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [baseSepolia],
  ssr: true,
})
```

## Step 5: Environment Variables

```bash
# .env.local
# Base Sepolia Configuration
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_BLOCK_EXPLORER=https://sepolia.basescan.org

# Contract Addresses (Your deployed contracts)
NEXT_PUBLIC_SOVABTC_ADDRESS=0xeed47bE0221E383643073ecdBF2e804433e4b077
NEXT_PUBLIC_SOVA_TOKEN_ADDRESS=0xDD4FFAB3ef55de9028BcADa261c32549b8d2Fc57
NEXT_PUBLIC_WRAPPER_ADDRESS=0x9fAD9a07691fAB4D757fdE4F2c61F836A8Dcd87f
NEXT_PUBLIC_TOKEN_WHITELIST_ADDRESS=0x73172C783Ac766CB951292C06a51f848A536cBc4
NEXT_PUBLIC_CUSTODY_MANAGER_ADDRESS=0xa117C55511751097B2c9d1633118F73E10FaB2A9
NEXT_PUBLIC_REDEMPTION_QUEUE_ADDRESS=0x07d01e0C535fD4777CcF5Ee8D66A90995cD74Cbb
NEXT_PUBLIC_STAKING_ADDRESS=0x5e6f97391Aa64Bfb6018795dcdC277A2C9B15b66

# Test Token Addresses
NEXT_PUBLIC_WBTC_TEST_ADDRESS=0x5fe42a7291d63F4B5ae233B4Ce0E95e2dD45556b
NEXT_PUBLIC_LBTC_TEST_ADDRESS=0x9B2a86059A9467C8Df05fb6Ad311eFaFAC6d990C
NEXT_PUBLIC_USDC_TEST_ADDRESS=0x53234a2Aa0FFD93448c70791A71f24Dcb69C4ADE

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

## Next Steps

After completing this setup:
1. Copy your ABIs from `../../abis/` to `src/contracts/abis/`
2. Move to Phase 2: Modern Layout & Navigation
3. Ensure all dependencies are installed and working

This foundation provides:
- ✅ Professional DeFi styling similar to Uniswap
- ✅ Smooth animations and transitions
- ✅ Glass morphism effects
- ✅ Modern gradient color palette
- ✅ Web3 infrastructure ready
- ✅ Responsive design foundation