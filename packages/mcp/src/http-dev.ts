import { serve } from "@hono/node-server";
import app from "./http.js";

const port = parseInt(process.env.PORT ?? "3001", 10);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Radar MCP server (HTTP) listening on http://localhost:${port}/mcp`);
});
