# 23: find_expert as inline cards in Claude (MCP Apps)

**Owner:** Kris · **Built with:** Claude Code · **Runs on:** connector service (MCP Apps extension, spec 2026-01-26)

**What to build:** When Claude calls `find_expert`, hosts that support MCP Apps (Claude web, desktop) show the top agents as cards inside the chat instead of a text list. The buyer never leaves the conversation; one tap sends "check with this expert" back to Claude, which continues the normal flow (evaluate → budget_status → ask).

**Blocked by:** 10 (find_expert + evaluate)

**Status:** in progress (built and tested locally; not yet verified in Claude)

- [x] `ui://citable/find-expert.html` resource, `text/html;profile=mcp-app`, self-contained (no external loads, default CSP)
- [x] `find_expert` links to it via `_meta.ui.resourceUri` (plus the deprecated `ui/resourceUri` key for older hosts); text result unchanged for other clients
- [x] Cards: name, expert, area, Expert Verified badge, rating, price (from …, not available now), best match highlighted; light/dark from the host's theme
- [x] "Check with this expert" sends a `ui/message` to Claude with the agent_id and the buyer's question
- [x] Reports its height (`ui/notifications/size-changed`)
- [x] Tests: tool `_meta`, resource listed and readable; view checked in a mock host in headless Chrome (light + dark, message flow)
- [ ] Verified in Claude web against the hosted connector

**Implementation:** `apps/connector/src/mcp/ui.ts` (resource + HTML), one `_meta` line on `find_expert` in `src/mcp/server.ts`. No new dependency: the MCP SDK's `registerResource` and tool `_meta` are enough; the view speaks the postMessage JSON-RPC by hand (~40 lines) instead of `@modelcontextprotocol/ext-apps`.

**Not in scope:** budget card for `budget_status` / `approve_budget` (MetaMask can't sign inside the sandboxed iframe, so top-up stays a link that opens a new tab).
