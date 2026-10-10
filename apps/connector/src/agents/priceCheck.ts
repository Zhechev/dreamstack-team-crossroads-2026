// Tier 1 price check: retrieve the agent's units, apply the freshness rule, answer from them only, sign.
import { SignedOutcome } from "@citable/protocol";
import type { FoundUnit } from "@citable/knowledge";
import { NoAnswerError, type Answerer } from "./answer.js";
import type { AgentConfig } from "./load.js";
import type { OutcomeSigner } from "./outcome.js";

export type UnitSearch = (agentId: string, question: string) => Promise<FoundUnit[]>;

/** Deal records older than this are not comparables ("Use only deals closed in the last 90 days."). */
export const MAX_RECORD_AGE_DAYS = 90;

// ADR-014: a price check is never called an appraisal or a valuation.
const FORBIDDEN = /\b(apprais\w*|valuation\w*)\b/i;

export function freshUnits(units: FoundUnit[], now: Date, maxAgeDays = MAX_RECORD_AGE_DAYS): FoundUnit[] {
  const cutoff = now.getTime() - maxAgeDays * 86_400_000;
  return units.filter((u) => u.kind !== "record" || Date.parse(u.as_of) >= cutoff);
}

export interface PriceCheckDeps {
  searchUnits: UnitSearch;
  answer: Answerer;
  signer: OutcomeSigner;
  now?: () => Date;
}

export async function runPriceCheck(
  deps: PriceCheckDeps,
  input: { agent: AgentConfig; question: string; orderId: string },
): Promise<SignedOutcome> {
  const now = deps.now?.() ?? new Date();
  const units = freshUnits(await deps.searchUnits(input.agent.id, input.question), now);
  const answer = await deps.answer({ agent: input.agent, question: input.question, units });

  if (FORBIDDEN.test(answer.text)) throw new NoAnswerError("answer used forbidden wording (appraisal/valuation)");

  const outcome = await deps.signer.sign(input.agent.slug, {
    order_id: input.orderId,
    text: answer.text,
    citations: answer.citations,
    agent_version: String(input.agent.version),
    created_at: now.toISOString(),
  });
  // Fails loudly if the answer doesn't fit the protocol (e.g. a citation without as_of).
  return SignedOutcome.parse(outcome);
}
