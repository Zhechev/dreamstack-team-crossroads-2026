---
type: component
updated: 2026-10-09
owner: Mitko
---
# Stall — seller agent

> ⚠️ **Pre-pivot (KAT build) — re-plan pending, see [[Open Questions]] Q-14.** Current plan: [[Product]] · [[Demo Story]].

> The service an expert runs on their own machine to sell capabilities. Decision: [[ADR-007 Stall seller agent]].

## Parts
- **Hono server** with the official x402 middleware; one route per capability.
- **Capabilities (demo):** `POST /assess-case` — 0.50 USDC fixed, x402 `exact`. `POST /draft-appeal` — cap 5.00, answers with an escrow quote, works only after the `Deposited` event for that orderId.
- **Retrieval:** hybrid search over the local `provisions` table → [[ADR-008 Cited sources with as-of dates]].
- **Generation:** Claude via Anthropic SDK; prompt allows claims only from retrieved provisions; output JSON with `citations[{provision_id, quote}]` and identity placeholders.
- **Signing:** outcomes signed with the seller agent key.
- **Registry client:** `register` on start, `heartbeat` every 60s.
- **Config:** one `.env` (keys, prices, Supabase URL, RPC URL, LLM provider).

## Corpus (demo)
Public texts only: ZDvP, APK, Insurance Code (mandatory civil liability), 5–10 public court decisions on KAT coercive measures. Split by article/paragraph/item, embedded, seeded by `corpus/` scripts.

## Privacy
Corpus never leaves the machine; only retrieved snippets go to the model. The seller never receives buyer identity.
