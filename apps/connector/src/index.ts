import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
serve({ fetch: createApp(config).fetch, port: config.port }, ({ port }) => {
  console.log(`connector listening on http://localhost:${port}`);
});
