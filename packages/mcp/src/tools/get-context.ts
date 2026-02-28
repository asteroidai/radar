import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getConvexClient, api } from "../convex-client.js";

export function registerGetContext(server: McpServer) {
  server.registerTool(
    "radar_get_context",
    {
      description:
        "Get an overview of a website's knowledge in Radar. Returns the site metadata and a summary of all available knowledge files (title, path, summary, confidence) without full body content. Use this first to understand what knowledge exists before reading specific files.",
      inputSchema: {
        domain: z
          .string()
          .describe('Website domain, e.g. "amazon.com", "github.com"'),
      },
    },
    async ({ domain }) => {
      const client = getConvexClient();

      const site = await client.query(api.sites.getByDomain, { domain });
      if (!site) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No knowledge found for "${domain}". Try radar_search or radar_explore to discover or create knowledge for this site.`,
            },
          ],
        };
      }

      const files = await client.query(api.files.listBySite, {
        siteId: site._id,
      });

      const fileList = files
        .map(
          (f) =>
            `- **${f.path}** — ${f.title} [${f.confidence}]\n  ${f.summary}`,
        )
        .join("\n");

      const text = [
        `# ${site.name} (${site.domain})`,
        "",
        `> ${site.description}`,
        "",
        `Tags: ${site.tags.join(", ")}`,
        `Files: ${site.fileCount}`,
        site.complexity ? `Complexity: ${site.complexity}` : null,
        site.authRequired ? `Auth required: yes` : null,
        "",
        "## Available Knowledge Files",
        "",
        fileList || "_No files yet._",
      ]
        .filter((line) => line !== null)
        .join("\n");

      return { content: [{ type: "text" as const, text }] };
    },
  );
}
