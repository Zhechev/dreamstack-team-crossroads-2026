# 10: MCP connector live in Claude: find_expert + evaluate

**Owner:** Kris · **Built with:** Claude Code · **Runs on:** connector service (remote MCP, Streamable HTTP, MCP TS SDK + Hono)
**Build Board:** T-07 (part)

**What to build:** A buyer adds their private link in Claude → Settings → Connectors, asks "Is €180k fair for a 2-bed in Lozenets?", and Claude shows the top 3 verified expert agents plus the free evaluation from the best one.

**Blocked by:** 06 (Edge Functions: search agents, orders, connector links), 07 (Expert agent route: free evaluation)

**Status:** in progress — code + tests done; live check in Claude needs a hosted Supabase project and a public URL

- [x] MCP endpoint at a per-buyer private link; token checked against the stored hash; revoked or unknown tokens rejected
- [x] `find_expert(question)` returns 3 agents with tier, price, Expert Verified (vN), rating
- [x] `evaluate(agent_id, question)` returns the agent's Evaluation unchanged
- [x] Tool descriptions tell Claude the flow: find, evaluate, then ask for a budget before paying
- [ ] Verified in Claude web with a real private link

**Implementation (ticket 10):** MCP TS SDK v2 (`@modelcontextprotocol/server` 2.1.0, stateless `createMcpHandler`; also serves 2025-era clients). `src/mcp/server.ts` (tools + instructions), `src/mcp/links.ts` (token → sha256 → `connector_links`, same hash as the Edge Function), `src/mcp/search.ts` (`search_agents` RPC). `evaluate` calls the agent's own `/agents/:id/evaluate` route over HTTP (in-process), so the result is the agent's Evaluation unchanged.

**To verify in Claude:** hosted Supabase project with migrations + seed applied → root `.env` `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` → issue a link (`connector_link/issue`) → expose the connector (`cloudflared tunnel --url http://localhost:4010` or deploy) → Claude → Settings → Connectors → Add custom connector → `https://<host>/mcp/<token>`.
