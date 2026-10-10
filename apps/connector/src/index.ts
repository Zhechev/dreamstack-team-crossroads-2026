import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";

const config = loadConfig();

// One line per request; connector tokens are redacted, MCP calls show their method and tool.
const app = new Hono();
app.use("*", async (c, next) => {
  const started = Date.now();
  const path = c.req.path.replace(/\/mcp\/[^/]+/, "/mcp/<token>");
  let rpc = "";
  if (path.startsWith("/mcp/") && c.req.method === "POST") {
    const body = await c.req.raw.clone().json().catch(() => null);
    const msgs = Array.isArray(body) ? body : body ? [body] : [];
    rpc = " " + msgs.map((m) => m.method + (m.params?.name ? `:${m.params.name}` : "")).join(",");
  }
  await next();
  console.log(`${new Date().toISOString()} ${c.req.method} ${path}${rpc} → ${c.res.status} ${Date.now() - started}ms`);
});
app.route("/", createApp(config));

serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
  console.log(`connector listening on http://localhost:${port}`);
});
