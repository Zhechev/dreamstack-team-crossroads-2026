// The MCP tools Claude sees (Buyer Connector note). Flow: find_expert → evaluate (free) → approve_budget → ask.
import { Evaluation } from "@citable/protocol";
import { McpServer, type CallToolResult } from "@modelcontextprotocol/server";
import { z } from "zod";
import type { ExpertSearch } from "./search.js";

/** Calls an expert agent's free evaluation route and returns its Evaluation unchanged, or null if the agent is unknown. */
export type AgentEvaluator = (agentId: string, question: string) => Promise<Evaluation | null>;

export interface McpDeps {
  searchExperts: ExpertSearch;
  evaluateAgent: AgentEvaluator;
}

const INSTRUCTIONS = `Citable connects you to expert-verified agents that answer with cited sources, each figure with a source and an as-of date.
Flow for a buyer's question:
1. find_expert — show the buyer the top agents (name, expert, badge, rating, price). Mention a demo label if present.
2. evaluate — free. Tell the buyer whether the agent can answer, what they will get and the price.
3. Before anything is paid, the buyer must approve a budget (a hard cap) — never pay without it.
Prices are in USDC. Say "price check", never "appraisal" or "valuation".`;

const json = (value: unknown): CallToolResult => ({
  content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
  structuredContent: value as Record<string, unknown>,
});

const error = (text: string): CallToolResult => ({ content: [{ type: "text", text }], isError: true });

export function buildMcpServer(deps: McpDeps): McpServer {
  const server = new McpServer({ name: "citable", version: "0.1.0" }, { instructions: INSTRUCTIONS });

  server.registerTool(
    "find_expert",
    {
      title: "Find expert agents",
      description:
        "Find the top 3 expert-verified agents for the buyer's question, best match first. Free. " +
        "Next step: call evaluate on the best match before suggesting any payment.",
      inputSchema: z.object({
        question: z.string().min(1).describe("The buyer's question in their own words"),
        budget: z
          .string()
          .regex(/^\d+(\.\d{1,6})?$/)
          .optional()
          .describe('Optional maximum price per answer in USDC, e.g. "2.00"'),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ question, budget }) => {
      const agents = await deps.searchExperts(question, budget);
      if (agents.length === 0) return json({ agents, note: "No verified agent covers this yet." });
      return json({ agents });
    },
  );

  server.registerTool(
    "evaluate",
    {
      title: "Free evaluation",
      description:
        "Ask an agent, for free, whether it can answer the question, what it will deliver and at what price. " +
        "Show the result to the buyer. If can_answer is true, the next step is asking the buyer to approve a budget; nothing is paid here.",
      inputSchema: z.object({
        agent_id: z.string().min(1).describe("agent_id from find_expert"),
        question: z.string().min(1).describe("The buyer's question"),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ agent_id, question }) => {
      const evaluation = await deps.evaluateAgent(agent_id, question);
      if (!evaluation) return error(`No agent "${agent_id}". Use an agent_id from find_expert.`);
      return json(evaluation);
    },
  );

  return server;
}
