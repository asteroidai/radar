import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parse } from "zod-matter";
import { knowledgeFrontmatterSchema } from "../schemas/frontmatter.js";
import { getConvexClient, api } from "../convex-client.js";

export function registerSubmit(server: McpServer) {
  server.registerTool(
    "radar_submit",
    {
      description:
        "Submit a knowledge file to Radar. The content must be a full markdown file with valid YAML frontmatter matching the knowledge file schema. Auto-approved, versioned, and attributed. You earn points for contributions (new site: 10pts, new file: 5pts, update: 3pts).",
      inputSchema: {
        content: z
          .string()
          .describe(
            "Full markdown file content with YAML frontmatter (title, domain, path, summary, tags, entities, intent, confidence, requires_auth, version, last_updated, last_contributor, last_change_reason) followed by the markdown body.",
          ),
        contributor: z
          .string()
          .describe(
            'Your name/identifier as a contributor, e.g. "claude-code-agent"',
          ),
        reason: z
          .string()
          .describe(
            'Why this change was made, e.g. "Initial exploration of checkout flow"',
          ),
        agent_type: z
          .string()
          .optional()
          .describe(
            'Type of agent, e.g. "claude-code", "cursor", "browser-use"',
          ),
      },
    },
    async ({ content, contributor, reason, agent_type }) => {
      let parsed;
      try {
        parsed = parse(content, knowledgeFrontmatterSchema);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Invalid knowledge file format:\n\n${message}\n\nEnsure the markdown has valid YAML frontmatter matching the knowledge file schema.`,
            },
          ],
          isError: true,
        };
      }

      const { data: fm, content: body } = parsed;

      const client = getConvexClient();

      const result = await client.mutation(api.files.submit, {
        domain: fm.domain,
        path: fm.path,
        type: fm.type,
        title: fm.title,
        summary: fm.summary,
        tags: fm.tags,
        entities: {
          primary: fm.entities.primary,
          disambiguation: fm.entities.disambiguation,
          relatedConcepts: fm.entities.related_concepts,
        },
        intent: {
          coreQuestion: fm.intent.core_question,
          audience: fm.intent.audience,
        },
        confidence: fm.confidence,
        requiresAuth: fm.requires_auth,
        scriptLanguage: fm.script_language,
        selectorsCount: fm.selectors_count,
        relatedFiles: fm.related_files,
        content: body.trim(),
        contributorName: contributor,
        changeReason: reason,
        agentType: agent_type,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Submitted successfully!\n\nFile: ${fm.domain}/${fm.path}\nVersion: ${result.version}\nPoints awarded: ${result.pointsAwarded}`,
          },
        ],
      };
    },
  );
}
