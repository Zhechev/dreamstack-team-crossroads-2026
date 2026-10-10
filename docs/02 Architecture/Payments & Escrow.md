---
type: component
updated: 2026-10-10
owner: Kris
---
# Payments & Escrow

> How money moves. Decisions: [[ADR-001 Payments with x402 and USDC on Base]] · [[ADR-011 Buyer wallet and spend permission]] · [[ADR-020 Crypto hidden at the edges]] · [[ADR-013 Escrow for drafts]] (deferred).

## MVP payment flow — top up once, then automatic (ADR-011)
1. **Setup (once):** on the Citable setup page the buyer connects MetaMask, gets their Claude link and tops up a budget (e.g. 5 USDC): the connector opens a **budget wallet** (`POST /problems` with the connector token) and the buyer signs **one** EIP-3009 `transferWithAuthorization` of that amount. The connector submits it and pays the gas — the buyer needs no ETH.
2. **Every question, all in the chat:** `find_expert` → `evaluate` (free) → `budget_status` → `ask`: the connector pays the x402 call (`exact`) from the budget wallet — no prompts, never more than what's left.
3. The agent route answers, runs the citation check, and settles via the facilitator only if it passes.
4. **Running low:** Claude calls `close_problem` (rest returned) and `approve_budget` → a top-up link (the same signing page).
5. **Withdraw any time:** `close_problem` → remainder to the buyer's MetaMask; receipt lists every payment with tx hashes.

**Gas:** x402 payments are gasless, but the remainder refund is a normal transfer — the connector seeds each problem wallet with 0.00001 Base Sepolia ETH (~25× one ERC-20 transfer). The buyer's approval is gasless: the connector submits the signed authorisation from its gas funder wallet (ADR-011, Q-14 decided). Same USDC function the x402 `exact` scheme uses, already proven on Base Sepolia USDC by the spike.

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
None. [[ADR-013 Escrow for drafts|ADR-013]] is superseded:
- **Tier 1** settles only after the citation check (4xx → never settled).
- **Tier 2 (roadmap)** settles **on delivery**: the buyer signs a gasless EIP-3009 authorisation (~24 h validity); the connector submits it only when the expert's review arrives. A slower review needs a fresh signature.

## Fee
Two transfers per order: expert's share over x402 + Citable's fee as a separate transfer from the same budget (30% tier 1, 10% tiers 2–3 → [[ADR-016 Take rate on settled orders|ADR-016]]). **MVP:** shown on the receipt as waived, not collected.

## Wallets
- **Buyer:** their own MetaMask on Base Sepolia, funded from the Circle faucet (20 USDC per address per 2h) — **USDC only, no ETH needed**. One signature per top-up.
- **Budget wallet** ("problem wallet" in code): one open per buyer link, holds only what was topped up, pays x402 automatically across questions, returns the remainder on close.
- **Next:** email sign-in wallet, card top-up, EUR payout to experts → [[ADR-020 Crypto hidden at the edges]].
