---
type: architecture
updated: 2026-10-10
owner: Mitko
---
# Expert Agent Lifecycle

> How an expert agent is built, verified, sold and kept fresh — Mitko's flow. Decisions: [[ADR-003 Hosted expert agents and the real-estate demo]] · [[ADR-019 Three-tier expert funnel]].

**Principle:** we build and maintain the agent infrastructure; the expert provides authority, domain judgment and optional private know-how.

## 1. Base knowledge — built by us
Per category we collect, normalise, structure and index the public, trusted sources (real estate: public statistics, regulations, official guidance). Every unit is stored with source and as-of date → [[ADR-008 Cited sources with as-of dates]].

## 2. Expert layer — added or approved by the expert
The expert does not build the agent. We hand them a prepared version and they:
- review the sources and approve the scope
- add preferred sources
- define important rules (e.g. "adjust for floor and parking", "ignore deals older than 6 months")
- review test cases and authorise the version

Optional private know-how: their actual deal prices, templates, internal checklists, methodology. Later it may stay on the expert's own server (self-hosted [[Stall]], premium tier).

## 3. Agent creation
`agent = base knowledge + expert-approved sources + expert rules + LLM + retrieval` — no model retraining; the agent retrieves at answer time.

## 4. Validation
`test questions → agent answers → expert reviews important failures → rules/sources adjusted → expert authorises version N` → badge **Expert Verified (vN)**. The badge covers sources and rules of the version, never a single answer.

## 5. Live usage
`assistant → finds the agent → pays via x402 → sends the task → agent retrieves → applies expert rules → returns the result with citations`. The knowledge base is never exposed; only the result leaves.
Tiers: automated answer (~0.50) → human review (~20, expert approves or edits) → consultation (50+).

## 6. Updates
`new source detected → knowledge updated → tests re-run → expert reviews only significant changes → new version authorised`. Ongoing expert work stays minimal.

## Hackathon cut
Fake it till we make it: demo experts and agents are seeded, labelled and already *Expert Verified*; steps 1–4 and 6 are shown, not run. Step 5 is live for tier 1, with a free **evaluation** before payment ([[MVP Scope]]).
