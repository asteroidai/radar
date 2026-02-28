import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { normalizeUrl } from "../urls.js";
import { getConvexClient, api } from "../convex-client.js";

export function registerExplore(server: McpServer) {
  server.registerTool(
    "radar_explore",
    {
      description:
        "Trigger a Browser Use exploration of a website. Queues an automated agent to navigate the site, catalog its structure, and generate knowledge files. Check the Radar web UI for real-time progress.",
      inputSchema: {
        url: z
          .string()
          .describe(
            'URL of the site to explore, e.g. "https://amazon.com" or "github.com"',
          ),
      },
    },
    async ({ url }) => {
      const { domain, url: normalizedUrl } = normalizeUrl(url);

      const client = getConvexClient();

      const explorationId = await client.mutation(api.explorations.create, {
        domain,
        url: normalizedUrl,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Exploration queued for ${domain}.\n\nExploration ID: ${explorationId}\nURL: ${normalizedUrl}\n\nThe Browser Use agent will explore the site and generate knowledge files. Check the Radar web UI for real-time progress.`,
          },
        ],
      };
    },
  );
}
