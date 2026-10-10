---
type: adr
id: ADR-010
status: Accepted
updated: 2026-10-10
---
# ADR-010 Buyer connector in Claude

## Context
Buyers live in web assistants. Claude accepts remote MCP connectors on every plan (free: one). ChatGPT personal plans allow connectors read-only; payments need Business/Enterprise/Edu.

## Decision
The connector is a **hosted remote MCP server** added to **Claude** with a **private per-buyer link** (`/mcp/<token>`, hashed, bound to wallet and permission, rotate/revoke). ChatGPT is roadmap — Mitko's flow assumes ChatGPT; check its payment rules before any slide claims it ([[Open Questions]]).

## Consequences
Works on Claude's free plan with no login screens. The link is a bearer secret capped by the on-chain limit. OAuth is roadmap.

## Rejected
Local Claude Desktop connector; OAuth for the weekend; ChatGPT-first.
