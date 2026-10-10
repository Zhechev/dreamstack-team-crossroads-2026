---
type: plan
updated: 2026-10-10
---
# MVP Scope

> What the demo must show, and what we cut first if late. Decision: [[ADR-017 MVP scope and event fit]].

## The demo must show, end to end
**Question → evaluation → one approval → automatic payment → response**, from Claude chat, with a MetaMask testnet wallet.

## In
1. **Claude chat as the client** — hosted [[Buyer Connector]] added via private link.
2. **Marketplace demo (Lovable + Supabase)** — landing, browse expert agents (tiers, prices, Expert Verified badge, rating), **budget approval page**, receipt view.
3. **Faked verified data and experts ("fake it till you make it")** — seeded, clearly labelled demo experts and agents, already marked *Expert Verified*; synthetic Lozenets deal data + public statistics. No real onboarding or eval run.
4. **Evaluation (free)** — the agent checks the question, says what it will deliver (e.g. price range + 5 comparable sales, last 90 days) and quotes the price.
5. **Payment** — buyer approves a hard cap **once per problem** in MetaMask (USDC to a problem wallet); the agent then pays x402 by itself; remainder returned → [[ADR-011 Buyer wallet and spend permission]].
6. **Response** — hosted [[Stall]] answers with citations (source + as-of date), checked before the payment settles; Claude fetches and shows it.

## Shown, not built (marketplace UI or slides)
Tier 2 human review · tier 3 consultation · expert console (version authorise, review queue) · eval runs and source updates ([[Expert Agent Lifecycle]]) · card top-up and EUR payouts.

## Out
DreamEscrow · ERC-7715 / Base Account spend permission (production path) · self-hosted Stall · ChatGPT · second vertical.

## Cut order if late (hard cut-off Sun 09:00)
1. Order/receipt view → tx link to BaseScan only.
2. Citation check before settle → check after, shown as a badge.
3. Browse page → one agent page.
