import { resolve, dirname, join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import type { Command } from "commander";
import { getConvexClient, api } from "../convex-client.js";

function reconstructMarkdown(file: {
  title: string;
  domain: string;
  path: string;
  type?: string;
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
  scriptLanguage?: string;
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
    file.type ? `type: "${file.type}"` : null,
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
    file.scriptLanguage ? `script_language: "${file.scriptLanguage}"` : null,
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

export function registerDownload(program: Command) {
  program
    .command("download")
    .description(
      "Download all knowledge files for a domain to a local directory as markdown files with YAML frontmatter",
    )
    .argument("<domain>", "Website domain, e.g. github.com")
    .argument("<directory>", "Local directory to write files to")
    .action(async (domain: string, directory: string) => {
      const client = getConvexClient();
      const outDir = resolve(directory);

      const files = await client.query(
        api.files.listByDomainWithContent,
        { domain },
      );

      if (files.length === 0) {
        console.error(
          `No files found for "${domain}". Use "radar list ${domain}" to verify.`,
        );
        process.exit(1);
      }

      await mkdir(outDir, { recursive: true });

      let written = 0;
      for (const file of files) {
        const filename = file.path.endsWith(".md")
          ? file.path
          : `${file.path}.md`;
        const filePath = join(outDir, filename);

        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, reconstructMarkdown(file), "utf-8");
        written++;

        console.log(`  ${filename}`);
      }

      console.log(
        `\nDownloaded ${written} file(s) for ${domain} to ${outDir}`,
      );
    });
}
