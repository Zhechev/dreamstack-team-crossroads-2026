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
**Hackathon only** (pitch path: [[ADR-020 Crypto hidden at the edges|ADR-020]]). Buyers bring their own **MetaMask** and grant an **ERC-7715 periodic USDC permission** (e.g. 20/day, 30 days, revocable) to the connector's session key. Real users top up via MetaMask Buy on Base; demo wallets are funded from faucets.

## Consequences
Whether the spend-permission spike is still worth doing is open. Spike T-12 would confirm Base Sepolia support, x402 redemption and escrow funding. Fallback: pre-funded demo wallet labelled 'demo custody'. Email wallets are roadmap — they remove the extension and seed phrase, not the card ID check.

## Rejected
Custodial wallets; email wallet this weekend.
