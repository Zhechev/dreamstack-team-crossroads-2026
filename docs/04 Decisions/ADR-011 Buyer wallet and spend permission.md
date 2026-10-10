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
**Top up once; then the agent pays by itself, question after question** (changed 2026-10-10 from "one approval per problem" — a page switch and MetaMask signature per question was too much friction).
- The buyer tops up a **budget** once, on the Citable setup page where they also get their Claude link (e.g. 5 USDC). Claude then pays agents from it inside the chat with no approval per question, never more than what's left. When it runs out, Claude sends a top-up link (the same signing page); `close_problem` returns the rest at any time.
- **Hackathon:** the top-up moves the amount into the buyer's **budget wallet** (a fresh Base Sepolia wallet, one open per buyer link; called "problem wallet" in code). It is **gasless for the buyer**: MetaMask signs an EIP-3009 `transferWithAuthorization` (amount → budget wallet, short validity) and the connector submits it and pays the gas, so the buyer needs only USDC, no ETH (Q-14, decided 2026-10-10). The connector pays every x402 call from it without asking; the limit is hard because the wallet holds nothing more. When the budget is closed, the remainder goes back to the buyer's MetaMask.
- **Production:** the same UX with a non-custodial spend permission granted once (allowance per period, e.g. 5 USDC a week), so the money stays in the buyer's wallet until each payment: Base Account spend permission or MetaMask ERC-7715 Advanced Permissions — both available on Base and Base Sepolia (checked 2026-10-10, [[Fact Check 2026-10-10]]).

## Consequences
Slide line: *"Top up once. Your AI pays per answer — never more than you put in — and the rest comes back."* — not "non-custodial" until the spend permission ships. One MetaMask signature per top-up, none per question or payment. On testnet we hold the open budget — an openly labelled exception to [[ADR-002 Thin non-custodial marketplace|ADR-002]]. Connector holds problem-wallet keys; caps stay small.

## Rejected
A plain USDC transfer for the approval (buyer would need Base Sepolia ETH too — a second faucet, and the spike showed it's easy to fund the wrong network); a MetaMask prompt per payment (too much friction); an approval page per question (still too much friction — replaced 2026-10-10); a Citable account balance topped up by card (custodial); ERC-7715 for the hackathon (unproven on Base Sepolia).
