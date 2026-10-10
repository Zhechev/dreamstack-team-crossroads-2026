# 13: Lovable project setup + landing page

**Owner:** Kris · **Built with:** Lovable · **Runs on:** Lovable hosting, its own synced GitHub repo, Supabase (read-only)
**Build Board:** T-08 (part)

**What to build:** The Citable web app exists, styled per Brand, connected read-only to our Supabase project, and synced to its own GitHub repo. A visitor sees the landing page: headline, how it works in three tiers, and "Add Citable to Claude".

**Blocked by:** 01 (Monorepo skeleton + protocol schemas), 04 (Supabase schema, RLS + seeded demo experts)

**Status:** ready-for-agent

- [x] Q-11 decided: logo mark is the citation pill [✓] (ADR-018, Brand note); the Brand style prompt already includes it
- [ ] Lovable project connected to GitHub (its own repo) and to our existing Supabase project
- [ ] Project knowledge in Lovable says: use existing tables only, never create or alter tables or functions; secrets never in the frontend
- [ ] Public config set: Supabase URL + anon key, connector service URL, Base Sepolia chain id, USDC address
- [ ] Landing page live on the Lovable URL, mobile-first, iOS feel, Brand colours and type
- [ ] Rule followed: nobody edits the Lovable repo by hand while someone is prompting Lovable

**Starter prompt:**
> Build "Citable", a mobile-first web app with an iOS feel: large titles that collapse into a frosted top bar, grouped inset lists, 16px rounded cards, pill buttons, max width 720px on desktop. Colours: Ink #1B2A41 text and primary buttons, Paper #F7F5F0 background, Card #FFFFFF, Separator #D9D4C7, one accent Seal #B4532A, Verified #2E7D4F, Muted #5E6673; dark mode background #141C2B, text #ECE8DF. Wordmark and hero in Source Serif 4 SemiBold, UI in the system font stack, hashes in JetBrains Mono. No robots, coins, neon or gradients. Landing page: headline "Expert answers in your AI. A human when it matters."; a "How it works" section with three tiers: Automated answer 0.50, Human review 20, Consultation 50+; a primary button "Add Citable to Claude". Footer: "by DreamStack · Built with Lovable + Claude Code". Connect to the existing Supabase project but do not create or change any tables.
