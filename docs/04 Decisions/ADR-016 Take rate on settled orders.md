---
type: adr
id: ADR-016
status: Accepted
updated: 2026-10-10
---
# ADR-016 Take rate on settled orders

## Context
x402 is open, so the fee must be tied to delivered value and visible on the receipt. We now build and host the agents and pay the LLM per tier-1 answer, so a flat 2% no longer covers cost.

## Decision
**We take more where we do the work** (decided 2026-10-10):
| Tier | Fee | Why |
|---|---|---|
| 1 Automated answer (~0.50) | **30%** | We build and host the agent and pay the LLM per answer (0.15 of 0.50 covers it with margin) |
| 2 Human review (~20) · 3 Consultation (50+) | **10%** | The expert's time; we bring the qualified lead and the payment |
Founding experts: **0% on tiers 2–3 for 6 months** (tier 1 can't be free — we carry the LLM cost).

**Collection — two transfers, no escrow:** the agent route charges the expert's share to the expert's address over x402; the connector pays Citable's fee as a second transfer from the same budget. The buyer sees one price (0.50 = 0.35 expert + 0.15 Citable); the receipt lists both. Nothing passes through us.
**MVP:** the split is shown on the receipt with the fee marked *waived during the hackathon* — not collected (one transfer per order keeps the live demo simple).

## Consequences
Revenue aligned with quality.

## Rejected
Subscription; listing fees; flat 2% (doesn't cover LLM cost on a 0.50 answer); flat 15–20%; collecting everything and forwarding the expert's share (custodial); invoicing experts monthly.
