import type { Command } from "commander";
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

export function registerRead(program: Command) {
  program
    .command("read")
    .description(
      "Get the full content of a specific knowledge file, including YAML frontmatter and markdown body",
    )
    .argument("<domain>", "Website domain, e.g. github.com")
    .argument("<path>", 'File path within the site, e.g. "flows/checkout"')
    .action(async (domain: string, path: string) => {
      const client = getConvexClient();

      const file = await client.query(api.files.getByDomainPath, {
        domain,
        path,
      });

      if (!file) {
        console.error(
          `No file found at "${domain}/${path}". Use "radar list ${domain}" to see available files.`,
        );
        process.exit(1);
      }

      console.log(reconstructMarkdown(file));
    });
}
