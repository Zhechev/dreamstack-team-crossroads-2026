# 01: Monorepo skeleton + protocol schemas

**Owner:** Kris · **Built with:** Claude Code · **Runs on:** pnpm workspace (Node 22)
**Build Board:** T-01, T-02

**What to build:** A fresh clone installs, builds and tests in one command. The shared protocol package defines the messages every other part speaks: Evaluation, Manifest, SignedOutcome (with citations `{unit_id, quote, as_of}` and identity placeholders), Receipt. The connector service and Supabase work import from it, so nobody re-types these shapes.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] pnpm workspace next to `docs/`, MIT licence, `.env.example` listing every key the project needs (no values), README stub with run steps
- [x] Protocol package exports zod schemas for Evaluation, Manifest, SignedOutcome, Receipt, matching the Data Model note field for field
- [x] Tests: a valid example of each message parses; a citation missing `as_of` or `unit_id` is rejected
- [x] `pnpm install && pnpm build && pnpm test` is green from a clean clone
- [x] No `apps/web` content: that folder is reserved for the Lovable import (ticket 20)
