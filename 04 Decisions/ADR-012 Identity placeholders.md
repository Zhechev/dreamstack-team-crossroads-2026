---
type: adr
id: ADR-012
status: Accepted
updated: 2026-10-09
---
# ADR-012 Identity placeholders

## Context
Sellers must not receive buyer identity; a hosted connector must not store it either.

## Decision
Sellers return placeholders (`{{full_name}}`, `{{address}}`); the connector passes them through and instructs the assistant to fill them only in the final text. Full ID numbers are never requested.

## Consequences
Identity stays between the buyer and her assistant. Relies on the assistant following the instruction.

## Rejected
Server-side merge (we'd hold personal data).
