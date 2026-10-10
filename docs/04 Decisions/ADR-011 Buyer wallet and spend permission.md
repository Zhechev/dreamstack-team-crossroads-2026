---
type: adr
id: ADR-011
status: Accepted
updated: 2026-10-10
---
# ADR-011 Buyer wallet and spend permission

## Context
A hosted connector cannot hold the buyer's key; holding keys would make us custodial.

## Decision
**One approval per problem, with a hard spend cap; then the agent pays by itself.**
- After the free evaluation, Claude proposes a cap for this problem (e.g. 2 USDC). The buyer approves it **once** in MetaMask on the marketplace page.
- **Hackathon:** the approval moves the cap into a **problem wallet** (a fresh Base Sepolia wallet for this problem). It is **gasless for the buyer**: MetaMask signs an EIP-3009 `transferWithAuthorization` (cap → problem wallet, short validity) and the connector submits it and pays the gas, so the buyer needs only USDC, no ETH (Q-14, decided 2026-10-10). The connector pays every x402 call from it without asking; the cap is hard because the wallet holds nothing more. When the problem closes, the remainder goes back to the buyer's MetaMask.
- **Production:** the same UX with a non-custodial spend permission scoped to the problem (allowance = cap, short expiry): Base Account spend permission or MetaMask ERC-7715 — verify before slides ([[Open Questions]] Q-13).

## Consequences
One MetaMask prompt per problem, none per payment. On testnet we briefly hold up to the cap — an openly labelled exception to [[ADR-002 Thin non-custodial marketplace|ADR-002]]. Connector holds problem-wallet keys; caps stay small.

## Rejected
A plain USDC transfer for the approval (buyer would need Base Sepolia ETH too — a second faucet, and the spike showed it's easy to fund the wrong network); a MetaMask prompt per payment (too much friction); one open-ended wallet per buyer (no per-problem cap); ERC-7715 for the hackathon (unproven on Base Sepolia).
