---
type: legal
updated: 2026-10-10
---
# Trust & Legal

> Why buyers and experts can rely on Citable, and how we answer every attack. Claims wording: [[ADR-014 Promises and claims]].

## Trust mechanisms
| Mechanism | What it guarantees |
|---|---|
| **Expert Verified (version N)** | The expert approved the sources and rules of this agent version — not each answer |
| **Reviewed by <expert>** | A human checked this specific answer (tier 2) |
| **Citations with as-of date** | Every figure names its source and date; machine-checked by the [[ADR-009 Deterministic citation judge\|judge]] |
| **Never pay for a bad citation** | Every citation is checked before the payment settles; any mismatch → not settled |
| **Ratings from paid orders only** | Only paying keys rate |

## Attacks and defences
| Attack | Defence |
|---|---|
| Does it work in ChatGPT? | Not today — write-capable custom apps are a ChatGPT Business/Enterprise beta and it has no x402. Claude works on every plan |
| Why not ChatGPT? | Private, fresh knowledge — "ChatGPT knows asking prices; our agents know what actually sold last month" — plus a human sign-off for ~20 |
| "Expert Verified" is misleading | Badge = sources and rules approved for a version; never a single answer. Human-checked answers get a separate badge |
| Regulated advice | Avoid law and medicine at launch. "Price check", never appraisal; tier 3 can be a licensed appraiser |
| Agents are biased | Answers cover prices and areas, not listings; own listings labelled; conflicts disclosed in Terms |
| Agencies guard their data | They sell answers, not raw data, and get leads back |
| Wrong data | Source + as-of date on every figure, a citation mismatch is never paid, ~20 human check |
| Doesn't scale — built by hand | One pipeline, only the sources change; add a vertical when ~5 experts ask |
| Experts won't share know-how | Optional; can stay on their own server later; only answers leave |
| Async review is slow | Priced as premium with a stated response window; the instant answer comes first |
| Liability | Tier 1: citation guarantee. Tiers 2–3: the expert's own professional liability |
| Cold start | Hand-onboard 5 experts, 0% fee for founders |
| Crypto friction | Card top-up for buyers, EUR payouts for experts, x402 underneath → [[ADR-020 Crypto hidden at the edges]]. If asked "is that real?": Stripe already settles x402 USDC on Base (preview, US) |
| Data leaks | Knowledge base never exposed; only answers leave. We never claim "can't leak" |

## Terms v1 (outline — text is task T-10)
- No retention beyond the task; no buyer identity sent to experts; security.
- Experts warrant they own the rights to the data they add; conflicts of interest disclosed.
- GDPR: Citable hosts expert sources as processor; the expert is controller for case facts in tier 2–3; Terms double as the DPA.
- Hash recorded on every order; experts sign at onboarding, buyers at first use.

## Identity
- Experts are verified in production; the demo experts are fictional and, for the MVP, not labelled in the product (2026-10-10).
- Buyers are pseudonymous: a wallet address and nothing else.

## Remaining risks
| Risk | Response |
|---|---|
| Expert sees buyer facts in tier 2–3 | Placeholders for identity ([[ADR-012 Identity placeholders\|ADR-012]]); say it plainly |
| Model hallucinates | Retrieval-only answers, citations machine-checked before payment |
| Fake ratings | Only paying keys rate; ratings decay |
| Custody | Testnet: we hold the problem-wallet key, capped. Production: scoped spend permission, money stays in the buyer's wallet; no escrow contract |
| Testnet facilitator down during recording | Record early; keep a second take |
