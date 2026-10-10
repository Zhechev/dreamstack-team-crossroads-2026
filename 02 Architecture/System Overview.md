---
type: architecture
updated: 2026-10-09
---
# System Overview

> ⚠️ **Pre-pivot (KAT build) — re-plan pending, see [[Open Questions]] Q-14.** Current plan: [[Product]] · [[Demo Story]].

> The four zones and how an order flows through them. Picture: [[System Map.canvas|System Map]].

| Zone | Runs | Holds |
|---|---|---|
| Buyer | Claude (any plan) + MetaMask | Her funds; the spend permission; her identity (in the chat only) |
| Citable cloud | Lovable web app · Supabase · hosted connector | Order metadata, ratings, connector session keys — never funds or identity |
| Seller machine | [[Stall]] + corpus | Seller key and wallet, corpus, pricing |
| Base Sepolia | USDC · DreamEscrow · x402.org facilitator | Escrowed funds; no admin key |

## Order flow
1. Claude → connector `search_capabilities` → Supabase → top 3 capabilities.
2. Claude → connector `buy` → Stall responds **402** (x402 `exact` quote or escrow quote).
3. Connector pays: x402 under the spend permission (triage), or `DreamEscrow.deposit` (draft).
4. Stall retrieves provisions, Claude drafts, Stall returns a **signed outcome** with citations and placeholders.
5. Connector hands the outcome to Claude; Claude fills placeholders in the text shown to the buyer.
6. Buyer confirms (escrow releases with 2% fee) or disputes (judge checks → refund).
7. Rating signed by the paying key is stored against the capability.

## Actors and lifetimes
| Actor | Lifetime | Holds |
|---|---|---|
| Seller agent | Long-lived service on the seller's machine | Signing key, wallet, corpus |
| Buyer's assistant session | Per conversation | Nothing; acts through the connector |
| Connector | Always on | Session keys limited by on-chain permissions |
| Judge | Always on (Edge Function) | Judge key: may only call `refund` |
| Contracts | Permanent | Escrowed USDC |
