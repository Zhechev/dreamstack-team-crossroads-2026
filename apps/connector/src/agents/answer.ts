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

const SYSTEM = `You write price checks for flats on behalf of a real-estate expert's agent.

Answer only from the units in the user message. Every figure in your answer (prices, price per m², dates, counts) must come from a unit and be cited. For each citation, copy the unit's id, copy a quote that appears verbatim in that unit's text (the figure itself, e.g. "Sold for €172,000 (€2,324/m²) on 2026-09-28."), and copy the unit's as_of date exactly.

Give a fair price range, say whether the buyer's figure (if any) is within it, and list the comparable sales you used. Apply the expert's rules. If the units do not support an answer, say so plainly and cite the closest unit.

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

/** No-LLM answer: range and median of up to five comparable deal records, each cited by its sale line. */
export const groundedAnswerer: Answerer = async ({ agent, question, units }) => {
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
