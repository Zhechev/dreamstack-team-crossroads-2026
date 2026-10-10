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

  it.each([
    ["POST", "/mcp/some-token", 10],
    ["POST", "/agents/lozenets-pricing/price-check", 8],
    ["GET", "/problems/p1", 11],
    ["POST", "/problems/p1/fund", 11],
  ])("%s %s is stubbed for ticket %i", async (method, path, ticket) => {
    const res = await app.request(path, { method });
    expect(res.status).toBe(501);
    expect(await res.json()).toMatchObject({ ticket });
  });

  it("404s unknown routes", async () => {
    expect((await app.request("/nope")).status).toBe(404);
  });
});
