// The demo conversation's follow-ups (ticket 28): a renovation contractor and a property lawyer, each its own expert.
import { loadAgentData, toUnits } from "@citable/knowledge";
import type { FoundUnit } from "@citable/knowledge";
import { describe, expect, it } from "vitest";
import { groundedAnswerer, sizeAsked } from "./answer.js";
import { evaluate } from "./evaluate.js";
import type { AgentConfig } from "./load.js";
import { freshUnits } from "./priceCheck.js";

const agent = (slug: string, vertical: string, area = "Sofia"): AgentConfig => ({
  id: slug,
  slug,
  name: slug,
  vertical,
  area,
  version: 1,
  sources: [],
  rules: [],
  payout_address: "0x00000000000000000000000000000000000de004",
  signing_address: null,
  capabilities: [{ slug: "price-check", tier: 1, name: "Price check", deliverable: "Range + 5 jobs", price: "0.50", is_live: true }],
});

const renovation = agent("sofia-renovation-price-check", "renovation");
const lawyer = agent("sofia-property-lawyer-fees", "legal-fees");
const lozenets = agent("lozenets-price-check", "real-estate", "Sofia / Lozenets");

const BATHROOM = "What will be the average price of a full bathroom renovation of 8 sq meters by local experts?";
const CONTRACT = "What is a fair price for having a lawyer draft a preliminary contract for the purchase of a property?";
const now = new Date("2026-10-10T12:00:00Z");

const unitsOf = (slug: string): FoundUnit[] =>
  toUnits(loadAgentData().find((f) => f.agent === slug)!).map((u) => ({ ...u, id: u.key, score: 1 }));

describe("each follow-up goes to its own expert", () => {
  it.each([
    [BATHROOM, renovation],
    [CONTRACT, lawyer],
    ["Is 180k fair for a 2-bedroom in Lozenets?", lozenets],
  ])("%s → only %s can answer", (question, expert) => {
    for (const a of [renovation, lawyer, lozenets]) expect(evaluate(a, question, now).can_answer).toBe(a === expert);
  });

  it("keeps the flat agent out of a lawyer question that names its district", () => {
    expect(evaluate(lozenets, "What does a lawyer charge for a preliminary contract on a flat in Lozenets?", now).can_answer).toBe(false);
  });

  it("explains each vertical's scope when it can't answer", () => {
    expect(evaluate(lawyer, "How much is a used Golf?", now).deliverable).toBe("Out of scope: sofia-property-lawyer-fees gives fee checks for a property lawyer's work in Sofia.");
  });
});

describe("grounded answers from completed jobs", () => {
  it("reads sizes from the question", () => {
    expect(sizeAsked(BATHROOM)).toBe(8);
    expect(sizeAsked("bathroom of 7.5 m²")).toBe(7.5);
    expect(sizeAsked("8m2 bathroom")).toBe(8);
    expect(sizeAsked(CONTRACT)).toBeNull();
  });

  it("prices an 8 m² bathroom from the 5 latest bathroom jobs, each quoted from its unit", async () => {
    const units = freshUnits(unitsOf(renovation.slug), now);
    const a = await groundedAnswerer({ agent: renovation, question: BATHROOM, units });
    expect(a.text.split("\n")[0]).toBe(
      "Price check for full bathroom renovation in Sofia: 5 completed jobs from the last 90 days cost between €4,900 and €8,600 " +
        "(average €6,620). That is €813–€956 per m² (average €866/m²), so about €6,900 for 8 m².",
    );
    expect(a.citations.map((c) => c.unit_id)).toEqual(["job-r01", "job-r02", "job-r03", "job-r04", "job-r05"]);
    for (const c of a.citations) {
      const unit = units.find((u) => u.id === c.unit_id)!;
      expect(unit.text).toContain(c.quote);
      expect(c.as_of).toBe(unit.as_of);
    }
  });

  it("gives a lawyer's fee range for a preliminary contract, leaving out the notary attendance", async () => {
    const a = await groundedAnswerer({ agent: lawyer, question: CONTRACT, units: freshUnits(unitsOf(lawyer.slug), now) });
    expect(a.text.split("\n")[0]).toBe(
      "Fee check for drafting a preliminary contract for a flat purchase in Sofia: 5 engagements from the last 90 days cost between €350 and €550 (average €450).",
    );
    expect(a.citations.map((c) => c.quote)).toContain("Fee €450 on 2026-09-30.");
    expect(a.citations.map((c) => c.unit_id)).not.toContain("job-l06");
  });
});
