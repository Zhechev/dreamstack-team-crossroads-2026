---
type: component
updated: 2026-10-09
owner: Kris
---
# Buyer Connector

> ⚠️ **Pre-pivot (KAT build) — re-plan pending, see [[Open Questions]] Q-14.** Current plan: [[Product]] · [[Demo Story]].

> The hosted MCP server that lets Claude find and pay sellers. Decision: [[ADR-010 Buyer connector in Claude]].

## Tools
| Tool | Does |
|---|---|
| `search_capabilities(need, max_price)` | Top 3 capabilities from the marketplace |
| `buy(capability_id, input)` | Calls Stall, handles the 402: pays x402 or deposits to escrow; returns the outcome (+ `refundable` flag) |
| `confirm(order_id, rating)` | Releases escrow, stores rating |
| `dispute(order_id, reason)` | Sends the outcome to the judge |
| `budget_status()` | Remaining spend permission for today |

## Rules
- Holds only a **session key** limited by the buyer's on-chain spend permission → [[ADR-011 Buyer wallet and spend permission]].
- Passes placeholders through untouched and tells the assistant to fill them only in the final text → [[ADR-012 Identity placeholders]].
- Authenticates by **private link** `/mcp/<token>` (256-bit, stored hashed, bound to wallet + permission; rotate/revoke on the web app).
- Stores order metadata only; outcomes pass through.

## Works in
Claude web, desktop and mobile, every plan (free plan: one custom connector). ChatGPT is roadmap.
