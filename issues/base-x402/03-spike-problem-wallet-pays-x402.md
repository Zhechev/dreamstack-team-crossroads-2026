# 03: Spike: problem wallet pays x402 on Base Sepolia

**Owner:** Kris · **Built with:** Claude Code · **Runs on:** Node script + Base Sepolia + x402.org facilitator
**Build Board:** T-09, T-10 · **Go/no-go:** Sat 14:00

**What to build:** Proof that the payment model in ADR-011 works before anything depends on it. A buyer MetaMask wallet funded from the Circle faucet sends a 2.00 USDC cap to a freshly created problem wallet; the problem wallet pays a dummy 0.50 paywalled Hono route via `@x402/fetch` with no prompt; the route settles only after a check hook passes; the remainder goes back to the buyer.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Two demo MetaMask wallets funded with faucet USDC on Base Sepolia (T-10)
- [ ] Script creates a problem wallet and seeds it with a little Base Sepolia ETH for the refund transfer
- [ ] Problem wallet pays the 0.50 route via x402 `exact`; the tx hash is visible on BaseScan
- [ ] A failing check hook means the payment is **not** settled (proves settle-after-check is possible with the middleware)
- [ ] Remainder refund to the buyer wallet succeeds
- [ ] Short result note: go / no-go, the exact package versions used, any gotchas. If no-go, the fallback goes into Open Questions
