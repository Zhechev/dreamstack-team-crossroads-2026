---
type: reference
updated: 2026-10-09
---
# Hackathon Brief — Crossroads AI Hackathon 2026

> Event rules and how Citable scores. Source: [startupbulgaria.eu/ai-hackathon](https://www.startupbulgaria.eu/ai-hackathon) and the organisers' Discord.

## Dates & places
- **Fri 9 Oct, evening** — Meet & Match at Feel Better; **registration closes 19:00**; **theme announced 21:00**.
- **Sat 10 Oct, from 09:00** — build day, Planet Schwarz, 51 Cherni Vrah Blvd, Office X, building 1, ground floor. Panel 11:00.
- **Sun 11 Oct** — **submissions close 14:00**; 15 finalists pitch in the afternoon; awards.
- Teams of 2–5 · free · Discord `discord.gg/xb8mqMEVV` · info@startupbulgaria.eu

## Submit by Sun 14:00
1. PDF presentation, **max 8 slides** → [[Pitch Deck]]
2. Demo video, **MP4, max 2 min** → [[Demo Video Script]]
3. **Public GitHub URL**

Finalists: 3 min pitch + 2 min video + 2 min judge questions.

## Sponsors
Anthropic (tech partner, **$50 Claude API credits per participant**) · Lovable (Gold Sponsor). We use both: [[ADR-005 Build tools, language and repo]].

## Prize path
Top 5 → mentoring + Crossroads Pitch Competition (29 Oct) → San Francisco pitch and Campus Founders Accelerator, Heilbronn (12 weeks, no equity).

## Theme
**AI That Does the Work** (announced Fri 21:00). Fit: the AI does the volume — cited price checks — and brings in the human expert only when it matters ([[ADR-019 Three-tier expert funnel]]).

## Judging
> "Our proof" below is pre-pivot; refresh after [[Open Questions]] Q-3.

| Official criterion | Website asks | Discord adds | Our proof |
|---|---|---|---|
| **Working prototype** | Functional, end to end? | — | Testnet flow: pay → cited answer → escrowed draft → refund; repo runs from README |
| **Use of AI** | Thoughtful, effective AI? | Technical implementation; innovation & creativity | Claude drafts only from retrieved law; citations machine-checked; Claude is the buyer agent via MCP; agents hiring agents over HTTP 402 |
| **Problem and impact** | Clear problem, who it helps? | Impact & scalability | Any Claude user (free plan too); any expert can publish; any field of expertise |
| **Execution and demo** | Works well, presented clearly? | Presentation | One story, one headline, rehearsed 3-min pitch |
