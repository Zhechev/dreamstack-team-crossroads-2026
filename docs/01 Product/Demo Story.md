---
type: product
updated: 2026-10-10
---
# Demo Story — Lozenets price check

> The one case the whole demo follows. Decision: [[ADR-003 Hosted expert agents and the real-estate demo]]. Video script must be rewritten from this → [[Open Questions]].

A buyer is about to offer **€180k for a 2-bedroom flat in Lozenets, Sofia**. Asking prices are online; actual sale prices are not. She has Claude and some testnet USDC in MetaMask.

## Steps
1. **Expert online.** A real-estate agent (fictional, clearly labelled) has an *Expert Verified* agent on Citable: base layer of public sources + her actual deal prices from the last 90 days + her rules.
2. **Ask.** The buyer asks Claude: "Is €180k fair for a 2-bed in Lozenets?" Claude searches Citable and picks the agent.
3. **Tier 1 — price check, 0.50 USDC via x402.** Instant answer: a fair range with comparable sales, each figure cited with source and as-of date.
4. **Tier 2 — human review, 20 USDC.** The buyer asks for a human check. The agent approves (or edits) it on her phone; the reviewed answer appears in the chat with a *Reviewed by* badge.
5. **Tier 3 — consultation / viewing, 50+.** Booked from the chat (shown; whether it is built is open).

## Ledger
| Order | Buyer pays | Settlement |
|---|---|---|
| Price check | 0.50 | direct x402 |
| Human review | 20.00 | open: direct or escrow |
| Consultation | 50+ | shown or built: open |

Take rate per tier is open → [[Business Model]].
