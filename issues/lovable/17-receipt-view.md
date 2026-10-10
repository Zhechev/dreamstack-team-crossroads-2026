# 17: Receipt view

**Owner:** Kris · **Built with:** Lovable · **Runs on:** Lovable app + `get_order` / problem-state endpoint
**Build Board:** T-08 (part) · **Cut order item 1** (fallback: BaseScan link only)

**What to build:** After `close_problem`, the buyer opens a receipt that looks like a paper slip: each order with capability, amount, tx hash, Terms hash and "citations verified", the budget approval, and the refunded remainder.

**Blocked by:** 12 (ask + close_problem), 15 (Budget approval page)

**Status:** ready-for-agent

- [ ] Receipt page by problem id lists budget, every payment, remainder refund, each with a BaseScan link
- [ ] Each order shows capability, amount, Terms hash and a green "Citations verified" mark when the check passed
- [ ] Citation pills like `[Deal #12 · Sep 2026]` for the answer's sources
- [ ] Reachable from the approval page after the problem is closed

**Starter prompt:**
> Add a Receipt page at /receipt/:problemId styled as a paper slip. Fetch the problem and its orders from {CONNECTOR_URL}/problems/:problemId. Show: budget approved, each payment (capability name, amount in USDC, tx hash in JetBrains Mono linking to BaseScan, Terms hash), a green "Citations verified" check when citationsVerified is true, citation pills like "[Deal #12 · Sep 2026]", and the refunded remainder. Link to it from the approval page once the problem is closed. Do not create or change any Supabase tables.
