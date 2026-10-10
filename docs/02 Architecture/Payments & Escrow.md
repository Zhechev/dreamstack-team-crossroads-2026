---
type: component
updated: 2026-10-10
owner: Kris
---
# Payments & Escrow

> How money moves. Decisions: [[ADR-001 Payments with x402 and USDC on Base]] · [[ADR-011 Buyer wallet and spend permission]] · [[ADR-020 Crypto hidden at the edges]] · [[ADR-013 Escrow for drafts]] (deferred).

## MVP payment flow — one approval per problem, hard cap, then automatic
1. After the free evaluation, Claude calls `approve_budget(cap)` → connector creates a **problem wallet** on Base Sepolia → returns a link.
2. Buyer opens the marketplace page → MetaMask → **one** USDC transfer of the cap (e.g. 2.00) to the problem wallet.
3. From then on the connector pays every x402 call (`exact`, gasless USDC authorisation) from the problem wallet — no prompts. It can never spend more than the cap.
4. Stall answers, runs the citation check, settles via the facilitator only if it passes.
5. `close_problem` → remainder returned to the buyer's MetaMask; receipt lists every payment with tx hashes.

**Gas:** x402 payments are gasless, but the remainder refund is a normal transfer — the connector seeds each problem wallet with 0.00001 Base Sepolia ETH (~25× one ERC-20 transfer). The buyer's approval, if a plain USDC transfer, also costs the buyer gas → [[Open Questions]] Q-14.

**Spike findings (ticket 03):**
- Settle after check = the agent route returns 4xx when the check fails; `@x402/hono` then never settles. No custom hook.
- Use a dedicated Base Sepolia RPC: `sepolia.base.org` returns stale reads right after a tx. Read balances at a receipt's block.
- Faucets: USDC from faucet.circle.com; ETH must be on **Base** Sepolia (easy to get Ethereum Sepolia by mistake).
- Versions: `@x402/*` 2.28.0, viem 2.57.4. Full note and tx links in `issues/base-x402/03-…`.

**Spike T-09 (ticket 03): GO on 2026-10-10** — confirmed x402 client (`@x402/fetch` + viem account) pays from the problem wallet on Base Sepolia, and the middleware lets us settle after the check.
Production: same UX with a spend permission scoped to the problem → [[ADR-011 Buyer wallet and spend permission]].

## Tiers
| | Tier 1 price check | Tier 2 human review | Tier 3 consultation |
|---|---|---|---|
| Price | 0.50 | 20.00 | 50+ |
| MVP | **live** | shown | shown |

## Escrow
Not in the MVP. DreamEscrow is deferred (ADR-013).

## Wallets
- **Buyer:** their own MetaMask on Base Sepolia, funded from the Circle faucet (20 USDC per address per 2h) plus a little Base Sepolia ETH unless Q-14 goes gasless. One approval per problem.
- **Problem wallet:** fresh per problem, holds only the cap, pays x402 automatically, returns the remainder.
- **Next:** email sign-in wallet, card top-up, EUR payout to experts → [[ADR-020 Crypto hidden at the edges]].
