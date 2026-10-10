# 13: Lovable project setup + landing page

**Owner:** Kris · **Built with:** Lovable · **Runs on:** Lovable hosting, its own synced GitHub repo, Supabase (read-only)
**Build Board:** T-08 (part)

**What to build:** The Citable web app exists, styled per Brand, connected read-only to our Supabase project, and synced to its own GitHub repo. A visitor sees the landing page: headline, how it works in three tiers, and "Add Citable to Claude".

**Blocked by:** 01 (Monorepo skeleton + protocol schemas), 04 (Supabase schema, RLS + seeded demo experts)

**Status:** done — checked on the live site (citable.lovable.app), 2026-10-10. Open: `CONNECTOR_URL` in the live config is still an old trycloudflare tunnel; set it to `https://citable-connector.onrender.com` (affects /setup and /approve)

- [x] Q-11 decided: logo mark is the citation pill [✓] (ADR-018, Brand note); the Brand style prompt already includes it
- [ ] Lovable project connected to GitHub (its own repo) and to our existing Supabase project
- [ ] Project knowledge in Lovable says: use existing tables only, never create or alter tables or functions; secrets never in the frontend
- [x] Public config set: Supabase URL + anon key, connector service URL, Base Sepolia chain id, USDC address
- [x] Landing page live on the Lovable URL, mobile-first, iOS feel, Brand colours and type
- [ ] Rule followed: nobody edits the Lovable repo by hand while someone is prompting Lovable

## How to build it in Lovable (prompts drafted 2026-10-10)

Wording follows ADR-014 (headline, seller line, claims) and Brand (colours, type, [✓] mark). Paste each block as one Lovable message, check the preview, then move on.

### Step 0 — set up (manual, in Lovable)
1. New project, name **Citable**.
2. **GitHub:** connect and let Lovable create its own repo (e.g. `citable-web`). Never connect it to this monorepo — it is imported into `apps/web` in ticket 20.
3. **Supabase:** connect our hosted project (the one Mitko's migrations + seed are applied to). Lovable reads with the anon key only.
4. **Project knowledge** (Settings → Knowledge) — paste:

> Citable is a marketplace where a buyer's AI assistant (Claude) hires expert-verified agents that answer with cited sources and pays per answer. This app is the web front end only.
> Rules:
> - Supabase: use the existing tables and views only (`marketplace_agents`, `experts`, `agents`, `capabilities`, `ratings`, `terms_versions`). Never create, alter or drop tables, views, functions, policies or migrations. Never use the service role key. Read with the anon key; anything that writes goes through the connector service or Edge Functions.
> - No secrets in the frontend.
> - Wording: say "price check", never "appraisal" or "valuation". Never say "non-custodial", "works in ChatGPT", "refund guaranteed" or "legal advice". Prices are in USDC, written like "0.50 USDC".
> - Style: mobile-first iOS feel, colours and type exactly as in the first prompt. One accent colour (#B4532A) used sparingly.

### Prompt 1 — brand + landing page
> Build "Citable", a mobile-first web app that feels like a native iOS app: large titles that collapse into a frosted translucent top bar, grouped inset lists with chevrons, 16px rounded cards with a soft shadow, pill buttons (full-width primary on mobile), 44px tap targets, spring transitions of 250–350 ms, max content width 720px on desktop.
> Colours: background #F7F5F0, cards #FFFFFF, text and primary buttons #1B2A41, separators #D9D4C7, muted text #5E6673, one accent #B4532A used sparingly, success #2E7D4F. Dark mode: background #141C2B, text #ECE8DF, accent unchanged.
> Type: the wordmark and the hero headline use Source Serif 4 SemiBold (Google Fonts); all other UI uses the system stack -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif; transaction hashes and source references use JetBrains Mono, small.
> Logo: the mark "[✓]" followed by the wordmark "Citable" — the square brackets in #1B2A41 Source Serif 4, the check in #B4532A. Use "[✓]" as the favicon too.
> No gradients, no robots, coins, neon or stock illustrations, no Apple logos or icons.
>
> Landing page at "/":
> 1. Hero: headline "Ask your AI. Get an answer an expert stands behind." Subline: "Citable lets your AI assistant hire expert-verified agents. Every figure comes with its source and date — and a human expert steps in when it matters." Primary button "Add Citable to Claude" (links to /setup). Small line under it: "Works in Claude — every plan, Free included."
> 2. Example card styled as a paper slip: question "Is €180k fair for a 2-bed in Lozenets?" and an answer preview "Fair range €172k–€186k, based on 5 recent sales" with two citation pills "[Deal #12 · Sep 2026 ✓]" and "[NSI housing prices · Q2 2026 ✓]" — pills are small rounded chips, the check in #2E7D4F.
> 3. "How it works" as a grouped inset list with three rows: "1 · Price check — instant, cited answer · 0.50 USDC", "2 · Human review — the expert approves or edits · 20 USDC", "3 · Consultation — a call or viewing with the expert · from 50 USDC". Under it: "You approve a hard cap once. The agent can't spend a cent more, and the rest comes back."
> 4. Trust strip with three short items: "Every figure has a source and a date", "You never pay for an invented or stale citation", "Expert Verified: the expert approved this agent's sources and rules".
> 5. "For experts" card: headline "We build your agent. You approve it. It brings you clients." and a secondary button "Become an expert" (links to /experts, a placeholder page for now).
> 6. Footer: "[✓] Citable · by DreamStack · Built with Lovable + Claude Code".
> Add simple placeholder pages for /setup and /experts with a large title and the text "Coming soon".

### Prompt 2 — public config
> Create one config module `src/config.ts` that exports: CONNECTOR_URL (placeholder "https://connector.example", to be replaced), CHAIN_ID 84532 (Base Sepolia), USDC_ADDRESS "0x036CbD53842c5426634e7929541eC2318f3dCF7e", USDC_DECIMALS 6, BASESCAN_TX_URL "https://sepolia.basescan.org/tx/". Every later page must import these from here instead of hard-coding them. The Supabase URL and anon key come from the existing Supabase integration. Do not create or change any Supabase tables.

### Prompt 3 — polish pass
> Check the landing page at 375px width and in dark mode: no horizontal scroll, 16px side padding, tap targets at least 44px, the top bar collapses smoothly, the citation pills wrap instead of overflowing. Fix anything that doesn't. Don't change the wording.

### Done when
The Lovable URL shows the landing page on a phone, the GitHub sync shows commits in the Lovable repo, and the Supabase integration is connected (anon key only). Then tick the boxes above.
