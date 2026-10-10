---
type: architecture
updated: 2026-10-10
owner: Mitko
---
# Data Model

> Entities, order lifecycle, protocol messages and the citation check.

## Entities
Expert · Agent · AgentVersion · Unit · TestCase · Capability (tier) · Quote · Order · SignedOutcome · Review · Receipt · Rating · TermsVersion · ConnectorLink

## Order lifecycle
- MVP (tier 1): `evaluated → awaiting_payment → paid (verified) → running → checked → settled → delivered` — failed check → not settled.
- Later (tier 2): `paid → review_pending → approved | edited → delivered`.

## Protocol messages (`packages/protocol`, zod)
- **Evaluation:** agent_id, can_answer, deliverable, price, expires_at.
- **Manifest:** agent id, version, key, capabilities[{id, tier, name, tags, price}], terms_hash.
- **SignedOutcome:** order_id, text (with placeholders), citations[{unit_id, quote, as_of}], agent_version, created_at, signature.
- **Review:** order_id, status, reviewer, final_text, reviewed_at.
- **Receipt:** order_id, tx_hash, amount, fee, terms_hash.

## Units (knowledge)
`units(id, agent_id, layer: base|expert, source, source_url, as_of, kind: passage|record, text, data jsonb, embedding vector(1536))` — FTS + `pg_trgm` + pgvector cosine. Demo: synthetic Lozenets deal records (labelled) + public base sources.

## Citation check
1. Verify the outcome signature matches the agent, version and order.
2. For every citation: `unit_id` exists, belongs to the agent, the normalised quote is contained in the unit, and `as_of` matches.
3. Any failure → don't settle and record a negative reputation event → [[ADR-009 Deterministic citation judge]].
4. Optional LLM "does the source support the claim?" is advisory only.

## Marketplace rules
Reputation is per capability; only paying keys rate. Only authorised versions are listed.
