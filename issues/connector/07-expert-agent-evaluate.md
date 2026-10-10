# 07: Expert agent route: free evaluation

**Owner:** Mitko · **Built with:** Claude Code · **Runs on:** connector service (Node + Hono, one small host)
**Build Board:** T-06 (part)

**What to build:** Any client can ask a demo expert agent, for free, whether it can answer a question. It replies with can_answer, the deliverable (e.g. "fair price range + 5 comparable sales, last 90 days, each cited") and the price (0.50 USDC), as a valid Evaluation message. This is the first route of the merged service; the MCP side arrives in ticket 10.

**Blocked by:** 01 (Monorepo skeleton + protocol schemas), 04 (Supabase schema, RLS + seeded demo experts)

**Status:** done — deployed to Render (`https://citable-connector.onrender.com`, see README)

- [x] Service skeleton deployed to the chosen Node host with one `.env`; per-agent config (sources, rules, prices, version, payout address) loaded from Supabase
- [x] Evaluate route for an agent returns a valid Evaluation (protocol schema) with an expiry
- [x] Out-of-scope question (e.g. a car price) returns can_answer = false, no price
- [x] No payment required on this route

**Notes:** `apps/connector` runs locally with `pnpm --filter @citable/connector dev`. The route lives in `routes/agents.ts` of the service skeleton (#6), agent config in `agents/load.ts`, and the Supabase keys come through `config.ts`. It is **not deployed yet**: that needs a Fly.io or Render account and the hosted Supabase keys. The protocol's `Evaluation.price` is required, so out of scope returns `"0.00"`; making `price` optional when `can_answer` is false would need a schema change in `@citable/protocol` (Kris). All agents share the deliverable "5 comparable sales", but Mladost and Varna have fewer than 5 deals in the data.
