// Private connector links for Claude (ADR-010). The plain token is returned once and never stored.
//   POST /connector_link/issue   {owner_address?, label?}  → {link_id, token}
//   POST /connector_link/rotate  {token}                   → {link_id, token}  (old token revoked)
//   POST /connector_link/revoke  {token}                   → {revoked: true}
//   POST /connector_link/verify  {token}                   → {link_id, owner_address, label}  (for the connector)
import { db, HttpError, readJson, serve } from "../_shared/http.ts";
import { hashToken, newToken, requireLink } from "../_shared/links.ts";

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

async function issue(owner_address: string | null, label: string | null) {
  const token = newToken();
  const { data, error } = await db
    .from("connector_links")
    .insert({ owner_address, label, token_hash: await hashToken(token) })
    .select("id")
    .single();
  if (error) throw error;
  return { link_id: data.id, token };
}

async function revoke(linkId: string, rotated: boolean) {
  const now = new Date().toISOString();
  const { error } = await db
    .from("connector_links")
    .update(rotated ? { revoked_at: now, rotated_at: now } : { revoked_at: now })
    .eq("id", linkId);
  if (error) throw error;
}

serve(["POST"], async (req) => {
  const action = new URL(req.url).pathname.split("/").filter(Boolean).pop();
  const body = await readJson(req);

  switch (action) {
    case "issue": {
      const { owner_address = null, label = null } = body;
      if (owner_address !== null && (typeof owner_address !== "string" || !ADDRESS.test(owner_address))) {
        throw new HttpError(400, "owner_address must be an EVM address");
      }
      if (label !== null && typeof label !== "string") throw new HttpError(400, "label must be a string");
      return issue(owner_address, label);
    }
    case "rotate": {
      const link = await requireLink(body.token as string);
      await revoke(link.id, true);
      return issue(link.owner_address, link.label);
    }
    case "revoke": {
      const link = await requireLink(body.token as string);
      await revoke(link.id, false);
      return { revoked: true };
    }
    case "verify": {
      const link = await requireLink(body.token as string);
      return { link_id: link.id, owner_address: link.owner_address, label: link.label };
    }
    default:
      throw new HttpError(404, "Use /issue, /rotate, /revoke or /verify");
  }
});
