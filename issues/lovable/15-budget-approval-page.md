# 15: Budget top-up page (MetaMask)

**Owner:** Kris · **Built with:** Lovable · **Runs on:** Lovable app + MetaMask (Base Sepolia) + connector problem-state endpoint
**Build Board:** T-08 (part, build first)

**Changed 2026-10-10 (ADR-011, top up once):** this page is now the **top-up** page — used by the setup page (ticket 16) for the first top-up and by Claude's `approve_budget` link when the budget runs low. The page itself is unchanged.

**What to build:** The link Claude gives the buyer opens this page. The buyer connects MetaMask on Base Sepolia, sees the cap (e.g. 2.00 USDC) and the problem wallet, **signs one gasless USDC authorisation** (no ETH needed; the connector submits it), and then watches a live list of the agent's automatic payments.

**Blocked by:** 11 (approve_budget + budget_status), 13 (Lovable project setup + landing page)

**Status:** in progress — prompt sent to Lovable 2026-10-10

- [ ] Page reads the problem id from the URL and loads wallet address, cap and status from the connector problem-state endpoint
- [ ] Connect MetaMask; prompt to switch to Base Sepolia if on another network
- [ ] One button asks MetaMask to sign the EIP-3009 typed data from the problem-state endpoint (`eth_signTypedData_v4`), posts the signature to `{CONNECTOR_URL}/problems/:id/fund`, and shows the returned tx hash with a BaseScan link
- [ ] After funding: "You can go back to Claude", plus a live list (polling) of payments with amounts and tx hashes
- [ ] Copy says the agent can never spend more than the cap and the rest comes back
- [ ] Works for a buyer with USDC and **zero** ETH

**Starter prompt** (corrected 2026-10-10 to the connector's real response; `CONNECTOR_URL` lives in Lovable's settings file — the current tunnel until the connector is hosted):
> Add a page at /approve/:problemId (the link Claude gives the buyer).
>
> Data: GET {CONNECTOR_URL}/problems/:problemId (CONNECTOR_URL from the settings file). The response is JSON:
> `{ problem_id, wallet_address, cap, status, funded, buyer_address, funding_tx, spent, remaining, payments: [{ amount, tx_hash, order_id, created_at }], authorization: { domain, types, primaryType, message } }` — `authorization` only while not funded.
>
> Page:
> 1. Paper-slip card: "Budget for this question: {cap} USDC. The agent pays by itself and can never spend more. The rest comes back to you." Show wallet_address small in JetBrains Mono.
> 2. "Connect MetaMask" (wagmi + viem, Base Sepolia, chain id 84532). If on another network, offer to switch.
> 3. Full-width "Approve {cap} USDC" button. On click: take authorization, set message.from to the connected address, convert message.value, message.validAfter and message.validBefore to BigInt, and sign with viem/wagmi signTypedData (domain, types, primaryType, message). Then POST JSON { from, signature, validAfter, validBefore, nonce } (validAfter/validBefore as the original strings, nonce from message.nonce) to {CONNECTOR_URL}/problems/:problemId/fund.
> 4. The response is { tx_hash, state }. Show tx_hash in JetBrains Mono with a link to https://sepolia.basescan.org/tx/{tx_hash}. On an error response show its "error" text.
> 5. No ETH is needed: never ask the user for gas, and no ERC-20 transfer.
> 6. When funded is true: "Done — go back to Claude", plus spent / remaining and a live list of payments (amount + tx_hash link), polling the GET every 3 seconds.
>
> Do not create or change any Supabase tables; this page only talks to CONNECTOR_URL.

**Test:** open `/approve/<problem_id>` for a budget from `approve_budget`, connect the buyer's MetaMask, sign (a signature request, no gas), see the funding tx; `budget_status` in Claude then shows funded.

**Spike findings (ticket 03, GO):** a plain USDC transfer costs the buyer gas, so the buyer needs Base Sepolia ETH as well as USDC — this blocked the first spike run (the faucet had sent ETH to Ethereum Sepolia). **Decided (Q-14, ADR-011):** gasless — the buyer signs an EIP-3009 `transferWithAuthorization` and the connector submits it.
