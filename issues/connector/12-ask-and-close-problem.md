# 12: ask + close_problem: automatic payment and response

**Owner:** Kris · **Built with:** Claude Code · **Runs on:** connector service + Base Sepolia + facilitator
**Build Board:** T-07 (part)

**What to build:** After the one approval, the buyer just reads the answer. `ask(agent_id, question)` pays the agent's 402 from the problem wallet by itself, never above the cap, and returns the cited answer into Claude. `close_problem()` sends the remainder back to the buyer's MetaMask and returns the full receipt.

**Blocked by:** 08 (Expert agent route: paid price check), 11 (approve_budget + budget_status)

**Status:** ready-for-agent

- [ ] `ask` pays via x402 from the problem wallet with no prompt; refuses if the price exceeds the remaining cap
- [ ] Answer reaches Claude with every figure's source and as-of date; placeholders passed through untouched, with an instruction to fill them only in the final text
- [ ] Each payment appears in the problem-state payments list with its tx hash
- [ ] `close_problem` refunds the remainder and returns a Receipt (protocol schema) per order
- [ ] Verified in Claude: question → evaluation → approval → automatic 0.50 payment → cited answer → close
