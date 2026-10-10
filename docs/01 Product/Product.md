---
type: product
updated: 2026-10-10
---
# Product

> What Citable is, for whom, and what we promise. Decisions: [[ADR-003 Hosted expert agents and the real-estate demo]] · [[ADR-019 Three-tier expert funnel]].

## One line
**Ask your AI. Get an answer an expert stands behind.**

Your AI assistant hires expert-verified agents and pays per task — and brings in the human expert only when it matters.

For experts: *"We build your agent. You approve it. It brings you clients."*

## Problem
- Assistants don't know what happened this week, and they can't buy expert knowledge; every service is a separate account and subscription.
- Nobody stands behind an AI answer.
- Experts can't sell their know-how to AI users — building an agent is far too much work.

## How it works
**Seller side — we build, the expert approves.**
1. **Base layer** — we collect and index the public sources for the category.
2. **Expert layer** — the expert reviews sources, adds rules and optional fresh or private knowledge (e.g. actual deal prices).
3. **Validation** — test cases → expert fixes failures → authorises version N → *Expert Verified*.
4. **Updates** — new sources re-run the tests; the expert reviews only significant changes.

**Buyer side — Discover → Pay → Get the work done.**
The buyer's assistant finds the agent, pays via x402, and gets the result in the chat:
| Tier | What | Price |
|---|---|---|
| 1 Automated answer | Instant, cited, every figure with source and as-of date | ~0.50 |
| 2 Human review | The expert approves or edits; returns into the chat | ~20 |
| 3 Consultation | Booked meeting or viewing with the expert | 50+ |

The AI handles the volume; the expert enters only where their time adds value.

## The moat
The expert's **fresh and private knowledge**. *"ChatGPT knows asking prices. Our agents know what actually sold last month."*

## Launch vertical: real estate
"Is €180k fair for a 2-bed in Lozenets?" → price check with comparable sales → agent's review → viewing. Same pipeline later for renovation quotes and used cars. → [[Demo Story]]

## Promises
Wording, headline and seller line are fixed in [[ADR-014 Promises and claims]].

## Who can use it
- **Today (hackathon):** Claude on every plan (Free included), MetaMask, USDC on Base Sepolia.
- **Next:** email sign-in wallet, top up by card, experts paid out in EUR → [[ADR-020 Crypto hidden at the edges]]; more verticals; any assistant with MCP connectors.
- **Vision:** any person gets expert work done from the assistant they already use.

## Why it is different
- Zero setup for the expert — we build and maintain the agent.
- Fresh, private expert knowledge, not just what's on the web.
- A human on call: review for ~20, consultation for 50+.
- Every figure cited with source and date; reputation per capability, only from paid orders.
- A hard cap you approve once — the agent can't spend more, the rest comes back. Non-custodial in production (scoped spend permission). Experts never see buyer identity.
- You never pay for an invented or stale citation: the check runs before the payment settles.
