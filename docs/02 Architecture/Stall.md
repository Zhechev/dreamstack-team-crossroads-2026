---
type: component
updated: 2026-10-10
owner: Mitko
---
# Stall — hosted expert agent runtime

> The service Citable hosts to run every expert agent. Decision: [[ADR-007 Stall seller agent]]. Build flow: [[Expert Agent Lifecycle]].

## Parts
- **Hono server** with the official x402 middleware; one config per expert agent (sources, rules, prices, version, payout address).
- **Capabilities (demo):**
  - `POST /price-check` — tier 1, **0.50 USDC**, x402 `exact`; instant cited answer.
  - `POST /human-review` — tier 2, **20 USDC**, x402 `exact`; creates a review task for the expert, answer returned later.
  - Tier 3 consultation — shown on the marketplace, not built.
- **Retrieval:** hybrid search over `units` (base + expert layer) → [[ADR-008 Cited sources with as-of dates]].
- **Generation:** Claude via Anthropic SDK; claims only from retrieved units; expert rules in the prompt; output JSON with `citations[{unit_id, quote, as_of}]` and identity placeholders.
- **Citation check:** every citation verified against its unit before the payment settles (proposed, Q-6).
- **Signing:** outcomes signed with the agent's key.
- **Config:** one `.env` (keys, Supabase URL, RPC URL, LLM provider).

## Privacy
The knowledge base never leaves Citable; only answers do. The expert never receives buyer identity. A self-hosted Stall for experts who keep private data on their own server is a later tier.
