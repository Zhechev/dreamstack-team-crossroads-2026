---
type: adr
id: ADR-013
status: Deferred
updated: 2026-10-10
---
# ADR-013 Escrow for drafts

> **Deferred (2026-10-10):** not in the MVP — the tier-1 guarantee is "settle only after the citation check" ([[ADR-011 Buyer wallet and spend permission|ADR-011]], [[Payments & Escrow]]). Revisit for tier 2 after the hackathon ([[Open Questions]] Q-5).

## Context
Plain x402 pays a fixed amount to an address with no order reference, so escrow can't attribute it; drafts need refunds.

## Decision
Fixed-price capabilities use x402 `exact` straight to the seller. Capped capabilities answer with an **escrow quote**; the connector calls `DreamEscrow.deposit(orderId, seller, amount, termsHash)` and retries with `X-Escrow-Order`. DreamEscrow supports partial `release` with a 2% fee, `releaseAfterTimeout`, and judge-only `refund`. Staking/slashing is roadmap.

## Consequences
Two payment paths in the connector; drafts need a little testnet ETH.

## Rejected
Escrow every order; custom x402 escrow scheme; staking this weekend.
