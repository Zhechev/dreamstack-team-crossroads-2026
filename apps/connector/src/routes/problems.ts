// Problem wallets: budget state for the Lovable approval page + gasless funding (ADR-011). Owner: Kris (ticket 11).
import { Hono } from "hono";

export const problems = new Hono();

problems.get("/:id", (c) => c.json({ error: "not_implemented", ticket: 11 }, 501));
problems.post("/:id/fund", (c) => c.json({ error: "not_implemented", ticket: 11 }, 501));
