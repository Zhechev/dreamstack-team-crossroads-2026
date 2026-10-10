# 09: Citation check before settle

**Owner:** Mitko · **Built with:** Claude Code · **Runs on:** connector service
**Build Board:** T-06 (part) · **Cut order item 2**

**What to build:** A buyer never pays for an answer with an invented citation. Before the price check payment settles, every citation is checked deterministically (ADR-009). If any fails, the payment is not settled and the agent gets a negative reputation event.

**Blocked by:** 08 (Expert agent route: paid price check)

**Status:** ready-for-agent

- [ ] Check: signature matches agent, version and order; each unit exists and belongs to the agent; normalised quote is contained in the unit; as_of matches
- [ ] Pass → settle via the facilitator; fail → no settlement, order marked failed check, negative reputation event recorded
- [ ] Tests: valid outcome passes; a tampered quote, a foreign unit and a wrong as_of each fail
- [ ] Order exposes a "citations verified" flag the Lovable receipt can show
- [ ] If cut at Sun 09:00: run the check after settlement and show it as a badge only
