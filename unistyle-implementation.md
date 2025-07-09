# SovaBTC Cross-Network Token Interface Product Specification

## Executive Summary

This specification outlines a unified token wrapping and cross-network bridging interface for SovaBTC Protocol that enables users to seamlessly wrap Bitcoin-backed tokens (WBTC, LBTC, USDC) into sovaBTC and bridge across multiple blockchain networks within a single, cohesive user experience.

## Product Overview

### Vision
Create a frictionless Bitcoin infrastructure experience where users can wrap diverse Bitcoin-backed tokens into sovaBTC and bridge across LayerZero V2 networks through a single interface, eliminating the complexity of multi-step processes and multiple UIs.

### Key Value Propositions
- **Unified Token Discovery**: Browse supported tokens (WBTC, LBTC, USDC) and sovaBTC across all networks
- **Cross-Network Visibility**: See sovaBTC balances and wrapping opportunities across different chains
- **Seamless Network Operations**: Execute wraps and bridges without leaving the interface
- **Portfolio Consolidation**: View all Bitcoin-backed holdings and sovaBTC positions regardless of network

## Core Features

### 1. Universal Token Selection Modal

#### Primary Token Display
- **Supported Tokens Section**: Display whitelisted tokens (WBTC, LBTC, USDC) with network-specific availability
- **SovaBTC Display**: Show sovaBTC balances across all LayerZero V2 connected networks
- **Search Functionality**: Search across supported tokens and sovaBTC instances
- **Token Metadata**: Display token symbol, logo, balance, USD value, and current sovaBTC conversion rates

#### Network Selection Integration
- **Network Selector**: Filter view by specific networks (Base Sepolia, Optimism Sepolia, etc.)
- **Multi-Network Indicators**: Visual badges showing which networks each token is available on
- **LayerZero Network Badges**: Distinguish LayerZero V2 supported networks with special indicators

### 2. Cross-Network Token Organization

#### Network-Specific Sections
- **"Wrap to sovaBTC"**: Section showing available tokens for wrapping on current network
- **"Bridge sovaBTC"**: Section showing sovaBTC balances available for cross-chain transfer
- **Network Identifiers**: Clear labeling with LayerZero endpoint IDs and network names
- **Visual Hierarchy**: Consistent sovaBTC branding with network-specific badges

#### Your Tokens Section
- **Multi-Asset Portfolio**: Display WBTC, LBTC, USDC, and sovaBTC holdings across all networks
- **Conversion Display**: Show both original token amounts and sovaBTC equivalent values
- **Network Context**: Clearly indicate which network each balance exists on with LayerZero endpoint IDs
- **Action Indicators**: Show available actions (wrap, bridge, stake, redeem) for each token

### 3. Intelligent Token Recommendation

#### Context-Aware Suggestions
- **Wrapping Opportunities**: Surface tokens available for wrapping on current network
- **Bridge Optimization**: Prioritize networks with better LayerZero V2 fees and speeds
- **Staking Suggestions**: Highlight sovaBTC positions eligible for SOVA rewards
- **Redemption Readiness**: Show sovaBTC positions eligible for redemption queue

#### Smart Defaults
- **Network Selection**: Auto-select optimal network based on gas costs and LayerZero fees
- **Token Pairing**: Suggest optimal wrapping ratios and bridge amounts
- **Decimal Handling**: Seamlessly convert between 6-decimal (USDC) and 8-decimal (WBTC, LBTC, sovaBTC) tokens

### 4. Unified Wrap & Bridge Interface

#### Single Transaction Flow
- **Token Selection**: Users select tokens from unified modal
- **Action Detection**: Automatically determine if wrapping or bridging is needed
- **Fee Estimation**: Show wrapper fees, LayerZero V2 bridge costs, and gas estimates
- **Route Optimization**: Find best conversion rates and bridge paths

#### Cross-Network Bridge Integration
- **LayerZero V2 Integration**: Seamlessly handle cross-chain sovaBTC transfers
- **Fee Transparency**: Display exact LayerZero messaging fees (0.001 ETH minimum)
- **Status Tracking**: Real-time bridge transaction monitoring with 2-5 minute completion times

