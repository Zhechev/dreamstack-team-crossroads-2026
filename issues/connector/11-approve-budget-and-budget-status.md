# 11: approve_budget + budget_status

**Owner:** Kris · **Built with:** Claude Code · **Runs on:** connector service + Base Sepolia
**Build Board:** T-07 (part)

**What to build:** Claude can open a budget for this problem. `approve_budget(cap)` creates a problem wallet, seeds it with a little test ETH, and returns a link to the Lovable approval page. Once the buyer sends the cap, `budget_status()` shows funded, spent and remaining. The approval page reads the same state.

**Blocked by:** 03 (Spike: problem wallet pays x402), 10 (MCP connector live in Claude)

**Status:** ready-for-agent

- [ ] `approve_budget(cap)` → problem wallet address + approval URL on the Lovable app (problem id in the URL)
- [ ] Problem-state endpoint (public, read-only, by problem id): wallet address, cap, funded yes/no, payments list. CORS allows the Lovable domain
- [ ] `budget_status()` reflects a funding transfer within a few seconds
- [ ] Problem wallet keys stored server-side only (testnet); the buyer's own key is never involved
- [ ] Verifiable before the Lovable page exists: send the cap manually from MetaMask, check `budget_status`

**Spike findings (ticket 03, GO):**
- Use a dedicated Base Sepolia RPC (Alchemy/QuickNode/CDP). `sepolia.base.org` is load-balanced and returns stale `latest` reads, so `budget_status` can show "not funded" after the transfer confirmed. For checks, read at a receipt's block number.
- Gas seed per problem wallet: 0.00001 ETH (~25× an ERC-20 transfer at ~0.006 gwei).
- Keep problem-wallet keys recoverable (the spike writes them to a gitignored file before funding).
