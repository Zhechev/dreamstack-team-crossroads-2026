---
type: component
updated: 2026-10-09
owner: Mitko (data) · Kris (Lovable UI)
---
# Marketplace

> ⚠️ **Pre-pivot (KAT build) — re-plan pending, see [[Open Questions]] Q-14.** Current plan: [[Product]] · [[Demo Story]].

> The Lovable web app and its Supabase backend. Decision: [[ADR-006 Marketplace on Lovable and Supabase]].

## Web app (Lovable)
- **Landing:** headline, how it works, "Add Citable to Claude".
- **Browse:** capabilities with price, rating, online status, citation badge.
- **Onboarding (buyer):** connect MetaMask → grant spend permission → get private connector link (rotate / revoke).
- **Seller view:** orders with status paid → running → completed / refunded; revenue; ratings. Never payloads.
- Style: [[Brand]].

## Supabase tables
`sellers` · `seller_agents` (key, endpoint, last_heartbeat) · `capabilities` (name, tags, price model, price, cap, embedding) · `orders` (capability, buyer address, amount, tx hash, terms hash, status) · `ratings` · `disputes` · `connector_links` (token hash, buyer address, permission id) · `terms_versions`.
RLS: public read on capabilities and sellers; all writes through Edge Functions.

## Edge Functions
| Function | Called by | Does |
|---|---|---|
| `register` | Stall | Signed manifest → upsert seller agent + capabilities |
| `heartbeat` | Stall (every 60s) | Update `last_heartbeat` |
| `search_capabilities` | Connector | Filter online + within budget, sort, return top 3 |
| `rate` | Connector | Store rating signed by the paying key |
| `dispute` | Connector | Run the [[Data Model#Judge\|judge]] → call `DreamEscrow.refund` |

## Ranking
MVP: online capabilities within budget sorted by rating. Design (post-MVP): `score = bayes_rating × uptime_7d × (1 + 0.2·badge)`; featured placement always labelled, never mixed into score. → [[ADR-004 Capabilities, reputation and ranking]]
