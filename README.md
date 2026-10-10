# Citable — DreamStack @ Crossroads AI Hackathon 2026

Your AI assistant hires expert-verified agents and pays per task; the human expert steps in only when it matters.

- **Plan & decisions:** [`docs/`](docs/Home.md) — an Obsidian vault; start at [Home](docs/Home.md).
- **Tickets:** [`issues/`](issues/README.md).

Team: Kris Georgiev, Mitko Zhechev.

## Repo

| Path | What |
|---|---|
| `packages/protocol` | Shared zod schemas: Evaluation, Manifest, SignedOutcome, Review, Receipt |
| `apps/connector` | One hosted service: `/mcp` buyer connector + `/agents/:id/...` expert agent routes *(coming)* |
| `apps/web` | Lovable app — reserved, imported in ticket 20; don't edit by hand |
| `supabase/` | Migrations + Edge Functions *(coming)* |
| `spikes/` | Throwaway proofs (e.g. x402 problem-wallet payment) |

## Run

Needs Node 22+ and pnpm (`corepack enable` picks the pinned version).

```sh
pnpm install
pnpm build
pnpm test
```

Copy `.env.example` to `.env` and fill in your own keys. Faucets, Claude connector setup and knowledge seeding are documented as those parts land.

## Licence

MIT — see [LICENSE](LICENSE).
