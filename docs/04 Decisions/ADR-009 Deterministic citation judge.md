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
**The check before settlement is the judge.** Before a payment settles, it verifies the outcome signature and that every cited unit exists and contains the quoted text or value with the stated as-of date ([[ADR-008 Cited sources with as-of dates|ADR-008]]). Any failure → the payment is never settled and the agent gets a negative reputation event. **No paid disputes or refunds after settlement** (decided 2026-10-10): whether the expert's judgement was good is for ratings (paid orders only) and the human-review tier. Refund-after-settle is roadmap. An LLM check is advisory only.

## Consequences
Backs the guarantee *"you never pay for an invented or stale citation"* without escrow, custody or a refund fund. No judge key needed for refunds.

## Rejected
LLM judge; manual refund button; expert-funded voluntary refunds; a Citable guarantee fund.
