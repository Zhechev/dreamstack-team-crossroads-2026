// GET ?id=<order uuid> (or POST {order_id}) → status, answer, citations, tx hash, terms hash.
// The order id is the capability: it is only shared with the buyer's assistant and receipt page.
import { db, HttpError, readJson, serve, usdc, UUID } from "../_shared/http.ts";

serve(["GET", "POST"], async (req) => {
  const id = req.method === "GET" ? new URL(req.url).searchParams.get("id") : (await readJson(req)).order_id;
  if (typeof id !== "string" || !UUID.test(id)) throw new HttpError(400, "order id (uuid) is required");

  const { data: order, error } = await db
    .from("orders")
    .select(`id, status, question, price, fee, answer, citations, citations_verified, tx_hash, terms_hash,
             created_at, updated_at, agents(slug, name, experts(name, demo_label)), agent_versions(version),
             capabilities(slug, name, tier)`)
    .eq("id", id)
    .eq("is_demo", false)
    .maybeSingle();
  if (error) throw error;
  if (!order) throw new HttpError(404, "Order not found");

  const { agents: agent, agent_versions: version, capabilities: capability, ...rest } = order as any;
  return {
    ...rest,
    price: usdc(rest.price),
    fee: usdc(rest.fee),
    agent: { slug: agent.slug, name: agent.name, expert: agent.experts.name, demo_label: agent.experts.demo_label },
    agent_version: version?.version ?? null,
    capability,
  };
});
