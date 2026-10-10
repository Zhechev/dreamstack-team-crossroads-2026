// One hosted service (ADR-007): /mcp for Claude, /agents/:id/... for the expert agents,
// /problems/:id for budget state read by the Lovable approval page.
import { createClient } from "@supabase/supabase-js";
import { Hono } from "hono";
import type { Config } from "./config.js";
import { supabaseAgentLoader, type AgentLoader } from "./agents/load.js";
import { createAgentRoutes } from "./routes/agents.js";
import { mcp } from "./routes/mcp.js";
import { problems } from "./routes/problems.js";

/** Collaborators the routes need; tests pass fakes, production builds them from config. */
export type AppDeps = {
  loadAgent: AgentLoader;
};

export function createApp(config: Config, deps: Partial<AppDeps> = {}) {
  const loadAgent = deps.loadAgent ?? lazySupabaseLoader(config);

  const app = new Hono();
  app.get("/health", (c) => c.json({ ok: true }));
  app.route("/mcp", mcp);
  app.route("/agents", createAgentRoutes({ loadAgent }));
  app.route("/problems", problems);
  return app;
}

// Built on first use, so the service (and its tests) start without Supabase keys.
function lazySupabaseLoader(config: Config): AgentLoader {
  let loader: AgentLoader | undefined;
  return (idOrSlug) => {
    if (!loader) {
      if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
        throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example)");
      }
      const db = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, { auth: { persistSession: false } });
      loader = supabaseAgentLoader(db);
    }
    return loader(idOrSlug);
  };
}
