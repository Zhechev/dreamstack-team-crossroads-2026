---
type: glossary
updated: 2026-10-10
---
# Glossary

> Every Citable term, defined once. Code, slides and notes use these words exactly.

## Product
- **Citable** — the product. **DreamStack** — the team.
- **Buyer** — a person who wants an outcome; acts through their **assistant** (Claude) with the [[Buyer Connector]] added.
- **Expert** — the human professional behind an agent (e.g. a real-estate agent). Verified in production; the demo expert is fictional and labelled.
- **Seller** — the verified party (person or firm) that gets paid and signs Terms; owns one or more expert agents.
- **Expert agent / seller agent** — the agent we build and host for an expert. Our runtime is **[[Stall]]**.
- **Base layer** — public sources we collect and index for a category.
- **Expert layer** — sources, rules and fresh or private knowledge the expert adds or approves.
- **Agent version** — a set of sources + rules the expert authorised after test cases.
- **Expert Verified** — badge meaning the expert approved the sources and rules of this agent version; never a claim about a single answer.
- **Reviewed by** — badge on a tier-2 answer a human expert checked.
- **Tier** — one of three capabilities per agent: **automated answer** (~0.50), **human review** (~20), **consultation** (50+).
- **Price check** — the real-estate tier-1 answer. Never "appraisal" or "valuation".
- **Capability** — the unit that is listed, priced and rated (each tier is one).
- **Outcome** — the delivered result of a capability call: text + citations + receipt.
- **Citable unit** — a passage of a source or a record of expert data, stored with source and **as-of date**.
- **Citation** — `{unit_id, quote, as_of}` in an outcome; valid only if the unit exists and the quote matches.
- **Order** — one paid capability call, from quote to settlement.
- **Receipt** — machine-readable proof of an order: tx hash, Terms hash, capability, amounts.
- **Rating** — score signed by the paying key over the order's tx hash.
- **Reputation / Score** — ratings and uptime per capability.
- **Signed outcome** — outcome JSON signed by the agent's key, bound to the order.
- **Dispute** — buyer's claim that an outcome breached Terms; in the MVP handled before settlement by the judge, afterwards only via ratings.
- **Judge** — the deterministic citation check that runs before a payment settles; a failure means the payment is never settled.
- **Placeholder** — `{{full_name}}`-style slot in an outcome; the buyer's assistant fills it in the final text.
- **Connector link** — private per-buyer URL `/mcp/<token>` that adds Citable to Claude.
- **Registry** — the marketplace's list of sellers, agents, capabilities, prices, tags.
- **Terms (v1)** — the agreement every party signs; its hash is on every order.
- **Take rate** — marketplace fee on a settled order.
- **Founding expert** — one of the first 5 hand-onboarded experts; 0% fee for 6 months.
- **Crypto hidden at the edges** — card top-up for buyers, EUR payout for experts, x402 + USDC underneath.

## Technical
- **x402** — open protocol for paying over HTTP: server answers `402 Payment Required`, client retries with a signed payment. **`exact` scheme** = fixed amount straight to the seller; gasless for the buyer.
- **Facilitator** — service that verifies and settles x402 payments (we use x402.org's testnet facilitator).
- **MCP** — Model Context Protocol; how assistants call tools. **Remote MCP / custom connector** — an MCP server reached over HTTPS, added in Claude → Settings → Connectors.
- **USDC** — USD stablecoin. **Base** — Coinbase's Ethereum L2; **Base Sepolia** — its testnet.
- **DreamEscrow** — the escrow contract we planned; superseded, not built (ADR-013).
- **ERC-7715** — standard for wallets granting scoped permissions to apps/agents.
- **Faucet** — free testnet tokens (Circle: 20 USDC per address per 2h).
- **Lovable** — AI app builder (React + TS + Supabase), sponsor. **Claude Code** — coding agent, sponsor.
- **Supabase** — hosted Postgres + auth + Edge Functions (Deno/TS).
- **Hono** — minimal TypeScript web framework. **viem** — TS library for Ethereum. **Foundry** — Solidity toolchain. **Drizzle** — TS ORM.
- **pgvector / FTS / pg_trgm** — Postgres vector search / full-text search / trigram matching.
- **RAG** — retrieval-augmented generation.
- **Onramp / offramp** — service converting card/bank money to crypto and back; **KYC** — its identity check.
