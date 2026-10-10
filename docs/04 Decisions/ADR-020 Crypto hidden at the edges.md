---
type: adr
id: ADR-020
status: Accepted
updated: 2026-10-10
---
# ADR-020 Crypto hidden at the edges

## Context
x402 always settles in USDC; most buyers and almost all experts will not hold crypto. A prepaid Citable balance would make us custodial (e-money licensing).

## Decision
**Hackathon:** plain crypto — MetaMask + USDC on Base Sepolia via x402 ([[ADR-001 Payments with x402 and USDC on Base|ADR-001]], [[ADR-011 Buyer wallet and spend permission|ADR-011]]); the code path exists and the theme rewards it.
**Pitch / next:** crypto hidden at the edges — buyers get an email sign-in wallet topped up by card or Apple Pay (e.g. Coinbase Onramp); experts are paid out in EUR via an offramp. x402 stays underneath, still non-custodial. Slide line: *"Top up by card, paid out in euros. Crypto runs underneath."* — **no provider named on the slide.** Q&A answer if asked "is that real?": *"Stripe already accepts x402 USDC on Base (preview, US businesses); in the EU we'd use an onramp."* ([[Fact Check 2026-10-10]])
**Revolut** appears only as *"a user can buy USDC there"* — withdrawal on Base is unconfirmed (Ethereum and Polygon are), so no Base or x402 claim.

## Consequences
Onramp ID check on first top-up; dependency on the onramp provider. Revolut and Stripe facts checked 2026-10-10 ([[Fact Check 2026-10-10]]).

## Rejected
Prepaid Citable balance (custodial; only after legal advice); Revolut as the payment rail.
