import { describe, expect, it } from "vitest";
import type { AgentConfig } from "../agents/load.js";
import { createApp } from "../app.js";
import { loadConfig } from "../config.js";
import { hashToken } from "./links.js";
import type { ExpertMatch } from "./search.js";

const TOKEN = "ctb_" + "a".repeat(43);

const agent: AgentConfig = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "lozenets-price-check",
  name: "Lozenets Price Check",
  vertical: "real-estate",
  area: "Sofia / Lozenets",
  version: 1,
  sources: [],
  rules: [],
  payout_address: "0x000000000000000000000000000000000000dEaD",
  signing_address: null,
  capabilities: [
    { slug: "price-check", tier: 1, name: "Price check", deliverable: "Fair price range + 5 comparable sales", price: "0.50", is_live: true },
  ],
};

const match: ExpertMatch = {
  agent_id: "lozenets-price-check",
  name: "Lozenets Price Check",
  expert: "Elena Petrova",
  area: "Sofia / Lozenets",
  badge: "Expert Verified (v1)",
  rating: 4.8,
  rating_count: 12,
  capabilities: [{ tier: 1, name: "Price check", price: "0.50", price_is_minimum: false, available_now: true }],
};

const searches: { question: string; budget?: string }[] = [];
const app = createApp(loadConfig({}), {
  verifyLink: async (token) => (token === TOKEN ? { id: "link-1", owner_address: null } : null),
  searchExperts: async (question, budget) => {
    searches.push({ question, budget });
    return [match];
  },
  loadAgent: async (id) => (id === agent.slug ? agent : null),
});

let nextId = 1;
async function rpc(method: string, params: unknown = {}, token = TOKEN) {
  const res = await app.request(`/mcp/${token}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "mcp-protocol-version": "2025-06-18",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  });
  const text = await res.text();
  // Streamable HTTP may answer as SSE: take the JSON from the data line.
  const body = text.startsWith("{") ? text : text.split("\n").find((l) => l.startsWith("data: "))?.slice(6);
  return { status: res.status, body: body ? JSON.parse(body) : undefined };
}

const call = (name: string, args: Record<string, unknown>) => rpc("tools/call", { name, arguments: args });

describe("MCP connector", () => {
  it("rejects an unknown or revoked link", async () => {
    const { status } = await rpc("tools/list", {}, "ctb_" + "b".repeat(43));
    expect(status).toBe(401);
  });

  it("initializes with instructions for Claude", async () => {
    const { body } = await rpc("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "test", version: "0" },
    });
    expect(body.result.serverInfo.name).toBe("citable");
    expect(body.result.instructions).toMatch(/approve_budget/);
  });

  it("lists the buyer tools", async () => {
    const { body } = await rpc("tools/list");
    expect(body.result.tools.map((t: { name: string }) => t.name).sort()).toEqual(["approve_budget", "budget_status", "evaluate", "find_expert"]);
  });

  it("find_expert returns the top agents from search", async () => {
    const { body } = await call("find_expert", { question: "Is 180k EUR fair for a 2-bed in Lozenets?", budget: "2.00" });
    expect(body.result.structuredContent).toEqual({ agents: [match] });
    expect(searches.at(-1)).toEqual({ question: "Is 180k EUR fair for a 2-bed in Lozenets?", budget: "2.00" });
  });

  it("evaluate returns the agent's Evaluation unchanged", async () => {
    const question = "Is 180k EUR fair for a 2-bed in Lozenets?";
    const { body } = await call("evaluate", { agent_id: agent.slug, question });
    const direct = await app.request(`/agents/${agent.slug}/evaluate`, {
      method: "POST",
      body: JSON.stringify({ question }),
    });
    const { expires_at: _a, ...fromTool } = body.result.structuredContent;
    const { expires_at: _b, ...fromRoute } = await direct.json();
    expect(fromTool).toEqual(fromRoute);
    expect(fromTool).toMatchObject({ agent_id: agent.slug, can_answer: true, price: "0.50" });
  });

  it("evaluate reports an unknown agent as a tool error", async () => {
    const { body } = await call("evaluate", { agent_id: "nope", question: "anything" });
    expect(body.result.isError).toBe(true);
  });
});

it("hashes tokens like the Edge Functions (0x + sha256 hex)", () => {
  expect(hashToken("ctb_x")).toMatch(/^0x[0-9a-f]{64}$/);
});
