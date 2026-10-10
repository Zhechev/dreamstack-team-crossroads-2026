// Private connector links (ADR-010): Claude calls /mcp/<token>; only the token's sha256 is stored.
// Same hashing as supabase/functions/_shared/links.ts, so links issued there verify here.
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ConnectorLink {
  id: string;
  owner_address: string | null;
}

/** The active link for a token, or null when it is unknown, revoked or malformed. */
export type LinkVerifier = (token: string) => Promise<ConnectorLink | null>;

const TOKEN = /^ctb_[A-Za-z0-9_-]{43}$/;

export function hashToken(token: string): string {
  return "0x" + createHash("sha256").update(token).digest("hex");
}

export function supabaseLinkVerifier(db: SupabaseClient): LinkVerifier {
  return async (token) => {
    if (!TOKEN.test(token)) return null;
    const { data, error } = await db
      .from("connector_links")
      .select("id, owner_address")
      .eq("token_hash", hashToken(token))
      .is("revoked_at", null)
      .maybeSingle();
    if (error) throw new Error(`verify connector link: ${error.message}`);
    return data;
  };
}
