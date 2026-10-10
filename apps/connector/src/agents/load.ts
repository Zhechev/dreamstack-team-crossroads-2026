// Per-agent config (sources, rules, prices, version, payout address), loaded from Supabase.
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AgentCapability {
  slug: string;
  tier: 1 | 2 | 3;
  name: string;
  deliverable: string;
  /** Protocol USDC text, e.g. "0.50". */
  price: string;
  is_live: boolean;
}

export interface AgentConfig {
  id: string;
  slug: string;
  name: string;
  vertical: string;
  /** e.g. "Sofia / Lozenets"; the last part is the area the agent covers. */
  area: string;
  version: number;
  sources: { name: string; url: string | null; layer: "base" | "expert" }[];
  rules: string[];
  payout_address: `0x${string}`;
  signing_address: `0x${string}` | null;
  capabilities: AgentCapability[];
}

export type AgentLoader = (idOrSlug: string) => Promise<AgentConfig | null>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const usdc = (n: number | string) => {
  const decimals = (String(Number(n)).split(".")[1] ?? "").length;
  return Number(n).toFixed(Math.min(6, Math.max(2, decimals)));
};

/** Reads the agent's authorised version from Supabase; cached for `ttlMs` so config edits show up quickly. */
export function supabaseAgentLoader(db: SupabaseClient, ttlMs = 60_000): AgentLoader {
  const cache = new Map<string, { at: number; config: AgentConfig | null }>();

  return async (idOrSlug) => {
    const hit = cache.get(idOrSlug);
    if (hit && Date.now() - hit.at < ttlMs) return hit.config;

    const { data, error } = await db
      .from("agents")
      .select(`id, slug, name, vertical, area, payout_address, signing_address, is_online,
               agent_versions!inner(version, sources, rules),
               capabilities(slug, tier, name, deliverable, price, is_live)`)
      .eq(UUID.test(idOrSlug) ? "id" : "slug", idOrSlug)
      .eq("agent_versions.status", "authorised")
      .maybeSingle();
    if (error) throw new Error(`load agent ${idOrSlug}: ${error.message}`);

    const config: AgentConfig | null =
      data && data.is_online
        ? {
            id: data.id,
            slug: data.slug,
            name: data.name,
            vertical: data.vertical,
            area: data.area,
            version: data.agent_versions[0].version,
            sources: data.agent_versions[0].sources,
            rules: data.agent_versions[0].rules,
            payout_address: data.payout_address,
            signing_address: data.signing_address,
            capabilities: data.capabilities
              .map((c) => ({ ...c, price: usdc(c.price) }))
              .sort((a, b) => a.tier - b.tier),
          }
        : null;
    cache.set(idOrSlug, { at: Date.now(), config });
    return config;
  };
}
