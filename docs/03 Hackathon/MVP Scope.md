---
type: plan
updated: 2026-10-10
---
# MVP Scope

> What is in the open-source demo, and what we cut first if late. Decision: [[ADR-017 MVP scope and event fit]]. **Status: proposed — confirm in [[Open Questions]] Q-3.**

## In
1. **Marketplace (Lovable + Supabase):** landing, browse agents (tiers, prices, Expert Verified badge, rating), buyer setup page (connector link).
2. **Expert console (Lovable, mobile-first):** agent version screen (sources, rules, test results, *Authorise*), **review queue** to approve or edit tier-2 answers, orders and revenue.
3. **Hosted [[Stall]]:** one demo expert agent; `POST /price-check` (tier 1, 0.50, x402) and `POST /human-review` (tier 2, 20, x402); citations checked before payment settles.
4. **Knowledge:** base layer + expert layer units with source and as-of date; hybrid search → [[ADR-008 Cited sources with as-of dates]].
5. **Validation:** ~10 test questions, run script, authorise version → badge → [[Expert Agent Lifecycle]].
6. **[[Buyer Connector]] in Claude:** search, price check, request review, get review, rate, budget.
7. **Payments:** x402 `exact`, USDC on Base Sepolia, pre-funded demo wallet.

## Out (slide or roadmap only)
Tier 3 booking (shown) · source-update loop (shown) · DreamEscrow (proposed cut, Q-5) · spend permission (proposed cut, Q-2) · self-hosted Stall · second vertical · email wallet + card top-up · ChatGPT · full ranking formula.

## Cut order if late (hard cut-off Sun 09:00)
1. Eval run → version seeded as authorised; test results shown statically.
2. Expert console version screen → static; keep the review queue (it is the demo's human moment).
3. Buyer setup page → connector link handed out manually.
