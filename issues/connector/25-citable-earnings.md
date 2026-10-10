# 25: Citable earnings page

**Owner:** Kris · **Built with:** Claude Code · **Runs on:** connector service (Render)
**Build Board:** supports T-13 video

**What to build:** The Citable side of the split-screen demo, next to the expert page from ticket 24. `/earnings` shows Citable's fee on every real settled order across all agents, at the ADR-016 take rate (30% tier 1, 10% tiers 2–3): fees earned, paid to experts, answers sold, experts earning, and incoming fees with expert, split and tx hash. Live via `/earnings/feed` every 2 s. The fee is computed, not collected (ADR-016 MVP: one transfer per order).

**Blocked by:** 24

**Status:** done

- [x] `/earnings` page + `/earnings/feed` JSON (registered before `/:agent`)
- [x] Expert and Citable pages share one renderer
- [x] Route tests + local Supabase test
