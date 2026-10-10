# 15: Budget approval page (MetaMask)

**Owner:** Kris · **Built with:** Lovable · **Runs on:** Lovable app + MetaMask (Base Sepolia) + connector problem-state endpoint
**Build Board:** T-08 (part, build first)

**What to build:** The link Claude gives the buyer opens this page. The buyer connects MetaMask on Base Sepolia, sees the cap (e.g. 2.00 USDC) and the problem wallet, **signs one gasless USDC authorisation** (no ETH needed; the connector submits it), and then watches a live list of the agent's automatic payments.

**Blocked by:** 11 (approve_budget + budget_status), 13 (Lovable project setup + landing page)

**Status:** ready-for-agent

- [ ] Page reads the problem id from the URL and loads wallet address, cap and status from the connector problem-state endpoint
- [ ] Connect MetaMask; prompt to switch to Base Sepolia if on another network
- [ ] One button asks MetaMask to sign the EIP-3009 typed data from the problem-state endpoint (`eth_signTypedData_v4`), posts the signature to `{CONNECTOR_URL}/problems/:id/fund`, and shows the returned tx hash with a BaseScan link
- [ ] After funding: "You can go back to Claude", plus a live list (polling) of payments with amounts and tx hashes
- [ ] Copy says the agent can never spend more than the cap and the rest comes back
- [ ] Works for a buyer with USDC and **zero** ETH

**Starter prompt:**
> Add a page at /approve/:problemId. Fetch {walletAddress, cap, funded, payments[]} from {CONNECTOR_URL}/problems/:problemId. Show a paper-slip card: "Budget for this question: {cap} USDC. The agent pays by itself and can never spend more. The rest comes back to you." Add "Connect MetaMask" (wagmi + viem, Base Sepolia, chain id 84532); if on the wrong network, offer to switch. The problem response also has `authorization` (EIP-712 typed data: domain, types, primaryType "TransferWithAuthorization", message). Then a full-width "Approve {cap} USDC" button that asks MetaMask to sign that typed data with signTypedData (set message.from to the connected address first), then POSTs {from, signature, validAfter, validBefore, nonce} to {CONNECTOR_URL}/problems/:problemId/fund and shows the returned txHash. No ETH is needed — never ask the user for gas. Show the tx hash in JetBrains Mono with a BaseScan link. After funding, show "Done, go back to Claude" and a live list of payments polled every 3 seconds. Do not create or change any Supabase tables.

**Spike findings (ticket 03, GO):** a plain USDC transfer costs the buyer gas, so the buyer needs Base Sepolia ETH as well as USDC — this blocked the first spike run (the faucet had sent ETH to Ethereum Sepolia). **Decided (Q-14, ADR-011):** gasless — the buyer signs an EIP-3009 `transferWithAuthorization` and the connector submits it.
