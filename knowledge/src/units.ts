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

/** A finished piece of paid work (a renovation, a lawyer's engagement): what it was and what it cost. */
const Job = z.object({
  key: z.string().regex(/^job-/),
  service: z.string().min(1),
  size_m2: z.number().positive().optional(),
  scope: z.string().min(1),
  district: z.string().min(1),
  price_eur: z.number().int().positive(),
  completed_on: z.iso.date(),
});

export const AgentData = z.object({
  agent: z.string().min(1),
  area: z.string().min(1),
  /** Source name shown on records: closed deals, or completed jobs. */
  deal_source: z.string().min(1),
  /** How a job record starts and names its price, e.g. "Completed job" / "Final price", "Engagement" / "Fee". */
  job_label: z.string().default("Completed job"),
  price_label: z.string().default("Final price"),
  passages: z.array(Passage),
  deals: z.array(Deal).default([]),
  jobs: z.array(Job).default([]),
});

export type AgentData = z.infer<typeof AgentData>;
export type Deal = z.infer<typeof Deal>;
export type Job = z.infer<typeof Job>;

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
    `Closed deal: ${size}, ${deal.area_m2} m², floor ${deal.floor} of ${deal.floors},`,
    `built ${deal.built}, ${deal.parking ? "with parking" : "no parking"}, ${deal.street}, ${area}.`,
    `Sold for ${eur(deal.price_eur)} (${eur(perM2)}/m²) on ${deal.sold_on}.`,
  ].join(" ");
}

/** The citable text of a job record; the last sentence ("Final price … on …") is what answers quote. */
export function jobText(job: Job, file: Pick<AgentData, "area" | "job_label" | "price_label">): string {
  const size = job.size_m2 === undefined ? "" : `${job.size_m2} m², `;
  const perM2 = job.size_m2 === undefined ? "" : ` (${eur(Math.round(job.price_eur / job.size_m2))}/m²)`;
  return [
    `${file.job_label}: ${job.service}, ${size}${job.scope}, ${job.district}, ${file.area}.`,
    `${file.price_label} ${eur(job.price_eur)}${perM2} on ${job.completed_on}.`,
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
  const jobs: UnitRow[] = file.jobs.map((j) => ({
    key: j.key,
    layer: "expert",
    source: file.deal_source,
    source_url: null,
    as_of: j.completed_on,
    kind: "record",
    text: jobText(j, file),
    data: {
      ...j,
      area: file.area,
      ...(j.size_m2 === undefined ? {} : { price_per_m2_eur: Math.round(j.price_eur / j.size_m2) }),
      synthetic: true,
    },
  }));
  return [...passages, ...deals, ...jobs];
}
