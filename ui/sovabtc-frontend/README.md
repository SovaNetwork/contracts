# SovaBTC Frontend

A modern, responsive frontend application for the SovaBTC protocol - a multi-chain Bitcoin-backed token system with LayerZero integration, redemption queues, and staking rewards.

## 🚀 Features

- **Multi-Token Wrapping**: Wrap various BTC-pegged tokens (WBTC, etc.) into unified SovaBTC
- **Cross-Chain Bridge**: Bridge SovaBTC between Base, Ethereum, and Sova using LayerZero
- **Redemption Queue**: Queue-based redemption system with configurable delays
- **Staking Rewards**: Stake SovaBTC and SOVA tokens to earn protocol rewards
- **Immediate BTC Withdrawal**: Direct Bitcoin withdrawals on Sova network
- **Portfolio Management**: Comprehensive portfolio tracking and analytics

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + Shadcn/UI components
- **Web3**: Wagmi v2 + Viem + RainbowKit
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Notifications**: Sonner
- **TypeScript**: Full type safety

## 🌐 Supported Networks

- **Base Sepolia** (Primary testnet)
- **Ethereum Sepolia** (Secondary testnet)
- **Sova Testnet** (Coming soon)

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sovabtc/frontend.git
   cd sovabtc-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration values.

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuration

### Environment Variables

Key environment variables to configure:

```env
# WalletConnect Project ID (required)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id

# Contract Addresses (update with deployed addresses)
NEXT_PUBLIC_SOVABTC_BASE_ADDRESS=0x...
NEXT_PUBLIC_WRAPPER_BASE_ADDRESS=0x...
NEXT_PUBLIC_STAKING_BASE_ADDRESS=0x...

# Feature Flags
NEXT_PUBLIC_ENABLE_STAKING=true
NEXT_PUBLIC_ENABLE_BRIDGING=true
NEXT_PUBLIC_ENABLE_REDEMPTION=true
```

### Getting a WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up or log in
3. Create a new project
4. Copy the Project ID to your environment variables

## 🏗 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Landing page
│   └── providers.tsx      # Web3 and theme providers
├── components/
│   ├── ui/                # Shadcn/UI components
│   ├── web3/              # Web3-specific components
│   │   ├── connect-wallet.tsx
│   │   └── network-switcher.tsx
│   └── layout/            # Layout components
│       ├── header.tsx
│       └── footer.tsx
├── config/                # Configuration files
│   ├── wagmi.ts          # Wagmi configuration
│   ├── contracts.ts      # Contract addresses and ABIs
│   └── chains.ts         # Chain configurations
├── hooks/                 # Custom React hooks
│   └── use-contracts.ts  # Contract interaction hooks
├── lib/                   # Utility functions
│   ├── utils.ts          # General utilities
│   └── constants.ts      # Protocol constants
└── types/                 # TypeScript type definitions
    └── contracts.ts      # Contract-related types
```

## 🎨 Design System

The application uses a custom design system built on:

- **Colors**: Orange/Yellow gradient theme matching Bitcoin branding
- **Typography**: Inter font family
- **Components**: Shadcn/UI with custom modifications
- **Icons**: Lucide React icons
- **Responsive**: Mobile-first design approach

## 🔧 Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with Next.js recommended rules
- **Prettier**: Code formatting (configure in your editor)
- **Husky**: Git hooks for pre-commit checks (optional)

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Manual Deployment

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 🔐 Security Considerations

- **Input Validation**: All user inputs are validated
- **Transaction Simulation**: Transactions are simulated before execution
- **Slippage Protection**: Configurable slippage tolerance
- **Network Validation**: Ensures users are on supported networks
- **Error Handling**: Comprehensive error handling and user feedback

## 🧪 Testing (Coming Soon)

Testing will be implemented in future iterations with:

- **Unit Tests**: Vitest + React Testing Library
- **Integration Tests**: Playwright for E2E testing
- **Contract Tests**: Wagmi test utilities
- **Visual Tests**: Chromatic for visual regression testing

## 📄 API Reference

### Custom Hooks

#### `useContractAddresses()`
Returns contract addresses for the current chain.

#### `useSovaBTC()`
Hook for SovaBTC token interactions (balance, allowance, transfers).

#### `useWrapper()`
Hook for wrapper contract interactions (deposits, whitelisted tokens).

#### `useStaking()`
Hook for staking contract interactions (stake, unstake, rewards).

#### `useERC20(tokenAddress)`
Generic hook for ERC20 token interactions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- [SovaBTC Protocol Docs](https://docs.sovabtc.com)
- [GitHub Repository](https://github.com/sovabtc/frontend)
- [Twitter](https://twitter.com/sovabtc)
- [Discord](https://discord.gg/sovabtc)

## 🐛 Known Issues

- Sova network integration is still in development
- Some features may not work on unsupported networks
- Contract addresses need to be updated after deployment

## 📈 Roadmap

- [ ] Complete Task 2: Token Deposit Interface
- [ ] Complete Task 3: Cross-Chain Bridge Interface
- [ ] Complete Task 4: Redemption Queue Dashboard
- [ ] Complete Task 5: Immediate BTC Withdrawal
- [ ] Complete Task 6: Staking Dashboard
- [ ] Complete Task 7: Portfolio & Analytics
- [ ] Complete Task 8: Admin Panel (Optional)

---

Built with ❤️ by the SovaBTC team
