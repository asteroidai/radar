import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getConvexClient, api } from "../convex-client.js";

function reconstructMarkdown(file: {
  title: string;
  domain: string;
  path: string;
  summary: string;
  tags: string[];
  entities: {
    primary: string;
    disambiguation: string;
    relatedConcepts: string[];
  };
  intent: { coreQuestion: string; audience: string };
  confidence: string;
  requiresAuth: boolean;
  selectorsCount?: number;
  relatedFiles: string[];
  version: number;
  lastUpdated: number;
  lastContributor: string;
  lastChangeReason: string;
  content: string;
}): string {
  const frontmatter = [
    "---",
    `title: "${file.title}"`,
    `domain: "${file.domain}"`,
    `path: "${file.path}"`,
    `summary: "${file.summary}"`,
    `tags: [${file.tags.map((t) => `"${t}"`).join(", ")}]`,
    `entities:`,
    `  primary: "${file.entities.primary}"`,
    `  disambiguation: "${file.entities.disambiguation}"`,
    `  related_concepts: [${file.entities.relatedConcepts.map((c) => `"${c}"`).join(", ")}]`,
    `intent:`,
    `  core_question: "${file.intent.coreQuestion}"`,
    `  audience: "${file.intent.audience}"`,
    `confidence: "${file.confidence}"`,
    `requires_auth: ${file.requiresAuth}`,
    file.selectorsCount !== undefined
      ? `selectors_count: ${file.selectorsCount}`
      : null,
    `related_files: [${file.relatedFiles.map((f) => `"${f}"`).join(", ")}]`,
    `version: ${file.version}`,
    `last_updated: "${new Date(file.lastUpdated).toISOString()}"`,
    `last_contributor: "${file.lastContributor}"`,
    `last_change_reason: "${file.lastChangeReason}"`,
    "---",
  ]
    .filter((line) => line !== null)
    .join("\n");

  return `${frontmatter}\n\n${file.content}`;
}

export function registerGetFile(server: McpServer) {
  server.registerTool(
    "radar_get_file",
    {
      description:
        "Get the full content of a specific knowledge file, including YAML frontmatter and markdown body. Use radar_get_context or radar_list_files first to discover available files.",
      inputSchema: {
        domain: z
          .string()
          .describe('Website domain, e.g. "amazon.com"'),
        path: z
          .string()
          .describe(
            'File path within the site, e.g. "flows/checkout", "README"',
          ),
      },
    },
    async ({ domain, path }) => {
      const client = getConvexClient();

      const file = await client.query(api.files.getByDomainPath, {
        domain,
        path,
      });

      if (!file) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No file found at "${domain}/${path}". Use radar_list_files to see available files.`,
            },
          ],
        };
      }

      return {
        content: [{ type: "text" as const, text: reconstructMarkdown(file) }],
      };
    },
  );
}
