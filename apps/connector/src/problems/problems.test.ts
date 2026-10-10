import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createApp } from "../app.js";
import { loadConfig } from "../config.js";
import type { SignedAuthorization } from "./authorization.js";
import { AskError, x402AgentPayer, type PaidAnswer } from "./pay.js";
import type { Chain } from "./chain.js";
import type { Problem, ProblemStore } from "./store.js";
import { decryptKey, encryptKey, type Hex } from "./wallet.js";

const SECRET = "11".repeat(32);
const TERMS = `0x${"f9".repeat(32)}` as Hex;
const LINK = { id: "link-1", token: "ctb_" + "a".repeat(43) };
const OTHER = { id: "link-2", token: "ctb_" + "b".repeat(43) };

function memoryStore(): ProblemStore & { rows: Map<string, Problem> } {
  const rows = new Map<string, Problem>();
  return {
    rows,
    async create(p) {
      const row: Problem = { id: randomUUID(), ...p, status: "awaiting_funding", buyerAddress: null, fundingTx: null, gasSeedTx: null, refundTx: null, refundAmount: null, createdAt: new Date().toISOString(), payments: [] };
      rows.set(row.id, row);
      return structuredClone(row);
    },
    async get(id) {
      const r = rows.get(id);
      return r ? structuredClone(r) : null;
    },
    async latestOpen(linkId) {
      return [...rows.values()].filter((r) => r.linkId === linkId && r.status !== "closed").at(-1) ?? null;
    },
    async markFunded(id, f) {
      const r = rows.get(id)!;
      if (r.status === "awaiting_funding") Object.assign(r, { status: "funded", ...f });
    },
    async setGasSeed(id, tx) {
      rows.get(id)!.gasSeedTx = tx;
    },
    async addPayment(id, p) {
      rows.get(id)!.payments.push({ ...p, termsHash: TERMS, createdAt: new Date().toISOString() });
    },
    async markClosed(id, r) {
      Object.assign(rows.get(id)!, { status: "closed", ...r });
    },
  };
}

const tx = (n: number) => `0x${n.toString(16).padStart(64, "0")}` as Hex;

function fakeChain() {
  const balances = new Map<string, bigint>();
  const submitted: SignedAuthorization[] = [];
  const seeded: Hex[] = [];
  const refunds: { from: string; to: Hex; amount: bigint }[] = [];
  const chain: Chain = {
    usdcBalance: async (a) => balances.get(a.toLowerCase()) ?? 0n,
    submitAuthorization: async (auth) => {
      submitted.push(auth);
      return tx(1);
    },
    seedGas: async (to) => {
      seeded.push(to);
      return tx(2);
    },
    transferUsdc: async (fromKey, to, amount) => {
      refunds.push({ from: privateKeyToAccount(fromKey).address, to, amount });
      return tx(4);
    },
  };
  return { chain, balances, submitted, seeded, refunds };
}

let store: ReturnType<typeof memoryStore>;
let fake: ReturnType<typeof fakeChain>;
let app: ReturnType<typeof createApp>;
let payer: { calls: { walletAddress: string; agentId: string; question: string; remaining: bigint }[]; next: PaidAnswer | Error };

const outcome = (orderId: string) => ({
  order_id: orderId,
  text: "{{full_name}}, a fair range is €172k–€186k for a 2-bed in Lozenets.",
  citations: [{ unit_id: "unit-12", quote: "182,000 EUR", as_of: "2026-09-15" }],
  agent_version: "3",
  created_at: "2026-10-10T12:00:00Z",
  signature: "0x1234",
});

