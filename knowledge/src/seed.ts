// Seeds every agent's units from data/*.json. Re-runnable: upserts by (agent, key), keeps unit ids,
// re-embeds only changed text, and deletes units that left the data files.
// Usage: pnpm --filter @citable/knowledge seed   (reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from ../.env)
import { pathToFileURL } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createEmbedder, type Embedder } from "./embed.js";
import { loadAgentData, toUnits } from "./units.js";

export async function seedUnits(client: SupabaseClient, embedder: Embedder | null): Promise<void> {
  for (const file of loadAgentData()) {
    const { data: agent, error: agentError } = await client
      .from("agents").select("id").eq("slug", file.agent).single();
    if (agentError) throw new Error(`agent ${file.agent}: ${agentError.message}`);

    const { data: existing, error: readError } = await client
      .from("units").select("key, text, embedding").eq("agent_id", agent.id);
    if (readError) throw new Error(`read units: ${readError.message}`);
    const before = new Map(existing.map((u) => [u.key as string, u]));

    const rows = toUnits(file);
    const stale = embedder ? rows.filter((r) => before.get(r.key)?.text !== r.text || !before.get(r.key)?.embedding) : [];
    const vectors = embedder ? await embedder(stale.map((r) => r.text)) : [];
    const fresh = new Map(stale.map((r, i) => [r.key, JSON.stringify(vectors[i])]));

    const upserts = rows.map((r) => {
      const old = before.get(r.key);
      const embedding = fresh.get(r.key) ?? (old?.text === r.text ? old.embedding : null);
      return { ...r, agent_id: agent.id, embedding };
    });
    const { error: upsertError } = await client.from("units").upsert(upserts, { onConflict: "agent_id,key" });
    if (upsertError) throw new Error(`upsert units: ${upsertError.message}`);

    const gone = [...before.keys()].filter((k) => !rows.some((r) => r.key === k));
    if (gone.length > 0) {
      const { error } = await client.from("units").delete().eq("agent_id", agent.id).in("key", gone);
      if (error) throw new Error(`delete units: ${error.message}`);
    }

    const embedded = upserts.filter((u) => u.embedding).length;
    console.log(`${file.agent}: ${rows.length} units (${fresh.size} embedded now, ${embedded} with embeddings, ${gone.length} removed)`);
  }
  if (!embedder) console.log("No embedding provider (set OPENAI_API_KEY): search runs on full-text + trigram only.");
}

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example)");
  await seedUnits(createClient(url, key, { auth: { persistSession: false } }), createEmbedder());
}
