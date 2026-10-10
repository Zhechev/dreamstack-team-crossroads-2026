// The paid route end to end, offline: a real x402 client (as in the spike) signs the payment with a fresh
// wallet; a fake facilitator verifies and settles. Knowledge is the real Lozenets demo data.
import { SignedOutcome } from "@citable/protocol";
import { loadAgentData, toUnits, type FoundUnit } from "@citable/knowledge";
import type { FacilitatorClient } from "@x402/core/server";
import { decodePaymentRequiredHeader } from "@x402/core/http";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { loadConfig } from "../config.js";
import { askingPrice, bedroomsAsked, groundedAnswerer, type Answerer } from "./answer.js";
import type { AgentConfig } from "./load.js";
import type { OrderStore } from "./orders.js";
import { keySigner, verifyOutcomeSignature } from "./outcome.js";
import { NETWORK } from "./payments.js";
import { freshUnits } from "./priceCheck.js";

const signer = keySigner(generatePrivateKey());
const NOW = new Date("2026-10-10T12:00:00Z");
const TX = `0x${"ab".repeat(32)}`;
const QUESTION = "Is €180k fair for a 2-bed in Lozenets?";

const lozenets: AgentConfig = {
  id: "22222222-0000-4000-8000-000000000001",
  slug: "lozenets-price-check",
  name: "Lozenets Price Check",
  vertical: "real-estate",
  area: "Sofia / Lozenets",
  version: 3,
  sources: [],
  rules: ["Use only deals closed in the last 90 days."],
  payout_address: "0x00000000000000000000000000000000000de001",
  signing_address: signer.address,
  capabilities: [
    { slug: "price-check", tier: 1, name: "Price check", deliverable: "Fair price range + 5 comparable sales", price: "0.50", is_live: true },
  ],
};

const units: FoundUnit[] = toUnits(loadAgentData().find((f) => f.agent === lozenets.slug)!).map((u) => ({
  ...u,
  id: u.key,
  score: 1,
}));

function fakeFacilitator() {
  const calls = { verify: 0, settle: 0 };
  const client: FacilitatorClient = {
    async getSupported() {
      return { kinds: [{ x402Version: 2, scheme: "exact", network: NETWORK }], extensions: [], signers: {} };
    },
    async verify(payload) {
      calls.verify++;
      return { isValid: true, payer: (payload.payload as { authorization?: { from?: string } }).authorization?.from };
    },
    async settle(payload) {
      calls.settle++;
      return { success: true, transaction: TX, network: NETWORK, payer: (payload.payload as { authorization?: { from?: string } }).authorization?.from };
    },
  };
  return { client, calls };
}

function memoryOrders() {
  const rows = new Map<string, { status: string; tx?: string; payer?: string; outcome?: SignedOutcome; failures?: string[] }>();
  const store: OrderStore = {
    async start() {
      const id = crypto.randomUUID();
      rows.set(id, { status: "running" });
      return { id, terms_hash: `0x${"cd".repeat(32)}` };
    },
    async answered(id, outcome, checked) {
      rows.set(id, { ...rows.get(id)!, outcome, status: checked ? "checked" : "running" });
    },
    async failedCheck({ orderId, outcome, failures }) {
      rows.set(orderId, { ...rows.get(orderId)!, outcome, failures, status: "failed_check" });
    },
    async settled(id, tx, payer) {
      rows.set(id, { ...rows.get(id)!, status: "delivered", tx, payer });
    },
  };
  return { store, rows };
}

