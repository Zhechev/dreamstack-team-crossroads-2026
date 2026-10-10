// Pre-connection discovery for agents and crawlers (MCP Server Cards, SEP-2127):
//   GET /mcp/server-card               → the Server Card (application/mcp-server-card+json)
//   GET /.well-known/ai-catalog.json   → AI Catalog pointing at the card (application/ai-catalog+json)
// Public, read-only metadata: never tokens or per-buyer data.
import { SUPPORTED_PROTOCOL_VERSIONS } from "@modelcontextprotocol/server";
import { Hono, type Context } from "hono";

export const SERVER_NAME = "app.lovable.citable/connector";
export const SERVER_VERSION = "0.1.0";
export const SERVER_TITLE = "Citable — expert-verified price checks";
export const SERVER_DESCRIPTION =
  "Fair-price checks for property, renovations and property lawyers' fees from local experts' private data (closed deals, completed jobs, recent fees), every figure cited with its source and as-of date. " +
  "Your AI pays per answer (0.50 USDC) from a budget you top up once.";

const CARD_TYPE = "application/mcp-server-card+json";
const PUBLIC_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type, If-None-Match",
  "Cache-Control": "public, max-age=3600",
};

export interface DiscoveryConfig {
  /** Public base URL of this service; derived from the request when unset (e.g. behind a tunnel). */
  publicUrl?: string;
  webAppUrl: string;
}

function baseUrl(c: Context, config: DiscoveryConfig): string {
  if (config.publicUrl) return config.publicUrl.replace(/\/$/, "");
  const proto = c.req.header("x-forwarded-proto") ?? new URL(c.req.url).protocol.replace(":", "");
  const host = c.req.header("x-forwarded-host") ?? c.req.header("host") ?? new URL(c.req.url).host;
  return `${proto}://${host}`;
}

export function serverCard(base: string, webAppUrl: string) {
  return {
    $schema: "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
    name: SERVER_NAME,
    version: SERVER_VERSION,
    title: SERVER_TITLE,
    description: SERVER_DESCRIPTION,
    websiteUrl: webAppUrl,
    repository: { url: "https://github.com/Zhechev/dreamstack-team-crossroads-2026", source: "github", subfolder: "apps/connector" },
    remotes: [
      {
        type: "streamable-http",
        url: `${base}/mcp/{token}`,
        variables: {
          token: {
            description: `Your private Citable connector token. Get it on ${webAppUrl.replace(/\/$/, "")}/setup.`,
            isRequired: true,
            isSecret: true,
          },
        },
        supportedProtocolVersions: [...SUPPORTED_PROTOCOL_VERSIONS],
      },
    ],
    _meta: {
      "app.lovable.citable/setupUrl": `${webAppUrl.replace(/\/$/, "")}/setup`,
      "app.lovable.citable/useWhen":
        "The user asks whether a property price is fair, or wants recent comparable sales — especially in Sofia (Lozenets, Mladost) or Varna, Bulgaria.",
    },
  };
}

export function createDiscoveryRoutes(config: DiscoveryConfig) {
  const app = new Hono();

  app.get("/mcp/server-card", (c) =>
    c.body(JSON.stringify(serverCard(baseUrl(c, config), config.webAppUrl), null, 2), 200, {
      ...PUBLIC_HEADERS,
      "Content-Type": CARD_TYPE,
    }),
  );

  app.get("/.well-known/ai-catalog.json", (c) => {
    const base = baseUrl(c, config);
    const catalog = {
      specVersion: "1.0",
      entries: [{ identifier: `urn:air:${new URL(base).host}:mcp:citable`, type: CARD_TYPE, url: `${base}/mcp/server-card` }],
    };
    return c.body(JSON.stringify(catalog, null, 2), 200, { ...PUBLIC_HEADERS, "Content-Type": "application/ai-catalog+json" });
  });

  return app;
}
