// Free evaluation: can this agent answer the question, what will it deliver, at what price.
// Deterministic on purpose: it costs nothing and never hallucinates a yes.
import { Evaluation } from "@citable/protocol";
import type { AgentConfig } from "./load.js";

/** How long an evaluation's price holds. */
export const EVALUATION_TTL_MS = 15 * 60_000;

// Words that make a question about residential property prices.
const PROPERTY = /\b(flat|flats|apartment|apartments|studio|\d\s*-?\s*bed(room)?s?|bedroom|m2|sqm|square met(re|er)s?|property|properties|home|house|maisonette|penthouse)\b|m²/i;
const RENOVATION = /\b(renovat\w*|refurbish\w*|remodel\w*|refit\w*|bathroom|kitchen|tiling)\b/i;
const LEGAL_FEES = /\b(lawyer|lawyers|attorney|solicitor|legal fees?|preliminary contract|notary)\b/i;

/**
 * What each vertical's agents answer. Flat price checks need the agent's district named; renovation and
 * lawyer fees are city-wide, so a follow-up like "and a bathroom renovation?" is enough.
 */
const VERTICALS: Record<string, { covers: (q: string, agent: AgentConfig) => boolean; scope: (agent: AgentConfig) => string }> = {
  "real-estate": {
    // A lawyer's fee or a renovation cost mentions "property" too; those go to their own experts.
    covers: (q, agent) => PROPERTY.test(q) && mentions(q, areaOf(agent)) && !LEGAL_FEES.test(q) && !/\brenovation (cost|price)|\b(bathroom|kitchen) renovation/i.test(q),
    scope: (agent) => `price checks for flats in ${agent.area.replace(" / ", ", ")}`,
  },
  renovation: {
    covers: (q) => RENOVATION.test(q),
    scope: (agent) => `price checks for renovation jobs in ${agent.area}`,
  },
  "legal-fees": {
    covers: (q) => LEGAL_FEES.test(q),
    scope: (agent) => `fee checks for a property lawyer's work in ${agent.area}`,
  },
};

/** The area the agent covers: the last part of "Sofia / Lozenets" → "Lozenets". */
export function areaOf(agent: Pick<AgentConfig, "area">): string {
  return agent.area.split("/").pop()!.trim();
}

/** Accent- and case-insensitive whole-word match. */
function mentions(text: string, word: string): boolean {
  const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const escaped = fold(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}])${escaped}([^\\p{L}]|$)`, "u").test(fold(text));
}

export function evaluate(agent: AgentConfig, question: string, now = new Date()): Evaluation {
  const capability = agent.capabilities.find((c) => c.tier === 1 && c.is_live);
  const vertical = VERTICALS[agent.vertical] ?? VERTICALS["real-estate"]!;
  const canAnswer = capability !== undefined && vertical.covers(question, agent);

  return Evaluation.parse({
    agent_id: agent.slug,
    can_answer: canAnswer,
    deliverable: canAnswer
      ? capability.deliverable
      : `Out of scope: ${agent.name} gives ${vertical.scope(agent)}.`,
    // The schema needs a price; out of scope means nothing to buy.
    price: canAnswer ? capability.price : "0.00",
    expires_at: new Date(now.getTime() + EVALUATION_TTL_MS).toISOString(),
  });
}
