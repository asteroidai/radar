import { readFileSync } from "node:fs";
import type { Command } from "commander";
import { parse } from "zod-matter";
import { knowledgeFrontmatterSchema } from "../schemas/frontmatter.js";
import { getConvexClient, api } from "../convex-client.js";

export function registerSubmit(program: Command) {
  program
    .command("submit")
    .description(
      `Submit a knowledge file to Radar. The file must be markdown with valid YAML frontmatter. Auto-approved, versioned, and attributed.

Paths have NO file extensions (e.g. README not README.md, flows/login not flows/login.md).
File types: readme, sitemap, flow, script, selectors, api, guide.

Gotchas to document (type: guide, path: gotchas):
  - CAPTCHAs or bot detection mechanisms
  - Dynamic content that requires waiting (JS-rendered, lazy-loaded)
  - Auth walls (what's behind login vs publicly accessible)
  - Cookie consent popups or modals that block interaction
  - Rate limiting indicators and thresholds
  - Infinite scroll or pagination patterns
  - A/B tests that change selectors or page structure
  - Dynamic IDs that change across sessions
  - Session expiry and re-authentication requirements`,
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
