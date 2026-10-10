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
**Pitch / next:** crypto hidden at the edges — buyers get an email sign-in wallet topped up by card or Apple Pay (e.g. Coinbase Onramp); experts are paid out in EUR via an offramp. x402 stays underneath, still non-custodial. Slide line: *"Top up by card, paid out in euros. Crypto runs underneath."*
**Revolut** is only a manual funding source (buy USDC, send to wallet) — not a rail under x402 and not an integration.

## Consequences
Onramp ID check on first top-up; dependency on the onramp provider. Any Revolut or Stripe-x402 claim must be verified before it goes on a slide.

## Rejected
Prepaid Citable balance (custodial; only after legal advice); Revolut as the payment rail.
