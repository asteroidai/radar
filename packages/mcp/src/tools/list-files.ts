import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { minimatch } from "minimatch";
import { getConvexClient, api } from "../convex-client.js";

export function registerListFiles(server: McpServer) {
  server.registerTool(
    "radar_list_files",
    {
      description:
        "List knowledge files for a domain with frontmatter only (no body content). Optionally filter by glob pattern. Returns title, path, summary, tags, and confidence for each file.",
      inputSchema: {
        domain: z.string().describe('Website domain, e.g. "amazon.com"'),
        glob: z
          .string()
          .optional()
          .describe(
            'Optional glob pattern to filter files, e.g. "flows/*", "**/*.md"',
          ),
      },
    },
    async ({ domain, glob }) => {
      const client = getConvexClient();

      const site = await client.query(api.sites.getByDomain, { domain });
      if (!site) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No site found for "${domain}".`,
            },
          ],
        };
      }

      let files = await client.query(api.files.listBySite, {
        siteId: site._id,
      });

      if (glob) {
        files = files.filter((f) => minimatch(f.path, glob));
      }

      if (files.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No files found for "${domain}"${glob ? ` matching "${glob}"` : ""}.`,
            },
          ],
        };
      }

      const formatted = files
        .map(
          (f) =>
            `- **${f.path}** — ${f.title} [${f.confidence}]\n  ${f.summary}\n  Tags: ${f.tags.join(", ")}`,
        )
        .join("\n");

      const text = `${files.length} file(s) for ${domain}${glob ? ` (matching "${glob}")` : ""}:\n\n${formatted}`;
      return { content: [{ type: "text" as const, text }] };
    },
  );
}
