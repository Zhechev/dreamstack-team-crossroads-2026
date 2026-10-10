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
| `supabase/` | Migrations, seed, pgTAP tests; Edge Functions *(coming)* |
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

The seed has three demo experts, all fictional and labelled "Demo expert, fictional". Each has one Expert Verified agent with three capabilities: price check 0.50, human review 20, consultation 50+. The anon key can read `experts`, `agents`, the authorised `agent_versions`, `capabilities`, `ratings`, `terms_versions` and the `marketplace_agents` view. Nobody writes with the anon key: writes go through Edge Functions using the service role.

**Schema ownership:** Claude Code owns the schema in `supabase/migrations`. Lovable must never create or alter tables; it only reads through the anon key and calls Edge Functions.

New tables get no anon or authenticated grants by default. Grant read access explicitly in the migration that needs it.

## Licence

MIT — see [LICENSE](LICENSE).
