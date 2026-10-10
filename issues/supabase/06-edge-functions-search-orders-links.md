# 06: Edge Functions: search agents, orders, connector links

**Owner:** Mitko · **Built with:** Claude Code · **Runs on:** Supabase Edge Functions (Deno/TS)
**Build Board:** T-03 (functions)

**What to build:** The connector and the Lovable app have one backend to call. Given a question and budget, it returns the top 3 verified agents. Orders can be created and read (status, answer, tx hash). A buyer can issue, rotate and revoke their private connector link.

**Blocked by:** 04 (Supabase schema, RLS + seeded demo experts)

**Status:** ready-for-agent

- [ ] `search_agents`: question + budget → top 3 authorised agents within budget, sorted by rating (ADR-004)
- [ ] `create_order` and `get_order`: create an order for agent + question; read status, answer, citations, tx hashes
- [ ] Connector link functions: issue (returns the plain token once, stores only the hash), rotate, revoke
- [ ] All callable with curl; example calls in the README
- [ ] CORS allows the Lovable app's domain
