// Free evaluation: can this agent answer the question, what will it deliver, at what price.
// Deterministic on purpose: it costs nothing and never hallucinates a yes.
import { Evaluation } from "@citable/protocol";
import type { AgentConfig } from "./load.js";

/** How long an evaluation's price holds. */
export const EVALUATION_TTL_MS = 15 * 60_000;

// Words that make a question about residential property prices.
const PROPERTY = /\b(flat|flats|apartment|apartments|studio|\d\s*-?\s*bed(room)?s?|bedroom|m2|sqm|square met(re|er)s?|property|properties|home|house|maisonette|penthouse)\b|m²/i;

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
  const area = areaOf(agent);
  const canAnswer = capability !== undefined && PROPERTY.test(question) && mentions(question, area);

  return Evaluation.parse({
    agent_id: agent.slug,
    can_answer: canAnswer,
    deliverable: canAnswer
      ? capability.deliverable
      : `Out of scope: ${agent.name} gives price checks for flats in ${agent.area.replace(" / ", ", ")}.`,
    // The schema needs a price; out of scope means nothing to buy.
    price: canAnswer ? capability.price : "0.00",
    expires_at: new Date(now.getTime() + EVALUATION_TTL_MS).toISOString(),
  });
}
