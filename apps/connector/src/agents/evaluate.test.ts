import { Evaluation } from "@citable/protocol";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { loadConfig } from "../config.js";
import type { AgentConfig } from "./load.js";
import { evaluate } from "./evaluate.js";

const lozenets: AgentConfig = {
  id: "22222222-0000-4000-8000-000000000001",
  slug: "lozenets-price-check",
  name: "Lozenets Price Check",
  vertical: "real-estate",
  area: "Sofia / Lozenets",
  version: 3,
  sources: [],
  rules: [],
  payout_address: "0x00000000000000000000000000000000000de001",
  signing_address: null,
  capabilities: [
    { slug: "price-check", tier: 1, name: "Price check", deliverable: "Fair price range + 5 comparable sales, last 90 days, each cited", price: "0.50", is_live: true },
    { slug: "human-review", tier: 2, name: "Human review", deliverable: "Expert check", price: "20.00", is_live: false },
  ],
};

const now = new Date("2026-10-10T12:00:00Z");

describe("evaluate", () => {
  it("can answer the demo question for 0.50 with an expiry", () => {
    const e = evaluate(lozenets, "Is €180k fair for a 2-bed in Lozenets?", now);
    expect(e).toEqual({
      agent_id: "lozenets-price-check",
      can_answer: true,
      deliverable: "Fair price range + 5 comparable sales, last 90 days, each cited",
      price: "0.50",
      expires_at: "2026-10-10T12:15:00.000Z",
    });
  });

  it.each([
    ["a car price", "How much is a used Golf in Sofia?"],
    ["another district", "Is €150k fair for a 2-bed in Mladost?"],
    ["no property", "What is the weather in Lozenets?"],
  ])("cannot answer %s, and quotes no price", (_, question) => {
    const e = evaluate(lozenets, question, now);
    expect(e.can_answer).toBe(false);
    expect(e.price).toBe("0.00");
    expect(e.deliverable).toMatch(/^Out of scope/);
  });

  it("matches the area regardless of case and accents", () => {
    expect(evaluate(lozenets, "price per m² in LOZENETS", now).can_answer).toBe(true);
    expect(evaluate(lozenets, "2-bedroom flat, Lozénets", now).can_answer).toBe(true);
  });

  it("cannot answer when no tier 1 capability is live", () => {
    const offline = { ...lozenets, capabilities: lozenets.capabilities.map((c) => ({ ...c, is_live: false })) };
    expect(evaluate(offline, "2-bed in Lozenets", now).can_answer).toBe(false);
  });
});

describe("POST /agents/:id/evaluate", () => {
  const app = createApp(loadConfig({}), { loadAgent: async (id) => (id === lozenets.slug ? lozenets : null) });
  const post = (id: string, body: unknown) =>
    app.request(`/agents/${id}/evaluate`, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });

  it("returns a valid Evaluation without any payment", async () => {
    const res = await post("lozenets-price-check", { question: "Is €180k fair for a 2-bed in Lozenets?" });
    expect(res.status).toBe(200);
    expect(Evaluation.parse(await res.json()).can_answer).toBe(true);
  });

  it("404s for an unknown agent and 400s without a question", async () => {
    expect((await post("nobody", { question: "2-bed in Lozenets" })).status).toBe(404);
    expect((await post("lozenets-price-check", {})).status).toBe(400);
  });
});
