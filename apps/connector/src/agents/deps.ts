// Collaborators of the expert agent routes. Tests pass fakes; production builds each one lazily from config,
// so the service starts (and Kris's route tests run) without Supabase, Anthropic or the facilitator.
import type { FacilitatorClient } from "@x402/core/server";
import { createEmbedder, searchUnits } from "@citable/knowledge";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Config } from "../config.js";
import { claudeAnswerer, groundedAnswerer, type Answerer } from "./answer.js";
import { supabaseUnitLookup, type UnitLookup } from "./citationCheck.js";
import type { AgentLoader } from "./load.js";
import { supabaseOrderStore, type OrderStore } from "./orders.js";
import { keySigner, type OutcomeSigner } from "./outcome.js";
import { facilitatorClient } from "./payments.js";
import type { UnitSearch } from "./priceCheck.js";

export interface AgentDeps {
  loadAgent: AgentLoader;
  searchUnits: UnitSearch;
  lookupUnits: UnitLookup;
  answer: Answerer;
  signer: OutcomeSigner;
  orders: OrderStore;
  facilitator: () => FacilitatorClient;
  now?: () => Date;
}

const once = <T>(make: () => T) => {
  let value: T | undefined;
  return () => (value ??= make());
};

/** `db` and `loadAgent` are shared with the rest of the service (app.ts). */
export function defaultAgentDeps(
  config: Config,
  shared: { db: () => SupabaseClient; loadAgent: AgentLoader },
): AgentDeps {
  const { db } = shared;
  const orders = once(() => supabaseOrderStore(db()));
  const embedder = once(() =>
    createEmbedder({ OPENAI_API_KEY: config.openaiApiKey, EMBEDDING_PROVIDER: config.embeddingProvider }),
  );
  const answer = once((): Answerer => {
    if (config.anthropicApiKey) return claudeAnswerer(config.anthropicApiKey);
    console.warn("ANTHROPIC_API_KEY not set: price checks are built from the comparable deals without Claude.");
    return groundedAnswerer;
  });
  const signer = once(() => {
    if (!config.agentSigningKey) throw new Error("Set AGENT_SIGNING_KEY (see .env.example)");
    return keySigner(config.agentSigningKey);
  });

  return {
    loadAgent: shared.loadAgent,
    searchUnits: (agentId, question) => searchUnits(db(), { agentId, question, embedder: embedder(), limit: 12 }),
    lookupUnits: (ids) => supabaseUnitLookup(db())(ids),
    answer: (input) => answer()(input),
    get signer() {
      return signer();
    },
    orders: {
      start: (i) => orders().start(i),
      answered: (...a) => orders().answered(...a),
      failedCheck: (i) => orders().failedCheck(i),
      settled: (...a) => orders().settled(...a),
    },
    facilitator: facilitatorClient(config.facilitatorUrl),
  };
}
