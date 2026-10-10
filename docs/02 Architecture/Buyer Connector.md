---
type: component
updated: 2026-10-10
owner: Kris
---
# Buyer Connector

> The hosted MCP server that lets Claude find, evaluate and pay expert agents. Runs as `/mcp/<token>` in the same Node + Hono service (`apps/connector`) as the [[Stall]] expert agent routes. Decision: [[ADR-010 Buyer connector in Claude]].

## Tools — question → evaluation → automatic payment from the budget → response
| Tool | Does |
|---|---|
| `find_expert(question)` | Top 3 verified expert agents for the question |
| `evaluate(agent_id, question)` | **Free.** Can answer, what it will deliver, price |
| `approve_budget(cap)` | Only when there's no budget or too little left: opens a top-up and returns its signing link (returns the open budget if there is one) |
| `ask(agent_id, question)` | Pays x402 from the problem wallet by itself (within the cap) and returns the cited answer |
| `budget_status()` | Spent / remaining for this problem |
| `close_problem()` | Returns the remainder to the buyer's MetaMask; full receipt |

Tier 2 review and tier 3 consultation are shown on the marketplace, not built.

`find_expert` also renders as inline expert cards in hosts that support MCP Apps (`ui://citable/find-expert.html`); a card's button sends "check with this expert" back to Claude. Other clients get the text result unchanged (ticket 23).

## Why top up once
Claude chat cannot open MetaMask, and a payment prompt — or an approval page — per question kills the flow. The buyer tops up a budget once at setup; the agent pays itself from it, question after question, never above what's left. → [[ADR-011 Buyer wallet and spend permission]]

## Rules
- Passes identity placeholders through untouched → [[ADR-012 Identity placeholders]].
- Authenticates by **private link** `/mcp/<token>` (256-bit, stored hashed; rotate/revoke on the web app).
- Holds problem-wallet keys (testnet); never the buyer's own key.
- Pays the agent routes over real x402 via the facilitator, even though they run in the same service.
- Stores order metadata only.

## Works in
Claude web, desktop and mobile, every plan (free plan: one custom connector). ChatGPT not supported (custom write-capable apps are a Business/Enterprise beta; no x402) → [[ADR-010 Buyer connector in Claude|ADR-010]].
