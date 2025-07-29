# SovaBTC Yield System Product Specification

## Overview
The SovaBTC Yield System is a multi-chain yield-generating vault that accepts various Bitcoin variants (WBTC, cbBTC, tBTC, native sovaBTC) and provides Bitcoin-denominated yield through actively managed investment strategies. Users receive `sovaBTCYield` tokens representing their vault share and can stake these tokens for additional rewards.

## Core Components

### 1. SovaBTCYieldVault (ERC-4626)
- **Standard**: ERC-4626 compliant yield vault
- **Deposits**: Multiple Bitcoin variants (WBTC, cbBTC, tBTC, sovaBTC)
- **Shares**: `sovaBTCYield` tokens representing vault ownership
- **Decimals**: 8 (matching Bitcoin)
- **Yield Source**: Admin-managed investment strategies

**Key Functions**:
- `deposit(uint256 assets, address receiver)`: Deposit primary asset
- `depositAsset(address asset, uint256 amount, address receiver)`: Deposit any supported asset
- `redeemForRewards(uint256 shares, address receiver)`: Redeem for sovaBTC/BridgedSovaBTC
- `addYield(uint256 rewardAmount)`: Admin adds yield to vault

### 2. BridgedSovaBTC (Hyperlane Integration)
- **Purpose**: Canonical sovaBTC representation on non-Sova networks
- **Bridge**: Hyperlane for cross-chain messaging
- **Access Control**: Role-based minting (VAULT_ROLE, BRIDGE_ROLE)
- **Network Support**: Ethereum, Base, other EVM chains

**Key Functions**:
- `mint(address to, uint256 amount)`: Mint bridged tokens (authorized only)
- `bridgeToSova(address recipient, uint256 amount)`: Bridge back to Sova Network
- `handle(uint32 origin, bytes32 sender, bytes calldata body)`: Hyperlane message handler

### 3. SovaBTCYieldStaking (Dual Token System)
**Staking Mechanism**:
- **Level 1**: Stake `sovaBTCYield` → Earn `SOVA` tokens
- **Level 2**: Stake `SOVA` + `sovaBTCYield` → Earn `sovaBTC`/`BridgedSovaBTC`
- **Requirement**: Must stake vault tokens to stake SOVA

**Key Functions**:
- `stakeVaultTokens(uint256 amount, uint256 lockPeriod)`: Stake vault shares
- `stakeSova(uint256 amount, uint256 lockPeriod)`: Stake SOVA (requires vault stake)
- `claimRewards()`: Claim accumulated rewards
- `compoundSovaRewards()`: Compound SOVA rewards back into SOVA stake

### 4. Network-Specific Rewards
**Sova Network**:
- Vault rewards: `sovaBTCYield` → native `sovaBTC`
- Staking rewards: earn native `sovaBTC`

**Other Networks (Ethereum, Base)**:
- Vault rewards: `sovaBTCYield` → `BridgedSovaBTC`
- Staking rewards: earn `BridgedSovaBTC`
- Hyperlane bridge for canonical sovaBTC

## Technical Architecture

### Contract Structure
```
contracts/
├── vault/
│   └── SovaBTCYieldVault.sol    # ERC-4626 yield vault
├── staking/
│   └── SovaBTCYieldStaking.sol  # Dual token staking system
├── bridges/
│   └── BridgedSovaBTC.sol       # Cross-chain sovaBTC token
├── test/
│   └── SovaBTCYieldSystem.t.sol # Comprehensive test suite
└── script/
    └── DeploySovaBTCYieldSystem.s.sol # Network-aware deployment
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

## Implementation Status

### ✅ Phase 1: Core Yield Vault System
- SovaBTCYieldVault (ERC-4626 compliant)
- Multi-asset support with decimal normalization
- Admin-managed investment strategies
- Exchange rate based yield distribution

### ✅ Phase 2: Cross-Chain Infrastructure
- BridgedSovaBTC with Hyperlane integration
- Network-aware deployment scripts
- Role-based access control for minting
- Native sovaBTC support on Sova Network

### ✅ Phase 3: Dual Token Staking
- SovaBTCYieldStaking with symbiotic rewards
- Vault token → SOVA rewards
- SOVA + vault token → sovaBTC rewards
- Lock periods and compound functionality

### ✅ Phase 4: Production Readiness
- Comprehensive test suite (46 tests passing)
- Multi-network deployment scripts
- Code formatting and audit preparation
- Complete documentation

## Dependencies
- OpenZeppelin Contracts v5.x
- Foundry for testing/deployment
- Existing Sova Network contracts (reference only)

## Deployment Networks

### Supported Networks
1. **Ethereum Mainnet**: WBTC, cbBTC, tBTC → BridgedSovaBTC rewards
2. **Base**: cbBTC, tBTC → BridgedSovaBTC rewards  
3. **Sova Network**: Native sovaBTC → Native sovaBTC rewards
4. **Sepolia Testnet**: Test tokens for development

### Token Addresses
- **Ethereum**: WBTC (0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599), cbBTC, tBTC
- **Base**: cbBTC (0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf), tBTC
- **Sova**: Native sovaBTC (0x2100000000000000000000000000000000000020)

## Success Criteria ✅
- ✅ ERC-4626 compliant yield vault with multi-asset support
- ✅ Cross-chain sovaBTC distribution via Hyperlane bridge
- ✅ Dual token staking with symbiotic reward structure
- ✅ Comprehensive test coverage (46 tests passing)
- ✅ Network-aware deployment infrastructure
- ✅ Admin-managed yield generation strategies