// Writes the price check from retrieved units only. Claude when a key is set, otherwise a deterministic
// answer built from the comparable deal records. Either way every figure cites a unit (ADR-008).
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { Citation } from "@citable/protocol";
import type { FoundUnit } from "@citable/knowledge";
import { z } from "zod";
import type { AgentConfig } from "./load.js";

export interface AnswerInput {
  agent: AgentConfig;
  question: string;
  /** Already filtered to what the expert's rules allow (e.g. deals from the last 90 days). */
  units: FoundUnit[];
}

export interface Answer {
  text: string;
  citations: Citation[];
}

export type Answerer = (input: AnswerInput) => Promise<Answer>;

/** The answer can't be given from the evidence (no comparables, refusal, bad output): never settle. */
export class NoAnswerError extends Error {}

export const CLAUDE_MODEL = "claude-opus-5-5";

const AnswerSchema = z.object({
  text: z.string(),
  citations: z.array(z.object({ unit_id: z.string(), quote: z.string(), as_of: z.string() })),
});

const SYSTEM = `You write price checks on behalf of a local expert's agent: what flats sell for, what renovation jobs cost, or what a property lawyer charges.

Answer only from the units in the user message. Every figure in your answer (prices, fees, price per m², dates, counts) must come from a unit and be cited. For each citation, copy the unit's id, copy a quote that appears verbatim in that unit's text (the figure itself, e.g. "Sold for €172,000 (€2,324/m²) on 2026-09-28." or "Fee €450 on 2026-09-30."), and copy the unit's as_of date exactly.

Give a fair price range, say whether the buyer's figure (if any) is within it, and list the comparable sales, jobs or engagements you used. Apply the expert's rules. If the units do not support an answer, say so plainly and cite the closest unit.

Call it a "price check". Never use the words "appraisal" or "valuation", and do not give legal, tax or financial advice. Never include personal details: if you need to address the buyer, write {{full_name}}; for a property address write {{address}}.

Keep the text short: two to five sentences, then the comparables as a short list.`;

