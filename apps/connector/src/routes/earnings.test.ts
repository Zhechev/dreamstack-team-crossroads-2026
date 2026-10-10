import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { loadConfig } from "../config.js";
import type { CitableEarnings, Earnings } from "../earnings/store.js";

const earnings: Earnings = {
  agent: { id: "a1", slug: "lozenets-price-check", name: "Lozenets Price Check", expert: "Elena Petrova", payoutAddress: "0x00000000000000000000000000000000000de001" },
  balance: "4.50",
  total: "1.00",
  count: 2,
  payments: [{ orderId: "o1", amount: "0.50", question: "Is €180k fair? </script><b>x</b>", txHash: `0x${"ab".repeat(32)}`, at: "2026-10-10T18:00:00Z" }],
};

const citable: CitableEarnings = {
  fees: "0.15",
  paidToExperts: "0.35",
  count: 1,
  experts: 1,
  payments: [{ ...earnings.payments[0]!, fee: "0.15", expertShare: "0.35", agent: "Lozenets Price Check", expert: "Elena Petrova" }],
};

const app = createApp(loadConfig({}), {
  readEarnings: async (id) => (id === "lozenets-price-check" ? earnings : null),
  readCitableEarnings: async () => citable,
});

describe("earnings page (ticket 24)", () => {
  it("serves the feed as JSON, uncached", async () => {
    const res = await app.request("/earnings/lozenets-price-check/feed");
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual(earnings);
  });

  it("serves the page with the data embedded safely", async () => {
    const res = await app.request("/earnings/lozenets-price-check");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Expert console");
    expect(html).not.toContain("</script><b>");
    expect(html).toContain("\\u003c/script>");
  });

  it("404s unknown agents", async () => {
    expect((await app.request("/earnings/nope")).status).toBe(404);
    expect((await app.request("/earnings/nope/feed")).status).toBe(404);
  });

  it("serves Citable's fees at the root, not as an agent called feed", async () => {
    const feed = await app.request("/earnings/feed");
    expect(feed.headers.get("cache-control")).toBe("no-store");
    expect(await feed.json()).toEqual(citable);
    const html = await (await app.request("/earnings")).text();
    expect(html).toContain("Marketplace");
    expect(html).toContain("Citable fee");
  });
});
