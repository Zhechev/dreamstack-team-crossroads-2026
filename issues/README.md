# Citable MVP tickets

One file per ticket, grouped by platform. Numbers are global and in dependency order (a ticket only depends on lower numbers). Pick any ticket whose blockers are done.

| # | Ticket | Owner | Built with | Blocked by |
|---|---|---|---|---|
| 01 | Monorepo skeleton + protocol schemas | Kris | Claude Code | — |
| 02 | Vault update: Stall merged into connector | Kris | Claude Code | — |
| 03 | Spike: problem wallet pays x402 | Kris | Claude Code | — |
| 04 | Supabase schema, RLS + seeded demo experts | Mitko | Claude Code | 01 |
| 05 | Knowledge units + hybrid search | Mitko | Claude Code | 04 |
| 06 | Edge Functions: search, orders, connector links | Mitko | Claude Code | 04 |
| 07 | Expert agent route: free evaluation | Mitko | Claude Code | 01, 04 |
| 08 | Expert agent route: paid price check (x402) | Mitko | Claude Code | 03, 05, 07 |
| 09 | Citation check before settle | Mitko | Claude Code | 08 |
| 10 | MCP connector in Claude: find_expert + evaluate | Kris | Claude Code | 06, 07 |
| 11 | approve_budget + budget_status | Kris | Claude Code | 03, 10 |
| 12 | ask + close_problem | Kris | Claude Code | 08, 11 |
| 13 | Lovable project setup + landing | Kris | Lovable | 01, 04 |
| 14 | Browse + agent page | Kris | Lovable | 13 |
| 15 | Budget approval page (MetaMask) | Kris | Lovable | 11, 13 |
| 16 | Buyer setup: connector link | Kris | Lovable | 06, 10, 13 |
| 17 | Receipt view | Kris | Lovable | 12, 15 |
| 18 | Expert console mock | Kris | Lovable | 14 |
| 19 | Terms v1 text + hash | Mitko | Manual | — |
| 20 | End-to-end run, Lovable import, fresh-clone README | Both | Claude Code + manual | 09, 12, 14, 15 |
| 21 | Video, slides + submit | Both | Manual | 20 |

Rules: Lovable has its own synced repo (web app only, never creates or alters Supabase tables) and is imported into `apps/web` in ticket 20. Claude Code owns everything else.
