import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getConvexClient, api } from "../convex-client.js";

export function registerSearch(server: McpServer) {
  server.registerTool(
    "radar_search",
    {
      description:
        "Full-text search across all knowledge file content. Returns matching files with frontmatter (title, path, summary, tags, confidence). Optionally filter by domain.",
      inputSchema: {
        query: z.string().describe("Search query text"),
        domain: z
          .string()
          .optional()
          .describe("Optional domain to filter results, e.g. \"amazon.com\""),
      },
    },
    async ({ query, domain }) => {
      const client = getConvexClient();

      const results = await client.query(api.files.search, {
        query,
        domain,
      });

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No results found for "${query}"${domain ? ` in ${domain}` : ""}. Try broader search terms or check if the site has been explored.`,
            },
          ],
        };
      }

      const formatted = results
        .map(
          (f) =>
            `### ${f.domain}/${f.path}\n**${f.title}** [${f.confidence}]\n${f.summary}\nTags: ${f.tags.join(", ")}`,
        )
        .join("\n\n");

      const text = `Found ${results.length} result(s):\n\n${formatted}`;
      return { content: [{ type: "text" as const, text }] };
    },
  );
}
