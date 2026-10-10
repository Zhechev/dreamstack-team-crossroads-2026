// Buyer connector: remote MCP server for Claude at /mcp/<token>. Owner: Kris (tickets 10–12).
import { Hono } from "hono";

export const mcp = new Hono();

mcp.all("/:token", (c) => c.json({ error: "not_implemented", ticket: 10 }, 501));
