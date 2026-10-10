// Live earnings page for the demo split screen (ticket 24): Claude on one side, the expert's money landing on the other.
//   GET /earnings               → Citable's fees across all agents (ADR-016 take rate), page
//   GET /earnings/feed          → CitableEarnings JSON
//   GET /earnings/:agent        → one expert's payouts, page (both pages poll their feed every 2 s)
//   GET /earnings/:agent/feed   → Earnings JSON
// Public and read-only, like the problem state: testnet amounts, tx hashes and shortened buyer questions.
import { Hono } from "hono";
import { citableEarningsPage, earningsPage } from "../earnings/page.js";
import type { CitableEarningsReader, EarningsReader } from "../earnings/store.js";

export function createEarningsRoutes({
  readEarnings,
  readCitableEarnings,
}: {
  readEarnings: EarningsReader;
  readCitableEarnings: CitableEarningsReader;
}) {
  const app = new Hono();

  // Before /:agent, so "feed" isn't taken for an agent.
  app.get("/feed", async (c) => {
    c.header("Cache-Control", "no-store");
    return c.json(await readCitableEarnings());
  });
  app.get("/", async (c) => c.html(citableEarningsPage(await readCitableEarnings())));

  app.get("/:agent/feed", async (c) => {
    const earnings = await readEarnings(c.req.param("agent"));
    c.header("Cache-Control", "no-store");
    return earnings ? c.json(earnings) : c.json({ error: "agent not found" }, 404);
  });

  app.get("/:agent", async (c) => {
    const earnings = await readEarnings(c.req.param("agent"));
    if (!earnings) return c.text("agent not found", 404);
    return c.html(earningsPage(earnings));
  });

  return app;
}
