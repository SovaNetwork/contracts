# SovaBTC Product Specification

## Overview
SovaBTC is a 1:1 wrapped Bitcoin token on EVM networks that allows users to deposit various wrapped Bitcoin variants (wBTC, cbBTC, etc.) and mint SovaBTC tokens. This extends Sova Network's existing native Bitcoin bridging capabilities to support ERC-20 wrapped Bitcoin tokens.

## Core Components

### 1. SovaBTC Token (ERC-20)
- **Standard**: ERC-20 compliant token
- **Ratio**: 1:1 with deposited Bitcoin variants
- **Decimals**: 8 (matching Bitcoin)
- **Features**:
  - Mintable (by wrapper contract only)
  - Burnable (for redemptions)
  - Pausable (emergency circuit breaker)

### 2. SovaBTC Wrapper Contract
**Core Functionality**:
- Accept deposits of whitelisted wrapped Bitcoin tokens
- Mint equivalent SovaBTC tokens to depositors
- Handle redemptions with configurable queue
- Admin-controlled token whitelist

**Admin Functions**:
- Add/remove accepted wrapped Bitcoin tokens
- Withdraw deposited tokens to specified addresses
- Configure redemption queue parameters
- Pause/unpause contract operations
- Emergency functions for recovery

**User Functions**:
- `deposit(address token, uint256 amount)`: Deposit wrapped BTC variant
- `requestRedemption(uint256 amount, address preferredToken)`: Queue redemption
- `claimRedemption(uint256 redemptionId)`: Claim after queue period
- `getRedemptionStatus(uint256 redemptionId)`: Check redemption status

### 3. Redemption Queue System
**Design Considerations**:
- **Option A**: Integrated into wrapper contract
  - Pros: Simpler deployment, atomic operations
  - Cons: Higher gas costs, less flexible upgrades
  
- **Option B**: Separate contract
  - Pros: Modular, upgradeable independently, gas efficient
  - Cons: Additional deployment complexity

**Recommended**: Separate contract for flexibility

**Features**:
- Configurable queue duration (X days)
- FIFO processing with priority options
- Pro-rata distribution if insufficient liquidity
- Emergency withdrawal mechanisms

### 4. Dual Token Staking System
**Architecture**:
- Staking contract accepting SovaBTC + SOVA tokens
- Configurable secondary token (default: SOVA)
- Reward distribution from vault contract
- Time-weighted reward calculations

**Components**:
- **StakingVault**: Holds staked tokens
- **RewardVault**: Preloaded with reward tokens
- **StakingManager**: Logic for deposits/withdrawals/rewards

**Features**:
- Flexible reward token configuration
- Compound/claim options
- Lock periods with boost multipliers
- Emergency unstake with penalties

## Technical Architecture

### Contract Structure
```
contracts/
├── core/
│   ├── SovaBTC.sol              # Main wrapper token
│   ├── SovaBTCWrapper.sol       # Deposit/mint logic
│   └── RedemptionQueue.sol      # Redemption queue
├── staking/
│   ├── DualTokenStaking.sol     # Staking logic
│   ├── StakingVault.sol         # Token custody
│   └── RewardVault.sol          # Reward distribution
├── interfaces/
│   ├── ISovaBTC.sol
│   ├── ISovaBTCWrapper.sol
│   ├── IRedemptionQueue.sol
│   └── IDualTokenStaking.sol
└── libraries/
    └── RedemptionLib.sol        # Queue calculations
```

### Security Considerations
1. **Access Control**: Role-based permissions (OpenZeppelin)
2. **Reentrancy Guards**: On all external calls
3. **Pausability**: Emergency pause mechanisms
4. **Upgrade Strategy**: UUPS proxy pattern for key contracts
5. **Oracle Dependencies**: None (1:1 peg assumed)

### Integration Points
1. **Existing SovaBTC**: Maintain compatibility with native BTC wrapper
2. **Cross-chain**: Potential future bridging to Sova Network
3. **DeFi Protocols**: Standard ERC-20 for composability

## Implementation Phases

### Phase 1: Core Infrastructure
- SovaBTC ERC-20 token
- Basic wrapper contract
- Admin functions
- Initial testing framework

### Phase 2: Redemption System
- Queue contract implementation
- Redemption logic
- Liquidity management
- Integration testing

### Phase 3: Staking System
- Dual token staking contracts
- Reward distribution logic
- Vault implementations
- UI integration requirements

### Phase 4: Production Readiness
- Comprehensive testing
- Audit preparation
- Documentation
- Deployment scripts

## Dependencies
- OpenZeppelin Contracts v5.x
- Foundry for testing/deployment
- Existing Sova Network contracts (reference only)

## Open Questions
1. Should redemption queue be part of wrapper or separate?
2. Specific wrapped BTC tokens to support initially?
3. Staking reward token(s) and distribution schedule?
4. Integration with existing Sova Network UBTC?
5. Multi-chain deployment strategy?

## Success Criteria
- Secure 1:1 wrapping of multiple BTC variants
- Efficient redemption mechanism
- Flexible staking system
- Full test coverage
- Clean audit report
- Gas-optimized operations