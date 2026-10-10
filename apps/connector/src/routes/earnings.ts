// Live earnings page for the demo split screen (ticket 24): Claude on one side, the expert's money landing on the other.
//   GET /earnings/:agent        → the page (polls the feed every 2 s)
//   GET /earnings/:agent/feed   → Earnings JSON
// Public and read-only, like the problem state: testnet amounts, tx hashes and shortened buyer questions.
import { Hono } from "hono";
import { earningsPage } from "../earnings/page.js";
import type { EarningsReader } from "../earnings/store.js";

export function createEarningsRoutes({ readEarnings }: { readEarnings: EarningsReader }) {
  const app = new Hono();

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
