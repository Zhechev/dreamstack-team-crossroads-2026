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
- **Why not ChatGPT:** *"ChatGPT knows asking prices. Our agents know what actually sold last month."*
- **Expert Verified** = sources and rules approved by the expert for version N. Never call an automated answer verified; human-checked answers say *Reviewed by <expert>*.
- **Real estate:** "price check" — never "appraisal" or "valuation".
- **Data:** only answers leave an agent, never its knowledge base. Every figure has a source and an as-of date.
- **Payments:** today — Claude, MetaMask, USDC on testnet. Pitch — *"Top up by card, paid out in euros. Crypto runs underneath."*
Never say: "AI lawyer", "legal advice", "appraisal", "valuation", "fully local", "anyone can use it today", "can't leak".
Buyer headline and seller line: **open** ([[Open Questions]]).

## Consequences
Landing page, slides, video and README use these lines verbatim once the headline is chosen.

## Rejected
"Every answer cited. Every draft guaranteed." (no drafts); "Sell outcomes. Keep your knowledge." (knowledge is now hosted).
