# 🧪 Test-Addition Roadmap

Below is a sequenced checklist (✅/🔲) covering every un-tested branch we identified.  
Work through the list top-to-bottom; each bullet is an **independent Foundry test** (or small group) you can add before moving on to the next.

> Tip: keep parity between numbering here and your eventual test filenames, e.g. `01_SovaBTC_Deposit.t.sol`, `02_SovaBTC_Withdraw.t.sol`, etc.

---

## 0. Shared test scaffolding
1. **Mock the Bitcoin precompile**  
   • Create `test/mocks/MockBTCPrecompile.sol` implementing the four selectors:  
     `BROADCAST_BYTES`, `DECODE_BYTES`, `ADDRESS_CONVERT_LEADING_BYTES`, `UBTC_SIGN_TX_BYTES`.  
   • In every suite that needs it:
   ```solidity
   MockBTCPrecompile mock = new MockBTCPrecompile();
   vm.etch(address(0x999), address(mock).code);
   ```
2. **Utility for 6-dec BTC token**
   ```solidity
   MockERC20BTC usdt = new MockERC20BTC("sUSDt", "USDT", 6);
   ```

---

## 1. SovaBTC.sol

| Seq | Scenario | Expected |
|-----|----------|----------|
| 1.1 | Happy-path `depositBTC` | `_pendingDeposits[msg.sender].amount == amount`, `usedTxids[txid] == true`, `Deposit` event |
| 1.2 | Happy-path `withdraw`   | `_pendingWithdrawals[msg.sender].amount == amount+gas`, `Withdraw` event |
| 1.3 | `finalize()` clears pending deposit and mints | `balanceOf == amount`, struct zeroed |
| 1.4 | `finalize()` clears pending withdrawal and burns | supply decreased, struct zeroed |
| 1.5 | `amount < minDepositAmount` → `DepositBelowMinimum` |
| 1.6 | `amount > maxDepositAmount` → `DepositAboveMaximum` |
| 1.7 | Re-using a txid → `TransactionAlreadyUsed` |
| 1.8 | Existing `_pendingDeposits` → `PendingDepositExists` |
| 1.9 | `withdraw` with `ZeroAmount` revert |
| 1.10| `ZeroGasLimit` revert |
| 1.11| `GasLimitTooHigh` revert |
| 1.12| `InsufficientAmount` revert |
| 1.13| Existing `_pendingWithdrawals` → `PendingWithdrawalExists` |
| 1.14| `pause()` then attempt `depositBTC`/`withdraw` → `ContractPaused` |
| 1.15| `unpause()` restores functionality |
| 1.16| Admin setters: invalid bounds trigger `InvalidDepositLimits`/`ZeroAmount` |

---

## 2. UBTC20.sol (abstract)

| Seq | Scenario | Expected |
|-----|----------|----------|
| 2.1 | When `_pendingDeposits` > 0, `transfer` reverts `PendingTransactionExists` |
| 2.2 | Same for `transferFrom` |
| 2.3 | After `finalize`, transfers succeed |

---

## 3. TokenWrapper.sol

### Deposits
| Seq | Scenario | Expected |
|-----|----------|----------|
| 3.1 | `decimals == 6`, deposit 1 USDT (1e6) → mints 1e8 sovaBTC |
| 3.2 | `decimals > 8`, amount not multiple of factor → `DepositBelowMinimum` |
| 3.3 | `amount == 0` → `ZeroAmount` |

### Redemptions
| Seq | Scenario | Expected |
|-----|----------|----------|
| 3.4 | `decimals < 8`, sovaAmount not divisible → `InsufficientReserve` |
| 3.5 | `sovaAmount == 0` → `ZeroAmount` |
| 3.6 | Reserve too small → `InsufficientReserve` |

### Governance / Pausing
| Seq | Scenario | Expected |
|-----|----------|----------|
| 3.7 | `addAllowedToken` twice → `AlreadyAllowed` |
| 3.8 | `removeAllowedToken` non-existent → `NotInAllowlist` |
| 3.9 | Remove token, redeem previously-wrapped collateral still works |
| 3.10| `pause()` blocks `deposit` & `redeem`; `unpause()` restores |

---

## 4. SovaL1Block.sol

| Seq | Scenario | Expected |
|-----|----------|----------|
| 4.1 | Non-system address calls `setBitcoinBlockData` → revert |
| 4.2 | `SYSTEM_ACCOUNT_ADDRESS` succeeds; stored values readable |

---

## 5. SovaBitcoin.sol (library)

| Seq | Scenario | Expected |
|-----|----------|----------|
| 5.1 | `outputs.length` 0 or >3 → `InvalidDeposit` |
| 5.2 | Output value mismatch → `InvalidAmount` |
| 5.3 | `inputs.length == 0` → `InsufficientInput` |
| 5.4 | `locktime != 0` → `InvalidLocktime` |
| 5.5 | Happy-path where first output address matches caller → no revert |

---

## 6. Events & Invariants

| Seq | Scenario | Expected |
|-----|----------|----------|
| 6.1 | Verify payload of each emitted event (`Deposit`, `Withdraw`, `AllowedTokenAdded`, etc.) |
| 6.2 | Invariant test: `totalSupply(sovaBTC) == wrapper reserves + ΣpendingDeposits – ΣpendingWithdrawals` (run as Foundry invariant/fuzz) |
| 6.3 | Fuzz decimal conversion: random `decimals ∈ [1,30]`, random multiples, ensure math holds & no over/under-flows |

---

### Progress tracker

```markdown
- [ ] 0.1 MockBTCPrecompile & helpers
- [ ] 1.1 SovaBTC deposit happy-path
- [ ] 1.2 SovaBTC withdraw happy-path
- [ ] ...
- [ ] 6.3 Fuzz decimal conversion
```