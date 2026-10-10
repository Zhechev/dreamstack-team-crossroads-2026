---
type: component
updated: 2026-10-10
owner: Kris
---
# Payments & Escrow

> How money moves. Decisions: [[ADR-001 Payments with x402 and USDC on Base]] · [[ADR-011 Buyer wallet and spend permission]] · [[ADR-020 Crypto hidden at the edges]] · [[ADR-013 Escrow for drafts]] (under review).

## Payment per tier (all x402 `exact`, USDC, Base Sepolia)
| | Tier 1 price check | Tier 2 human review | Tier 3 consultation |
|---|---|---|---|
| Price | 0.50 | 20.00 | 50+ |
| Built | yes | yes | shown only |
| Gas for buyer | none (facilitator pays) | none | — |
| Guarantee | citations checked before settle (proposed, Q-6) | expert's own liability | expert's own liability |
| Fee | per tier, open (Q-9) | open | open |

## Settle after check (spike T-10)
x402 verifies the payment first and settles after the handler runs. Proposal: Stall settles only if every citation passes the check — a bad answer is never charged, with no escrow contract. Spike must confirm the middleware allows this.

## Escrow
DreamEscrow is **proposed cut** (Q-5). Kept in ADR-013 until decided.

## Wallets
- **Hackathon:** pre-funded demo wallet, labelled (proposed, Q-2); MetaMask spend permission only if the spike is cheap.
- **Pitch / next:** email sign-in wallet, card top-up via onramp, EUR payout to experts → [[ADR-020 Crypto hidden at the edges]].

## Funding
Circle faucet: 20 USDC per address per 2h → two rounds per demo wallet (~25 USDC covers tier 1 + tier 2).
