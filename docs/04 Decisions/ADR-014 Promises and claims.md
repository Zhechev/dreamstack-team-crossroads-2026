---
type: adr
id: ADR-014
status: Accepted
updated: 2026-10-10
---
# ADR-014 Promises and claims

## Context
Judges will test every claim. The old headline ("Every draft guaranteed") no longer matches the product ([[ADR-019 Three-tier expert funnel|ADR-019]]).

## Decision
Lines we use:
- **Buyer headline:** *"Ask your AI. Get an answer an expert stands behind."* On the real-estate slide, followed by the moat line below.
- **Seller line:** *"We build your agent. You approve it. It brings you clients."*
- **Where it works:** *"Works in Claude today — every plan, Free included. Any assistant with MCP connectors next."* ChatGPT is not named ([[Fact Check 2026-10-10]]).
- **Budget:** *"You approve a hard cap once. The agent can't spend a cent more, and the rest comes back."* Say **non-custodial** only about the production path (scoped spend permission, [[ADR-011 Buyer wallet and spend permission|ADR-011]]) — on testnet we hold the problem-wallet key.
- **Guarantee:** *"You never pay for an invented or stale citation."* — the check runs before the payment settles ([[ADR-009 Deterministic citation judge|ADR-009]]). No refund promises.
- **Why not ChatGPT:** *"ChatGPT knows asking prices. Our agents know what actually sold last month."*
- **Expert Verified** = sources and rules approved by the expert for version N. Never call an automated answer verified; human-checked answers say *Reviewed by <expert>*.
- **Real estate:** "price check" — never "appraisal" or "valuation".
- **Data:** only answers leave an agent, never its knowledge base. Every figure has a source and an as-of date.
- **Payments:** today — Claude, MetaMask, USDC on testnet. Pitch — *"Top up by card, paid out in euros. Crypto runs underneath."*
Never say: "AI lawyer", "legal advice", "appraisal", "valuation", "fully local", "anyone can use it today", "can't leak", "works in ChatGPT", "we never hold your money" (until spend permissions), "refund guaranteed", any x402 transaction volume.
Facts behind every external claim: [[Fact Check 2026-10-10]].

## Consequences
Landing page, slides, video and README use these lines verbatim once the headline is chosen.

## Rejected
Headlines "Expert answers in your AI. A human when it matters." (sounds like support) and "Your AI hires the expert. You get the receipts." (needs decoding); seller line "Your know-how, sold while you sleep." (tiers 2–3 need the expert's time); "Every answer cited. Every draft guaranteed." (no drafts); "Sell outcomes. Keep your knowledge." (knowledge is now hosted).