## Technical Requirements

### Frontend Architecture

#### State Management
- **Token Registry**: Centralized store of whitelisted tokens across networks
- **Network State**: Track LayerZero V2 connections and endpoint availability
- **Balance Management**: Real-time tracking of both original tokens and sovaBTC positions
- **Transaction State**: Monitor wrap operations, bridge transfers, and confirmations

#### Data Structures
```typescript
SupportedToken {
  address: string,
  symbol: 'WBTC' | 'LBTC' | 'USDC',
  name: string,
  decimals: 6 | 8,
  logo: string,
  networks: NetworkAvailability[],
  isWhitelisted: boolean
}

SovaBTCInstance {
  networkId: string,
  contractAddress: string,
  layerZeroEndpointId: number,
  balance: string,
  usdValue: number,
  bridgeEnabled: boolean
}

UserPosition {
  tokenAddress: string,
  networkId: string,
  balance: string,
  decimals: number,
  usdValue: number,
  canWrap: boolean,
  canBridge: boolean,
  canStake: boolean,
  canRedeem: boolean
}
```

### Backend Integration

#### Data Sources
- **Contract State**: Real-time balance queries across all deployed networks
- **LayerZero Status**: Bridge availability and fee estimation
- **Price Feeds**: USD values for WBTC, LBTC, USDC, and sovaBTC
- **Whitelist Management**: Dynamic token approval status

#### API Endpoints
- `GET /tokens/supported` - Retrieve whitelisted tokens by network
- `GET /sova/balances` - Get sovaBTC balances across all networks
- `GET /user/positions` - Get comprehensive user positions
- `GET /wrap/quote` - Get wrapping conversion rates
- `GET /bridge/quote` - Get LayerZero V2 bridge quotes
- `POST /wrap/execute` - Execute token wrapping
- `POST /bridge/execute` - Execute cross-chain bridge

### Network Support

#### LayerZero V2 Networks
- **Base Sepolia**: EID 40245 (Primary deployment)
- **Optimism Sepolia**: EID 40232 (Cross-chain tested)
- **Ethereum Sepolia**: EID 40161 (Available)
- **Mainnet Ready**: All networks when deployed

#### Contract Integration
- **SovaBTCOFT**: Core token with LayerZero V2 OFT functionality
- **SovaBTCWrapper**: Multi-token wrapping with decimal conversion
- **RedemptionQueue**: 10-day delayed redemption system
- **SovaBTCStaking**: SOVA token rewards for sovaBTC staking

## User Experience Design

### Information Architecture

#### Token Discovery Flow
1. **Entry Point**: User clicks "Select token" from wrap or bridge interface
2. **Modal Display**: Unified modal showing available tokens and sovaBTC positions
3. **Action Context**: Clear indication of available actions (wrap, bridge, stake, redeem)
4. **Network Switching**: Seamless network change detection and wallet prompting

#### Visual Design Principles
- **Bitcoin Aesthetic**: Gold/orange color scheme reflecting Bitcoin branding
- **Network Clarity**: LayerZero endpoint IDs and network names clearly displayed
- **Action Hierarchy**: Primary actions (wrap, bridge) prominently featured
- **Status Indicators**: Real-time transaction and bridge status updates

### Interaction Patterns

#### Wrap Flow
- **Token Selection**: Choose from whitelisted WBTC, LBTC, or USDC
- **Amount Input**: Decimal-aware input with sovaBTC output preview
- **Approval Check**: Automatic token approval detection and execution
- **Conversion Display**: Real-time conversion rate with fee breakdown

#### Bridge Flow
- **Source Network**: Current sovaBTC balance display
- **Destination Selection**: Available LayerZero V2 networks
- **Fee Calculation**: LayerZero messaging fee estimation (minimum 0.001 ETH)
- **Transfer Execution**: Burn-and-mint process with status tracking

## Security Considerations

### Contract Integration
- **Whitelist Validation**: Only approved tokens can be wrapped
- **Decimal Safety**: Proper conversion between 6 and 8 decimal tokens
- **Access Controls**: Role-based permissions for admin functions
- **Emergency Pause**: Circuit breakers for wrapper and bridge operations

