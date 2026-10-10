# 15: Budget approval page (MetaMask)

**Owner:** Kris · **Built with:** Lovable · **Runs on:** Lovable app + MetaMask (Base Sepolia) + connector problem-state endpoint
**Build Board:** T-08 (part, build first)

**What to build:** The link Claude gives the buyer opens this page. The buyer connects MetaMask on Base Sepolia, sees the cap (e.g. 2.00 USDC) and the problem wallet, approves **one** USDC transfer, and then watches a live list of the agent's automatic payments.

**Blocked by:** 11 (approve_budget + budget_status), 13 (Lovable project setup + landing page)

**Status:** ready-for-agent

- [ ] Page reads the problem id from the URL and loads wallet address, cap and status from the connector problem-state endpoint
- [ ] Connect MetaMask; prompt to switch to Base Sepolia if on another network
- [ ] One button sends exactly the cap in USDC to the problem wallet; shows the tx hash with a BaseScan link
- [ ] After funding: "You can go back to Claude", plus a live list (polling) of payments with amounts and tx hashes
- [ ] Copy says the agent can never spend more than the cap and the rest comes back

**Starter prompt:**
> Add a page at /approve/:problemId. Fetch {walletAddress, cap, funded, payments[]} from {CONNECTOR_URL}/problems/:problemId. Show a paper-slip card: "Budget for this question: {cap} USDC. The agent pays by itself and can never spend more. The rest comes back to you." Add "Connect MetaMask" (wagmi + viem, Base Sepolia, chain id 84532); if on the wrong network, offer to switch. Then a full-width "Approve {cap} USDC" button that sends an ERC-20 transfer of exactly {cap} USDC (contract {USDC_ADDRESS}, 6 decimals) to walletAddress. Show the tx hash in JetBrains Mono with a BaseScan link. After funding, show "Done, go back to Claude" and a live list of payments polled every 3 seconds. Do not create or change any Supabase tables.
