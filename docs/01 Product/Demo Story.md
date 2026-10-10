---
type: product
updated: 2026-10-10
---
# Demo Story — Lozenets price check

> The one case the whole demo follows. Decision: [[ADR-003 Hosted expert agents and the real-estate demo]]. Video script must be rewritten from this → [[Open Questions]].

A buyer is about to offer **€180k for a 2-bedroom flat in Lozenets, Sofia**. Asking prices are online; actual sale prices are not. She has Claude and a MetaMask wallet with testnet USDC.

## Steps (MVP: question → evaluation → automatic payment from a budget topped up once → response)
1. **Expert online.** A real-estate agent (fake, clearly labelled) has an *Expert Verified* agent on the marketplace: public statistics + her deal prices from the last 90 days (synthetic) + her rules.
2. **Question.** "Is €180k fair for a 2-bed in Lozenets?" Claude calls `find_expert` and picks the agent.
3. **Evaluation (free).** The agent replies: "I can answer this: a fair price range with 5 comparable sales from the last 90 days, each cited. Price: 0.50 USDC."
4. **Pays by itself.** She topped up 5 USDC once when she added Citable to Claude (one MetaMask signature, no gas). Claude pays the 0.50 from that budget — no popup, no page — and says what's left (4.50).
5. **Response.** Claude fetches the answer: a fair range and comparable sales, every figure with source and as-of date.
6. **Shown, not built.** On the agent page: *Get a human check — 20* and *Book a viewing — 50+*.

## Ledger
| Order | Buyer pays | Settlement |
|---|---|---|
| Evaluation | 0.00 | — |
| Top-up (at setup) | 5.00, once | one MetaMask signature → budget wallet; rest returned on close |
| Price check | 0.50 | x402 paid by the agent from the problem wallet, settled after the citation check |
| Human review / consultation | 20 / 50+ | shown only |

Take rate: 30% on tier 1, 10% on tiers 2–3; shown on the receipt, waived during the hackathon → [[Business Model]].