function setup(answer: Answerer = groundedAnswerer) {
  const facilitator = fakeFacilitator();
  const orders = memoryOrders();
  const app = createApp(loadConfig({}), {
    loadAgent: async (id) => (id === lozenets.slug ? lozenets : null),
    searchUnits: async () => units,
    lookupUnits: async (ids) => units.filter((u) => ids.includes(u.id)).map((u) => ({ id: u.id, agent_id: lozenets.id, text: u.text, as_of: u.as_of })),
    answer,
    signer,
    orders: orders.store,
    facilitator: () => facilitator.client,
    now: () => NOW,
  });
  const appFetch = (input: RequestInfo | URL, init?: RequestInit) =>
    app.request(input instanceof Request ? input : String(input), init);
  const buyer = privateKeyToAccount(generatePrivateKey());
  const pay = wrapFetchWithPaymentFromConfig(appFetch as typeof fetch, {
    schemes: [{ network: NETWORK, client: new ExactEvmScheme(buyer) }],
  });
  const post = (f: typeof fetch, id: string, body: unknown) =>
    f(`http://localhost/agents/${id}/price-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  return { app, appFetch, pay, post, facilitator, orders, buyer };
}

describe("POST /agents/:id/price-check", () => {
  let t: ReturnType<typeof setup>;
  beforeEach(() => {
    t = setup();
  });

  it("answers 402 with the 0.50 USDC exact requirement to the agent's payout address", async () => {
    const res = await t.post(t.appFetch as typeof fetch, lozenets.slug, { question: QUESTION });
    expect(res.status).toBe(402);
    const required = decodePaymentRequiredHeader(res.headers.get("PAYMENT-REQUIRED")!);
    expect(required.accepts[0]).toMatchObject({
      scheme: "exact",
      network: NETWORK,
      payTo: lozenets.payout_address,
      amount: "500000", // 0.50 USDC, 6 decimals
    });
    expect(t.facilitator.calls.settle).toBe(0);
  });

  it("paid: returns a signed, cited price check, settles once and records the tx on the order", async () => {
    const res = await t.post(t.pay, lozenets.slug, { question: QUESTION });
    expect(res.status).toBe(200);
    const outcome = SignedOutcome.parse(await res.json());

    expect(outcome.text).toMatch(/^Price check for a 2-bed flat in Lozenets: 5 comparable sales/);
    expect(outcome.text).toContain("€180,000 is within that range.");
    expect(outcome.text).not.toMatch(/apprais|valuation/i);
    expect(outcome.citations).toHaveLength(5);
    for (const c of outcome.citations) {
      const unit = units.find((u) => u.id === c.unit_id)!;
      expect(unit.text).toContain(c.quote);
      expect(c.as_of).toBe(unit.as_of);
      expect(unit.data).toMatchObject({ bedrooms: 2 });
    }
    expect(outcome.agent_version).toBe("3");
    expect(await verifyOutcomeSignature(lozenets.slug, signer.address, outcome)).toBe(true);

    expect(t.facilitator.calls).toEqual({ verify: 1, settle: 1 });
    const [row] = [...t.orders.rows.values()];
    expect(row).toMatchObject({ status: "delivered", tx: TX, payer: t.buyer.address });
    expect(row.outcome?.order_id).toBe(outcome.order_id);
  });

  it("uses only deals from the last 90 days", async () => {
    const res = await t.post(t.pay, lozenets.slug, { question: QUESTION });
    const outcome = SignedOutcome.parse(await res.json());
    expect(outcome.citations.map((c) => c.unit_id)).not.toContain("deal-l08");
    expect(outcome.citations.map((c) => c.unit_id)).not.toContain("deal-l09");
  });

  it("does not settle when there is no answer from the evidence", async () => {
    const res = await t.post(t.pay, lozenets.slug, { question: "Is €400k fair for a 5-bed in Lozenets?" });
    expect(res.status).toBe(422);
    expect(t.facilitator.calls.settle).toBe(0);
  });

  it("does not settle an answer that calls itself an appraisal", async () => {
    const sloppy: Answerer = async (input) => {
      const a = await groundedAnswerer(input);
      return { ...a, text: `Appraisal: ${a.text}` };
    };
    t = setup(sloppy);
    const res = await t.post(t.pay, lozenets.slug, { question: QUESTION });
    expect(res.status).toBe(422);
    expect(t.facilitator.calls.settle).toBe(0);
  });

  it("does not settle an answer with an invented citation, and marks the order failed (ticket 09)", async () => {
    const inventive: Answerer = async (input) => {
      const a = await groundedAnswerer(input);
      return { ...a, citations: a.citations.map((c, i) => (i === 0 ? { ...c, quote: "Sold for €150,000" } : c)) };
    };
    t = setup(inventive);
    const res = await t.post(t.pay, lozenets.slug, { question: QUESTION });
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ error: "citation_check_failed", failures: ["citation 1: quote not found in unit"] });
    expect(t.facilitator.calls.settle).toBe(0);
    const [row] = [...t.orders.rows.values()];
    expect(row).toMatchObject({ status: "failed_check", failures: ["citation 1: quote not found in unit"] });
    expect(row.tx).toBeUndefined();
  });

  it("marks a passing order checked before it settles", async () => {
    await t.post(t.pay, lozenets.slug, { question: QUESTION });
    const [row] = [...t.orders.rows.values()];
    expect(row.status).toBe("delivered");
  });

  it("turns away unknown agents and missing questions before asking for payment", async () => {
    expect((await t.post(t.appFetch as typeof fetch, "nobody", { question: QUESTION })).status).toBe(404);
    expect((await t.post(t.appFetch as typeof fetch, lozenets.slug, {})).status).toBe(400);
  });
});

describe("answer helpers", () => {
  it.each([
    ["Is €180k fair?", 180000],
    ["offer of 180,000 EUR", 180000],
    ["EUR 175000 for a flat", 175000],
    ["What is a 2-bed worth?", null],
  ])("askingPrice(%s)", (q, expected) => expect(askingPrice(q)).toBe(expected));

  it.each([
    ["2-bed in Lozenets", 2],
    ["3 bedroom flat", 3],
    ["studio near the park", 0],
    ["a flat in Lozenets", null],
  ])("bedroomsAsked(%s)", (q, expected) => expect(bedroomsAsked(q)).toBe(expected));

  it("freshUnits keeps passages and drops records older than 90 days", () => {
    const kept = freshUnits(units, NOW).map((u) => u.id);
    expect(kept).toContain("base-asking-vs-sold");
    expect(kept).toContain("deal-l07"); // 2026-07-21, 81 days
    expect(kept).not.toContain("deal-l08"); // 2026-05-18
  });
});
