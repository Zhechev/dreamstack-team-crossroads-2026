---
type: brand
updated: 2026-10-10
---
# Brand

> Look, feel and voice for the app, slides and video. Decision: [[ADR-018 Name, brand and iOS-style UI]]. The § mark is a legal-tech leftover — keep or replace is [[Open Questions]] Q-11.

## Personality
Calm, precise, accountable — and as easy as an iPhone app. Brand moments feel like a well-kept file of evidence; the interface feels like iOS.

## Logo
*Citable* in **Source Serif 4 SemiBold**, with **§** as icon and favicon. Credit lines: "by DreamStack" · "Built with Lovable + Claude Code".

## Colour
| Token | Hex | Use |
|---|---|---|
| Ink | `#1B2A41` | Text, logo, primary buttons |
| Paper | `#F7F5F0` | Background |
| Card | `#FFFFFF` | Cards, sheets |
| Separator | `#D9D4C7` | Lines, borders |
| Seal | `#B4532A` | One accent: §, key numbers, "verified" |
| Verified | `#2E7D4F` | Citation verified, refund done |
| Muted | `#5E6673` | Secondary text |
Dark mode: background `#141C2B`, text `#ECE8DF`, Seal unchanged.

## Type
- Wordmark and hero headline: Source Serif 4 SemiBold.
- All UI: system stack `-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif`.
- Tx hashes and source references: JetBrains Mono, small.

## Interface (iOS feel)
Large titles collapsing into a frosted top bar · grouped inset lists with chevrons · 16px rounded cards with soft shadow · bottom sheet for *Review & pay* and receipts · segmented control Buyer / Seller · pill buttons, full-width primary on mobile · 44px tap targets · spring transitions 250–350 ms · mobile-first, desktop max width ~720px. Feel only — no Apple fonts, icons or logos.

## Motifs
Citation pills `[Deal #12 · Sep 2026]` with a green check when verified · receipts styled as paper slips · no robots, coins, neon or gradients.

## Voice
Short, plain sentences; exact numbers ("0.50 USDC", "last 90 days"). Headlines from [[Product]].

## Lovable style prompt
> Build a mobile-first app that feels like a native iOS app: large titles that collapse into a frosted translucent top bar, grouped inset lists with chevrons, rounded cards (16px radius, soft shadow), pill buttons, a bottom sheet for "Review & pay" and receipts, a segmented control for Buyer / Seller, smooth spring transitions, 44px tap targets. Use the system font stack (-apple-system, BlinkMacSystemFont, Inter, sans-serif) for all UI text; only the "Citable" wordmark and the hero headline use Source Serif 4 SemiBold, with a § symbol as the logo mark. Colours: background #F7F5F0, cards white, text and primary buttons #1B2A41, single accent #B4532A used sparingly, success #2E7D4F, separators #D9D4C7. Transaction hashes and source references in JetBrains Mono, small. Show citations as small rounded pills like [Deal #12 · Sep 2026] with a green check when verified. No gradients, no robot or coin illustrations, no Apple logos or icons.

## Slides & video
Paper background, Ink text, one Seal accent per slide, one idea per slide. Title and end cards use wordmark + headline.
