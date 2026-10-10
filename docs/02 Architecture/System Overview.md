---
type: architecture
updated: 2026-10-10
---
# System Overview

> The zones and how an order flows through them. Picture: [[System Map.canvas|System Map]]. Agent build flow: [[Expert Agent Lifecycle]].

| Zone | Runs | Holds |
|---|---|---|
| Buyer | Claude (any plan) + wallet | Their funds; their identity (in the chat only) |
| Expert | Phone / browser → expert console | Their judgment; approves versions and tier-2 answers |
| Citable cloud | Lovable app · Supabase · hosted connector · hosted [[Stall]] agents · knowledge index | Expert sources and rules, order metadata, ratings — never buyer funds or identity |
| Base Sepolia | USDC · x402.org facilitator | Settlement only |

## Order flow — tier 1 (price check)
1. Claude → connector `search_agents` → Supabase → top 3 agents.
2. Claude → connector `price_check` → Stall answers **402**; connector pays x402 from the wallet.
3. Stall retrieves units, applies expert rules, Claude (API) writes the answer with citations.
4. Stall checks every citation against its unit; only then is payment settled (proposed, [[Open Questions]] Q-6).
5. Signed outcome returns to Claude; buyer rates.

## Order flow — tier 2 (human review)
1. Claude → `request_review(order_id)` → pays 20 via x402 → review task in Supabase.
2. Expert console shows it in the review queue → expert approves or edits.
3. Claude → `get_review(order_id)` returns the *Reviewed by* answer (Q-8).

## Actors and lifetimes
| Actor | Lifetime | Holds |
|---|---|---|
| Expert agent (Stall config) | Long-lived, hosted by Citable | Signing key, expert wallet address, sources, rules, version |
| Buyer's assistant session | Per conversation | Nothing; acts through the connector |
| Connector | Always on | Connector links; demo wallet key (hackathon) |
| Judge / citation check | Per request | Read-only access to units |
