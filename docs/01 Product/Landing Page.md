---
type: product
updated: 2026-10-10
---
# Landing Page

> Copy and Lovable prompt for the public landing (T-08). Positioning: **a global marketplace where AI assistants hire expert agents**. Real estate in Sofia and Varna is the *first live vertical*, used as proof, not as the product. Claims follow [[ADR-014 Promises and claims]] and [[Fact Check 2026-10-10]]; money split from [[ADR-016 Take rate on settled orders]]; tiers from [[ADR-019 Three-tier expert funnel]].

Audience on stage: investors. They should leave knowing (1) it works in any field, (2) where the money goes on every order, and (3) why it grows without us hiring people.

## Sections

### 1. Hero
- Eyebrow: **The expert marketplace for AI assistants**
- Headline: **Ask your AI. Get an answer an expert stands behind.**
- Sub: Your assistant finds the right expert agent, pays per task, and brings in the human expert only when it matters, in any field, from the assistant you already use.
- Buttons: **Connect to Claude** (primary) · **Become an expert** (secondary)
- Proof strip: `[✓] Works in Claude today: every plan, Free included` · `Live now: real estate` · `Paid over x402, an open standard`

### 2. One marketplace, every expertise
Title: **One pipeline. Any field.**
Line: We build each expert's agent with the same pipeline. A new field takes a new set of sources and a few experts, not a new product.
Cards (grid):
| Field | Example question | Status |
|---|---|---|
| Real estate | "Is €180k fair for a 2-bed in Lozenets?" | **Live** (Sofia, Varna) |
| Renovation quotes | "Is this bathroom quote too high?" | Next |
| Used cars | "Is this price right for a 2019 Golf?" | Next |
| Any expert field | Tax, travel, health admin, B2B sourcing… | Vision |

### 3. How the money flows (key investor section)
Title: **Every answer is a paid order. Every order is split on the spot.**
Diagram (left → right): **Buyer budget** (approved once, hard cap) → **Expert agent** → two transfers: **Expert** · **Citable fee**. The rest goes back to the buyer.

Per-order split, shown as three receipt cards:
| Tier | Buyer pays | Expert gets | Citable gets |
|---|---|---|---|
| 1 Automated answer | 0.50 | 0.35 | 0.15 (30%) |
| 2 Human review | 20 | 18 | 2 (10%) |
| 3 Consultation | 50 | 45 | 5 (10%) |

Lines under it:
- *We take more where we do the work.* On tier 1 we host the agent and pay for the model; tiers 2–3 are the expert's time.
- The fee is its own transfer. Funds never pass through us.
- Each tier brings in the next: a 0.50 answer leads to a review, and a review leads to a consultation. Experts get paid clients, not cents.
- Small print: *Fees waived during the hackathon demo.*

### 4. Why it scales
Title: **Built to grow without a sales team.**
Four tiles:
1. **Demand comes built in.** Buyers already sit in their AI assistant. Citable is a connector: no new app to download.
2. **Supply costs experts nothing.** We build and maintain the agent; the expert approves it. Zero setup.
3. **The AI handles the volume.** Automated answers cost cents to serve; the expert steps in only when a buyer pays for their time.
4. **Open rails.** x402 is a Linux Foundation standard backed by 50+ members including Visa, Mastercard, Stripe and Google.

### 5. Trust
Title: **You never pay for an invented or stale citation.**
- Every figure has a source and an as-of date: `[Closed deal #12 · Sep 2026 ✓]`
- *Expert Verified* = sources and rules approved by the expert for that version.
- You approve a hard cap once. The agent can't spend a cent more, and the rest comes back.

### 6. For experts
Title: **We build your agent. You approve it. It brings you clients.**
- Founding experts: 0% on reviews and consultations for 6 months.
- Button: **Become a founding expert**

### 7. Roadmap strip
**Today:** Claude, testnet USDC, real estate. **Next:** top up by card, paid out in euros (crypto runs underneath), more fields, any assistant with MCP connectors. **Vision:** any expert, any field, from the assistant you already use.

### Footer
Citable [✓] · by DreamStack · Built with Lovable + Claude Code

