---
type: component
updated: 2026-10-09
owner: Kris
---
# Payments & Escrow

> ⚠️ **Pre-pivot (KAT build) — re-plan pending, see [[Open Questions]] Q-14.** Current plan: [[Product]] · [[Demo Story]].

> How money moves. Decisions: [[ADR-001 Payments with x402 and USDC on Base]] · [[ADR-011 Buyer wallet and spend permission]] · [[ADR-013 Escrow for drafts]].

## Two payment paths (both start with a 402)
| | Triage (*Assess case*) | Draft (*Draft appeal*) |
|---|---|---|
| Price | 0.50 fixed | cap 5.00, settles actual (~3.80) |
| Path | x402 `exact` → seller wallet | escrow quote → `DreamEscrow.deposit` |
| Gas for buyer | none (facilitator pays) | small, Base Sepolia ETH |
| Refundable | no | yes, via judge |
| Fee | not collected in MVP | 2% split on release |

## Spend permission
Buyer's MetaMask grants an ERC-7715 periodic USDC permission (e.g. 20 USDC/day, 30 days, revocable) to the connector's session key. The cap is enforced on-chain.
**Spike T-12 (Sat 09:00–11:00) must confirm:** works on Base Sepolia · a facilitator redeems it for x402 · it can fund `deposit`. If any fails → fallback: connector pays from a pre-funded demo wallet labelled "demo custody".

## DreamEscrow (Solidity, Base Sepolia)
```
deposit(orderId, seller, amount, termsHash)   // buyer side, via permission
release(orderId, finalAmount)                 // buyer confirm: pay seller finalAmount − 2% fee, refund rest
releaseAfterTimeout(orderId)                  // anyone, after deadline
refund(orderId)                               // judge key only
event Deposited / Released / Refunded
```
No admin key, no pause, no redirect of funds.

## Funding
- **Demo:** Circle faucet (20 USDC per address per 2h) + Base Sepolia ETH; fund 3 buyer wallets the day before (T-14).
- **Real users:** MetaMask → Buy → network **Base** → USDC, card or bank via an onramp (ID check on first purchase).
