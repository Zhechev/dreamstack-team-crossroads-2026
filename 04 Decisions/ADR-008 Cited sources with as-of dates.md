---
type: adr
id: ADR-008
status: Accepted
updated: 2026-10-10
---
# ADR-008 Cited sources with as-of dates

## Context
Citations must be checkable by machine, and the value of expert knowledge is that it is fresh — a figure without a date can't be trusted.

## Decision
Every citable unit (a passage of a public source, or a record from the expert's data such as a deal price) is stored with its **source** and an **as-of date**, searched with Postgres full-text + pg_trgm + pgvector. Outputs cite the unit's id + exact quote/value + as-of date.

## Consequences
The citation proves both origin and freshness. Exact table shape is re-planned with the hosted agent (see [[Open Questions]]). Re-embedding needed if the embedding model changes.

## Rejected
Vector-only search; long-context prompts without an index; undated figures.
