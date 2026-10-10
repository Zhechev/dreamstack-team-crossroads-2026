// Demo knowledge files (data/*.json) → citable unit rows (ADR-008).
import { readdirSync, readFileSync } from "node:fs";
import { z } from "zod";

const DATA_DIR = new URL("../data/", import.meta.url);

/** The day the demo data was written; "last 90 days" is counted from here. */
export const DEMO_TODAY = "2026-10-10";

const Passage = z.object({
  key: z.string().min(1),
  layer: z.enum(["base", "expert"]),
  source: z.string().min(1),
  source_url: z.url().nullable(),
  as_of: z.iso.date(),
  text: z.string().min(1),
});

const Deal = z.object({
  key: z.string().regex(/^deal-/),
  bedrooms: z.number().int().min(0),
  area_m2: z.number().positive(),
  floor: z.number().int().min(0),
  floors: z.number().int().positive(),
  built: z.number().int(),
  parking: z.boolean(),
  price_eur: z.number().int().positive(),
  sold_on: z.iso.date(),
  street: z.string().min(1),
});

export const AgentData = z.object({
  agent: z.string().min(1),
  area: z.string().min(1),
  deal_source: z.string().regex(/\(synthetic\)$/, "deal source must be labelled (synthetic)"),
  passages: z.array(Passage),
  deals: z.array(Deal),
});

export type AgentData = z.infer<typeof AgentData>;
export type Deal = z.infer<typeof Deal>;

/** One row of the `units` table, minus agent_id and embedding. */
export interface UnitRow {
  key: string;
  layer: "base" | "expert";
  source: string;
  source_url: string | null;
  as_of: string;
  kind: "passage" | "record";
  text: string;
  data: Record<string, unknown> | null;
}

export function loadAgentData(): AgentData[] {
  return readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => AgentData.parse(JSON.parse(readFileSync(new URL(f, DATA_DIR), "utf8"))));
}

const eur = (n: number) => `€${n.toLocaleString("en-US")}`;

/** The citable text of a deal record. Deterministic: quotes are checked against it (ADR-009). */
export function dealText(deal: Deal, area: string): string {
  const size = deal.bedrooms === 0 ? "Studio" : `${deal.bedrooms}-bed flat`;
  const perM2 = Math.round(deal.price_eur / deal.area_m2);
  return [
    `Synthetic deal record: ${size}, ${deal.area_m2} m², floor ${deal.floor} of ${deal.floors},`,
    `built ${deal.built}, ${deal.parking ? "with parking" : "no parking"}, ${deal.street}, ${area}.`,
    `Sold for ${eur(deal.price_eur)} (${eur(perM2)}/m²) on ${deal.sold_on}.`,
  ].join(" ");
}

export function toUnits(file: AgentData): UnitRow[] {
  const passages: UnitRow[] = file.passages.map((p) => ({ ...p, kind: "passage", data: null }));
  const deals: UnitRow[] = file.deals.map((d) => ({
    key: d.key,
    layer: "expert",
    source: file.deal_source,
    source_url: null,
    as_of: d.sold_on,
    kind: "record",
    text: dealText(d, file.area),
    data: { ...d, area: file.area, price_per_m2_eur: Math.round(d.price_eur / d.area_m2), synthetic: true },
  }));
  return [...passages, ...deals];
}
