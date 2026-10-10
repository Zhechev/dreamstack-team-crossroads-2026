---
type: adr
id: ADR-015
status: Accepted
updated: 2026-10-10
---
# ADR-015 Demo prices

## Context
Prices must feel real next to a €180k flat and fit faucet limits (Circle: 20 USDC per address per 2h).

## Decision
Tier 1 *Price check* **0.50 USDC** · tier 2 *Human review* **20 USDC** · tier 3 *Consultation / viewing* **50+**. Which tiers are transacted on testnet vs only shown: **open** ([[Open Questions]]).

## Consequences
A demo wallet that transacts tier 2 needs ~21 USDC, i.e. two faucet rounds.

## Rejected
0.10 per task; KAT prices (0.50 / cap 5.00 / 30 EUR).
