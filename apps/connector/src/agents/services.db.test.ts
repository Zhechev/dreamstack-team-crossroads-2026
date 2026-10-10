// The demo conversation against the local Supabase (ticket 28): the flat question and both follow-ups find their
// own expert, and the follow-ups are paid, answered from the expert's jobs and pass the citation check.
// Only the facilitator is faked. Needs `supabase start`, both seed files and AGENT_SIGNING_KEY in the root .env.
import { existsSync } from "node:fs";
import { SignedOutcome } from "@citable/protocol";
import { seedUnits } from "@citable/knowledge";
import { createClient } from "@supabase/supabase-js";
import type { FacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { loadConfig } from "../config.js";
import { supabaseExpertSearch } from "../mcp/search.js";
import { groundedAnswerer } from "./answer.js";
import { NETWORK } from "./payments.js";

const envFile = new URL("../../../../.env", import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);
const config = loadConfig();
const db = createClient(config.supabaseUrl!, config.supabaseServiceRoleKey!, { auth: { persistSession: false } });

const facilitator: FacilitatorClient = {
  getSupported: async () => ({ kinds: [{ x402Version: 2, scheme: "exact", network: NETWORK }], extensions: [], signers: {} }),
  verify: async () => ({ isValid: true }),
  settle: async () => ({ success: true, transaction: `0x${"cd".repeat(32)}`, network: NETWORK }),
};
const app = createApp(config, { facilitator: () => facilitator, answer: groundedAnswerer, now: () => new Date("2026-10-10T12:00:00Z") });
const pay = wrapFetchWithPaymentFromConfig(((i: RequestInfo | URL, init?: RequestInit) => app.request(i instanceof Request ? i : String(i), init)) as typeof fetch, {
  schemes: [{ network: NETWORK, client: new ExactEvmScheme(privateKeyToAccount(generatePrivateKey())) }],
});

const FLAT = "Is 180k fair for a 2-bedroom in Lozenets?";
const BATHROOM = "What will be the average price of a full bathroom renovation of 8 sq meters by local experts?";
const CONTRACT = "What is a fair price for having a lawyer draft a preliminary contract for the purchase of a property?";

describe("the demo conversation against Supabase", () => {
  beforeAll(async () => {
    await seedUnits(db, null);
  });

  it.each([
    [FLAT, "lozenets-price-check", "Elena Petrova"],
    [BATHROOM, "sofia-renovation-price-check", "Stoyan Kolev"],
    [CONTRACT, "sofia-property-lawyer-fees", "Desislava Nikolova"],
  ])("find_expert: %s → %s first", async (question, slug, expert) => {
    const [top] = await supabaseExpertSearch(db)(question);
    expect(top).toMatchObject({ agent_id: slug, expert });
  });

  it.each([
    [BATHROOM, "sofia-renovation-price-check", /^Price check for full bathroom renovation in Sofia: 5 completed jobs/],
    [CONTRACT, "sofia-property-lawyer-fees", /^Fee check for drafting a preliminary contract/],
  ])("evaluate + paid answer: %s", async (question, slug, opening) => {
    const evaluation = await (
      await app.request(`/agents/${slug}/evaluate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) })
    ).json();
    expect(evaluation).toMatchObject({ can_answer: true, price: "0.50" });

    const res = await pay(`http://localhost/agents/${slug}/price-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    expect(res.status).toBe(200);
    const outcome = SignedOutcome.parse(await res.json());
    expect(outcome.text).toMatch(opening);
    const { data: order } = await db.from("orders").select("status, citations_verified").eq("id", outcome.order_id).single();
    expect(order).toEqual({ status: "delivered", citations_verified: true });
  });
});
