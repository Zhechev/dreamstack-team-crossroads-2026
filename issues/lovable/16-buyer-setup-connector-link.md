# 16: Buyer setup: connector link get, rotate, revoke

**Owner:** Kris · **Built with:** Lovable · **Runs on:** Lovable app + Supabase Edge Functions from ticket 06
**Build Board:** T-08 (part) · **Cut candidate** (fallback: we hand out links manually)

**What to build:** A buyer gets their own private Citable link for Claude without us handing it over, with a step-by-step "add to Claude" guide. They can rotate or revoke it.

**Blocked by:** 06 (Edge Functions: search agents, orders, connector links), 10 (MCP connector live in Claude), 13 (Lovable project setup + landing page)

**Status:** ready-for-agent

- [ ] "Add Citable to Claude" on the landing page leads here
- [ ] Get link calls the issue function; the full link is shown once with a copy button and a warning to keep it private
- [ ] Rotate and Revoke call their functions; a revoked link stops working in Claude
- [ ] Guide: Claude → Settings → Connectors → Add custom connector → paste link (note: free plan allows one custom connector)

**Starter prompt:**
> Add a "Get your Claude link" page reached from "Add Citable to Claude". A button calls the existing Supabase Edge Function issue_connector_link and shows the returned link once in a monospace field with a Copy button and the note "Keep this private. Anyone with it can use your Citable budget approvals." Add Rotate and Revoke buttons calling rotate_connector_link and revoke_connector_link. Below, a numbered guide: open Claude, Settings, Connectors, Add custom connector, paste the link. Do not create or change any tables or functions.
