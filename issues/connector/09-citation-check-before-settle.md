# 09: Citation check before settle

**Owner:** Mitko · **Built with:** Claude Code · **Runs on:** connector service
**Build Board:** T-06 (part) · **Cut order item 2**

**What to build:** A buyer never pays for an answer with an invented citation. Before the price check payment settles, every citation is checked deterministically (ADR-009). If any fails, the payment is not settled and the agent gets a negative reputation event.

**Blocked by:** 08 (Expert agent route: paid price check)

**Status:** done

- [x] Check: signature matches agent, version and order; each unit exists and belongs to the agent; normalised quote is contained in the unit; as_of matches
- [x] Pass → settle via the facilitator; fail → no settlement, order marked failed check, negative reputation event recorded
- [x] Tests: valid outcome passes; a tampered quote, a foreign unit and a wrong as_of each fail
- [x] Order exposes a "citations verified" flag the Lovable receipt can show
- [ ] If cut at Sun 09:00: run the check after settlement and show it as a badge only

**Spike findings (ticket 03, GO):** no settle hook needed. `@x402/hono` verifies the payment before the handler and settles only when the handler returns < 400 — so run the check in the handler and return 422 on failure; the buyer is never charged. Proven on Base Sepolia: a failing check left the seller at +0.00.

**Notes:**
- **Where:** the check is `agents/citationCheck.ts`, deterministic with no LLM, run in the price-check handler before the response. A failure returns `422 {error: "citation_check_failed", failures}`, so `@x402/hono` never settles.
- **What it checks:** the EIP-191 signature against the agent's `signing_address`, the authorised version, and this order. Then, per citation: the unit exists, belongs to the agent, contains the quote after normalisation (case, spacing, dash and quote styles, thousands separators, NFKC), and has the same `as_of`.
- **On failure:** the order becomes `failed_check` with `citations_verified = false`, and a `reputation_events` row is written (`citation_check_failed`, −1, the failures). On a pass: `checked` then `delivered` with `citations_verified = true`. `get_order` returns the flag for the receipt (checked live).
- **Not needed:** the cut-line fallback (check after settlement, badge only).
- **Tests:** 10 for the check (valid passes; tampered quote, foreign unit, wrong as_of, missing unit, edited text, other key, order or version each fail), 2 route tests (invented citation not settled), 1 `test:db` (failed_check + reputation event).
