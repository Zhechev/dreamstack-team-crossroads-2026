# 22: Site audit fixes (landing, setup, experts, mobile)

**Owner:** Kris · **Built with:** Lovable · **Runs on:** Lovable app
**Build Board:** T-08 (polish) · from the site audit of https://citable.lovable.app on 2026-10-10

**What to build:** Fix what the audit found before the demo: the old tunnel address in the app's settings (shown on /setup, used by /approve), the expert sign-up button that goes nowhere, payment copy that contradicts itself, the missing mobile menu, small tap targets, and bare "Not found" screens.

**Blocked by:** 13 (landing), 14 (browse + agent page), 15 (approval page), 16 (setup — prompt A goes with it)

**Status:** ready-for-agent

Paste each prompt as its own Lovable message and check the preview before the next.

- [ ] A. Connector address + setup flow (ticket 13's fix prompt first; then A, immediately followed by ticket 16's starter prompt)
- [ ] B. "Apply as an expert" form (backend done: `expert_application` Edge Function)
- [ ] C. Payment claim on the landing page
- [ ] D. Expert earnings + founding-expert offer on /experts
- [ ] E. Mobile menu
- [ ] F. 44px tap targets
- [ ] G. Invalid budget link + 404 page
- [x] Outside Lovable: host the connector at a stable URL — done, `https://citable-connector.onrender.com` (ticket 07); the Lovable side is ticket 13's fix prompt

## Prompts

### A. Connector address + setup flow (audit items 1 and 3)
The address isn't hard-coded in a component: it comes from `CONNECTOR_URL` in `src/config.ts`, which still holds an old trycloudflare tunnel. Send ticket 13's "Fix: point the app at the hosted connector" prompt first (it fixes the address everywhere, /approve included). Then send this, **immediately followed by ticket 16's starter prompt**. On its own, this prompt would leave /setup with no address at all.

> On /setup, stop showing the shared connector address (the CONNECTOR_URL + "/mcp" field and its Copy button). Each buyer gets their own private link from the next step instead. Every connector URL in the app must keep coming from CONNECTOR_URL in the settings file; never type a URL in a component. Replace the line "When an answer costs money, Claude gives you a link to approve a budget" with: "Top up once. Your AI pays per answer, never more than you put in, and the rest comes back." Do not create or change any tables or functions.

### B. "Apply as an expert" form (item 2)
Backed by the `expert_application` Edge Function (migration `20261010170000_expert_applications.sql`, live on the hosted project). Applications land in the private `expert_applications` table; review them in Supabase Studio (Table editor) and set `status` to contacted / accepted / declined.

> On /experts, the "Apply as an expert" button currently opens mailto:experts@citable.app, which doesn't work. Replace it with an application form in a section with id="apply" (iOS grouped inset list style):
> - Name (required), Email (required, email keyboard), "What you know" (required, placeholder "e.g. Residential property, Sofia"), City (optional), "Links (website, LinkedIn)" (optional), "Anything else?" (optional, multi-line).
> - A hidden field named "website": visually hidden with CSS, tabindex -1, autocomplete off. It's a spam trap: never show it and send it as is.
> - "Apply" (primary, full width on mobile) calls the existing Supabase Edge Function: supabase.functions.invoke("expert_application", { body: { name, email, field, city, links, note, website } }).
> - On success, replace the form with: "Thanks — we'll be in touch within a few days. Founding experts get 0% fee on reviews and consultations for 6 months." On an error, show the returned `error` message under the button and keep what was typed.
>
> Make every "Become an expert" / "Become a founding expert" button on the landing page go to /experts#apply. Do not create or change any tables or functions.

### C. Payment claim (item 4)
The old line contradicts ADR-002/ADR-011 (testnet budget wallet controlled by the connector).

> On the landing page, in the "Every answer is a paid order" section, replace "The fee is its own transfer. Funds never pass through us." with two lines: "The fee is its own transfer, separate from the expert's." and, in small muted text, "In production, funds go straight from your wallet to the expert. In this testnet demo, a budget wallet holds only what you approved, and the rest comes back to you." Keep the existing styles.

### D. Expert earnings on /experts (items 5 and 10)
Matches ADR-016 split shown on the landing page.

> On /experts, under "What you earn", show what the expert actually receives, using the same split as the landing page:
> - Price check: "0.35 USDC per answer" with sub-line "0.50 paid by the buyer · 30% Citable fee · no work from you"
> - Human check: "18 USDC" with sub-line "20 paid · 10% fee · you approve or edit an answer"
> - Viewing: "45+ USDC" with sub-line "50+ paid · 10% fee · a visit or call, your price"
>
> In step 4 "You get paid", change "Per price check, in USDC" to "Per answer, in USDC. The fee is a separate transfer."
> Under the cards, add a highlighted Card-style banner with the Seal colour as accent: "Founding experts: 0% fee on reviews and consultations for 6 months." Then a small muted line: "Fees waived during the hackathon demo."

### E. Mobile menu (item 6)

> On screens narrower than 768px, the top bar hides "Browse" and "For experts" and gives no other way to reach them. Add a menu button (a simple three-line icon, 44×44 tap target, aria-label "Menu") to the left of "Add to Claude". It opens a bottom sheet in the existing iOS sheet style, with a grouped inset list and chevrons: Browse experts → /browse, For experts → /experts, Add to Claude → /setup. Close the sheet when a link is tapped, on Escape, and on a tap outside it. Keep the desktop top bar as it is.

### F. Tap targets (item 7)

> Make every link and button at least 44px tall. On the landing page, turn the "See the live real-estate experts" text link into a secondary pill button (same style as "Become an expert"), full width on mobile. In the footer, give the Browse / For experts / Setup links at least 44px of vertical tap area using padding, without changing how they look.

### G. Missing-link states (item 8)

> On /approve/:problemId, when the problem can't be found or the request fails, don't show a bare "Not found". Show a centred card in the iOS style with the title "This budget link isn't valid", the text "It may have expired or been closed. Ask Claude for a new one, or set up Citable again.", and two buttons: "Go to setup" (primary, → /setup) and "Browse experts" (secondary, → /browse). Use the same card for any unknown route in the app (the 404 page), with the title "Page not found".

## Later polish (not prompted yet)
- `twitter:card` → `summary_large_image`
- Dark-mode `theme-color` (`#141C2B`)
- Shorten the hero pill to "Works in Claude, Free plan included" (wraps on mobile)
- Hide the "Edit with Lovable" badge for the demo
- `llms.txt`: add one line on the broader marketplace, not only real estate
- Agent pages: show a sample cited answer with a `[Deal #12 · Sep 2026 ✓]` pill
- Human review / Book sheets: "Coming soon. Get notified?" with an email field
