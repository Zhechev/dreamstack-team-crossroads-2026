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
**Stall** is a Node + Hono service with the official x402 middleware, **hosted by Citable** and serving every expert agent (one config per expert). Generation uses **Claude** (Anthropic SDK); embeddings use **OpenAI text-embedding-3-small**; the provider is configurable. A self-hosted Stall for experts who keep private data on their own server is a later premium tier.

## Consequences
Experts install nothing. We hold expert sources and pay for generation — Anthropic credits ($50/person) cover the hackathon. The privacy claim changes: knowledge is hosted by us; only answers leave, never the knowledge base.

## Rejected
Self-hosted by default (setup stopper); local model for the demo.