beforeEach(() => {
  store = memoryStore();
  fake = fakeChain();
  app = createApp(loadConfig({ PROBLEM_WALLET_SECRET: SECRET, WEB_APP_URL: "https://citable.lovable.app" }), {
    verifyLink: async (t) => (t === LINK.token ? { id: LINK.id, owner_address: null } : t === OTHER.token ? { id: OTHER.id, owner_address: null } : null),
    problemStore: store,
    chain: fake.chain,
    agentPayer: {
      async priceCheck({ walletKey, agentId, question, remaining }) {
        payer.calls.push({ walletAddress: privateKeyToAccount(walletKey).address, agentId, question, remaining });
        if (payer.next instanceof Error) throw payer.next;
        return payer.next;
      },
    },
    unitSources: async (ids) => new Map(ids.map((id) => [id, { source: "Elena Petrova: closed deals", source_url: null }])),
  });
  payer = { calls: [], next: { ok: true, outcome: outcome(randomUUID()), amount: 500_000n, txHash: tx(3) } };
});

let nextId = 1;
async function tool(name: string, args: Record<string, unknown>, token = LINK.token) {
  const res = await app.request(`/mcp/${token}`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-06-18" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } }),
  });
  const text = await res.text();
  const body = JSON.parse(text.startsWith("{") ? text : text.split("\n").find((l) => l.startsWith("data: "))!.slice(6));
  return body.result as { isError?: boolean; structuredContent?: any; content: { text: string }[] };
}

const getState = async (id: string) => (await app.request(`/problems/${id}`)).json() as Promise<any>;

async function signFor(id: string, buyerKey: Hex, override: { value?: string } = {}) {
  const state = await getState(id);
  const buyer = privateKeyToAccount(buyerKey);
  const { domain, types, message } = state.authorization;
  const signed = { ...message, from: buyer.address, ...override };
  const signature = await buyer.signTypedData({
    domain,
    types,
    primaryType: "TransferWithAuthorization",
    message: { ...signed, value: BigInt(signed.value), validAfter: BigInt(signed.validAfter), validBefore: BigInt(signed.validBefore) },
  });
  return { from: buyer.address, signature, validAfter: message.validAfter, validBefore: message.validBefore, nonce: message.nonce };
}

