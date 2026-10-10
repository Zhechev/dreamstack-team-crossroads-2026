// Expert agent routes, paywalled with x402 (formerly Stall, ADR-007). Owner: Mitko (tickets 07–09).
// Pattern for the paid route: spikes/03-x402-problem-wallet/server.ts. A failed citation check returns 422 → never settled.
import { Hono, type MiddlewareHandler } from "hono";
import { NoAnswerError } from "../agents/answer.js";
import { checkCitations } from "../agents/citationCheck.js";
import type { AgentDeps } from "../agents/deps.js";
import { evaluate } from "../agents/evaluate.js";
import type { AgentConfig } from "../agents/load.js";
import { OrderError } from "../agents/orders.js";
import { priceCheckPaywall, settlementOf } from "../agents/payments.js";
import { runPriceCheck } from "../agents/priceCheck.js";

type Env = { Variables: { agent: AgentConfig; orderId?: string } };

export function createAgentRoutes(deps: AgentDeps) {
  const agents = new Hono<Env>();

  // Free: no payment middleware on this route (ticket 07).
  agents.post("/:id/evaluate", async (c) => {
    const body = await c.req.json().catch(() => null);
    const question = body?.question;
    if (typeof question !== "string" || question.trim() === "") {
      return c.json({ error: "question is required" }, 400);
    }
    const agent = await deps.loadAgent(c.req.param("id"));
    if (!agent) return c.json({ error: "agent not found" }, 404);
    return c.json(evaluate(agent, question));
  });

  // Unknown agents and malformed requests are turned away before anyone is asked to pay.
  const requirePriceCheck: MiddlewareHandler<Env> = async (c, next) => {
    const agent = await deps.loadAgent(c.req.param("id")!);
    if (!agent) return c.json({ error: "agent not found" }, 404);
    if (!agent.capabilities.some((cap) => cap.slug === "price-check" && cap.is_live)) {
      return c.json({ error: "price check is not available for this agent" }, 409);
    }
    const body = await c.req.json().catch(() => null);
    if (typeof body?.question !== "string" || body.question.trim() === "") {
      return c.json({ error: "question is required" }, 400);
    }
    c.set("agent", agent);
    await next();
  };

  // Wraps the paywall: once it has settled, the order gets the tx hash and becomes delivered.
  const recordSettlement: MiddlewareHandler<Env> = async (c, next) => {
    await next();
    const orderId = c.get("orderId");
    const settlement = c.res.status < 400 ? settlementOf(c.res) : null;
    if (orderId && settlement) await deps.orders.settled(orderId, settlement.transaction, settlement.payer);
  };

  agents.post(
    "/:id/price-check",
    requirePriceCheck,
    recordSettlement,
    priceCheckPaywall({ loadAgent: deps.loadAgent, facilitator: deps.facilitator }),
    async (c) => {
      const agent = c.get("agent");
      const { question, order_id } = await c.req.json();
      try {
        const order = await deps.orders.start({ agent, capability: "price-check", question, orderId: order_id });
        const outcome = await runPriceCheck(deps, { agent, question, orderId: order.id });

        // Ticket 09: check every citation before the middleware settles. 422 → never settled.
        const check = await checkCitations(deps.lookupUnits, { agent, orderId: order.id, outcome });
        if (!check.ok) {
          await deps.orders.failedCheck({ orderId: order.id, agent, capability: "price-check", outcome, failures: check.failures });
          return c.json({ error: "citation_check_failed", order_id: order.id, failures: check.failures }, 422);
        }

        await deps.orders.answered(order.id, outcome, true);
        c.set("orderId", order.id);
        return c.json(outcome);
      } catch (e) {
        // 4xx/5xx here means the middleware never settles: the buyer is not charged.
        if (e instanceof OrderError) return c.json({ error: e.message }, e.status);
        if (e instanceof NoAnswerError) return c.json({ error: "no_answer", reason: e.message }, 422);
        throw e;
      }
    },
  );

  return agents;
}
