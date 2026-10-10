# 19: Terms v1 text + hash

**Owner:** Mitko · **Built with:** Manual writing (hash via Claude Code script) · **Runs on:** repo + Supabase terms_versions
**Build Board:** T-11

**What to build:** Every order and receipt references a real Terms v1 hash instead of a placeholder. The text is short and plain, and covers: price check is not an appraisal, citations with as-of dates, the citation check and its effect on settlement, demo experts are fictional, testnet only.

**Blocked by:** None (can start immediately)

**Status:** ready-for-human

- [ ] Terms v1 text in the repo, consistent with Trust & Legal and ADR-014
- [ ] Hash computed by a script and stored in terms_versions; connector config uses it
- [ ] Receipts (ticket 12) show the real hash