const fund = (id: string, body: unknown) =>
  app.request(`/problems/${id}/fund`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

describe("approve_budget", () => {
  it("opens a problem with a fresh wallet and an approval link", async () => {
    const r = await tool("approve_budget", { cap: "2" });
    expect(r.isError).toBeFalsy();
    const { problem_id, cap, wallet_address, approval_url } = r.structuredContent;
    expect(cap).toBe("2.00");
    expect(wallet_address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(approval_url).toBe(`https://citable.lovable.app/approve/${problem_id}`);
    // Key stored encrypted, and it really is the wallet's key.
    const row = store.rows.get(problem_id)!;
    expect(row.keyEnc).not.toMatch(/^0x/);
    expect(privateKeyToAccount(decryptKey(row.keyEnc, SECRET)).address).toBe(wallet_address);
  });

  it("rejects a cap above the maximum", async () => {
    const r = await tool("approve_budget", { cap: "25.00" });
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toMatch(/at most 20.00/);
  });
});

describe("problem state + gasless funding", () => {
  let id: string;
  beforeEach(async () => {
    id = (await tool("approve_budget", { cap: "2.00" })).structuredContent.problem_id;
  });

  it("serves public state with the typed data to sign", async () => {
    const s = await getState(id);
    expect(s).toMatchObject({ cap: "2.00", funded: false, spent: "0.00", remaining: "2.00", payments: [] });
    expect(s.authorization.message).toMatchObject({ to: s.wallet_address, value: "2000000", validAfter: "0" });
    expect(s.authorization.domain).toMatchObject({ name: "USDC", version: "2", chainId: 84532 });
    expect(JSON.stringify(s)).not.toContain(store.rows.get(id)!.keyEnc);
  });

  it("submits a valid signature, marks funded and seeds gas", async () => {
    const buyerKey = generatePrivateKey();
    const res = await fund(id, await signFor(id, buyerKey));
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.tx_hash).toBe(tx(1));
    expect(body.state).toMatchObject({ funded: true, buyer_address: privateKeyToAccount(buyerKey).address, funding_tx: tx(1) });
    expect(body.state.authorization).toBeUndefined();
    expect(fake.submitted[0]).toMatchObject({ value: 2_000_000n, to: body.state.wallet_address });
    expect(fake.seeded).toEqual([body.state.wallet_address]);
  });

  it("rejects a signature over a different amount", async () => {
    const res = await fund(id, await signFor(id, generatePrivateKey(), { value: "1" }));
    expect(res.status).toBe(400);
    expect(fake.submitted).toHaveLength(0);
  });

  it("rejects funding twice", async () => {
    const key = generatePrivateKey();
    expect((await fund(id, await signFor(id, key))).status).toBe(200);
    expect((await fund(id, { from: privateKeyToAccount(key).address })).status).toBe(400);
  });

  it("counts a cap sent outside the page (plain transfer) as funded", async () => {
    fake.balances.set(store.rows.get(id)!.walletAddress.toLowerCase(), 2_000_000n);
    expect((await getState(id)).funded).toBe(true);
    expect(fake.seeded).toHaveLength(1);
  });

  it("allows the Lovable origin and nothing else", async () => {
    const ok = await app.request(`/problems/${id}`, { headers: { origin: "https://citable.lovable.app" } });
    expect(ok.headers.get("access-control-allow-origin")).toBe("https://citable.lovable.app");
    const bad = await app.request(`/problems/${id}`, { headers: { origin: "https://evil.example" } });
    expect(bad.headers.get("access-control-allow-origin")).toBeNull();
  });
});

describe("budget_status", () => {
  it("shows the caller's latest open budget, without the signing request", async () => {
    await tool("approve_budget", { cap: "2.00" });
    const r = await tool("budget_status", {});
    expect(r.structuredContent).toMatchObject({ cap: "2.00", funded: false, remaining: "2.00" });
    expect(r.structuredContent.authorization).toBeUndefined();
  });

  it("never shows another link's budget", async () => {
    const id = (await tool("approve_budget", { cap: "2.00" })).structuredContent.problem_id;
    const r = await tool("budget_status", { problem_id: id }, OTHER.token);
    expect(r.isError).toBe(true);
  });
});

it("encrypts wallet keys reversibly", () => {
  const key = generatePrivateKey();
  expect(decryptKey(encryptKey(key, SECRET), SECRET)).toBe(key);
});

describe("ask", () => {
  let id: string;
  const buyerKey = generatePrivateKey();
  const fundIt = async () => expect((await fund(id, await signFor(id, buyerKey))).status).toBe(200);
  beforeEach(async () => {
    id = (await tool("approve_budget", { cap: "2.00" })).structuredContent.problem_id;
  });

  it("refuses until the budget is approved, and sends the approval link", async () => {
    const r = await tool("ask", { agent_id: "lozenets-price-check", question: "Is 180k fair?" });
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toContain(`/approve/${id}`);
    expect(payer.calls).toHaveLength(0);
  });

  it("pays from the problem wallet and returns the cited answer with sources", async () => {
    await fundIt();
    const r = await tool("ask", { agent_id: "lozenets-price-check", question: "Is 180k fair?" });
    expect(payer.calls[0]).toMatchObject({ walletAddress: store.rows.get(id)!.walletAddress, remaining: 2_000_000n });
    expect(r.structuredContent).toMatchObject({
      charged: true,
      paid: "0.50",
      remaining: "1.50",
      tx_hash: tx(3),
      citations_verified: true,
      citations: [{ unit_id: "unit-12", quote: "182,000 EUR", as_of: "2026-09-15", source: "Elena Petrova: closed deals" }],
    });
    // Placeholders pass through untouched, with the instruction to fill them only in the final reply.
    expect(r.structuredContent.answer).toContain("{{full_name}}");
    expect(r.structuredContent.note).toMatch(/final reply/);
    expect((await getState(id)).payments).toEqual([expect.objectContaining({ amount: "0.50", tx_hash: tx(3) })]);
    expect((await getState(id)).remaining).toBe("1.50");
  });

  it("records nothing when the citation check fails (never settled)", async () => {
    await fundIt();
    payer.next = { ok: false, reason: "citation_check_failed", orderId: "o-1", failures: ["citation 1: quote not found"] };
    const r = await tool("ask", { agent_id: "lozenets-price-check", question: "Is 180k fair?" });
    expect(r.structuredContent).toMatchObject({ charged: false, remaining: "2.00" });
    expect((await getState(id)).payments).toEqual([]);
  });

  it("reports a price above what's left as a tool error", async () => {
    await fundIt();
    payer.next = new AskError("the price (5 USDC) is more than what's left in the budget (2 USDC)");
    const r = await tool("ask", { agent_id: "lozenets-price-check", question: "Is 180k fair?" });
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toMatch(/more than what's left/);
  });
});

describe("close_problem", () => {
  it("refunds what's left to the buyer and returns a Receipt per paid answer", async () => {
    const id = (await tool("approve_budget", { cap: "2.00" })).structuredContent.problem_id;
    const buyerKey = generatePrivateKey();
    await fund(id, await signFor(id, buyerKey));
    await tool("ask", { agent_id: "lozenets-price-check", question: "Is 180k fair?" });
    const wallet = store.rows.get(id)!.walletAddress;
    fake.balances.set(wallet.toLowerCase(), 1_500_000n);

    const r = await tool("close_problem", {});
    const buyer = privateKeyToAccount(buyerKey).address;
    expect(fake.refunds).toEqual([{ from: wallet, to: buyer, amount: 1_500_000n }]);
    expect(r.structuredContent).toMatchObject({ spent: "0.50", refunded: "1.50", refund_to: buyer, refund_tx: tx(4) });
    expect(r.structuredContent.receipts).toEqual([
      { order_id: expect.any(String), tx_hash: tx(3), amount: "0.50", fee: "0.00", terms_hash: TERMS },
    ]);
    expect(r.structuredContent.fee_note).toMatch(/waived/);
    expect((await getState(id)).status).toBe("closed");
    expect((await tool("close_problem", { problem_id: id })).isError).toBe(true);
  });

  it("needs refund_to when the budget came in as a plain transfer", async () => {
    const id = (await tool("approve_budget", { cap: "2.00" })).structuredContent.problem_id;
    fake.balances.set(store.rows.get(id)!.walletAddress.toLowerCase(), 2_000_000n);
    await getState(id); // the next read counts the plain transfer as funded
    expect((await tool("close_problem", {})).isError).toBe(true);
    const to = privateKeyToAccount(generatePrivateKey()).address;
    const r = await tool("close_problem", { refund_to: to });
    expect(r.structuredContent).toMatchObject({ refunded: "2.00", refund_to: to, receipts: [] });
  });
});

describe("x402 payer", () => {
  it("refuses a price above what's left before signing anything", async () => {
    const required = {
      x402Version: 2,
      resource: { url: "http://connector.internal/agents/a/price-check" },
      accepts: [{ scheme: "exact", network: "eip155:84532", amount: "5000000", asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", payTo: "0x000000000000000000000000000000000000dEaD", maxTimeoutSeconds: 60, extra: {} }],
    };
    let calls = 0;
    const fetch = async () => {
      calls++;
      return new Response("{}", { status: 402, headers: { "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(required)).toString("base64") } });
    };
    const p = x402AgentPayer(fetch as typeof globalThis.fetch);
    await expect(p.priceCheck({ walletKey: generatePrivateKey(), agentId: "a", question: "q", remaining: 2_000_000n })).rejects.toThrow(/more than what's left/);
    expect(calls).toBe(1);
  });
});