export function claudeAnswerer(apiKey: string, client = new Anthropic({ apiKey })): Answerer {
  return async ({ agent, question, units }) => {
    if (units.length === 0) throw new NoAnswerError("no units to answer from");
    const unitsText = units
      .map((u) => `<unit id="${u.id}" as_of="${u.as_of}" source="${u.source}">\n${u.text}\n</unit>`)
      .join("\n");

    const response = await client.beta.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      // Short, fully grounded task: medium is enough (and is this model's default; set explicitly).
      output_config: { effort: "medium", format: betaZodOutputFormat(AnswerSchema) },
      // On a safety decline the API re-runs the request on a fallback model inside the same call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content:
            `Agent: ${agent.name} (${agent.area}), Expert Verified v${agent.version}.\n` +
            `Expert rules:\n${agent.rules.map((r) => `- ${r}`).join("\n")}\n\n` +
            `Units:\n${unitsText}\n\nQuestion: ${question}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") throw new NoAnswerError("model declined to answer");
    if (response.stop_reason === "max_tokens") throw new NoAnswerError("answer was cut off");
    const parsed = response.parsed_output;
    if (!parsed || parsed.citations.length === 0) throw new NoAnswerError("no parseable, cited answer");
    return parsed;
  };
}

const eur = (n: number) => `€${n.toLocaleString("en-US")}`;

/** "€180k", "180,000 EUR", "EUR 180000" → 180000. */
export function askingPrice(question: string): number | null {
  const m = question.match(/(?:€|eur\s*)\s*(\d[\d,.\s]*)(k)?|(\d[\d,.\s]*)(k)?\s*(?:€|eur)/i);
  if (!m) return null;
  const digits = (m[1] ?? m[3]).replace(/[,\s]/g, "");
  const value = Number(digits) * (m[2] || m[4] ? 1000 : 1);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** "2-bed", "2 bedroom", "studio" → bedrooms; null when the question doesn't say. */
export function bedroomsAsked(question: string): number | null {
  if (/\bstudio\b/i.test(question)) return 0;
  const m = question.match(/\b(\d)\s*-?\s*bed(room)?s?\b/i);
  return m ? Number(m[1]) : null;
}

/** "8 sq m", "8m2", "8 m²", "8 square meters" → 8; null when the question doesn't say. */
export function sizeAsked(question: string): number | null {
  const m = question.match(/(\d+(?:[.,]\d+)?)\s*(?:sq\.?\s*m|sqm|m2|m²|square\s*met(?:re|er)s?)/i);
  return m ? Number(m[1].replace(",", ".")) : null;
}

const SIGNIFICANT = (text: string) => text.toLowerCase().match(/\p{L}{5,}/gu) ?? [];

/**
 * No-LLM answer for job records (renovations, a lawyer's engagements): range and average of up to five recent jobs
 * of the kind asked about, each cited by its price line; per m² and scaled to the size asked when jobs have a size.
 */
function jobsAnswer({ agent, question, units }: AnswerInput): Answer {
  const records = units.filter((u) => u.kind === "record" && u.data && typeof u.data.service === "string");
  // The jobs whose service shares the most words with the question ("bathroom renovation" beats "kitchen renovation").
  const asked = new Set(SIGNIFICANT(question));
  const overlap = (u: FoundUnit) => SIGNIFICANT(String(u.data!.service)).filter((w) => asked.has(w)).length;
  const best = Math.max(0, ...records.map(overlap));
  const jobs = records
    .filter((u) => overlap(u) === best)
    .sort((a, b) => b.as_of.localeCompare(a.as_of))
    .slice(0, 5);
  if (jobs.length === 0) throw new NoAnswerError("no comparable jobs in the agent's data");

  const prices = jobs.map((u) => Number(u.data!.price_eur));
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const average = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const service = String(jobs[0]!.data!.service);
  const fee = agent.vertical === "legal-fees";
  const noun = fee ? "engagements" : "completed jobs";

  let perM2 = "";
  const sizes = jobs.map((u) => u.data!.size_m2).filter((n): n is number => typeof n === "number");
  if (sizes.length === jobs.length) {
    const rates = jobs.map((u) => Number(u.data!.price_eur) / Number(u.data!.size_m2));
    const rate = rates.reduce((a, b) => a + b, 0) / rates.length;
    const size = sizeAsked(question);
    perM2 =
      ` That is ${eur(Math.round(Math.min(...rates)))}–${eur(Math.round(Math.max(...rates)))} per m² (average ${eur(Math.round(rate))}/m²)` +
      (size === null ? "." : `, so about ${eur(Math.round((rate * size) / 100) * 100)} for ${size} m².`);
  }

  const priceLine = (u: FoundUnit) => u.text.slice(u.text.lastIndexOf(". ") + 2);
  const text =
    `${fee ? "Fee check" : "Price check"} for ${service} in ${agent.area}: ${jobs.length} ${noun} from the last 90 days ` +
    `cost between ${eur(low)} and ${eur(high)} (average ${eur(average)}).${perM2}\n` +
    jobs.map((u, i) => `[${i + 1}] ${u.text}`).join("\n");

  return { text, citations: jobs.map((u) => ({ unit_id: u.id, quote: priceLine(u), as_of: u.as_of })) };
}

/** No-LLM answer: range and median of up to five comparable deal records, each cited by its sale line. */
export const groundedAnswerer: Answerer = async (input) => {
  if (input.agent.vertical !== "real-estate") return jobsAnswer(input);
  const { agent, question, units } = input;
  const bedrooms = bedroomsAsked(question);
  const comparables = units
    .filter((u) => u.kind === "record" && u.data && (bedrooms === null || u.data.bedrooms === bedrooms))
    .sort((a, b) => b.as_of.localeCompare(a.as_of))
    .slice(0, 5);
  if (comparables.length === 0) throw new NoAnswerError("no comparable sales in the agent's data");

  const prices = comparables.map((u) => Number(u.data!.price_eur)).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 ? prices[mid] : Math.round((prices[mid - 1] + prices[mid]) / 2);
  const low = prices[0];
  const high = prices[prices.length - 1];
  const area = agent.area.split("/").pop()!.trim();
  const kind = bedrooms === null ? "flat" : bedrooms === 0 ? "studio" : `${bedrooms}-bed flat`;

  const asked = askingPrice(question);
  const verdict =
    asked === null
      ? ""
      : asked < low
        ? ` ${eur(asked)} is below that range.`
        : asked > high
          ? ` ${eur(asked)} is above that range.`
          : ` ${eur(asked)} is within that range.`;

  const saleLine = (u: FoundUnit) => u.text.slice(u.text.indexOf("Sold for"));
  const text =
    `Price check for a ${kind} in ${area}: ${comparables.length} comparable sales from the last 90 days ` +
    `closed between ${eur(low)} and ${eur(high)} (median ${eur(median)}).${verdict}\n` +
    comparables.map((u, i) => `[${i + 1}] ${saleLine(u)}`).join("\n");

  return {
    text,
    citations: comparables.map((u) => ({ unit_id: u.id, quote: saleLine(u), as_of: u.as_of })),
  };
};
