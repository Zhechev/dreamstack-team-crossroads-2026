# 10: MCP connector live in Claude: find_expert + evaluate

**Owner:** Kris · **Built with:** Claude Code · **Runs on:** connector service (remote MCP, Streamable HTTP, MCP TS SDK + Hono)
**Build Board:** T-07 (part)

**What to build:** A buyer adds their private link in Claude → Settings → Connectors, asks "Is €180k fair for a 2-bed in Lozenets?", and Claude shows the top 3 verified expert agents plus the free evaluation from the best one.

**Blocked by:** 06 (Edge Functions: search agents, orders, connector links), 07 (Expert agent route: free evaluation)

**Status:** ready-for-agent

- [ ] MCP endpoint at a per-buyer private link; token checked against the stored hash; revoked or unknown tokens rejected
- [ ] `find_expert(question)` returns 3 agents with tier, price, Expert Verified (vN), rating
- [ ] `evaluate(agent_id, question)` returns the agent's Evaluation unchanged
- [ ] Tool descriptions tell Claude the flow: find, evaluate, then ask for a budget before paying
- [ ] Verified in Claude web with a real private link
