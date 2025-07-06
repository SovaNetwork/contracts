# SovaBTC Protocol - Web3 Application

A comprehensive DeFi application for the SovaBTC protocol built on Base Sepolia. This application provides a complete interface for wrapping Bitcoin, staking tokens, and managing redemptions.

## 🚀 Features

### Core Functionality
- **Bitcoin Wrapping**: Convert Bitcoin-backed tokens (WBTC, LBTC, USDC) into sovaBTC
- **Staking System**: Stake sovaBTC and SOVA tokens to earn rewards
- **Redemption Queue**: 10-day redemption system for converting sovaBTC back to Bitcoin
- **Protocol Analytics**: Real-time TVL, APY, and protocol metrics

### Technical Features
- **Multi-Wallet Support**: MetaMask, Coinbase Wallet, WalletConnect, and more
- **Real-time Data**: Live balance updates and transaction monitoring
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark Theme**: Professional DeFi-inspired design system

## 🛠 Technology Stack

### Frontend Framework
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework

### Web3 Integration
- **Wagmi v1** - React hooks for Ethereum
- **Viem** - TypeScript interface for Ethereum
- **RainbowKit** - Wallet connection interface
- **TanStack Query** - Data synchronization and caching

### UI Components
- **shadcn/ui** - Reusable component library
- **Radix UI** - Accessible primitives
- **Lucide React** - Icon library
- **Framer Motion** - Animation library

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd contracts/ui
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Add your environment variables:
   ```
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Contract Addresses

The application is configured for Base Sepolia testnet with the following deployed contracts:

```typescript
// Core Protocol Contracts
SOVABTC: '0x37cc44e3b6c9386284e3a9f5b047c6933a80be0d'
SOVA_TOKEN: '0x2415a13271aa21dbac959b8143e072934dbc41c6'
WRAPPER: '0x5edae197d9e6e2be273cf67b5791f6b6f6cf04d3'
STAKING: '0xa433c557b13f69771184f00366e14b3d492578cf'
REDEMPTION_QUEUE: '0xb855b4aecabc18f65671efa337b17f86a6e24a61'

// Test Tokens
MOCK_WBTC: '0xb34227f992e4ec3aa8d6937eb2c9ed92e2650acd'
MOCK_LBTC: '0xb21dd6c1e73288c03f8f2ec0a896f2ccc5590cba'
MOCK_USDC: '0x0f7900ae7506196bff662ce793742980ed7d58ee'
```

### Network Configuration

- **Chain**: Base Sepolia (84532)
- **RPC URL**: https://sepolia.base.org
- **Block Explorer**: https://sepolia.basescan.org

## 🏗 Project Structure

```
src/
├── app/                     # Next.js App Router pages
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles and design system
├── components/             # React components
│   ├── ui/                 # Reusable UI components
│   ├── layout/             # Layout components
│   ├── wrap/               # Wrapping interface components
│   ├── stake/              # Staking interface components
│   ├── redeem/             # Redemption interface components
│   └── shared/             # Shared components
├── hooks/                  # Custom React hooks
│   ├── web3/               # Web3-specific hooks
│   ├── ui/                 # UI interaction hooks
│   └── api/                # API hooks
├── contracts/              # Smart contract integration
│   ├── addresses.ts        # Contract addresses and configuration
│   ├── abis/               # Contract ABIs
│   └── types.ts            # Contract type definitions
├── lib/                    # Utility functions
│   ├── utils.ts            # General utilities
│   ├── constants.ts        # Application constants
│   └── formatters.ts       # Token and data formatting
└── providers/              # React context providers
    └── web3-provider.tsx   # Web3 configuration
```

## 🎨 Design System

### Color Palette
- **Primary**: Purple gradient (#8B5CF6)
- **Secondary**: Pink gradient (#EC4899)
- **Accent**: Blue gradient (#3B82F6)
- **Background**: Dark slate theme
- **Text**: High contrast white/gray

### Components
- **defi-card**: Glassmorphism effect cards
- **gradient-text**: Gradient text for headings
- **btn-defi**: Gradient buttons with hover effects
- **card-hover**: Subtle hover animations

### Animations
- **Smooth transitions**: 300ms ease-out
- **Micro-interactions**: Button hovers and card effects
- **Loading states**: Shimmer animations
- **Page transitions**: Fade and slide effects

## 🔐 Web3 Integration

### Wallet Connection
```typescript
// Supported wallets
- MetaMask
- Coinbase Wallet
- WalletConnect
- Rainbow Wallet
- Injected wallets
```

### Contract Interactions
```typescript
// Example: Reading token balance
const { balance } = useTokenBalance({
  tokenAddress: ADDRESSES.SOVABTC,
  accountAddress: address,
});

// Example: Writing to contract
const { writeContract } = useWriteContract();
```

### Transaction Handling
- **Loading states**: Show pending transactions
- **Error handling**: User-friendly error messages
- **Success feedback**: Transaction confirmation
- **Block explorer links**: Direct links to transactions

## 📱 Features Roadmap

### Phase 1: Foundation ✅
- [x] Project setup and configuration
- [x] Web3 provider integration
- [x] Basic UI components
- [x] Wallet connection
- [x] Contract address configuration

### Phase 2: Core Wrapping (In Progress)
- [ ] Token wrapping interface
- [ ] Multi-token support
- [ ] Approval flows
- [ ] Transaction status tracking

### Phase 3: Staking System
- [ ] Staking pools dashboard
- [ ] Stake/unstake functionality
- [ ] Rewards calculation
- [ ] Lock period management

### Phase 4: Redemption System
- [ ] Redemption queue interface
- [ ] Queue status tracking
- [ ] Custodian management
- [ ] Batch operations

### Phase 5: Analytics & Admin
- [ ] Protocol metrics dashboard
- [ ] User portfolio interface
- [ ] Administrative controls
- [ ] Advanced features

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Linting
```bash
npm run lint
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

## 📚 Development Guidelines

### Code Standards
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Conventional Commits**: Structured commit messages

### Web3 Best Practices
- **Error Handling**: Comprehensive error management
- **Loading States**: Clear user feedback
- **Transaction Safety**: Validation before execution
- **Network Validation**: Ensure correct chain

### Performance
- **Code Splitting**: Lazy loading components
- **Caching**: Efficient data caching
- **Optimization**: Bundle size optimization
- **Mobile**: Responsive design

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- **Documentation**: https://docs.sovabtc.com
- **Website**: https://sovabtc.com
- **Twitter**: https://twitter.com/sovabtc
- **Discord**: https://discord.gg/sovabtc
- **GitHub**: https://github.com/sovabtc

## 💬 Support

For support and questions:
- Join our Discord community
- Open an issue on GitHub
- Follow us on Twitter for updates

---

Built with ❤️ by the SovaBTC team
