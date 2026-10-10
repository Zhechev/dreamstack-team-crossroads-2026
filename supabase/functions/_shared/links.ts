// Private connector links: the plain token is shown once; only its sha256 is stored.
import { db, HttpError } from "./http.ts";

const TOKEN_PREFIX = "ctb_";

export function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return TOKEN_PREFIX + btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return "0x" + [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface ActiveLink {
  id: string;
  owner_address: string | null;
  label: string | null;
}

/** The active (not revoked) link for a token, or a 401. */
export async function requireLink(token: string | null | undefined): Promise<ActiveLink> {
  if (!token || !token.startsWith(TOKEN_PREFIX)) throw new HttpError(401, "Missing or malformed connector token");
  const { data, error } = await db
    .from("connector_links")
    .select("id, owner_address, label")
    .eq("token_hash", await hashToken(token))
    .is("revoked_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(401, "Unknown or revoked connector token");
  return data;
}
