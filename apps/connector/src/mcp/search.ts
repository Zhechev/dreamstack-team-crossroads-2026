// find_expert's data: the search_agents RPC from ticket 06 (top 3 authorised agents, ADR-004).
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ExpertMatch {
  agent_id: string;
  name: string;
  expert: string;
  area: string;
  badge: string;
  rating: number | null;
  rating_count: number;
  capabilities: { tier: number; name: string; price: string; price_is_minimum: boolean; available_now: boolean }[];
}

export type ExpertSearch = (question: string, budget?: string) => Promise<ExpertMatch[]>;

type Row = {
  slug: string;
  name: string;
  area: string;
  expert_name: string;
  demo_label: string | null;
  badge: string;
  rating: number | string | null;
  rating_count: number | string;
  capabilities: { tier: number; name: string; price: string; price_is_minimum: boolean; is_live: boolean }[];
};

export function toExpertMatch(row: Row): ExpertMatch {
  return {
    agent_id: row.slug,
    name: row.name,
    expert: row.expert_name,
    area: row.area,
    badge: row.badge,
    rating: row.rating === null ? null : Number(row.rating),
    rating_count: Number(row.rating_count),
    capabilities: row.capabilities.map((c) => ({
      tier: c.tier,
      name: c.name,
      price: c.price,
      price_is_minimum: c.price_is_minimum,
      available_now: c.is_live,
    })),
  };
}

export function supabaseExpertSearch(db: SupabaseClient): ExpertSearch {
  return async (question, budget) => {
    const { data, error } = await db.rpc("search_agents", {
      p_question: question,
      p_budget: budget === undefined ? null : Number(budget),
    });
    if (error) throw new Error(`search agents: ${error.message}`);
    return (data as Row[]).map(toExpertMatch);
  };
}
