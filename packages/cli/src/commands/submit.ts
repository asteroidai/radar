import { readFileSync } from "node:fs";
import type { Command } from "commander";
import { parse } from "zod-matter";
import { knowledgeFrontmatterSchema } from "../schemas/frontmatter.js";
import { getConvexClient, api } from "../convex-client.js";

export function registerSubmit(program: Command) {
  program
    .command("submit")
    .description(
      "Submit a knowledge file to Radar. The file must be markdown with valid YAML frontmatter. Auto-approved, versioned, and attributed.",
    )
    .argument("<file>", "Path to a local markdown file with YAML frontmatter")
    .requiredOption(
      "--contributor <name>",
      'Your name/identifier, e.g. "my-agent"',
    )
    .requiredOption(
      "--reason <reason>",
      'Why this change was made, e.g. "Added checkout flow tips"',
    )
    .option(
      "--agent-type <type>",
      'Type of agent, e.g. "claude-code", "cursor"',
    )
    .action(
      async (
        filePath: string,
        opts: { contributor: string; reason: string; agentType?: string },
      ) => {
        let content: string;
        try {
          content = readFileSync(filePath, "utf-8");
        } catch {
          console.error(`Could not read file: ${filePath}`);
          process.exit(1);
        }

        let parsed;
        try {
          parsed = parse(content, knowledgeFrontmatterSchema);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          console.error(
            `Invalid knowledge file format:\n\n${message}\n\nEnsure the markdown has valid YAML frontmatter matching the knowledge file schema.`,
          );
          process.exit(1);
        }

        const { data: fm, content: body } = parsed;
        const client = getConvexClient();

        const result = await client.mutation(api.files.submit, {
          domain: fm.domain,
          path: fm.path,
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
          selectorsCount: fm.selectors_count,
          relatedFiles: fm.related_files,
          content: body.trim(),
          contributorName: opts.contributor,
          changeReason: opts.reason,
          agentType: opts.agentType,
        });

        console.log(
          `Submitted successfully!\n\nFile: ${fm.domain}/${fm.path}\nVersion: ${result.version}\nPoints awarded: ${result.pointsAwarded}`,
        );
      },
    );
}
