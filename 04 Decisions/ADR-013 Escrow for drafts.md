---
type: adr
id: ADR-013
status: Under review
updated: 2026-10-10
---
# ADR-013 Escrow for drafts

> **Under review (2026-10-10):** drafts are gone with the pivot ([[ADR-019 Three-tier expert funnel|ADR-019]]). Whether escrow survives — e.g. for tier-2 human review or for the citation refund — is open in [[Open Questions]].

## Context
Plain x402 pays a fixed amount to an address with no order reference, so escrow can't attribute it; drafts need refunds.

## Decision
Fixed-price capabilities use x402 `exact` straight to the seller. Capped capabilities answer with an **escrow quote**; the connector calls `DreamEscrow.deposit(orderId, seller, amount, termsHash)` and retries with `X-Escrow-Order`. DreamEscrow supports partial `release` with a 2% fee, `releaseAfterTimeout`, and judge-only `refund`. Staking/slashing is roadmap.

## Consequences
Two payment paths in the connector; drafts need a little testnet ETH.

## Rejected
Escrow every order; custom x402 escrow scheme; staking this weekend.
