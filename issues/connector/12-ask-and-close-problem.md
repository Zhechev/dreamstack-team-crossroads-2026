# 12: ask + close_problem: automatic payment and response

**Owner:** Kris · **Built with:** Claude Code · **Runs on:** connector service + Base Sepolia + facilitator
**Build Board:** T-07 (part)

**What to build:** After the one approval, the buyer just reads the answer. `ask(agent_id, question)` pays the agent's 402 from the problem wallet by itself, never above the cap, and returns the cited answer into Claude. `close_problem()` sends the remainder back to the buyer's MetaMask and returns the full receipt.

**Blocked by:** 08 (Expert agent route: paid price check), 11 (approve_budget + budget_status)

**Status:** in progress — code, tests and live run on Base Sepolia done; final check in Claude pending

- [x] `ask` pays via x402 from the problem wallet with no prompt; refuses if the price exceeds the remaining cap
- [x] Answer reaches Claude with every figure's source and as-of date; placeholders passed through untouched, with an instruction to fill them only in the final text
- [x] Each payment appears in the problem-state payments list with its tx hash
- [x] `close_problem` refunds the remainder and returns a Receipt (protocol schema) per order
- [ ] Verified in Claude: question → evaluation → approval → automatic 0.50 payment → cited answer → close

**Spike findings (ticket 03, GO):** compute spent/remaining from settlement receipts (or reads pinned to their block), not from a `latest` balance right after a payment — the public RPC lags. The refund is a normal transfer paid with the seeded ETH.

**Implementation (ticket 12):** `src/problems/pay.ts` (quote first: reads the 402 price and refuses above what's left before signing; then `@x402/fetch` pays from the decrypted problem-wallet key against this service's own agent route, real facilitator), `service.ask` (records the payment, adds each cited unit's source, placeholder note; a failed citation check is returned as `charged: false` and never recorded), `service.close` (refunds the on-chain remainder to the buyer, or `refund_to` for plain-transfer budgets; one protocol `Receipt` per paid order, fee "0.00" + waived note).

**Live run (2026-10-10, local Supabase):** `ask` paid 0.50 from Claude's 1.00 budget — [0x402ef4…](https://sepolia.basescan.org/tx/0x402ef425c751d41094dadd79c93ca8e92f49811348e74bdb7e88bcaa3c575f94) — 5 cited comparables, citations verified, 0.50 left. `close_problem` refunded 0.50 ([0x60438e…](https://sepolia.basescan.org/tx/0x60438ed0d61bf22d84fed94ad079a4a097184a2e24fed79ba2d23a0f9f22c79b)) with a receipt carrying the Terms v1 hash; a second test budget refunded 1.00 ([0xa2185d…](https://sepolia.basescan.org/tx/0xa2185d5d6eb67c1a4d5c913f3b6a51a7d14c0e5a10b391070dbfb16e45d9ff77)).
