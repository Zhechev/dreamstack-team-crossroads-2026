// One hosted service (ADR-007): /mcp for Claude, /agents/:id/... for the expert agents,
// /problems/:id for budget state read by the Lovable approval page.
import { Hono } from "hono";
import type { Config } from "./config.js";
import { agents } from "./routes/agents.js";
import { mcp } from "./routes/mcp.js";
import { problems } from "./routes/problems.js";

export function createApp(_config: Config) {
  const app = new Hono();
  app.get("/health", (c) => c.json({ ok: true }));
  app.route("/mcp", mcp);
  app.route("/agents", agents);
  app.route("/problems", problems);
  return app;
}
