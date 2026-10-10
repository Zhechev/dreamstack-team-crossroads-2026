---
type: reference
updated: 2026-10-10
---
# Fact Check 2026-10-10

> Facts behind every external claim on the slides, video and landing page (closed Q-12, Q-13). Wording rules: [[ADR-014 Promises and claims]]. Re-check anything marked medium/low before it goes on a slide.

## Safe claims
| Topic | Fact | Slide-safe line | Source | Confidence |
|---|---|---|---|---|
| Claude | Custom remote MCP connectors on Free, Pro, Max, Team, Enterprise; Free = one custom connector | "Works in Claude — every plan, Free included." | support.claude.com/en/articles/11175166 | high |
| ChatGPT | Write-capable custom MCP apps: beta for Business / Enterprise / Edu, enabled by admins; Pro read/fetch only; Plus unclear | (not named on slides) "Any assistant with MCP connectors next." | help.openai.com/en/articles/12584461; @OpenAIDevs 10 Sep 2025 | medium |
| ChatGPT payments | No x402. OpenAI's path is ACP with Stripe; Instant Checkout (Sep 2025) moved back to retailer apps in Mar 2026 | — | stripe.com/newsroom/news/stripe-openai-instant-checkout; digitalcommerce360.com 6 Mar 2026; skift.com 5 Mar 2026 | high (ACP) / medium (wind-down) |
| JustAnswer | Expert Q&A by subscription, $28–$125/month after $1/$5 join offers; FTC suit filed 13 Jan 2026 (pending) | "Human experts on a $28–$125/month subscription." — no lawsuit, no revenue | ftc.gov press release Jan 2026 | high |
| TollBit | AI bots pay publishers per fetch; publishers set rates; $24M Series A (Lightspeed) | "TollBit meters AI access to content. We sell expert answers." | tollbit.com; lsvp.com | medium |
| Cloudflare | Pay Per Crawl (2025, closed beta) → Pay Per Use (beta, 30 Sep 2026); Monetization Gateway charges via x402; co-founded x402 Foundation | "Cloudflare is moving from pay-per-crawl to pay-per-answer — on x402." | blog.cloudflare.com/pay-per-use; blog.cloudflare.com/monetization-gateway | high |
| Stripe | x402 "machine payments" preview: USDC on Base, US businesses (not NY), others by request; CDP facilitator | Q&A only: "Stripe already accepts x402 USDC on Base (preview)." | docs.stripe.com/payments/machine/x402 | high |
| x402 | Linux Foundation x402 Foundation, operational 14 Jul 2026; 50+ members (Visa, Mastercard, Stripe, Google, AWS, Cloudflare, Coinbase, Circle, Shopify, Adyen, Amex); Google AP2 has an x402 extension | "x402 is a Linux Foundation standard backed by 50+ members including Visa, Mastercard, Stripe and Google." | linuxfoundation.org press 14 Jul 2026, 1 Oct 2026; github.com/google-agentic-commerce/a2a-x402 | high |
| Spend permissions (production path) | Base Account spend permissions (spender, token, allowance, period) on Base and Base Sepolia; MetaMask ERC-7715 Advanced Permissions list Base and Base Sepolia (MetaMask ≥ 13.23) | "In production the money stays in your wallet — a scoped spend permission." | docs.base.org/base-account/improve-ux/spend-permissions; docs.metamask.io/smart-accounts-kit/get-started/supported-networks | high |
| Revolut | Buy USDC and withdraw to external wallets; Ethereum and Polygon confirmed, **Base not confirmed**; no x402 product | Only: "Buy USDC in mainstream apps like Revolut." | help.revolut.com (search excerpts) | low |

## Do not claim
- Any x402 transaction volume — no official figure; reported numbers conflict and roughly half may be wash trading.
- ChatGPT Instant Checkout as live, or that ChatGPT can pay agents.
- Revolut on Base or Revolut + x402.
- JustAnswer revenue (estimates range $64M–$500M).
- Cloudflare NET Dollar as launched.
