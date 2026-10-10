// Buyer connector: remote MCP server for Claude at /mcp/<token> (ADR-010). Owner: Kris (tickets 10–12).
import { createMcpHandler } from "@modelcontextprotocol/server";
import { Hono } from "hono";
import type { LinkVerifier } from "../mcp/links.js";
import { buildMcpServer, type McpDeps } from "../mcp/server.js";

export function createMcpRoutes(deps: McpDeps & { verifyLink: LinkVerifier }) {
  // Stateless: a fresh server per request, bound to the link verified below, so any instance can serve any call.
  const handler = createMcpHandler(({ authInfo }) => {
    if (!authInfo?.clientId) throw new Error("MCP request without a verified connector link");
    return buildMcpServer(deps, { id: authInfo.clientId, owner_address: (authInfo.extra?.ownerAddress as string | null) ?? null });
  });
  const mcp = new Hono();

  mcp.all("/:token", async (c) => {
    const token = c.req.param("token");
    const link = await deps.verifyLink(token);
    if (!link) return c.json({ error: "Unknown or revoked connector link" }, 401);
    return handler.fetch(c.req.raw, {
      authInfo: { token, clientId: link.id, scopes: [], extra: { ownerAddress: link.owner_address } },
    });
  });

  return mcp;
}
