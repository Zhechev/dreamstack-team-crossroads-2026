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
The connector is a **hosted remote MCP server** added to **Claude** with a **private per-buyer link** (`/mcp/<token>`, hashed, bound to wallet and permission, rotate/revoke). **ChatGPT is not in the demo or on the slides** (checked 2026-10-10, [[Fact Check 2026-10-10]]): write-capable custom MCP apps are a Business/Enterprise/Edu beta enabled by admins, and ChatGPT has no x402 or agent-to-service payment. Slide line: *"Works in Claude today — every plan, Free included. Any assistant with MCP connectors next."*

## Consequences
Works on Claude's free plan with no login screens. The link is a bearer secret capped by the on-chain limit. OAuth is roadmap.

## Rejected
Local Claude Desktop connector; OAuth for the weekend; ChatGPT-first.
