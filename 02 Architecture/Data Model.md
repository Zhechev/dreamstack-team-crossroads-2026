---
type: architecture
updated: 2026-10-09
owner: Mitko
---
# Data Model

> ⚠️ **Pre-pivot (KAT build) — re-plan pending, see [[Open Questions]] Q-14.** Current plan: [[Product]] · [[Demo Story]].

> Entities, order lifecycle, protocol messages and the judge algorithm.

## Entities
Seller · SellerAgent · Capability · Quote · EscrowQuote · Order · SignedOutcome · Receipt · Rating · Dispute · TermsVersion · Provision · ConnectorLink

## Order lifecycle
`quoted → paid | deposited → running → delivered → confirmed | disputed → settled | refunded → rated`

## Protocol messages (`packages/protocol`, zod)
- **Manifest:** seller agent id, key, endpoint, capabilities[{id, name, tags, price_model, price, cap}], terms_hash.
- **EscrowQuote:** order_id, capability_id, cap, seller, escrow_address, terms_hash, expires_at.
- **SignedOutcome:** order_id, text (with placeholders), citations[{provision_id, quote}], created_at, signature.
- **Receipt:** order_id, tx_hash, amount, fee, terms_hash.

## Provisions (corpus)
`provisions(id, act, article, paragraph, item, text, source_url, version_date, embedding vector(1536))` — FTS with `simple` config + `pg_trgm`, pgvector cosine.

## Judge
1. Verify the outcome signature matches the seller agent and order.
2. For every citation: `provision_id` exists and the normalised quote is contained in the provision text.
3. Any failure → ruling *refund*: call `DreamEscrow.refund(orderId)`, record a negative reputation event.
4. Optional LLM check "does the source support the claim?" is advisory only and cannot move money.

## Marketplace rules
- Reputation is per capability; only paying keys rate.
- Uptime counts toward reputation.
- Escrow timeout releases to the seller.
- Chaining (post-MVP): budgets flow downhill, depth ≤ 3, no buying from your own buyer.
