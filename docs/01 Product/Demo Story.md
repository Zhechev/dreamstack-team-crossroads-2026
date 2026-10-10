---
type: product
updated: 2026-10-10
---
# Demo Story — Lozenets price check

> The one case the whole demo follows. Decision: [[ADR-003 Hosted expert agents and the real-estate demo]]. Video script must be rewritten from this → [[Open Questions]].

A buyer is about to offer **€180k for a 2-bedroom flat in Lozenets, Sofia**. Asking prices are online; actual sale prices are not. She has Claude and a MetaMask wallet with testnet USDC.

## Steps (MVP: question → evaluation → payment → response)
1. **Expert online.** A real-estate agent (fake, clearly labelled) has an *Expert Verified* agent on the marketplace: public statistics + her deal prices from the last 90 days (synthetic) + her rules.
2. **Question.** "Is €180k fair for a 2-bed in Lozenets?" Claude calls `find_expert` and picks the agent.
3. **Evaluation (free).** The agent replies: "I can answer this: a fair price range with 5 comparable sales from the last 90 days, each cited. Price: 0.50 USDC."
4. **Payment.** Claude gives a payment link → marketplace page → MetaMask signs 0.50 USDC on Base Sepolia → receipt with tx hash.
5. **Response.** Claude fetches the answer: a fair range and comparable sales, every figure with source and as-of date.
6. **Shown, not built.** On the agent page: *Get a human check — 20* and *Book a viewing — 50+*.

## Ledger
| Order | Buyer pays | Settlement |
|---|---|---|
| Evaluation | 0.00 | — |
| Price check | 0.50 | x402 from MetaMask, settled after the citation check |
| Human review / consultation | 20 / 50+ | shown only |

Take rate per tier is open → [[Business Model]].
