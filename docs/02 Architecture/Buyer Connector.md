---
type: component
updated: 2026-10-10
owner: Kris
---
# Buyer Connector

> The hosted MCP server that lets Claude find, evaluate and pay expert agents. Decision: [[ADR-010 Buyer connector in Claude]].

## Tools — question → evaluation → approval → automatic payment → response
| Tool | Does |
|---|---|
| `find_expert(question)` | Top 3 verified expert agents for the question |
| `evaluate(agent_id, question)` | **Free.** Can answer, what it will deliver, price |
| `approve_budget(cap)` | Creates a problem wallet; returns a link for the **one** MetaMask approval |
| `ask(agent_id, question)` | Pays x402 from the problem wallet by itself (within the cap) and returns the cited answer |
| `budget_status()` | Spent / remaining for this problem |
| `close_problem()` | Returns the remainder to the buyer's MetaMask; full receipt |

Tier 2 review and tier 3 consultation are shown on the marketplace, not built.

## Why one approval
Claude chat cannot open MetaMask, and a payment prompt per call kills the flow. The buyer approves a hard cap once per problem; the agent pays itself within it. → [[ADR-011 Buyer wallet and spend permission]]

## Rules
- Passes identity placeholders through untouched → [[ADR-012 Identity placeholders]].
- Authenticates by **private link** `/mcp/<token>` (256-bit, stored hashed; rotate/revoke on the web app).
- Holds problem-wallet keys (testnet); never the buyer's own key.
- Stores order metadata only.

## Works in
Claude web, desktop and mobile, every plan (free plan: one custom connector). ChatGPT pending Q-12.
