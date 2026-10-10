---
type: architecture
updated: 2026-10-10
---
# System Overview

> The zones and how an order flows through them. Picture: [[System Map.canvas|System Map]]. Agent build flow: [[Expert Agent Lifecycle]].

| Zone | Runs | Holds |
|---|---|---|
| Buyer | Claude (any plan) + MetaMask (Base Sepolia) | Their funds; their identity (in the chat only) |
| Expert | Phone / browser → expert console | Their judgment; approves versions and tier-2 answers |
| Citable cloud | Lovable app · Supabase · hosted connector · hosted [[Stall]] agents · knowledge index | Expert sources and rules, order metadata, ratings — never buyer funds or identity |
| Base Sepolia | USDC · x402.org facilitator | Settlement only |

## Order flow — MVP (question → evaluation → payment → response)
1. **Question:** Claude → connector `find_expert` → Supabase → top 3 agents.
2. **Evaluation:** `evaluate` → Stall `/evaluate` (free): can answer, what it delivers, price.
3. **Payment:** `pay` → order + payment link → payment page → Stall answers **402** → buyer signs in MetaMask → page retries.
4. Stall retrieves units, applies expert rules, Claude (API) writes the answer with citations; citation check passes → payment settles via the facilitator; answer + tx hash stored on the order.
5. **Response:** Claude `get_answer` → cited answer in the chat.

Tier 2 (human review) and tier 3 (consultation) are shown on the marketplace, not built.

## Actors and lifetimes
| Actor | Lifetime | Holds |
|---|---|---|
| Expert agent (Stall config) | Long-lived, hosted by Citable | Signing key, expert wallet address, sources, rules, version |
| Buyer's assistant session | Per conversation | Nothing; acts through the connector |
| Connector | Always on | Connector links; never a buyer key |
| Judge / citation check | Per request | Read-only access to units |
