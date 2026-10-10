# 28: Demo follow-ups — renovation and lawyer experts

**Owner:** Kris · **Built with:** Claude Code · **Runs on:** connector + Supabase (local and hosted)
**Build Board:** supports T-13 video

**What to build:** The demo conversation continues after *"Is 180k fair for a 2-bedroom in Lozenets?"* with two follow-ups, each answered and paid to a different expert from the same budget:
1. *"What will be the average price of a full bathroom renovation of 8 sq meters by local experts?"* → Stoyan Kolev, renovation contractor (`sofia-renovation-price-check`).
2. *"What is a fair price for having a lawyer draft a preliminary contract for the purchase of a property?"* → Desislava Nikolova, property lawyer (`sofia-property-lawyer-fees`), a fee check: fees only, never legal advice (ADR-014).

**Blocked by:** 24

**Status:** done

- [x] Knowledge: job records (`jobs`, "Completed job … Final price €X (€Y/m²) on DATE"), two data files
- [x] `supabase/seed_services.sql` (re-runnable): experts, agents, versions, capabilities, rating history
- [x] `evaluate` per vertical; the grounded answerer prices jobs (range, average, per m², scaled to the size asked)
- [x] MCP instructions + `find_expert` cover renovation and lawyer costs, and say to search again per question
- [x] Tests: unit + local Supabase (search ranks the right expert first; paid answers pass the citation check)

**Earnings pages:** `/earnings/sofia-renovation-price-check`, `/earnings/sofia-property-lawyer-fees`.
