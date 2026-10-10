// Expert sign-up from the /experts page (ticket 22). Public: no auth, no table access from the browser.
//   POST /expert_application  {name, email, field, city?, links?, note?, website?}  → {received: true}
// `website` is a honeypot: real people leave it empty, so a filled one is accepted and dropped.
import { db, HttpError, readJson, serve } from "../_shared/http.ts";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function text(body: Record<string, unknown>, key: string, max: number, required = false): string | null {
  const v = body[key];
  if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
    if (required) throw new HttpError(400, `${key} is required`);
    return null;
  }
  if (typeof v !== "string") throw new HttpError(400, `${key} must be text`);
  const s = v.trim();
  if (s.length > max) throw new HttpError(400, `${key} can be at most ${max} characters`);
  return s;
}

serve(["POST"], async (req) => {
  const body = await readJson(req);
  if (text(body, "website", 500)) return { received: true };

  const name = text(body, "name", 120, true)!;
  const email = text(body, "email", 254, true)!.toLowerCase();
  const field = text(body, "field", 200, true)!;
  if (name.length < 2) throw new HttpError(400, "name is too short");
  if (field.length < 2) throw new HttpError(400, "field is too short");
  if (!EMAIL.test(email)) throw new HttpError(400, "email doesn't look right");

  // One application per email per day is enough; repeats get the same answer.
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count, error: countError } = await db
    .from("expert_applications")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", since);
  if (countError) throw countError;
  if (count) return { received: true };

  const { error } = await db.from("expert_applications").insert({
    name,
    email,
    field,
    city: text(body, "city", 120),
    links: text(body, "links", 1000),
    note: text(body, "note", 2000),
  });
  if (error) throw error;
  return { received: true };
});
