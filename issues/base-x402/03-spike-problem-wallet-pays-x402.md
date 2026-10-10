# 03: Spike: problem wallet pays x402 on Base Sepolia

**Owner:** Kris · **Built with:** Claude Code · **Runs on:** Node script + Base Sepolia + x402.org facilitator
**Build Board:** T-09, T-10 · **Go/no-go:** Sat 14:00

**What to build:** Proof that the payment model in ADR-011 works before anything depends on it. A buyer MetaMask wallet funded from the Circle faucet sends a 2.00 USDC cap to a freshly created problem wallet; the problem wallet pays a dummy 0.50 paywalled Hono route via `@x402/fetch` with no prompt; the route settles only after a check hook passes; the remainder goes back to the buyer.

**Blocked by:** None (can start immediately)

**Status:** done — GO (2026-10-10)

- [x] Two demo MetaMask wallets funded with faucet USDC on Base Sepolia (T-10)
- [x] Script creates a problem wallet and seeds it with a little Base Sepolia ETH for the refund transfer
- [x] Problem wallet pays the 0.50 route via x402 `exact`; the tx hash is visible on BaseScan
- [x] A failing check hook means the payment is **not** settled (proves settle-after-check is possible with the middleware)
- [x] Remainder refund to the buyer wallet succeeds
- [x] Short result note: go / no-go, the exact package versions used, any gotchas. If no-go, the fallback goes into Open Questions

## Result — GO (2026-10-10)

Code: `spikes/03-x402-problem-wallet/` (`npm run spike`). Run on Base Sepolia:

| Step | Tx |
|---|---|
| Buyer → problem wallet, 2.00 USDC cap | [0x9e59e4…](https://sepolia.basescan.org/tx/0x9e59e44ece75ad563651d736b31bdaa3bc9d31a707efa9b7e39d6c8c260aa8db) |
| Gas seed 0.00001 ETH | [0xb556ff…](https://sepolia.basescan.org/tx/0xb556ff5956903eca95283c9acd368d25bd4c2ce6f9a1d38070d61260d5fe93aa) |
| Failing check → 422, **not settled** (seller +0.00) | — |
| Passing check → 200, settled 0.50 via x402 `exact` | [0xd59725…](https://sepolia.basescan.org/tx/0xd5972506885dbbdbfd8d9c130cba1299bed41a8e2fef97ffe1fa3e04d53636b0) |
| Remainder 1.50 → buyer | [0x2f0c42…](https://sepolia.basescan.org/tx/0x2f0c4233243b5e1ca8edc17f38ccc6cba880d7e2da5fd1a4ae1da28c7c5aa450) |

**Versions:** `@x402/core`, `@x402/evm`, `@x402/fetch`, `@x402/hono` 2.28.0 · viem 2.57.4 · hono 4.13.13 · `@hono/node-server` 2.1.4 · Node 24 · facilitator `https://x402.org/facilitator`.

**Gotchas**
- **Settle after check needs no hook:** `@x402/hono` verifies the payment before the handler and settles only when the handler returns < 400. Return 4xx when the citation check fails and the buyer is never charged (tickets 08/09).
- **The buyer needs Base Sepolia ETH too**, not just USDC: the one MetaMask approval is a normal USDC transfer and costs gas. Faucets easily send ETH to Ethereum Sepolia by mistake — check the network. For ticket 15, consider having the buyer sign an EIP-3009 `transferWithAuthorization` that the connector submits, so the buyer needs no ETH at all.
- **The public RPC (`sepolia.base.org`) is load-balanced and returns stale `latest` reads**, so balance checks right after a tx can be wrong. Read at the receipt's block number (as the spike does) or use a dedicated RPC for the connector.
- **Gas seed:** an ERC-20 transfer costs ~0.0000004 ETH at ~0.006 gwei; 0.00001 ETH per problem wallet is ~25× headroom. Leftover ETH stays in the problem wallet as dust.
- v2 returns the settlement in the `PAYMENT-RESPONSE` header (`decodePaymentResponseHeader` from `@x402/fetch`).
- In the spike the buyer's transfer is signed from a key in `.env`; in the product it's the MetaMask approval page (ticket 15).
