// Expert agent routes, paywalled with x402 (formerly Stall, ADR-007). Owner: Mitko (tickets 07–09).
// Pattern for the paid route: spikes/03-x402-problem-wallet/server.ts. A failed citation check returns 422 → never settled.
import { Hono } from "hono";

export const agents = new Hono();

agents.post("/:id/evaluate", (c) => c.json({ error: "not_implemented", ticket: 7 }, 501));
agents.post("/:id/price-check", (c) => c.json({ error: "not_implemented", ticket: 8 }, 501));
