// Earnings against the local Supabase (seeded agents, real order rows). Needs `supabase start` and the root .env.
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { supabaseEarnings } from "./store.js";

const envFile = new URL("../../../../.env", import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

describe.skipIf(!url || !key)("earnings against Supabase", () => {
  it("reads the demo agent, its expert and the payout balance", async () => {
    const read = supabaseEarnings(createClient(url!, key!, { auth: { persistSession: false } }), async () => 4_500_000n);
    const e = await read("lozenets-price-check");
    expect(e?.agent).toMatchObject({ slug: "lozenets-price-check", expert: expect.any(String) });
    expect(e?.balance).toBe("4.50");
    expect(e!.payments.every((p) => p.txHash.startsWith("0x"))).toBe(true);
    expect(await read("no-such-agent")).toBeNull();
  });
});
