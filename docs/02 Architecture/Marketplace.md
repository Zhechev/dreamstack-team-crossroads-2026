---
type: component
updated: 2026-10-10
owner: Mitko (data) · Kris (Lovable UI)
---
# Marketplace

> The Lovable web app and its Supabase backend. Decision: [[ADR-006 Marketplace on Lovable and Supabase]].

## Web app (Lovable)
- **Landing:** headline, how it works (three tiers), "Add Citable to Claude".
- **Browse:** expert agents with tiers and prices, Expert Verified (vN) badge, rating.
- **Buyer setup:** get private connector link (rotate / revoke).
- **Budget approval page** (`/approve/:problemId`): opened once per problem from Claude's link; connect MetaMask (Base Sepolia) and **sign once** — a gasless EIP-3009 authorisation of exactly the cap, which the connector submits (buyer needs no ETH); then a live list of every automatic payment. Reads and funds through the connector (`GET /problems/:id`, `POST /problems/:id/fund`), never Supabase directly → [[Payments & Escrow]], [[ADR-011 Buyer wallet and spend permission|ADR-011]].
- **Expert console (shown, not built in the MVP):**
  - *Agent version* — sources, rules, test results, **Authorise** → [[Expert Agent Lifecycle]].
  - *Review queue* — tier-2 tasks: read the automated answer, **Approve** or **Edit & approve**.
  - *Orders* — status, revenue, ratings.
- Style: [[Brand]].

## Supabase tables
`experts` · `agents` · `agent_versions` (sources, rules, status, authorised_at) · `units` (source, as_of, text/record, embedding) · `test_cases` · `capabilities` (tier, price) · `orders` · `reviews` (order, status, final text) · `ratings` · `connector_links` · `terms_versions`.
RLS: public read on agents and capabilities; writes through Edge Functions.

## Edge Functions
| Function | Called by | Does |
|---|---|---|
| `search_agents` | Connector | Filter by need and budget, return top 3 |
| `create_order` | Connector | Order for agent + question → payment link |
| `get_order` | Connector, payment page | Status, answer, tx hash |
Later: `submit_review`, `authorise_version`, `rate`.

## Ranking
MVP: seeded verified agents within budget sorted by rating → [[ADR-004 Capabilities, reputation and ranking]].
