// One hosted service (ADR-007): /mcp for Claude, /agents/:id/... for the expert agents,
// /problems/:id for budget state read by the Lovable approval page.
import { Evaluation } from "@citable/protocol";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Hono } from "hono";
import type { Config } from "./config.js";
import { defaultAgentDeps, type AgentDeps } from "./agents/deps.js";
import { supabaseAgentLoader } from "./agents/load.js";
import { supabaseLinkVerifier, type LinkVerifier } from "./mcp/links.js";
import { supabaseExpertSearch, type ExpertSearch } from "./mcp/search.js";
import { createAgentRoutes } from "./routes/agents.js";
import { createDiscoveryRoutes } from "./routes/discovery.js";
import { createMcpRoutes } from "./routes/mcp.js";
import { baseSepoliaChain, type Chain } from "./problems/chain.js";
import { x402AgentPayer, type AgentPayer } from "./problems/pay.js";
import { createProblems, type ProblemsDeps } from "./problems/service.js";
import { supabaseProblemStore, type ProblemStore } from "./problems/store.js";
import { createProblemRoutes } from "./routes/problems.js";

/** Collaborators the routes need; tests pass fakes, production builds them from config. */
export type AppDeps = AgentDeps & {
  verifyLink: LinkVerifier;
  searchExperts: ExpertSearch;
  problemStore: ProblemStore;
  chain: Chain;
  agentPayer: AgentPayer;
  unitSources: ProblemsDeps["unitSources"];
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
  const store = lazy(() => deps.problemStore ?? supabaseProblemStore(db()));
  const chain =
    deps.chain ?? baseSepoliaChain({ rpcUrl: config.rpcUrl, usdcAddress: config.usdcAddress, gasFunderKey: config.gasFunderKey });
  const problems = createProblems({
    store: {
      create: (p) => store().create(p),
      get: (id) => store().get(id),
      latestOpen: (id) => store().latestOpen(id),
      markFunded: (id, f) => store().markFunded(id, f),
      setGasSeed: (id, tx) => store().setGasSeed(id, tx),
      addPayment: (id, p) => store().addPayment(id, p),
      markClosed: (id, r) => store().markClosed(id, r),
    },
    chain,
    usdc: { chainId: config.chainId, usdcAddress: config.usdcAddress },
    get walletSecret() {
      if (!config.problemWalletSecret) throw new Error("Set PROBLEM_WALLET_SECRET (see .env.example)");
      return config.problemWalletSecret;
    },
    webAppUrl: config.webAppUrl,
    // ask pays this service's own agent routes over real x402 (in-process fetch, real facilitator).
    payer: deps.agentPayer ?? x402AgentPayer(async (input, init) => app.fetch(new Request(input, init))),
    unitSources: deps.unitSources ?? ((ids) => unitSourcesFrom(db(), ids)),
  });
  // Expert agent routes (tickets 07–09): defaults share the client and agent loader above.
  const agentDeps = withDefaults(defaultAgentDeps(config, { db, loadAgent }), deps);

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
  // Before /mcp/:token, so /mcp/server-card isn't taken for a token.
  app.route("/", createDiscoveryRoutes({ publicUrl: config.publicUrl, webAppUrl: config.webAppUrl }));
  app.route("/mcp", createMcpRoutes({ verifyLink, searchExperts, evaluateAgent, problems }));
  app.route("/agents", createAgentRoutes(agentDeps));
  app.route("/problems", createProblemRoutes({ problems, verifyLink, allowedOrigins: config.allowedOrigins }));
  return app;
}

async function unitSourcesFrom(db: SupabaseClient, ids: string[]) {
  const { data, error } = await db.from("units").select("id, source, source_url").in("id", ids);
  if (error) throw new Error(`unit sources: ${error.message}`);
  return new Map((data ?? []).map((u) => [u.id as string, { source: u.source as string, source_url: u.source_url as string | null }]));
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

// Keep the lazy getters of the agent defaults; only replace the agent deps the caller passed.
function withDefaults(defaults: AgentDeps, overrides: Partial<AppDeps>): AgentDeps {
  const merged = Object.create(defaults) as AgentDeps;
  for (const key of Object.keys(defaults) as (keyof AgentDeps)[]) {
    const value = overrides[key];
    if (value !== undefined) Object.defineProperty(merged, key, { value, enumerable: true });
  }
  if (overrides.now) Object.defineProperty(merged, "now", { value: overrides.now, enumerable: true });
  return merged;
}
