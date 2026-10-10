# 16: Buyer setup: Claude link + one-time top-up

**Owner:** Kris · **Built with:** Lovable · **Runs on:** Lovable app + Supabase Edge Functions from ticket 06
**Build Board:** T-08 (part) · **Cut candidate** (fallback: we hand out links manually)

**What to build:** One setup page that does everything once: the buyer connects MetaMask, gets their private Citable link for Claude, and tops up their budget (e.g. 5 USDC, one gasless signature). After this, everything happens in the Claude chat (ADR-011, top up once). They can rotate or revoke the link.

**Blocked by:** 06 (Edge Functions: search agents, orders, connector links), 10 (MCP connector live in Claude), 13 (Lovable project setup + landing page)

**Status:** ready-for-agent — needs the connector on the hosted Supabase project (links are issued there)

- [ ] "Add Citable to Claude" on the landing page leads here
- [ ] Connect MetaMask (Base Sepolia); Get link calls `connector_link/issue` with the wallet as owner; the full Claude URL is shown once with a copy button and a warning to keep it private
- [ ] Top up: amount (default 5.00, max 20.00) → `POST {CONNECTOR_URL}/problems` with the token → sign once (same flow as the /approve page) → funded
- [ ] Rotate and Revoke call their functions; a revoked link stops working in Claude
- [ ] Guide: Claude → Settings → Connectors → Add custom connector → paste link (free plan allows one custom connector)

**Starter prompt:**
> Add a "Set up Citable" page at /setup, reached from "Add Citable to Claude". Three numbered steps on one page, iOS grouped-list style:
>
> 1. **Connect MetaMask** (same wagmi setup as /approve, Base Sepolia 84532).
> 2. **Get your Claude link.** Button calls the existing Supabase Edge Function `connector_link/issue` (supabase.functions.invoke("connector_link/issue", { body: { owner_address: <connected address>, label: "Claude" } })). It returns { link_id, token }. Build the Claude URL as `${CONNECTOR_URL}/mcp/${token}` and show it once in a JetBrains Mono field with a Copy button and the note "Keep this private — anyone with it can spend your Citable budget." Keep the token in memory for steps 3 and Rotate/Revoke (never store it in a table). Add Rotate (`connector_link/rotate`, body { token } → new { link_id, token }, update the URL) and Revoke (`connector_link/revoke`, body { token }).
> 3. **Top up your budget.** Amount field, default 5.00 USDC, max 20.00. "Top up" calls POST `${CONNECTOR_URL}/problems` with header `x-connector-token: <token>` and JSON { cap: "<amount>" }. The response is the same problem state as GET /problems/:id. If `funded` is false, run the same sign-and-fund flow as the /approve page (sign `authorization` with signTypedData after setting message.from and converting value/validAfter/validBefore to BigInt, then POST { from, signature, validAfter, validBefore, nonce } to `${CONNECTOR_URL}/problems/${problem_id}/fund`); reuse that component rather than copying it. If `existing` and `funded` are true, just show "You have {remaining} USDC left."
>
> Under the steps, a short guide: open Claude → Settings → Connectors → Add custom connector → name "Citable" → paste the link (Claude's free plan allows one custom connector). Then: "Ask Claude: Ask an expert on Citable: is €180k fair for a 2-bed in Lozenets?"
>
> Copy: "Top up once. Your AI pays per answer — never more than you put in — and the rest comes back." Never ask for gas; no ERC-20 transfer. Do not create or change any tables or functions.
