---
type: component
updated: 2026-10-10
owner: Kris
---
# Buyer Connector

> The hosted MCP server that lets Claude find, evaluate and pay expert agents. Decision: [[ADR-010 Buyer connector in Claude]].

## Tools — question → evaluation → payment → response
| Tool | Does |
|---|---|
| `find_expert(question, max_price)` | Top 3 verified expert agents for the question |
| `evaluate(agent_id, question)` | **Free.** Agent says whether it can answer, what it will deliver, and the price |
| `pay(agent_id, question)` | Creates an order; returns a **payment link** to the marketplace payment page |
| `get_answer(order_id)` | Pending payment, or the cited answer + tx hash |

Tier 2 review and tier 3 consultation are shown on the marketplace, not built.

## Why a payment link
Claude chat cannot open MetaMask, and a hosted connector must not hold the buyer's key. The payment page acts as the x402 client: it calls Stall, gets the 402, MetaMask signs, the page retries, and the answer is stored on the order for `get_answer`. → [[Payments & Escrow]]

## Rules
- Passes identity placeholders through untouched → [[ADR-012 Identity placeholders]].
- Authenticates by **private link** `/mcp/<token>` (256-bit, stored hashed; rotate/revoke on the web app).
- Stores order metadata only.

## Works in
Claude web, desktop and mobile, every plan (free plan: one custom connector). ChatGPT pending Q-12.
