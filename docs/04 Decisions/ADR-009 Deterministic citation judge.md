---
type: adr
id: ADR-009
status: Accepted
updated: 2026-10-10
---
# ADR-009 Deterministic citation judge

## Context
A judge that can hallucinate would undermine the guarantee.

## Decision
On dispute, the judge verifies the outcome signature and that every cited unit exists and contains the quoted text or value with the stated as-of date ([[ADR-008 Cited sources with as-of dates|ADR-008]]). Any failure → refund and a negative reputation event. How the refund is paid now that drafts and escrow are gone is **open** ([[Open Questions]]). An LLM check is advisory only.

## Consequences
Backs the tier-1 citation guarantee; whether the refund beat stays in the demo is open. Judge key is a hot key on testnet; multisig later.

## Rejected
LLM judge; manual refund button.
