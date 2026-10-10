# 11: approve_budget + budget_status

**Owner:** Kris · **Built with:** Claude Code · **Runs on:** connector service + Base Sepolia
**Build Board:** T-07 (part)

**What to build:** Claude can open a budget for this problem. `approve_budget(cap)` creates a problem wallet, seeds it with a little test ETH, and returns a link to the Lovable approval page. Once the buyer sends the cap, `budget_status()` shows funded, spent and remaining. The approval page reads the same state.

**Blocked by:** 03 (Spike: problem wallet pays x402), 10 (MCP connector live in Claude)

**Status:** done

- [x] `approve_budget(cap)` → problem wallet address + approval URL on the Lovable app (problem id in the URL)
- [x] Problem-state endpoint (public, read-only, by problem id): wallet address, cap, funded yes/no, payments list. CORS allows the Lovable domain
- [x] `budget_status()` reflects a funding transfer within a few seconds
- [x] Problem wallet keys stored server-side only (testnet); the buyer's own key is never involved
- [x] Gasless funding (ADR-011): problem-state includes the EIP-3009 typed data to sign (USDC domain, `from` = buyer, `to` = problem wallet, `value` = cap, `validBefore` ≈ 15 min, random `nonce`); `POST /problems/:id/fund {from, signature, validAfter, validBefore, nonce}` submits `transferWithAuthorization` from the gas funder wallet (`GAS_FUNDER_PRIVATE_KEY`) and returns the tx hash. Rejects a `value` ≠ cap or a `to` ≠ the problem wallet
- [x] Verifiable before the Lovable page exists: sign the authorisation with a script (or send the cap manually from MetaMask), check `budget_status`

**Spike findings (ticket 03, GO):**
- Use a dedicated Base Sepolia RPC (Alchemy/QuickNode/CDP). `sepolia.base.org` is load-balanced and returns stale `latest` reads, so `budget_status` can show "not funded" after the transfer confirmed. For checks, read at a receipt's block number.
- Gas seed per problem wallet: 0.00001 ETH (~25× an ERC-20 transfer at ~0.006 gwei).
- Keep problem-wallet keys recoverable (the spike writes them to a gitignored file before funding).

**Implementation (ticket 11):** `apps/connector/src/problems/` — `wallet.ts` (keys AES-256-GCM encrypted with `PROBLEM_WALLET_SECRET`), `authorization.ts` (EIP-3009 typed data; the server rebuilds `to` and `value`, so any other recipient or amount fails verification), `chain.ts` (submit from the gas funder, gas seed), `store.ts` (migration `20261010150000_problems.sql`: `problems`, `problem_payments`, service role only), `service.ts`. Max cap 20.00 USDC. A cap sent by plain transfer also counts as funded on the next status read. Gas is seeded when the budget is funded, not when it's opened, so abandoned budgets cost nothing.
**On-chain check (2026-10-10):** our typed data (domain `USDC` / `2`) signed, verified and submitted via `transferWithAuthorization` on Base Sepolia USDC — [0x9baafe…](https://sepolia.basescan.org/tx/0x9baafe102dc7008027f0709d4dba41b57f5d9da02e0b280b2444417d679421ce).
**Live test (2026-10-10):** in Claude web, `approve_budget("1.00")` → funded with `fund-problem` (gasless, [0xf47b6e…](https://sepolia.basescan.org/tx/0xf47b6ed928a261baf5b74b4673bd1ecfe1c84cc859d8a49f3d1342fb3ff8f925)) → `budget_status` showed funded, 1.00 remaining. Claude also warned the buyer about the placeholder approval domain — real Lovable URL needed (ticket 15).
