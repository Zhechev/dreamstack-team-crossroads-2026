import { describe, expect, it } from "vitest";
import { DEMO_TODAY, loadAgentData, toUnits } from "./units.js";

const files = loadAgentData();
const daysBefore = (date: string) => (Date.parse(DEMO_TODAY) - Date.parse(date)) / 86_400_000;

describe("demo knowledge", () => {
  it("has data for all three demo agents", () => {
    expect(files.map((f) => f.agent)).toEqual(["lozenets-price-check", "mladost-price-check", "varna-coast-price-check"]);
  });

  it("has at least 5 two-bed Lozenets comparables from the last 90 days", () => {
    const lozenets = files.find((f) => f.agent === "lozenets-price-check")!;
    const comparables = lozenets.deals.filter((d) => d.bedrooms === 2 && daysBefore(d.sold_on) <= 90);
    expect(comparables.length).toBeGreaterThanOrEqual(5);
  });

  it("marks every deal record synthetic internally only, and dates it by its sale", () => {
    for (const file of files) {
      for (const unit of toUnits(file).filter((u) => u.kind === "record")) {
        expect(unit.text).toMatch(/^Closed deal:/);
        expect(unit.text).not.toMatch(/synthetic/i);
        expect(unit.source).not.toMatch(/synthetic/i);
        expect(unit.data).toMatchObject({ synthetic: true, sold_on: unit.as_of });
      }
    }
  });

  it("gives every unit a source and an as-of date no later than the demo date", () => {
    for (const unit of files.flatMap(toUnits)) {
      expect(unit.source).not.toBe("");
      expect(daysBefore(unit.as_of)).toBeGreaterThanOrEqual(0);
    }
  });

  it("uses unique keys per agent", () => {
    for (const file of files) {
      const keys = toUnits(file).map((u) => u.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("renders deal text deterministically", () => {
    const lozenets = files.find((f) => f.agent === "lozenets-price-check")!;
    expect(toUnits(lozenets).find((u) => u.key === "deal-l01")!.text).toBe(
      "Closed deal: 2-bed flat, 74 m², floor 3 of 6, built 2008, no parking, near South Park, Lozenets, Sofia. " +
        "Sold for €172,000 (€2,324/m²) on 2026-09-28.",
    );
  });
});
