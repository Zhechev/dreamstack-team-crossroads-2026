---
type: adr
id: ADR-013
status: Superseded
updated: 2026-10-10
---
# ADR-013 Escrow for drafts

> **Superseded (2026-10-10): no escrow.** Tier 1 settles only after the citation check. Tier 2 settles **on delivery**: the buyer signs a gasless EIP-3009 authorisation (~24 h validity) up front, and the connector submits it only when the expert's review arrives — nothing is held, no contract to audit, and "we don't hold funds" stays true in production. A review slower than the validity window needs a fresh signature. See [[Payments & Escrow]]. The record below is kept for history.

## Context
Plain x402 pays a fixed amount to an address with no order reference, so escrow can't attribute it; drafts need refunds.

## Decision
Fixed-price capabilities use x402 `exact` straight to the seller. Capped capabilities answer with an **escrow quote**; the connector calls `DreamEscrow.deposit(orderId, seller, amount, termsHash)` and retries with `X-Escrow-Order`. DreamEscrow supports partial `release` with a 2% fee, `releaseAfterTimeout`, and judge-only `refund`. Staking/slashing is roadmap.

## Consequences
Two payment paths in the connector; drafts need a little testnet ETH.

## Rejected
Escrow every order; custom x402 escrow scheme; staking this weekend.
