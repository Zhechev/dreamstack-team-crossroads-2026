// Expert agent routes, paywalled with x402 (formerly Stall, ADR-007). Owner: Mitko (tickets 07–09).
// Pattern for the paid route: spikes/03-x402-problem-wallet/server.ts. A failed citation check returns 422 → never settled.
import { Hono } from "hono";
import { evaluate } from "../agents/evaluate.js";
import type { AgentLoader } from "../agents/load.js";

export function createAgentRoutes({ loadAgent }: { loadAgent: AgentLoader }) {
  const agents = new Hono();

  // Free: no payment middleware on this route (ticket 07).
  agents.post("/:id/evaluate", async (c) => {
    const body = await c.req.json().catch(() => null);
    const question = body?.question;
    if (typeof question !== "string" || question.trim() === "") {
      return c.json({ error: "question is required" }, 400);
    }
    const agent = await loadAgent(c.req.param("id"));
    if (!agent) return c.json({ error: "agent not found" }, 404);
    return c.json(evaluate(agent, question));
  });

  agents.post("/:id/price-check", (c) => c.json({ error: "not_implemented", ticket: 8 }, 501));

  return agents;
}
