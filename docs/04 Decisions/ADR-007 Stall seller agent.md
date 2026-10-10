---
type: adr
id: ADR-007
status: Accepted
updated: 2026-10-10
---
# ADR-007 Stall seller agent

## Context
Per [[ADR-003 Hosted expert agents and the real-estate demo|ADR-003]] we build and host each expert's agent; it must quote, get paid, retrieve, answer with citations and sign.

## Decision
**Stall** is the set of paywalled expert agent routes (`/agents/:id/...`, official x402 middleware), **hosted by Citable** and serving every expert agent (one config per expert). For the hackathon they live **in the same Node + Hono service as the [[Buyer Connector]]** (one deploy, next to `/mcp`), not a separate service. The connector still pays them over **real x402** through the facilitator — no internal shortcut — so the payment path is the same one an outside agent would use. Generation uses **Claude** (Anthropic SDK); embeddings use **OpenAI text-embedding-3-small**; the provider is configurable. A self-hosted Stall for experts who keep private data on their own server is a later premium tier.

## Consequences
Experts install nothing. One service to deploy and monitor; the agent routes can be split out later without changing their URLs' shape. We hold expert sources and pay for generation — Anthropic credits ($50/person) cover the hackathon. The privacy claim changes: knowledge is hosted by us; only answers leave, never the knowledge base.

## Rejected
Self-hosted by default (setup stopper); local model for the demo; a separate Stall service for the hackathon (a second deploy for no demo gain).
