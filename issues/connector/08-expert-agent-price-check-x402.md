# 08: Expert agent route: paid price check (x402, 0.50)

**Owner:** Mitko · **Built with:** Claude Code · **Runs on:** connector service (Node + Hono + x402 middleware) + Supabase + Anthropic API
**Build Board:** T-06 (part)

**What to build:** Paying 0.50 USDC over x402 gets a cited price check. Without payment the route answers 402. With payment it retrieves the agent's units, applies the expert's rules, asks Claude for an answer that only uses retrieved units, returns a signed outcome with citations and identity placeholders, settles to the expert's payout address, and records the order.

**Blocked by:** 03 (Spike: problem wallet pays x402), 05 (Knowledge units + hybrid search), 07 (Expert agent route: free evaluation)

**Status:** ready-for-agent

- [ ] Unpaid request → 402 with the 0.50 USDC `exact` requirement to the agent's payout address
- [ ] Paid request → SignedOutcome (protocol schema): text, citations `{unit_id, quote, as_of}`, agent_version, signature by the agent key
- [ ] Answer says "price check", never "appraisal" or "valuation"; personal details appear only as placeholders (ADR-012)
- [ ] Order row updated with answer, citations, tx hash and Terms hash (placeholder hash until ticket 19)
- [ ] Test with a scripted x402 client from the spike: Lozenets question → range + 5 cited comparables
