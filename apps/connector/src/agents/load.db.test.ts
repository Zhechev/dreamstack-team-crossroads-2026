// Needs a running Supabase with the seed: `supabase start`, then `pnpm --filter @citable/connector test:db`.
import { existsSync } from "node:fs";
import { Evaluation } from "@citable/protocol";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { loadConfig } from "../config.js";
import { supabaseAgentLoader } from "./load.js";

const envFile = new URL("../../../../.env", import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);

const config = loadConfig();
const db = createClient(config.supabaseUrl!, config.supabaseServiceRoleKey!, { auth: { persistSession: false } });
const loadAgent = supabaseAgentLoader(db);

describe("agent config from Supabase", () => {
  it("loads the authorised version, rules, prices and payout address", async () => {
    const agent = await loadAgent("lozenets-price-check");
    expect(agent).toMatchObject({ slug: "lozenets-price-check", version: 3, area: "Sofia / Lozenets" });
    expect(agent!.payout_address).toMatch(/^0x[0-9a-f]{40}$/i);
    expect(agent!.rules).toContain("Use only deals closed in the last 90 days.");
    expect(agent!.capabilities.map((c) => c.price)).toEqual(["0.50", "20.00", "50.00"]);
  });

  it("loads by uuid too, and returns null for unknown agents", async () => {
    expect((await loadAgent("22222222-0000-4000-8000-000000000001"))?.slug).toBe("lozenets-price-check");
    expect(await loadAgent("nobody")).toBeNull();
  });

  it("serves the evaluate route end to end", async () => {
    const res = await createApp(loadConfig(), { loadAgent }).request("/agents/lozenets-price-check/evaluate", {
      method: "POST",
      body: JSON.stringify({ question: "Is €180k fair for a 2-bed in Lozenets?" }),
    });
    expect(Evaluation.parse(await res.json())).toMatchObject({ can_answer: true, price: "0.50" });
  });
});