## Do not put on the page
Market-size or transaction-volume figures, "works in ChatGPT", "appraisal"/"valuation", "we never hold your money", "refund guaranteed" (full list in [[ADR-014 Promises and claims]]). Sofia and Varna appear only as the live vertical, never in the hero.

## Lovable prompt
> Rework the landing page. Citable is no longer positioned as a home-buying tool for Sofia and Varna. It is **the global expert marketplace for AI assistants**: your assistant hires expert-verified agents, pays per task, and brings in the human expert only when it matters. Real estate (Sofia, Varna) becomes the first live vertical, shown as proof further down, not in the hero. Remove "your next home" and "For buyers in Sofia and Varna" from the hero.
>
> Build these sections in order, keeping the existing iOS-style brand (Paper #F7F5F0 background, Ink #1B2A41 text, single Seal #B4532A accent, Verified #2E7D4F, Source Serif 4 for wordmark and hero headline, system font for UI, [✓] logo mark):
> 1. **Hero.** Small eyebrow "The expert marketplace for AI assistants". Headline "Ask your AI. Get an answer an expert stands behind." Sub "Your assistant finds the right expert agent, pays per task, and brings in the human expert only when it matters, in any field, from the assistant you already use." Primary pill button "Connect to Claude", secondary "Become an expert". Below, three small proof chips: "[✓] Works in Claude today: every plan, Free included", "Live now: real estate", "Paid over x402, an open standard".
> 2. **"One pipeline. Any field."** Line: "We build each expert's agent with the same pipeline. A new field takes a new set of sources and a few experts, not a new product." Four cards in a grid: Real estate ("Is €180k fair for a 2-bed in Lozenets?", green "Live · Sofia, Varna" badge), Renovation quotes ("Is this bathroom quote too high?", grey "Next"), Used cars ("Is this price right for a 2019 Golf?", grey "Next"), Any expert field ("Tax, travel, health admin, B2B sourcing…", outline "Vision").
> 3. **"Every answer is a paid order. Every order is split on the spot."** A simple left-to-right flow diagram: "Buyer budget (approved once, hard cap)" → "Expert agent" → splits into "Expert" and "Citable fee", with a thin return arrow "Rest back to buyer". Under it, three receipt-style paper cards: Automated answer: buyer 0.50 USDC → expert 0.35 · Citable 0.15 (30%). Human review: 20 → expert 18 · Citable 2 (10%). Consultation: 50 → expert 45 · Citable 5 (10%). Seal accent on the Citable numbers only. Lines: "We take more where we do the work." "The fee is its own transfer. Funds never pass through us." "Each tier brings in the next: a 0.50 answer leads to a review, and a review leads to a consultation." Small print: "Fees waived during the hackathon demo."
> 4. **"Built to grow without a sales team."** Four tiles: "Demand comes built in: buyers already sit in their AI assistant; Citable is a connector, no new app." "Supply costs experts nothing: we build and maintain the agent, the expert approves it." "The AI handles the volume: automated answers cost cents; the expert steps in only when a buyer pays for their time." "Open rails: x402 is a Linux Foundation standard backed by 50+ members including Visa, Mastercard, Stripe and Google."
> 5. **"You never pay for an invented or stale citation."** Show a citation pill "[Closed deal #12 · Sep 2026 ✓]" and three bullets: every figure has a source and an as-of date; Expert Verified means sources and rules approved by the expert for that version; you approve a hard cap once, the agent can't spend a cent more, and the rest comes back.
> 6. **"We build your agent. You approve it. It brings you clients."** Line "Founding experts: 0% on reviews and consultations for 6 months." Button "Become a founding expert".
> 7. **Roadmap strip** with three columns: Today (Claude, testnet USDC, real estate), Next (top up by card, paid out in euros, crypto runs underneath; more fields; any assistant with MCP connectors), Vision (any expert, any field, from the assistant you already use).
> Footer: "Citable [✓] · by DreamStack · Built with Lovable + Claude Code".
> Do not add market-size numbers, transaction volumes, ChatGPT, robots, coins or gradients. Keep the existing browse, approval and receipt pages unchanged.
