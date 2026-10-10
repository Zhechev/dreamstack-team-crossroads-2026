# 04: Supabase schema, RLS + seeded demo experts and agents

**Owner:** Mitko · **Built with:** Claude Code · **Runs on:** Supabase (migrations in our monorepo)
**Build Board:** T-03 (schema), T-05 (experts/agents)

**What to build:** The marketplace data exists and is publicly readable. Two to three clearly labelled fictional demo experts with Expert Verified agent versions and three capabilities each (price check 0.50, human review 20, consultation 50+) can be read with the anon key, so the Lovable app can show them as soon as it connects.

**Blocked by:** 01 (Monorepo skeleton + protocol schemas)

**Status:** ready-for-agent

- [ ] Migrations for experts, agents, agent_versions, units, test_cases, capabilities, orders, reviews, ratings, connector_links (token stored hashed), terms_versions
- [ ] RLS: public read on experts, agents, agent_versions, capabilities, ratings; no anon writes anywhere; writes only through Edge Functions or the service role
- [ ] Seed: demo experts labelled "Demo expert, fictional", agents with an authorised version shown as Expert Verified (vN), ratings, and each agent's payout address
- [ ] `supabase db reset` locally reproduces the whole thing
- [ ] Claude Code owns the schema: a note in the README says Lovable must never create or alter tables
