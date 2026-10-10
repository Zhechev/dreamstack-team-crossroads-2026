# 06: Edge Functions: search agents, orders, connector links

**Owner:** Mitko · **Built with:** Claude Code · **Runs on:** Supabase Edge Functions (Deno/TS)
**Build Board:** T-03 (functions)

**What to build:** The connector and the Lovable app have one backend to call. Given a question and budget, it returns the top 3 verified agents. Orders can be created and read (status, answer, tx hash). A buyer can issue, rotate and revoke their private connector link.

**Blocked by:** 04 (Supabase schema, RLS + seeded demo experts)

**Status:** done

- [x] `search_agents`: question + budget → top 3 authorised agents within budget, sorted by rating (ADR-004)
- [x] `create_order` and `get_order`: create an order for agent + question; read status, answer, citations, tx hashes
- [x] Connector link functions: issue (returns the plain token once, stores only the hash), rotate, revoke
- [x] All callable with curl; example calls in the README
- [x] CORS allows the Lovable app's domain

**Notes:** `create_order` requires the buyer's `x-connector-token`, so every order belongs to a link; tier 2/3 capabilities answer 409 (shown only). `get_order` is keyed by the unguessable order uuid and never returns seeded demo orders. `connector_link/verify` is for the connector (ticket 10). Orders have one `tx_hash` (the x402 payment); the problem-wallet funding and refund hashes belong to the problem (ticket 11). Locally the gateway adds `Access-Control-Allow-Origin: *`; on hosted Supabase the functions' own CORS rules apply. Prices are protocol text ("0.50").
