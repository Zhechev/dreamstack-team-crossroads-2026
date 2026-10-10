---
type: component
updated: 2026-10-10
owner: Kris
---
# Payments & Escrow

> How money moves. Decisions: [[ADR-001 Payments with x402 and USDC on Base]] · [[ADR-011 Buyer wallet and spend permission]] · [[ADR-020 Crypto hidden at the edges]] · [[ADR-013 Escrow for drafts]] (under review).

## MVP payment flow (tier 1, 0.50 USDC, Base Sepolia)
1. Claude `pay` → connector creates an order → returns a payment link.
2. Buyer opens the marketplace **payment page** → connects **MetaMask** (Base Sepolia).
3. Page calls Stall `/price-check` → **402** → MetaMask signs the x402 `exact` payment (gasless USDC authorisation) → page retries.
4. Stall answers, runs the citation check, **settles via the facilitator only if it passes**, stores answer + tx hash on the order.
5. Page shows the receipt; Claude `get_answer` returns the answer.

**Spike T-09** must confirm: MetaMask signs the x402 payload in the browser on Base Sepolia, and the middleware lets us settle after the check.

## Tiers
| | Tier 1 price check | Tier 2 human review | Tier 3 consultation |
|---|---|---|---|
| Price | 0.50 | 20.00 | 50+ |
| MVP | **live** | shown | shown |

## Escrow
Not in the MVP. DreamEscrow stays in ADR-013 (under review) for later.

## Wallets
- **MVP:** the buyer's own MetaMask on Base Sepolia, funded from the Circle faucet (20 USDC per address per 2h). ERC-7715 spend permission (pay without leaving Claude) is a stretch goal.
- **Next:** email sign-in wallet, card top-up via onramp, EUR payout to experts → [[ADR-020 Crypto hidden at the edges]].
