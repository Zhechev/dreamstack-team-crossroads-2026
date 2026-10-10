# Citable — DreamStack @ Crossroads AI Hackathon 2026

Your AI assistant hires expert-verified agents and pays per task; the human expert steps in only when it matters.

- **Plan & decisions:** [`docs/`](docs/Home.md) — an Obsidian vault; start at [Home](docs/Home.md).
- **Tickets:** [`issues/`](issues/README.md).

Team: Kris Georgiev, Mitko Zhechev.

## Repo

| Path | What |
|---|---|
| `packages/protocol` | Shared zod schemas: Evaluation, Manifest, SignedOutcome, Review, Receipt |
| `apps/connector` | One hosted service: `/mcp` buyer connector + `/agents/:id/...` expert agent routes + `/problems/:id` budget state. `pnpm --filter @citable/connector dev` |
| `apps/web` | Lovable app — reserved, imported in ticket 20; don't edit by hand |
| `supabase/` | Migrations, seed, pgTAP tests, Edge Functions |
| `knowledge/` | Demo sources, synthetic deal data, seeder and hybrid search (`@citable/knowledge`) |
| `terms/` | Terms text per version + `hash.mjs` (sha256 stored in `terms_versions`) |
| `spikes/` | Throwaway proofs (e.g. x402 problem-wallet payment) |

## Run

Needs Node 22+ and pnpm (`corepack enable` picks the pinned version).

```sh
pnpm install
pnpm build
pnpm test
```

Copy `.env.example` to `.env` and fill in your own keys. Faucets, Claude connector setup and knowledge seeding are documented as those parts land.

## Supabase (local)

Needs Docker and the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).

```sh
supabase start      # local Postgres, API and Studio
supabase db reset   # apply supabase/migrations, then supabase/seed.sql
supabase test db    # pgTAP tests in supabase/tests
```

The seed has three fictional demo experts; for the MVP they carry no demo label in the product. Each has one Expert Verified agent with three capabilities: price check 0.50, human review 20, consultation 50+. The anon key can read `experts`, `agents`, the authorised `agent_versions`, `capabilities`, `ratings`, `terms_versions` and the `marketplace_agents` view. Nobody writes with the anon key: writes go through Edge Functions using the service role.

**Schema ownership:** Claude Code owns the schema in `supabase/migrations`. Lovable must never create or alter tables; it only reads through the anon key and calls Edge Functions.

New tables get no anon or authenticated grants by default. Grant read access explicitly in the migration that needs it.

### Knowledge units

```sh
pnpm --filter @citable/knowledge seed      # upsert units from knowledge/data/*.json (re-runnable)
pnpm --filter @citable/knowledge test:db   # search tests against the running Supabase
```

Run the seeder again after every `supabase db reset`. Deal records are synthetic and labelled so; base passages are illustrative summaries, not real statistics. With `OPENAI_API_KEY` set, the seeder embeds new or changed units with `text-embedding-3-small` and search adds vector ranking. Without it, search uses full-text + trigram only. `search_units(agent, question)` can only be called with the service role.

### Edge Functions

`supabase functions serve` runs them on `http://127.0.0.1:54321/functions/v1`. None needs a Supabase JWT: `create_order` checks the buyer's connector token, and the link actions check the link token. CORS allows `*.lovable.app`, `*.lovableproject.com`, localhost and anything in `ALLOWED_ORIGINS` (comma-separated). On Windows, pass bodies containing `€` with `--data-binary @file.json`: Git Bash re-encodes command-line arguments.

```sh
F=http://127.0.0.1:54321/functions/v1

# Top 3 authorised agents within budget, best match first, then rating
curl -X POST $F/search_agents -d '{"question": "Is 180k EUR fair for a 2-bed in Lozenets?", "budget": "2.00"}'

# Private connector link: the token is shown once, only its sha256 is stored
curl -X POST $F/connector_link/issue  -d '{"owner_address": "0x…", "label": "my Claude"}'   # → {link_id, token}
curl -X POST $F/connector_link/rotate -d '{"token": "ctb_…"}'                              # → new token, old one revoked
curl -X POST $F/connector_link/revoke -d '{"token": "ctb_…"}'
curl -X POST $F/connector_link/verify -d '{"token": "ctb_…"}'                              # used by the connector

# Order for agent + question (agent uuid or slug; capability defaults to price-check)
curl -X POST $F/create_order -H 'x-connector-token: ctb_…' \
  -d '{"agent_id": "lozenets-price-check", "question": "Is 180k EUR fair for a 2-bed in Lozenets?"}'
# → {order_id, status: "awaiting_payment", price: "0.50", pay_to, terms_hash, …}

# Status, answer, citations, citations_verified, tx hash, terms hash
curl "$F/get_order?id=<order_id>"
```

