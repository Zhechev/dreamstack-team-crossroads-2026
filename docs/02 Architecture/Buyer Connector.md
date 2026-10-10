---
type: component
updated: 2026-10-10
owner: Kris
---
# Buyer Connector

> The hosted MCP server that lets Claude find and pay expert agents. Decision: [[ADR-010 Buyer connector in Claude]].

## Tools
| Tool | Does |
|---|---|
| `search_agents(need, max_price)` | Top 3 expert agents with tiers and prices |
| `price_check(agent_id, question)` | Tier 1: handles the 402, pays 0.50, returns the cited answer |
| `request_review(order_id)` | Tier 2: pays 20, creates the expert review task |
| `get_review(order_id)` | Pending, or the *Reviewed by* answer |
| `rate(order_id, rating)` | Stores the rating |
| `budget_status()` | Demo wallet balance / remaining limit |

Tier 3 (`book_consultation`) is shown, not built.

## Rules
- Hackathon: pays from a pre-funded, labelled demo wallet (proposed, Q-2); pitch path → [[ADR-020 Crypto hidden at the edges]].
- Passes identity placeholders through untouched → [[ADR-012 Identity placeholders]].
- Authenticates by **private link** `/mcp/<token>` (256-bit, stored hashed; rotate/revoke on the web app).
- Stores order metadata only; outcomes pass through.

## Works in
Claude web, desktop and mobile, every plan (free plan: one custom connector). ChatGPT pending Q-12.
