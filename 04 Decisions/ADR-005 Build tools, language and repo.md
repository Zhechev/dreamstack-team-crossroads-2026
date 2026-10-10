---
type: adr
id: ADR-005
status: Accepted
updated: 2026-10-09
---
# ADR-005 Build tools, language and repo

## Context
Sponsors require Lovable and Claude Code; the official x402 and MCP SDKs are TypeScript; the team is strongest in Laravel but Claude Code writes most code.

## Decision
Build the web app with **Lovable** and everything else with **Claude Code**, in **TypeScript** (Node 22, pnpm monorepo), Solidity with **Foundry**. Public repo, **MIT**, runs with your own API keys.

## Consequences
One language end to end; Laravel skills used for review. README must cover keys, faucets, Claude connector setup and corpus seeding.

## Rejected
Laravel backend; mixed-language repo.
