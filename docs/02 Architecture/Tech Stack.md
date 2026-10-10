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
| Marketplace + expert console | Lovable web app + Supabase (Postgres, RLS, Edge Functions) | [[ADR-006 Marketplace on Lovable and Supabase\|006]] |
| Expert agents | [[Stall]]: Node + Hono + official x402 middleware, hosted by Citable | [[ADR-007 Stall seller agent\|007]] |
| LLM | Claude (Anthropic SDK) answers; OpenAI `text-embedding-3-small` embeds; provider switchable | [[ADR-007 Stall seller agent\|007]] |
| Knowledge | `units` table with source + as-of, Postgres FTS + pg_trgm + pgvector (Drizzle) | [[ADR-008 Cited sources with as-of dates\|008]] |
| Citation check | Deterministic check before settle | [[ADR-009 Deterministic citation judge\|009]] |
| Buyer connector | Hosted remote MCP (Streamable HTTP, MCP TS SDK + Hono), added to Claude via private link | [[ADR-010 Buyer connector in Claude\|010]] |
| Payments | x402 `exact`, USDC, Base Sepolia, x402.org facilitator; one MetaMask approval per problem into a capped problem wallet; connector pays via `@x402/fetch` | [[ADR-001 Payments with x402 and USDC on Base\|001]] · [[ADR-020 Crypto hidden at the edges\|020]] |
| Hosting | Lovable hosting (web) · Supabase (data, functions) · one small Node host for connector + Stall (e.g. Fly.io/Render) | [[ADR-006 Marketplace on Lovable and Supabase\|006]] |

## Repo layout
```
dreamstack-team-crossroads-2026/
  docs/             this vault
  apps/web          Lovable app (synced from Lovable)
  apps/connector    Hosted MCP buyer connector
  apps/stall        Hosted expert agent runtime
  packages/protocol zod schemas: manifest, quote, signed outcome, review, receipt
  supabase/         migrations + Edge Functions
  knowledge/        demo sources, synthetic deal data, test cases, seeder
```
Rule: Lovable owns `apps/web`; nobody hand-edits it while someone is prompting Lovable. `contracts/` only if escrow survives (Q-5).
