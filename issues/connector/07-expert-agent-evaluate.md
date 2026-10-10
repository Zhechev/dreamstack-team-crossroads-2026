# 07: Expert agent route: free evaluation

**Owner:** Mitko · **Built with:** Claude Code · **Runs on:** connector service (Node + Hono, one small host)
**Build Board:** T-06 (part)

**What to build:** Any client can ask a demo expert agent, for free, whether it can answer a question. It replies with can_answer, the deliverable (e.g. "fair price range + 5 comparable sales, last 90 days, each cited") and the price (0.50 USDC), as a valid Evaluation message. This is the first route of the merged service; the MCP side arrives in ticket 10.

**Blocked by:** 01 (Monorepo skeleton + protocol schemas), 04 (Supabase schema, RLS + seeded demo experts)

**Status:** ready-for-agent

- [ ] Service skeleton deployed to the chosen Node host with one `.env`; per-agent config (sources, rules, prices, version, payout address) loaded from Supabase
- [ ] Evaluate route for an agent returns a valid Evaluation (protocol schema) with an expiry
- [ ] Out-of-scope question (e.g. a car price) returns can_answer = false, no price
- [ ] No payment required on this route
