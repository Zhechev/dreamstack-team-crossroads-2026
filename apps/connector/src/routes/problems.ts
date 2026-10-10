// Problem wallets: budget state for the Lovable approval page + gasless funding (ADR-011). Owner: Kris (ticket 11).
import { Hono } from "hono";
import { cors } from "hono/cors";
import { FundingError } from "../problems/authorization.js";
import type { Problems } from "../problems/service.js";

/** Lovable preview and hosted domains, localhost, plus anything in ALLOWED_ORIGINS. */
export function allowOrigin(extra: string[]) {
  return (origin: string) => {
    if (extra.includes(origin)) return origin;
    try {
      const { hostname } = new URL(origin);
      const ok =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.endsWith(".lovable.app") ||
        hostname.endsWith(".lovableproject.com");
      return ok ? origin : null;
    } catch {
      return null;
    }
  };
}

export function createProblemRoutes({ problems, allowedOrigins }: { problems: Problems; allowedOrigins: string[] }) {
  const app = new Hono();
  app.use("*", cors({ origin: allowOrigin(allowedOrigins), allowMethods: ["GET", "POST"] }));

  // Public and read-only: anyone with the problem id (it is in the approval link) sees the budget state.
  app.get("/:id", async (c) => {
    const state = await problems.state(c.req.param("id"));
    return state ? c.json(state) : c.json({ error: "problem not found" }, 404);
  });

  app.post("/:id/fund", async (c) => {
    try {
      const result = await problems.fund(c.req.param("id"), await c.req.json().catch(() => null));
      return result ? c.json(result) : c.json({ error: "problem not found" }, 404);
    } catch (e) {
      if (e instanceof FundingError) return c.json({ error: e.message }, 400);
      throw e;
    }
  });

  return app;
}
