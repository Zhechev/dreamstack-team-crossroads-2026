# 08: Expert agent route: paid price check (x402, 0.50)

**Owner:** Mitko · **Built with:** Claude Code · **Runs on:** connector service (Node + Hono + x402 middleware) + Supabase + Anthropic API
**Build Board:** T-06 (part)

**What to build:** Paying 0.50 USDC over x402 gets a cited price check. Without payment the route answers 402. With payment it retrieves the agent's units, applies the expert's rules, asks Claude for an answer that only uses retrieved units, returns a signed outcome with citations and identity placeholders, settles to the expert's payout address, and records the order.

**Blocked by:** 03 (Spike: problem wallet pays x402), 05 (Knowledge units + hybrid search), 07 (Expert agent route: free evaluation)

**Status:** done (live Base Sepolia run pending a funded wallet)

- [x] Unpaid request → 402 with the 0.50 USDC `exact` requirement to the agent's payout address
- [x] Paid request → SignedOutcome (protocol schema): text, citations `{unit_id, quote, as_of}`, agent_version, signature by the agent key
- [x] Answer says "price check", never "appraisal" or "valuation"; personal details appear only as placeholders (ADR-012)
- [x] Order row updated with answer, citations, tx hash and Terms hash (the real Terms v1 hash from ticket 19)
- [ ] Test with a scripted x402 client from the spike: Lozenets question → range + 5 cited comparables

**Spike findings (ticket 03, GO):** reuse `spikes/03-x402-problem-wallet/` — `server.ts` is the route pattern (`@x402/hono` 2.28.0, `ExactEvmScheme` on `eip155:84532`), `run.ts` is the scripted paying client. The settlement tx comes back in the `PAYMENT-RESPONSE` header.

**Notes:**
- **Pipeline:** the route is `routes/agents.ts`: `requirePriceCheck` → `recordSettlement` → x402 paywall (`agents/payments.ts`) → handler. `payTo` and price are resolved per agent from Supabase. The handler (`agents/priceCheck.ts`) searches the agent's units, drops deal records older than 90 days, answers, rejects "appraisal"/"valuation" wording, and signs (`agents/outcome.ts`, EIP-191 over agent, version, order, text and citations).
- **Claude:** with `ANTHROPIC_API_KEY` set, Claude (`claude-opus-5-5`) writes the answer via structured output, effort `medium`, server-side refusal fallbacks (`fallbacks: "default"`). Without a key, `groundedAnswerer` builds a range and median from up to 5 comparables. That is the path tested so far; **the Claude path has not run yet** (no key).
- **Signing key:** `AGENT_SIGNING_KEY` is a local testnet key. `pnpm --filter @citable/connector configure:demo` writes its address to the demo agents (re-run after `supabase db reset`). It also writes `AGENT_PAYOUT_ADDRESS` once set; the Lozenets agent still has the placeholder payout address.
- **Tests:** 14 unit tests use a real x402 client (`@x402/fetch` + `ExactEvmScheme`, a fresh wallet) against a fake facilitator: 402 requirement, paid flow, 90-day rule, no-answer and wording checks not settled, 404/400 before payment. 2 `test:db` tests run against Supabase.
- **Live:** the real facilitator path was exercised with an empty wallet, which got `402 invalid_exact_evm_insufficient_balance` and no order. A funded run is `price-check:live` with `BUYER_PRIVATE_KEY`.
