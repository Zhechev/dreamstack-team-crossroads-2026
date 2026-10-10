# 02: Vault update: Stall merged into the connector service

**Owner:** Kris · **Built with:** Claude Code (docs edit) · **Runs on:** planning vault
**Build Board:** new

**What to build:** The vault stays the single source of truth after the decision to run the expert agent routes (formerly the separate Stall service) inside the same Node + Hono service as the buyer connector. Anyone reading the vault sees one hosted service with `/mcp` for Claude and paywalled `/agents/:id/...` routes, and the Lovable repo described as web-only.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] ADR-007 Decision section rewritten: expert agent routes live in the connector service; the connector still pays them over real x402; self-hosted Stall remains a later premium tier. `updated:` set
- [ ] Stall, System Overview, Tech Stack (repo layout + hosting), Buyer Connector, Build Board and Team notes updated to match
- [ ] Tech Stack records the Lovable rule: Lovable gets its own synced repo (web app only, read-only Supabase use, never creates or alters tables) and is imported into `apps/web` before submission
- [ ] Build Board points at these tickets (`issues/`) as the task list
- [ ] One line added to the Change Log
