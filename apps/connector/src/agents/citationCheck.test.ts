import type { SignedOutcome } from "@citable/protocol";
import { generatePrivateKey } from "viem/accounts";
import { beforeEach, describe, expect, it } from "vitest";
import { checkCitations, normalise, type CitableUnit } from "./citationCheck.js";
import type { AgentConfig } from "./load.js";
import { keySigner } from "./outcome.js";

const signer = keySigner(generatePrivateKey());
const ORDER = "aaaaaaaa-0000-4000-8000-000000000001";

const agent: AgentConfig = {
  id: "agent-lozenets",
  slug: "lozenets-price-check",
  name: "Lozenets Price Check",
  vertical: "real-estate",
  area: "Sofia / Lozenets",
  version: 3,
  sources: [],
  rules: [],
  payout_address: "0x00000000000000000000000000000000000de001",
  signing_address: signer.address,
  capabilities: [],
};

const units: CitableUnit[] = [
  { id: "u1", agent_id: "agent-lozenets", as_of: "2026-09-28", text: "Synthetic deal record: 2-bed flat, 74 m². Sold for €172,000 (€2,324/m²) on 2026-09-28." },
  { id: "u2", agent_id: "agent-lozenets", as_of: "2026-09-19", text: "Synthetic deal record: 2-bed flat, 81 m². Sold for €194,000 (€2,395/m²) on 2026-09-19." },
  { id: "foreign", agent_id: "agent-mladost", as_of: "2026-09-25", text: "Synthetic deal record: 2-bed flat, 70 m². Sold for €142,000 (€2,029/m²) on 2026-09-25." },
];
const lookup = async (ids: string[]) => units.filter((u) => ids.includes(u.id));

const sign = (citations: SignedOutcome["citations"], overrides: Partial<SignedOutcome> = {}) =>
  signer.sign(agent.slug, {
    order_id: ORDER,
    text: "Price check: €172,000 to €194,000.",
    citations,
    agent_version: "3",
    created_at: "2026-10-10T12:00:00.000Z",
    ...overrides,
  });

const good = [
  { unit_id: "u1", quote: "Sold for €172,000 (€2,324/m²) on 2026-09-28.", as_of: "2026-09-28" },
  { unit_id: "u2", quote: "€194,000", as_of: "2026-09-19" },
];

describe("checkCitations", () => {
  let valid: SignedOutcome;
  beforeEach(async () => {
    valid = await sign(good);
  });

  it("passes a valid outcome", async () => {
    expect(await checkCitations(lookup, { agent, orderId: ORDER, outcome: valid })).toEqual({ ok: true, failures: [] });
  });

  it("fails a tampered quote", async () => {
    const outcome = await sign([good[0], { ...good[1], quote: "€184,000" }]);
    expect(await checkCitations(lookup, { agent, orderId: ORDER, outcome })).toEqual({
      ok: false,
      failures: ["citation 2: quote not found in unit"],
    });
  });

  it("fails a foreign unit", async () => {
    const outcome = await sign([good[0], { unit_id: "foreign", quote: "€142,000", as_of: "2026-09-25" }]);
    expect((await checkCitations(lookup, { agent, orderId: ORDER, outcome })).failures).toEqual([
      "citation 2: unit belongs to another agent",
    ]);
  });

  it("fails a wrong as_of", async () => {
    const outcome = await sign([{ ...good[0], as_of: "2026-10-01" }]);
    expect((await checkCitations(lookup, { agent, orderId: ORDER, outcome })).failures).toEqual([
      "citation 1: as_of 2026-10-01 does not match the unit's 2026-09-28",
    ]);
  });

  it("fails a unit that doesn't exist", async () => {
    const outcome = await sign([{ unit_id: "u404", quote: "€1", as_of: "2026-09-28" }]);
    expect((await checkCitations(lookup, { agent, orderId: ORDER, outcome })).failures).toEqual([
      "citation 1: unit u404 does not exist",
    ]);
  });

  it("fails when the text or citations were changed after signing", async () => {
    const edited = { ...valid, text: "Price check: €150,000 to €194,000." };
    expect((await checkCitations(lookup, { agent, orderId: ORDER, outcome: edited })).failures).toEqual([
      "signature does not match the agent",
    ]);
  });

  it("fails an outcome signed by another key, for another order or version", async () => {
    const other = await keySigner(generatePrivateKey()).sign(agent.slug, { ...valid });
    expect((await checkCitations(lookup, { agent, orderId: ORDER, outcome: other })).failures).toContain(
      "signature does not match the agent",
    );
    expect((await checkCitations(lookup, { agent, orderId: "another-order", outcome: valid })).failures).toContain(
      "outcome is for another order",
    );
    const v2 = await sign(good, { agent_version: "2" });
    expect((await checkCitations(lookup, { agent, orderId: ORDER, outcome: v2 })).failures).toContain(
      "agent version 2 is not v3",
    );
  });

  it("fails every check when the agent has no signing address", async () => {
    const unsignedAgent = { ...agent, signing_address: null };
    expect((await checkCitations(lookup, { agent: unsignedAgent, orderId: ORDER, outcome: valid })).failures).toEqual([
      "agent has no signing address",
    ]);
  });
});

describe("normalise", () => {
  it("ignores case, spacing, dash and quote styles, and thousands separators", () => {
    expect(normalise("Sold  for €172 000 – “cash”")).toBe(normalise("sold for €172,000 - \"cash\""));
    expect(normalise("€2,324/m²")).toBe(normalise("€2324/m2")); // NFKC folds ², on both sides
  });

  it("keeps different numbers different", () => {
    expect(normalise("€172,000")).not.toBe(normalise("€172,500"));
  });
});
