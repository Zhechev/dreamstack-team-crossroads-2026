---
type: index
updated: 2026-10-10
---
# Citable — Home

> **This vault is the single source of truth** for Citable, built by team DreamStack (Kris Georgiev, Mitko Zhechev) at the Crossroads AI Hackathon, Sofia, 9–11 Oct 2026. If something changes, change it here first; code, slides and video follow the vault.

## Plan at a glance
- **What:** your AI assistant hires expert-verified agents and pays per task; the human expert steps in only when it matters. We build the agent, the expert approves it. → [[Product]]
- **Theme fit:** *AI That Does the Work* — three tiers: ~0.50 automated answer · ~20 human review · 50+ consultation. → [[ADR-019 Three-tier expert funnel]]
- **Demo:** "Is €180k fair for a 2-bed in Lozenets?" — free evaluation, one capped MetaMask approval, the agent pays 0.50 by itself, cited price check in Claude. → [[Demo Story]]
- **Stack:** Lovable + Supabase marketplace · hosted Stall agents (TypeScript, x402) · hosted MCP connector in Claude · USDC on Base Sepolia; crypto hidden at the edges in the pitch. → [[Tech Stack]]
- **Deadline:** submit 8-slide PDF + 2-min MP4 + public GitHub URL by **Sun 11 Oct 14:00**. → [[Hackathon Brief]]

## Map
| Folder | Notes |
|---|---|
| Root | [[Home]] · [[Glossary]] · [[System Map.canvas\|System Map]] |
| 01 Product | [[Product]] · [[Demo Story]] · [[Business Model]] · [[Trust & Legal]] · [[Brand]] |
| 02 Architecture | [[Expert Agent Lifecycle]] · [[Tech Stack]] · [[System Overview]] · [[Marketplace]] · [[Stall]] · [[Buyer Connector]] · [[Payments & Escrow]] · [[Data Model]] |
| 03 Hackathon | [[Hackathon Brief]] · [[MVP Scope]] · [[Build Board]] · [[Build Schedule]] · [[Demo Video Script]] · [[Pitch Deck]] · [[Team]] |
| 04 Decisions | [[ADR Index]] — one record per decision |
| 05 Operations | [[Open Questions]] · [[Change Log]] |
| 09 Templates | [[ADR Template]] · [[Meeting Note Template]] |

## How we keep it true
1. **Facts live in one note.** Other notes link to it instead of repeating it.
2. **A decision = an ADR.** New decision → new ADR from [[ADR Template]], status *Accepted*, then update every note it affects in the same sitting.
3. **Changing a decision** → edit the ADR's Decision section, set `updated:`, add one line to [[Change Log]]. No superseded copies are kept.
4. **Open items** live only in [[Open Questions]]; when closed they become an ADR or a note edit.
5. **Tasks** live only on the [[Build Board]].

## Now
- **Sat 10 Oct:** pivot locked and the whole vault rewritten (see [[Change Log]]). MVP locked: Claude + MetaMask + marketplace + faked verified experts; question → evaluation → one approval → automatic payment → response → [[MVP Scope]]. First task: T-09 MetaMask x402 spike, go/no-go 14:00.
