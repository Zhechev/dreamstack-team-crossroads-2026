---
type: tasks
updated: 2026-10-10
---
# Build Board

> Every task, owner and estimate. Time slots: [[Build Schedule]]. Scope: [[MVP Scope]].

| ID | Task | Tool | Owner | Est. h | Status |
|---|---|---|---|---|---|
| T-01 | Monorepo skeleton (pnpm) next to `docs/`, MIT, `.env.example`, README | Claude Code | Kris | 1 | in progress (repo + docs pushed) |
| T-02 | `packages/protocol` zod schemas (evaluation, quote, signed outcome, receipt) | Claude Code | Mitko | 1 | todo |
| T-03 | Supabase schema, RLS, Edge Functions (`search_agents`, `create_order`, `get_order`) | Claude Code | Mitko | 2.5 | todo |
| T-04 | Knowledge: `units` with source + as-of, embed, hybrid search | Claude Code | Mitko | 2.5 | todo |
| T-05 | Fake-it data: 2–3 labelled demo experts + agents (Expert Verified), synthetic Lozenets deals, public statistics | Claude Code | Mitko | 2 | todo |
| T-06 | Hosted Stall: `/evaluate` (free), `/price-check` (x402 0.50), citation check before settle, signed outcome → order | Claude Code | Mitko | 5 | todo |
| T-07 | Connector: `find_expert`, `evaluate`, `pay` (returns payment link), `get_answer`; private link auth; deploy; add to Claude | Claude Code | Kris | 4 | todo |
| T-08 | Lovable: landing, browse agents (tiers 2–3 shown), payment page, order/receipt view | Lovable | Kris | 4 | todo |
| T-09 | **Spike:** browser x402 client with MetaMask on Base Sepolia (payment page → Stall) + settle after check | Claude Code | Kris | 2 | todo |
| T-10 | Fund demo MetaMask wallets with faucet USDC | — | Kris | 0.5 | todo |
| T-11 | Terms v1 text + hash | — | Mitko | 1 | todo |
| T-12 | End-to-end run: question → evaluation → payment → response | — | Both | 3 each | todo |
| T-13 | Record 2-min MP4 by Sun 12:30 | — | Both | 1.5 each | todo |
| T-14 | 8-slide PDF + pitch rehearsal | — | Kris | 3 | todo |

## Capacity (from Sat 12:00)
| | Kris | Mitko |
|---|---|---|
| Tasks | 19h | 18.5h |
| Capacity (minus sleep, meals) | ~18h | ~18h |
Roughly at capacity; the [[MVP Scope]] cut order applies at Sun 09:00.
