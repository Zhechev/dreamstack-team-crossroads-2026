---
type: adr
id: ADR-006
status: Accepted
updated: 2026-10-10
---
# ADR-006 Marketplace on Lovable and Supabase

## Context
Lovable's native backend is Supabase; the MVP needs the fewest moving parts.

## Decision
The marketplace is a **Lovable web app on Supabase**: tables for agents, versions, knowledge units, orders, reviews, ratings and connector links; **Edge Functions** `search_agents`, `submit_review`, `get_review`, `authorise_version`, `rate`. It also hosts the **expert console**. Functions are written with Claude Code.

## Consequences
No server to run for the marketplace. RLS set by hand (public read, writes via functions). The repo includes `supabase/` so anyone can run it locally.

## Rejected
Separate Node API; Laravel app.
