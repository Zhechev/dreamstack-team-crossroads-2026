import { describe, expect, it } from "vitest";
import { Evaluation, Manifest, Receipt, Review, SignedOutcome } from "./index.js";

const hash = `0x${"ab".repeat(32)}`;

const examples = {
  Evaluation: {
    agent_id: "lozenets-pricing",
    can_answer: true,
    deliverable: "Fair price range for a 2-bed flat in Lozenets with 3 cited recent deals",
    price: "0.50",
    expires_at: "2026-10-11T12:00:00Z",
  },
  Manifest: {
    id: "lozenets-pricing",
    version: "1.0.0",
    key: "0x000000000000000000000000000000000000dEaD",
    capabilities: [{ id: "price-check", tier: 1, name: "Price check", tags: ["real-estate", "sofia"], price: "0.50" }],
    terms_hash: hash,
  },
  SignedOutcome: {
    order_id: "ord_1",
    text: "{{full_name}}, a fair price is 175,000–190,000 EUR.",
    citations: [{ unit_id: "unit_42", quote: "182,000 EUR", as_of: "2026-09-15" }],
    agent_version: "1.0.0",
    created_at: "2026-10-10T14:00:00Z",
    signature: "0x1234abcd",
  },
  Review: {
    order_id: "ord_1",
    status: "approved",
    reviewer: "expert_1",
    final_text: "Approved as written.",
    reviewed_at: "2026-10-10T15:00:00Z",
  },
  Receipt: { order_id: "ord_1", tx_hash: hash, amount: "0.50", fee: "0.01", terms_hash: hash },
};

describe("valid messages parse", () => {
  it.each([
    ["Evaluation", Evaluation],
    ["Manifest", Manifest],
    ["SignedOutcome", SignedOutcome],
    ["Review", Review],
    ["Receipt", Receipt],
  ] as const)("%s", (name, schema) => {
    expect(schema.safeParse(examples[name]).success).toBe(true);
  });
});

describe("citations", () => {
  const withCitation = (citation: Record<string, unknown>) => ({ ...examples.SignedOutcome, citations: [citation] });
  const { as_of, unit_id, ...rest } = examples.SignedOutcome.citations[0];

  it("rejects a citation without as_of", () => {
    expect(SignedOutcome.safeParse(withCitation({ unit_id, ...rest })).success).toBe(false);
  });

  it("rejects a citation without unit_id", () => {
    expect(SignedOutcome.safeParse(withCitation({ as_of, ...rest })).success).toBe(false);
  });

  it("rejects an as_of that is not a date", () => {
    expect(SignedOutcome.safeParse(withCitation({ unit_id, as_of: "recently", ...rest })).success).toBe(false);
  });

  it("rejects an outcome with no citations", () => {
    expect(SignedOutcome.safeParse({ ...examples.SignedOutcome, citations: [] }).success).toBe(false);
  });
});

it("rejects a float price", () => {
  expect(Evaluation.safeParse({ ...examples.Evaluation, price: 0.5 }).success).toBe(false);
});
