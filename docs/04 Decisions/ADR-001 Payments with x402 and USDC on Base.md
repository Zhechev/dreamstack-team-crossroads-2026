---
type: adr
id: ADR-001
status: Accepted
updated: 2026-10-09
---
# ADR-001 Payments with x402 and USDC on Base

## Context
Agents must pay per request without accounts, cards or API keys.

## Decision
Payments use the open **x402** protocol with **USDC on Base Sepolia** for the hackathon, settled through the **x402.org testnet facilitator**.

## Consequences
Free testnet, agent-native; mainnet later needs a legal opinion on the escrow contract. Switching facilitator is configuration.

## Rejected
Card rails (need accounts); Cloudflare's gateway (closed beta); running our own facilitator (extra demo risk).
