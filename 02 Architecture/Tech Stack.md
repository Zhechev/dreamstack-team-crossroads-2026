---
type: architecture
updated: 2026-10-09
---
# Tech Stack

> ⚠️ **Pre-pivot (KAT build) — re-plan pending, see [[Open Questions]] Q-14.** Current plan: [[Product]] · [[Demo Story]].

> Every technology choice on one page, with the ADR that decided it.

| Layer | Choice | ADR |
|---|---|---|
| Build tools | **Lovable** for the web app · **Claude Code** for everything else | [[ADR-005 Build tools, language and repo\|005]] |
| Language | TypeScript (Node 22, pnpm workspaces); Solidity for the contract | [[ADR-005 Build tools, language and repo\|005]] |
| Repo | Public monorepo, MIT, bring your own keys | [[ADR-005 Build tools, language and repo\|005]] |
| Marketplace | Lovable web app + Supabase (Postgres, RLS, Edge Functions) | [[ADR-006 Marketplace on Lovable and Supabase\|006]] |
| Seller agent | [[Stall]]: Node + Hono + official x402 middleware, on the seller's machine | [[ADR-007 Stall seller agent\|007]] |
| LLM | Claude (Anthropic SDK) generates; OpenAI `text-embedding-3-small` embeds; provider switchable | [[ADR-007 Stall seller agent\|007]] |
| Retrieval | `provisions` table, Postgres FTS + pg_trgm + pgvector (Drizzle) | [[ADR-008 Cited sources with as-of dates\|008]] |
| Judge | Deterministic citation check in a Supabase Edge Function → `refund()` | [[ADR-009 Deterministic citation judge\|009]] |
| Buyer connector | Hosted remote MCP (Streamable HTTP, MCP TS SDK + Hono), added to Claude via private link | [[ADR-010 Buyer connector in Claude\|010]] |
| Buyer wallet | Own MetaMask; ERC-7715 periodic USDC permission (MetaMask Smart Accounts Kit, @metamask/x402, @x402/fetch) | [[ADR-011 Buyer wallet and spend permission\|011]] |
| Payments | x402 `exact`, USDC, Base Sepolia, x402.org facilitator | [[ADR-001 Payments with x402 and USDC on Base\|001]] |
| Escrow | DreamEscrow.sol (Foundry), funded by connector `deposit()` | [[ADR-013 Escrow for drafts\|013]] |
| Hosting | Lovable hosting (web) · Supabase (data, functions) · one small Node host for the connector (e.g. Fly.io/Render) | [[ADR-006 Marketplace on Lovable and Supabase\|006]] · [[ADR-010 Buyer connector in Claude\|010]] |

## Repo layout
```
citable/
  apps/web          Lovable app (synced from Lovable)
  apps/connector    Hosted MCP buyer connector
  apps/stall        Seller agent
  packages/protocol zod schemas: manifest, quote, escrow quote, signed outcome, receipt
  supabase/         migrations + Edge Functions (register, heartbeat, search_capabilities, rate, dispute)
  contracts/        Foundry: DreamEscrow.sol, tests, deploy script
  corpus/           public-law sources + seeder
```
Rule: Lovable owns `apps/web`; nobody hand-edits it while someone is prompting Lovable.
