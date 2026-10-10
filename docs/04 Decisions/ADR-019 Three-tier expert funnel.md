---
type: adr
id: ADR-019
status: Accepted
updated: 2026-10-10
---
# ADR-019 Three-tier expert funnel

## Context
Selling only automated answers earns sellers cents and is easy to compare with ChatGPT. Experts need real money and a reason to join; buyers need a way to get a human when it matters.

## Decision
Every expert agent sells three tiers, each a capability:
| Tier | Buyer gets | Price |
|---|---|---|
| 1 Automated answer | Instant cited answer from base sources + the expert's rules and fresh/private knowledge | ~0.50 |
| 2 Human review | The expert approves or edits the answer asynchronously; it returns into the chat | ~20 |
| 3 Consultation | A booked meeting (or viewing) with the expert | 50+ |
**Expert Verified** means *sources and rules approved by the expert for version N* — never that a single automated answer was checked. Tier-2 answers carry a separate *Reviewed by* badge.

## Consequences
The AI handles volume; the expert enters only where their time adds value, and tier 3 is a qualified lead. Tier 2 needs an expert approval screen and a way to return a late answer to the chat. Badge wording is fixed in [[ADR-014 Promises and claims]].

## Rejected
Automated answers only; calling automated answers "verified".
