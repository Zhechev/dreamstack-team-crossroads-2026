// Paid price check against the local Supabase (seeded agents + units, real order rows). Only the facilitator
// is faked; the x402 client is real. Needs `supabase start` and AGENT_SIGNING_KEY in the root .env.
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
import { groundedAnswerer } from "./answer.js";
import { NETWORK } from "./payments.js";

const envFile = new URL("../../../../.env", import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);
const config = loadConfig();
const db = createClient(config.supabaseUrl!, config.supabaseServiceRoleKey!, { auth: { persistSession: false } });
const TX = `0x${"ef".repeat(32)}`;
const QUESTION = "Is €180k fair for a 2-bed in Lozenets?";

const facilitator: FacilitatorClient = {
  getSupported: async () => ({ kinds: [{ x402Version: 2, scheme: "exact", network: NETWORK }], extensions: [], signers: {} }),
  verify: async () => ({ isValid: true }),
  settle: async () => ({ success: true, transaction: TX, network: NETWORK }),
};

// Deterministic answers in tests even when ANTHROPIC_API_KEY is set.
const app = createApp(config, { facilitator: () => facilitator, answer: groundedAnswerer, now: () => new Date("2026-10-10T12:00:00Z") });
const pay = wrapFetchWithPaymentFromConfig(((i: RequestInfo | URL, init?: RequestInit) => app.request(i instanceof Request ? i : String(i), init)) as typeof fetch, {
  schemes: [{ network: NETWORK, client: new ExactEvmScheme(privateKeyToAccount(generatePrivateKey())) }],
});
const priceCheck = (body: unknown) =>
  pay("http://localhost/agents/lozenets-price-check/price-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("price check against Supabase", () => {
  beforeAll(async () => {
    await seedUnits(db, null);
  });

  it("creates the order, answers from the seeded units and records the settlement", async () => {
    const res = await priceCheck({ question: QUESTION });
    expect(res.status).toBe(200);
    const outcome = SignedOutcome.parse(await res.json());

    const { data: order } = await db.from("orders").select("*").eq("id", outcome.order_id).single();
    expect(order).toMatchObject({
      status: "delivered",
      tx_hash: TX,
      answer: outcome.text,
      signature: outcome.signature,
      terms_hash: "0xf9b91ca563e63f98b44f1a83eadfde2a1aa1dfe747467d1a8f91c4fa2f2b0757",
    });
    expect(order.citations).toEqual(outcome.citations);

    const { data: cited } = await db.from("units").select("id, text, as_of").in("id", outcome.citations.map((c) => c.unit_id));
    expect(cited).toHaveLength(5);
    for (const c of outcome.citations) {
      const unit = cited!.find((u) => u.id === c.unit_id)!;
      expect(unit.text).toContain(c.quote);
      expect(unit.as_of).toBe(c.as_of);
    }
  });

  it("fills an order made by create_order, and refuses to run it twice", async () => {
    const { data: created } = await db
      .from("orders")
      .insert({
        agent_id: "22222222-0000-4000-8000-000000000001",
        capability_id: "44444444-0000-4000-8000-000000000011",
        question: QUESTION,
        status: "awaiting_payment",
        price: 0.5,
        terms_hash: "0xf9b91ca563e63f98b44f1a83eadfde2a1aa1dfe747467d1a8f91c4fa2f2b0757",
      })
      .select("id")
      .single();

    const res = await priceCheck({ question: QUESTION, order_id: created!.id });
    expect(SignedOutcome.parse(await res.json()).order_id).toBe(created!.id);
    expect((await priceCheck({ question: QUESTION, order_id: created!.id })).status).toBe(409);
  });
});
