// Problem wallets: budget state for the Lovable approval page + gasless funding (ADR-011). Owner: Kris (ticket 11).
import { Hono } from "hono";
import { cors } from "hono/cors";
import { FundingError } from "../problems/authorization.js";
import type { LinkVerifier } from "../mcp/links.js";
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

export function createProblemRoutes({
  problems,
  verifyLink,
  allowedOrigins,
}: {
  problems: Problems;
  verifyLink: LinkVerifier;
  allowedOrigins: string[];
}) {
  const app = new Hono();
  app.use("*", cors({ origin: allowOrigin(allowedOrigins), allowMethods: ["GET", "POST"], allowHeaders: ["content-type", "x-connector-token"] }));

  // Setup page (ADR-011, top up once): open the buyer's budget with their connector token, then fund it via /:id/fund.
  // Returns the open budget instead if there already is one.
  app.post("/", async (c) => {
    const link = await verifyLink(c.req.header("x-connector-token") ?? "");
    if (!link) return c.json({ error: "Unknown or revoked connector link" }, 401);
    const body = (await c.req.json().catch(() => null)) as { cap?: unknown } | null;
    try {
      return c.json(await problems.open(link.id, String(body?.cap ?? "")));
    } catch (e) {
      if (e instanceof FundingError) return c.json({ error: e.message }, 400);
      throw e;
    }
  });

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
