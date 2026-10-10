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
