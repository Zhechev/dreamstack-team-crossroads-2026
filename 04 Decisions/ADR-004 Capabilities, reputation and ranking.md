---
type: adr
id: ADR-004
status: Accepted
updated: 2026-10-09
---
# ADR-004 Capabilities, reputation and ranking

## Context
Sources mixed seller, provider, expert and agent; a good drafter can be a poor reviewer.

## Decision
The **capability** is what is listed, priced and rated. Ratings are valid only when signed by the paying key over the order's tx hash. MVP ranking: online, within budget, sorted by rating; design formula `bayes_rating × uptime_7d × (1 + 0.2·badge)`; the connector returns the top 3 and Claude picks.

## Consequences
Schema `sellers 1─n seller_agents 1─n capabilities`. Fake ratings cost real fees. New capabilities start cold.

## Rejected
Rating whole agents; rating people.
