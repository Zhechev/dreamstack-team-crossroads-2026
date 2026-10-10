// One hosted service (ADR-007): /mcp for Claude, /agents/:id/... for the expert agents,
// /problems/:id for budget state read by the Lovable approval page.
import { Evaluation } from "@citable/protocol";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Hono } from "hono";
import type { Config } from "./config.js";
import { supabaseAgentLoader, type AgentLoader } from "./agents/load.js";
import { supabaseLinkVerifier, type LinkVerifier } from "./mcp/links.js";
import { supabaseExpertSearch, type ExpertSearch } from "./mcp/search.js";
import { createAgentRoutes } from "./routes/agents.js";
import { createMcpRoutes } from "./routes/mcp.js";
import { problems } from "./routes/problems.js";

/** Collaborators the routes need; tests pass fakes, production builds them from config. */
export type AppDeps = {
  loadAgent: AgentLoader;
  verifyLink: LinkVerifier;
  searchExperts: ExpertSearch;
};

export function createApp(config: Config, deps: Partial<AppDeps> = {}) {
  // Built on first use, so the service (and its tests) start without Supabase keys.
  const db = lazy(() => supabaseFrom(config));
  const agentLoader = lazy(() => supabaseAgentLoader(db()));
  const linkVerifier = lazy(() => supabaseLinkVerifier(db()));
  const expertSearch = lazy(() => supabaseExpertSearch(db()));
  const loadAgent = deps.loadAgent ?? ((id) => agentLoader()(id));
  const verifyLink = deps.verifyLink ?? ((token) => linkVerifier()(token));
  const searchExperts = deps.searchExperts ?? ((q, budget) => expertSearch()(q, budget));

  const app = new Hono();

  // The connector calls the agent routes over HTTP, as it would an outside agent (ADR-007).
  // In-process for now; ask (ticket 12) pays the same routes over x402.
  const evaluateAgent = async (agentId: string, question: string) => {
    const res = await app.request(`/agents/${encodeURIComponent(agentId)}/evaluate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`evaluate ${agentId}: HTTP ${res.status}`);
    return Evaluation.parse(await res.json());
  };

  app.get("/health", (c) => c.json({ ok: true }));
  app.route("/mcp", createMcpRoutes({ verifyLink, searchExperts, evaluateAgent }));
  app.route("/agents", createAgentRoutes({ loadAgent }));
  app.route("/problems", problems);
  return app;
}

const lazy = <T>(make: () => T) => {
  let value: T | undefined;
  return () => (value ??= make());
};

function supabaseFrom(config: Config): SupabaseClient {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example)");
  }
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, { auth: { persistSession: false } });
}
