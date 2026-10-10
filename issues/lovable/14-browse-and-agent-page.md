# 14: Browse + agent page

**Owner:** Kris · **Built with:** Lovable · **Runs on:** Lovable app, reads Supabase tables
**Build Board:** T-08 (part) · **Cut order item 3** (fall back to one agent page)

**What to build:** A visitor browses the demo expert agents and opens one. Each shows its expert, Expert Verified (vN) badge, rating and three tiers with prices. Tier 1 explains it's used from Claude; "Get a human check: 20" and "Book a viewing: 50+" are shown but not built.

**Blocked by:** 13 (Lovable project setup + landing page)

**Status:** done — checked on the live site (citable.lovable.app), 2026-10-10: `/browse` and `/agents/:slug`; tiers 2–3 open a "Coming soon" dialog (not a bottom sheet)

- [x] Browse list reads agents, capabilities and ratings from Supabase with the anon key
- [x] Agent page: expert name, version badge, rating, sources summary, three tiers
- [x] Tier 2 and 3 buttons open a "coming soon" sheet; nothing is written
- [x] Wording: "price check", never "appraisal" or "valuation"; badge explained as "expert approved the sources and rules of this version"

**Starter prompt:**
> Add a Browse page listing expert agents from the existing Supabase tables agents, capabilities, ratings and experts (read only). Each row: agent name, expert name, an "Expert Verified v{n}" badge in Seal colour, star rating, and the lowest price. Tapping opens an Agent page with three cards: "Price check · 0.50 USDC · ask from Claude", "Get a human check · 20" and "Book a viewing · 50+". The last two open a bottom sheet saying "Coming soon". Under the badge, explain: "The expert approved the sources and rules of this version." Never say appraisal or valuation. Do not create or change any tables.
