// CORS + JSON helpers shared by every Edge Function.
import { createClient } from "npm:@supabase/supabase-js@2.117.3";

// The Lovable app (preview and published domains), local dev, and anything listed in ALLOWED_ORIGINS.
const extraOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((o) => o.trim()).filter(Boolean);
const allowedOrigin = (origin: string) =>
  extraOrigins.includes(origin) ||
  /^https:\/\/[a-z0-9-]+\.(lovable\.app|lovableproject\.com)$/.test(origin) ||
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  if (!origin || !allowedOrigin(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-connector-token",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
}

export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

/** Wraps a handler with CORS preflight, JSON errors and a method check. */
export function serve(methods: string[], handler: (req: Request) => Promise<unknown>) {
  Deno.serve(async (req) => {
    const cors = corsHeaders(req);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const json = (status: number, body: unknown) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
    try {
      if (!methods.includes(req.method)) throw new HttpError(405, `Use ${methods.join(" or ")}`);
      return json(200, await handler(req));
    } catch (e) {
      if (e instanceof HttpError) return json(e.status, { error: e.message });
      console.error(e);
      return json(500, { error: "Internal error" });
    }
  });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === "object" && !Array.isArray(body)) return body;
  } catch {
    // fall through
  }
  throw new HttpError(400, "Body must be a JSON object");
}

/** Service-role client: functions are the only writers (RLS blocks anon writes). */
export const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** USDC as protocol text with at least two decimals: 0.5 → "0.50", 0.125 → "0.125". */
export const usdc = (n: number | string) => {
  const decimals = (String(Number(n)).split(".")[1] ?? "").length;
  return Number(n).toFixed(Math.min(6, Math.max(2, decimals)));
};