### LayerZero V2 Security
- **Peer Validation**: Trusted peer verification before bridge execution
- **Message Verification**: LayerZero V2 message authentication
- **Fee Protection**: Minimum fee enforcement to prevent failed transactions
- **Slippage Protection**: Bridge amount validation and limits

### Transaction Safety
- **Approval Limits**: Granular token approval management
- **Balance Validation**: Pre-transaction balance verification
- **Gas Estimation**: Accurate gas cost predictions with safety margins
- **Error Handling**: Comprehensive error messages and recovery flows

## Performance Requirements

### Load Times
- **Modal Open**: Token selection modal opens within 200ms
- **Balance Refresh**: Real-time balance updates within 300ms
- **Bridge Status**: LayerZero transaction status updates within 500ms
- **Network Switching**: New network data loads within 1 second

### Scalability
- **Multi-Network**: Support for 10+ LayerZero V2 networks
- **Token Expansion**: Extensible whitelist for new Bitcoin-backed tokens
- **Concurrent Users**: Handle 10,000+ concurrent users across all networks
- **Bridge Throughput**: Support 1000+ daily bridge transactions

## Success Metrics

### User Engagement
- **Wrap Conversion**: Percentage of modal opens that result in wrapping
- **Bridge Adoption**: Percentage of users utilizing cross-chain features
- **Network Distribution**: sovaBTC distribution across supported networks
- **Retention Rate**: Users returning for additional wrap/bridge operations

### Technical Performance
- **Wrap Success Rate**: Percentage of successful wrap transactions
- **Bridge Success Rate**: LayerZero V2 bridge completion rate
- **Average Bridge Time**: Time from initiation to destination confirmation
- **Gas Efficiency**: Average gas costs compared to manual processes

## Implementation Roadmap

### Phase 1: Core Interface (Weeks 1-3)
- Unified token selection modal
- Basic wrap interface with existing SovaBTCWrapper
- Network switching and balance display
- Integration with current contract deployments

### Phase 2: Bridge Integration (Weeks 4-6)
- LayerZero V2 bridge interface
- Cross-network sovaBTC balance tracking
- Bridge fee estimation and execution
- Transaction status monitoring

### Phase 3: Enhanced UX (Weeks 7-9)
- Advanced token filtering and search
- Portfolio view with action recommendations
- Staking and redemption queue integration
- Mobile optimization and responsive design

### Phase 4: Production Polish (Weeks 10-12)
- Performance optimization and caching
- Comprehensive error handling
- Analytics and monitoring integration
- User testing and feedback incorporation

## SovaBTC-Specific Considerations

### Existing Contract Integration
- **Proven Deployments**: Leverage existing Base Sepolia and Optimism Sepolia contracts
- **Test Coverage**: Build on 99.84% test coverage foundation
- **LayerZero V2**: Utilize tested bridge configuration with working transaction proof

### Bitcoin-Focused Features
- **8-Decimal Standard**: Maintain Bitcoin-compatible decimal precision
- **Multi-Token Support**: WBTC, LBTC, USDC wrapping with automatic decimal conversion
- **Redemption Queue**: Integration with 10-day redemption security system
- **SOVA Rewards**: Highlight staking opportunities for yield generation

### Development Environment
- **Foundry Integration**: Build on existing test suite and deployment scripts
- **Next.js Frontend**: Extend current UI with enhanced token selection
- **RainbowKit**: Maintain existing wallet connection infrastructure
- **Contract ABIs**: Utilize existing ABI exports and address management

## Conclusion

This unified token selection interface will transform SovaBTC from a multi-step process requiring separate interfaces into a seamless, single-view experience. By combining wrapping and bridging functionality with intelligent token discovery, users can efficiently manage their Bitcoin-backed positions across multiple networks while maintaining the security and functionality of the existing SovaBTC Protocol infrastructure.

The implementation builds directly on SovaBTC's proven LayerZero V2 integration, comprehensive test coverage, and production-ready contracts, ensuring a robust foundation for this enhanced user experience.