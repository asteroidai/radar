import { StreamableHTTPTransport } from "@hono/mcp";
import { Hono } from "hono";
import { createServer } from "./server.js";

type Bindings = { CONVEX_URL: string };

const app = new Hono<{ Bindings: Bindings }>();
const mcpServer = createServer();
const transport = new StreamableHTTPTransport();

app.use("*", async (c, next) => {
  if (c.env?.CONVEX_URL && !process.env.CONVEX_URL) {
    process.env.CONVEX_URL = c.env.CONVEX_URL;
  }
  return next();
});

app.all("/mcp", async (c) => {
  if (!mcpServer.isConnected()) {
    await mcpServer.connect(transport);
  }
  return transport.handleRequest(c);
});

app.get("/health", (c) => c.json({ status: "ok" }));

export default app;
