// Needs a running Supabase with migrations applied: `supabase start`, then `pnpm --filter @citable/knowledge test:db`.
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import { createEmbedder } from "./embed.js";
import { searchUnits } from "./search.js";
import { seedUnits } from "./seed.js";

const envFile = new URL("../../.env", import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);

const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const embedder = createEmbedder();
const LOZENETS = "22222222-0000-4000-8000-000000000001";
const MLADOST = "22222222-0000-4000-8000-000000000002";

describe("hybrid search", () => {
  beforeAll(async () => {
    await seedUnits(client, embedder);
  });

  it("returns the 2-bed Lozenets comparables first", async () => {
    const units = await searchUnits(client, { agentId: LOZENETS, question: "2-bed Lozenets €180k", embedder, limit: 5 });
    expect(units).toHaveLength(5);
    for (const unit of units) {
      expect(unit.kind).toBe("record");
      expect(unit.data).toMatchObject({ bedrooms: 2, area: "Lozenets, Sofia" });
    }
  });

  it("is scoped to one agent", async () => {
    const units = await searchUnits(client, { agentId: MLADOST, question: "2-bed Lozenets €180k", embedder });
    expect(units.every((u) => !u.text.includes("Lozenets"))).toBe(true);
  });

  it("keeps unit ids when re-run", async () => {
    const before = await searchUnits(client, { agentId: LOZENETS, question: "parking space Lozenets", embedder });
    await seedUnits(client, embedder);
    const after = await searchUnits(client, { agentId: LOZENETS, question: "parking space Lozenets", embedder });
    expect(after.map((u) => u.id)).toEqual(before.map((u) => u.id));
  });
});
