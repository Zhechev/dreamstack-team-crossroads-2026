# 20: End-to-end run, Lovable import + fresh-clone README

**Owner:** Both · **Built with:** Claude Code + manual testing · **Runs on:** Claude web + MetaMask + all deployed services
**Build Board:** T-12

**What to build:** The full demo works twice in a row from Claude: question → free evaluation → one approval → automatic payment → cited response → close with refund. The public monorepo contains the Lovable app under `apps/web`, and a stranger can run everything from the README with their own keys.

**Blocked by:** 09 (Citation check before settle), 12 (ask + close_problem), 14 (Browse + agent page), 15 (Budget approval page)

**Status:** ready-for-human

- [ ] Two clean runs of the Demo Story in Claude web with a fresh buyer wallet; issues found become fixes or cuts
- [ ] Sun 09:00 cut order applied if needed, and the vault's MVP Scope updated to match
- [ ] Lovable repo imported into `apps/web` (subtree or copy), done when nobody is prompting Lovable
- [ ] README: keys, faucets, Supabase setup + seeding, deploy, adding the connector in Claude
- [ ] Fresh-clone test passes on a second machine
