---
type: adr
id: ADR-016
status: Accepted
updated: 2026-10-10
---
# ADR-016 Take rate on settled orders

> **Rate per tier is open (2026-10-10):** the 2% figure was set for cheap legal drafts; tiers and hosting cost change the math → [[Open Questions]] Q-9.

## Context
x402 is open, so the fee must be small and tied to delivered value.

## Decision
Fee **1–3% (2% working figure)** only on orders that settle without an upheld dispute; collected by DreamEscrow on release. Not collected on direct x402 orders in the MVP.

## Consequences
Revenue aligned with quality.

## Rejected
Subscription; listing fees.
