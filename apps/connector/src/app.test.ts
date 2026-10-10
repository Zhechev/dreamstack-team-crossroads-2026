import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";

const app = createApp(loadConfig({}));

describe("connector service", () => {
  it("answers /health", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("404s unknown routes", async () => {
    expect((await app.request("/nope")).status).toBe(404);
  });
});

describe("discovery (MCP Server Card, SEP-2127)", () => {
  const app = createApp(loadConfig({ WEB_APP_URL: "https://citable.lovable.app" }));

  it("serves the Server Card with the templated, secret token and public CORS", async () => {
    const res = await app.request("https://connector.example/mcp/server-card");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/mcp-server-card+json");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    const card = (await res.json()) as any;
    expect(card).toMatchObject({
      $schema: "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
      name: "app.lovable.citable/connector",
      websiteUrl: "https://citable.lovable.app",
      remotes: [{ type: "streamable-http", url: "https://connector.example/mcp/{token}", variables: { token: { isRequired: true, isSecret: true } } }],
    });
    expect(card.remotes[0].supportedProtocolVersions).toContain("2025-06-18");
  });

  it("serves an AI Catalog that points at the card", async () => {
    const res = await app.request("https://connector.example/.well-known/ai-catalog.json");
    expect(res.headers.get("content-type")).toBe("application/ai-catalog+json");
    expect(await res.json()).toEqual({
      specVersion: "1.0",
      entries: [
        { identifier: "urn:air:connector.example:mcp:citable", type: "application/mcp-server-card+json", url: "https://connector.example/mcp/server-card" },
      ],
    });
  });
});
