// Hybrid search over one agent's units (FTS + trigram + vector), via the search_units SQL function.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Embedder } from "./embed.js";

export interface FoundUnit {
  id: string;
  layer: "base" | "expert";
  source: string;
  source_url: string | null;
  as_of: string;
  kind: "passage" | "record";
  text: string;
  data: Record<string, unknown> | null;
  score: number;
}

export interface SearchOptions {
  agentId: string;
  question: string;
  /** Without an embedder the search uses full-text + trigram only. */
  embedder?: Embedder | null;
  limit?: number;
}

/** Needs a service-role client: units are not readable with the anon key. */
export async function searchUnits(
  client: SupabaseClient,
  { agentId, question, embedder, limit = 8 }: SearchOptions,
): Promise<FoundUnit[]> {
  const embedding = embedder ? (await embedder([question]))[0] : null;
  const { data, error } = await client.rpc("search_units", {
    p_agent_id: agentId,
    p_query: question,
    p_embedding: embedding ? JSON.stringify(embedding) : null,
    p_limit: limit,
  });
  if (error) throw new Error(`search_units failed: ${error.message}`);
  return data as FoundUnit[];
}
