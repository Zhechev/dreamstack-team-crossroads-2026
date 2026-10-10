---
type: adr
id: ADR-003
status: Accepted
updated: 2026-10-10
---
# ADR-003 Hosted expert agents and the real-estate demo

## Context
Asking an expert to run their own agent (Node, Postgres, keys, uptime) is a hard stopper — almost nobody will. The KAT legal demo was hard to defend: regulated advice, tiny market, public law that ChatGPT already knows, and the least likely seller to share know-how. Theme announced: **"AI That Does the Work"**.

## Decision
**We build and host the agent; the expert approves it.** Per category we prepare a base layer of public sources; the expert reviews sources, adds rules and optional private or fresh know-how, signs off test cases and authorises a version. The **moat** is the expert's fresh and private knowledge — public sources alone do not beat ChatGPT.
Launch and demo vertical: **real estate** (price checks for buyers, backed by agents' actual deal prices). Renovation quotes and used cars appear on the "any field" slide only. Demo expert is fictional and clearly labelled.

## Consequences
Seller onboarding becomes review work, not setup work. We carry curation per vertical, so verticals are added only when ~5 experts ask. Private know-how may stay on the expert's server later (self-hosted [[Stall]] as a premium tier). Product, demo, pitch, MVP scope and architecture follow this ADR.

## Rejected
Self-hosted agent as the default (setup stopper); KAT / legal vertical (regulated, weak "why not ChatGPT"); selling raw passages or reports (old reports don't sell, little money for sellers); market research, customs and marketing verticals.
