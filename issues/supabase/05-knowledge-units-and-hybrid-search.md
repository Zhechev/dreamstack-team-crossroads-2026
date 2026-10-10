# 05: Knowledge units + hybrid search

**Owner:** Mitko · **Built with:** Claude Code · **Runs on:** Supabase Postgres (pgvector, FTS, pg_trgm) + seeder script
**Build Board:** T-04, T-05 (deal data)

**What to build:** The Lozenets demo agent has knowledge it can cite. Public base sources (statistics, guidance) and labelled synthetic deal records from the last 90 days are stored as citable units with source and as-of date. One search call returns the best units for a question, scoped to one agent.

**Blocked by:** 04 (Supabase schema, RLS + seeded demo experts)

**Status:** ready-for-agent

- [ ] Units seeded in both layers (base and expert) with source, source_url, as_of, kind (passage or record), text or data
- [ ] Synthetic deals are clearly labelled synthetic; at least 5 two-bed Lozenets comparables within 90 days exist
- [ ] Embeddings created with the configured embedding provider; the seeder is re-runnable
- [ ] A hybrid search function (FTS + trigram + vector) returns the top N units for (agent, question)
- [ ] Test: "2-bed Lozenets €180k" returns the comparable deal records first
- [ ] Demo sources, synthetic data and seeder live in the monorepo's knowledge area
