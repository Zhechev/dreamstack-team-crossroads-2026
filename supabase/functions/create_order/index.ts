// POST {agent_id, question, capability?} with header x-connector-token → a new order awaiting payment.
// agent_id may be the agent's uuid or slug; capability defaults to the live price check.
import { db, HttpError, readJson, serve, usdc, UUID } from "../_shared/http.ts";
import { requireLink } from "../_shared/links.ts";

serve(["POST"], async (req) => {
  const link = await requireLink(req.headers.get("x-connector-token"));
  const { agent_id, question, capability = "price-check" } = await readJson(req);
  if (typeof agent_id !== "string" || agent_id === "") throw new HttpError(400, "agent_id is required");
  if (typeof question !== "string" || question.trim() === "") throw new HttpError(400, "question is required");
  if (typeof capability !== "string") throw new HttpError(400, "capability must be a slug");

  const { data: agent, error: agentError } = await db
    .from("agents")
    .select("id, slug, payout_address, agent_versions!inner(id, version), capabilities!inner(id, slug, price, is_live)")
    .eq(UUID.test(agent_id) ? "id" : "slug", agent_id)
    .eq("agent_versions.status", "authorised")
    .eq("capabilities.slug", capability)
    .maybeSingle();
  if (agentError) throw agentError;
  if (!agent) throw new HttpError(404, `No authorised agent ${agent_id} with capability ${capability}`);
  const [version] = agent.agent_versions;
  const [cap] = agent.capabilities;
  if (!cap.is_live) throw new HttpError(409, `${capability} is shown only in the MVP and cannot be ordered`);

  const { data: terms, error: termsError } = await db
    .from("terms_versions").select("hash").order("created_at", { ascending: false }).limit(1).single();
  if (termsError) throw termsError;

  const { data: order, error } = await db
    .from("orders")
    .insert({
      agent_id: agent.id,
      capability_id: cap.id,
      agent_version_id: version.id,
      connector_link_id: link.id,
      question: question.trim(),
      status: "awaiting_payment",
      price: cap.price,
      terms_hash: terms.hash,
    })
    .select("id, status, price, terms_hash, created_at")
    .single();
  if (error) throw error;

  return {
    order_id: order.id,
    status: order.status,
    agent: agent.slug,
    agent_version: version.version,
    capability,
    price: usdc(order.price),
    pay_to: agent.payout_address,
    terms_hash: order.terms_hash,
    created_at: order.created_at,
  };
});
