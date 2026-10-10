// Deterministic citation check before settlement (ADR-009). No LLM: a buyer never pays for an invented citation.
import type { SignedOutcome } from "@citable/protocol";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentConfig } from "./load.js";
import { verifyOutcomeSignature } from "./outcome.js";

export interface CitableUnit {
  id: string;
  agent_id: string;
  text: string;
  as_of: string;
}

/** Reads the cited units by id (any agent's: the check itself enforces ownership). */
export type UnitLookup = (ids: string[]) => Promise<CitableUnit[]>;

export interface CheckResult {
  ok: boolean;
  /** One line per failure, e.g. "citation 2: quote not found in unit". */
  failures: string[];
}

/** Case, whitespace, dash, quote and thousands-separator differences don't make a quote false. */
export function normalise(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‐-―−]/g, "-")
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/(\d)[,   ](?=\d{3}\b)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export async function checkCitations(
  lookup: UnitLookup,
  input: { agent: AgentConfig; orderId: string; outcome: SignedOutcome },
): Promise<CheckResult> {
  const { agent, orderId, outcome } = input;
  const failures: string[] = [];

  // 1. The outcome is signed by this agent, for its authorised version and this order.
  if (!agent.signing_address) failures.push("agent has no signing address");
  else if (!(await verifyOutcomeSignature(agent.slug, agent.signing_address, outcome))) failures.push("signature does not match the agent");
  if (outcome.agent_version !== String(agent.version)) failures.push(`agent version ${outcome.agent_version} is not v${agent.version}`);
  if (outcome.order_id !== orderId) failures.push("outcome is for another order");
  if (outcome.citations.length === 0) failures.push("no citations");

  // 2. Every citation points at one of this agent's units, quotes it, and carries its as-of date.
  const units = new Map((await lookup([...new Set(outcome.citations.map((c) => c.unit_id))])).map((u) => [u.id, u]));
  outcome.citations.forEach((c, i) => {
    const n = i + 1;
    const unit = units.get(c.unit_id);
    if (!unit) return failures.push(`citation ${n}: unit ${c.unit_id} does not exist`);
    if (unit.agent_id !== agent.id) return failures.push(`citation ${n}: unit belongs to another agent`);
    if (!normalise(unit.text).includes(normalise(c.quote))) failures.push(`citation ${n}: quote not found in unit`);
    if (unit.as_of !== c.as_of) failures.push(`citation ${n}: as_of ${c.as_of} does not match the unit's ${unit.as_of}`);
  });

  return { ok: failures.length === 0, failures };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Units by id from Supabase (service role: units are private). Non-uuid ids simply don't exist. */
export function supabaseUnitLookup(db: SupabaseClient): UnitLookup {
  return async (ids) => {
    const valid = ids.filter((id) => UUID.test(id));
    if (valid.length === 0) return [];
    const { data, error } = await db.from("units").select("id, agent_id, text, as_of").in("id", valid);
    if (error) throw new Error(`read cited units: ${error.message}`);
    return data;
  };
}
