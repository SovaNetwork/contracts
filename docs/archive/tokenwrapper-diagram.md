# SovaBTC & TokenWrapper System Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant TokenWrapper_Contract
    participant SovaBTC_Contract
    participant Owner_Governance
    participant Bitcoin_Network

    Note over User,SovaBTC_Contract: **TokenWrapper Multi-Token Deposit Flow**
    Owner_Governance ->> TokenWrapper_Contract: addAllowedToken(WBTC)
    Owner_Governance ->> TokenWrapper_Contract: setMintFee(enabled, bps)
    User ->> TokenWrapper_Contract: approve(WBTC, amount)
    User ->> TokenWrapper_Contract: deposit(WBTC, amount)
    TokenWrapper_Contract ->> SovaBTC_Contract: adminMint(user, amount - fees)
    TokenWrapper_Contract ->> SovaBTC_Contract: adminMint(owner, fees)
    SovaBTC_Contract ->> User: transfer SovaBTC (1:1 BTC value minus fees)
    
    Note over User,TokenWrapper_Contract: (TokenWrapper now holds WBTC collateral)
    
    Note over User: **Cross-Asset Token Redemption Flow**
    User ->> TokenWrapper_Contract: redeem(tBTC, sovaAmount)
    TokenWrapper_Contract ->> SovaBTC_Contract: adminBurn(user, sovaAmount)
    TokenWrapper_Contract ->> User: transfer tBTC (minus burn fees)
    TokenWrapper_Contract ->> Owner_Governance: transfer burn fees (in tBTC)
    
    Note over User,TokenWrapper_Contract: (User deposited WBTC, redeemed tBTC!)

    %% Blank line to separate flows
    
    Note over User: **Native BTC Deposit Flow**
    User ->> SovaBTC_Contract: depositBTC(signed BTC tx)
    SovaBTC_Contract ->> Bitcoin_Network: validate & broadcast BTC tx
    Bitcoin_Network -->> SovaBTC_Contract: BTC confirmed (funds secured)
    SovaBTC_Contract -->> User: finalize mint of SovaBTC

    Note over User: **Native BTC Redemption Flow**
    User ->> SovaBTC_Contract: withdraw(amount in sats, dest BTC address)
    SovaBTC_Contract ->> Bitcoin_Network: initiate BTC tx (sign & broadcast)
    Bitcoin_Network -->> User: receive BTC on Bitcoin (to provided dest)

    Note over Owner_Governance,TokenWrapper_Contract: **Governance Controls**
    Owner_Governance ->> TokenWrapper_Contract: removeAllowedToken(token)
    Owner_Governance ->> TokenWrapper_Contract: setBurnFee(enabled, bps)
    Owner_Governance ->> TokenWrapper_Contract: pause() / unpause()
    Owner_Governance ->> TokenWrapper_Contract: setMinDepositSatoshi(amount)
```

## System Overview

This sequence diagram illustrates the complete SovaBTC ecosystem:

### TokenWrapper Features
1. **Multi-Token Wrapping**: Converts various BTC-pegged tokens (WBTC, tBTC, etc.) into unified SovaBTC
2. **Cross-Asset Conversion**: Deposit one wrapped BTC token, redeem another
3. **Fee System**: Configurable mint/burn fees collected by governance
4. **Governance Controls**: Allowlist management, fee configuration, emergency pause

### Native Bitcoin Integration
1. **Direct BTC Deposits**: Users can deposit native Bitcoin directly to mint SovaBTC
2. **Direct BTC Withdrawals**: Users can redeem SovaBTC for native Bitcoin
3. **Bitcoin Network Validation**: All BTC transactions are validated and broadcast to Bitcoin network

### Key Differentiators
- **Unified liquidity**: All wrapped BTC tokens contribute to a single SovaBTC token
- **1:1 BTC backing**: Every SovaBTC represents exactly 1 Bitcoin worth of value
- **Flexible redemption**: Users can exit into any supported wrapped BTC token or native Bitcoin
- **Revenue generation**: Optional fees provide sustainable funding for the protocol 