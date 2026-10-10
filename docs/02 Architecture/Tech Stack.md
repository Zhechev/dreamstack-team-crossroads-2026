---
type: architecture
updated: 2026-10-10
---
# Tech Stack

> Every technology choice on one page, with the ADR that decided it.

| Layer | Choice | ADR |
|---|---|---|
| Build tools | **Lovable** for the web app · **Claude Code** for everything else | [[ADR-005 Build tools, language and repo\|005]] |
| Language | TypeScript (Node 22, pnpm workspaces) | [[ADR-005 Build tools, language and repo\|005]] |
| Repo | Public monorepo, MIT, bring your own keys; planning vault in `docs/` | [[ADR-005 Build tools, language and repo\|005]] |
| Marketplace + expert console | Lovable web app (own synced repo, web only) + Supabase (Postgres, RLS, Edge Functions) | [[ADR-006 Marketplace on Lovable and Supabase\|006]] |
| Expert agents | [[Stall]]: paywalled `/agents/:id/...` routes (Hono + official x402 middleware) inside the connector service | [[ADR-007 Stall seller agent\|007]] |
| LLM | Claude (Anthropic SDK) answers; OpenAI `text-embedding-3-small` embeds; provider switchable | [[ADR-007 Stall seller agent\|007]] |
| Knowledge | `units` table with source + as-of, Postgres FTS + pg_trgm + pgvector (Drizzle) | [[ADR-008 Cited sources with as-of dates\|008]] |
| Citation check | Deterministic check before settle | [[ADR-009 Deterministic citation judge\|009]] |
| Buyer connector | Hosted remote MCP (Streamable HTTP, MCP TS SDK + Hono) at `/mcp/<token>`, added to Claude via private link; same service as the agent routes | [[ADR-010 Buyer connector in Claude\|010]] |
| Payments | x402 `exact`, USDC, Base Sepolia, x402.org facilitator; one MetaMask approval per problem into a capped problem wallet; connector pays via `@x402/fetch` | [[ADR-001 Payments with x402 and USDC on Base\|001]] · [[ADR-020 Crypto hidden at the edges\|020]] |
| Hosting | Lovable hosting (web) · Supabase (data, functions) · one small Node host for the connector service (`/mcp` + `/agents/:id/...`, e.g. Fly.io/Render) | [[ADR-006 Marketplace on Lovable and Supabase\|006]] |

## Repo layout
```
dreamstack-team-crossroads-2026/
  docs/             this vault
  apps/web          Lovable app (imported from the Lovable repo before submission)
  apps/connector    One hosted service: /mcp (buyer connector) + /agents/:id/... (expert agent routes)
  packages/protocol zod schemas: manifest, quote, signed outcome, review, receipt
  supabase/         migrations + Edge Functions
  knowledge/        demo sources, synthetic deal data, test cases, seeder
```
**Lovable rule:** Lovable has its **own synced repo** (web app only). It reads Supabase but **never creates or alters tables** — schema changes go through `supabase/` migrations in this repo. It is imported into `apps/web` before submission (ticket 20); nobody hand-edits `apps/web`. `contracts/` only if escrow survives (Q-5).
