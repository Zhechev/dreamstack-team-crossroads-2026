# 24: Demo split screen — no inline cards, live earnings page

**Owner:** Kris · **Built with:** Claude Code · **Runs on:** connector service (Render)
**Build Board:** supports T-13 video

**What to build:** The demo is a split screen: Claude on the left (question → `find_expert` → evaluate → ask → cited answer as plain text), and on the right the expert's money landing. Ticket 23's MCP Apps cards are removed so Claude answers in text. The connector serves a live earnings page per agent at `/earnings/:agent` (id or slug) that polls `/earnings/:agent/feed` every 2 s: payout-wallet USDC balance (Base Sepolia), total earned, answers sold, and incoming payments with question, amount and tx hash. A new payment slides in with a "+0.50 USDC" toast.

**Blocked by:** 12 (ask)

**Status:** done

- [x] MCP Apps view and `find_expert` UI link removed (ticket 23 reverted)
- [x] `/earnings/:agent` page + `/earnings/:agent/feed` JSON; real settlements only (`is_demo` and unsettled orders excluded)
- [x] Buyer text reaches the page only via `textContent`; JSON in the page is `<`-escaped
- [x] Route tests + local Supabase test

**Demo:** open `https://citable-connector.onrender.com/earnings/lozenets-price-check` next to Claude.