## Connector service (local)

```sh
pnpm --filter @citable/connector dev       # http://localhost:4010, reads the root .env
pnpm --filter @citable/connector test:db   # needs the running Supabase

curl -X POST http://localhost:4010/agents/lozenets-price-check/evaluate \
  -d '{"question": "Is 180k EUR fair for a 2-bed in Lozenets?"}'
# → {"agent_id":"lozenets-price-check","can_answer":true,"deliverable":"Fair price range + 5 comparable sales, …","price":"0.50","expires_at":"…"}
```

**MCP for Claude:** `POST /mcp/<token>` (Streamable HTTP, stateless). The token is a connector link from `connector_link/issue`; unknown or revoked tokens get 401. Tools: `find_expert(question, budget?)` → top 3 agents, `evaluate(agent_id, question)` → the agent's Evaluation. In Claude: Settings → Connectors → Add custom connector → `https://<public host>/mcp/<token>`.

**Budgets (ticket 11):** `approve_budget(cap)` creates a problem wallet (key encrypted with `PROBLEM_WALLET_SECRET`) and returns `${WEB_APP_URL}/approve/<problem_id>`; `budget_status(problem_id?)` shows funded / spent / remaining. `GET /problems/:id` is the public state for the approval page, including the EIP-3009 typed data to sign; `POST /problems/:id/fund {from, signature, validAfter, validBefore, nonce}` submits it from the gas funder (buyer needs no ETH) and seeds the wallet with gas for the refund. Without the page: `pnpm --filter @citable/connector fund-problem <problem_id>` signs with `BUYER_PRIVATE_KEY`. Needs migration `20261010150000_problems.sql`.

`POST /agents/:id/evaluate` is free (no x402) and deterministic: `can_answer` is true only for a property question that names the agent's area. Out of scope returns `can_answer: false` and price `"0.00"`. Agent config (sources, rules, prices, version, payout address) comes from the authorised version in Supabase and is cached for 60 s.

### Paid price check (x402, 0.50 USDC)

`POST /agents/:id/price-check` with `{"question": "…", "order_id"?: "<from create_order>"}`. It works like this:

- **Unpaid:** the route answers `402` with an x402 `exact` requirement for 0.50 USDC on Base Sepolia, paid to the agent's payout address.
- **Paid:** the agent searches its units, drops deals older than 90 days and answers from what remains. It returns a `SignedOutcome` (text, citations `{unit_id, quote, as_of}`, agent version, signature by `AGENT_SIGNING_KEY`).
- **Who writes the answer:** Claude (`claude-opus-5-5`, structured output) when `ANTHROPIC_API_KEY` is set. Otherwise a deterministic answer built from the comparable deals.
- **Not charged:** an answer that can't be given from the evidence, or that says "appraisal" or "valuation", returns `422`, and the payment is never settled.
- **Recorded:** the order stores the answer, citations, signature and Terms hash, and gets the tx hash once the facilitator settles.
- **Citation check (ticket 09):** before the payment settles, every citation is checked: signature (agent, version, order), unit exists and belongs to the agent, the quote is in the unit, `as_of` matches. Any failure returns `422`, the payment is never settled, the order is marked `failed_check`, and a negative `reputation_events` row is written. Passing orders get `citations_verified = true`, which `get_order` returns for the receipt.

```sh
pnpm --filter @citable/connector configure:demo     # after every db reset: signing address (+ AGENT_PAYOUT_ADDRESS) on the demo agents
pnpm --filter @citable/connector price-check:live   # pays the running connector on Base Sepolia from BUYER_PRIVATE_KEY (needs test USDC)
```

## Licence

MIT — see [LICENSE](LICENSE).
