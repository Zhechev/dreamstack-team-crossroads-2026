---
type: adr
id: ADR-002
status: Accepted
updated: 2026-10-10
---
# ADR-002 Thin non-custodial marketplace

## Context
Holding funds would make us a custodian. Self-hosted seller agents were a setup stopper, so we now host agents ([[ADR-003 Hosted expert agents and the real-estate demo|ADR-003]]) — which brings expert data and GDPR exposure inside.

## Decision
Citable owns discovery, reputation, judging, Terms **and hosts the expert agents and their sources**. Money still goes wallet → seller (or wallet → DreamEscrow); we never hold buyer funds and have no admin key over funds — **except on testnet**, where a problem wallet briefly holds the buyer's approved cap ([[ADR-011 Buyer wallet and spend permission|ADR-011]]). Only answers leave an agent — never its knowledge base.

## Consequences
We carry hosting cost and are processor for expert sources (Terms double as DPA). Buyer identity still never reaches the expert ([[ADR-012 Identity placeholders|ADR-012]]).

## Rejected
Custodial balances (see [[ADR-020 Crypto hidden at the edges|ADR-020]]); self-hosted agents by default.
