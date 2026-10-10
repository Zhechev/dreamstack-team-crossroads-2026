# 17: Receipt view

**Owner:** Kris · **Built with:** Lovable · **Runs on:** Lovable app + `get_order` / problem-state endpoint
**Build Board:** T-08 (part) · **Cut order item 1** (fallback: BaseScan link only)

**What to build:** After `close_problem`, the buyer opens a receipt that looks like a paper slip: each order with capability, amount, tx hash, Terms hash and "citations verified", the budget approval, and the refunded remainder.

**Blocked by:** 12 (ask + close_problem), 15 (Budget approval page)

**Status:** ready-for-agent

- [ ] Receipt page by problem id lists budget, every payment, remainder refund, each with a BaseScan link
- [ ] Each order shows capability, amount, Terms hash and a green "Citations verified" mark when the check passed
- [ ] Citation pills like `[Deal #12 · Sep 2026]` for the answer's sources
- [ ] Each order shows the split: "0.35 to expert · 0.15 Citable fee — waived during the hackathon" (ADR-016; fee not collected in the MVP)
- [ ] Reachable from the approval page after the problem is closed

**Connector support (done 2026-10-10):** `GET {CONNECTOR_URL}/problems/:id` now returns, per payment, `capability`, `agent`, `terms_hash`, `citations_verified`, `expert_share`, `fee`, `fee_waived` and `citations` (source + as-of date, no quotes), plus `refund_tx`, `refund_amount` and `receipt_url` on the problem. `close_problem` returns `receipt_url`, so Claude can hand the buyer the link.

**Starter prompt** (matches the connector's real response):
> Add a Receipt page at /receipt/:problemId, styled as a paper slip (same card style as /approve). Data: GET {CONNECTOR_URL}/problems/:problemId (CONNECTOR_URL from the settings file). Response JSON:
> `{ problem_id, cap, status, buyer_address, funding_tx, spent, remaining, refund_tx, refund_amount, payments: [{ amount, tx_hash, created_at, capability, agent, terms_hash, citations_verified, expert_share, fee, fee_waived, citations: [{ source, source_url, as_of }] }] }`
>
> Show, top to bottom:
> 1. "Budget approved: {cap} USDC" with funding_tx as a BaseScan link (BASESCAN_TX_URL + hash), hash shortened in JetBrains Mono.
> 2. One row per payment: "{capability} · {agent}", "{amount} USDC", the date, tx_hash as a BaseScan link, "Terms {first 10 chars of terms_hash}…" in JetBrains Mono, and a green "✓ Citations verified" when citations_verified is true.
>    Under it, citation pills: one per citation, text "[{source} · {as_of as 'Sep 2026'}]", linking to source_url when present. Show each distinct pill once.
>    A small fee line: "{expert_share} to expert · {fee} Citable fee — waived during the hackathon", with the fee amount struck through.
> 3. If status is "closed": "Refunded {refund_amount} USDC" with refund_tx as a BaseScan link (no link when refund_tx is null). Otherwise: "Budget still open — {remaining} USDC left".
> 4. Totals: spent and refunded.
>
> On /approve, when status is "closed", show a "View receipt" button that opens /receipt/:problemId. Never say appraisal or valuation. Do not create or change any Supabase tables; this page only talks to CONNECTOR_URL.
