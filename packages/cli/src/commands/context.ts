import type { Command } from "commander";
import { getConvexClient, api } from "../convex-client.js";

export function registerContext(program: Command) {
  program
    .command("context")
    .description(
      "Get an overview of a site's knowledge — metadata and file summaries without full body content",
    )
    .argument("<domain>", "Website domain, e.g. github.com")
    .action(async (domain: string) => {
      const client = getConvexClient();

      const site = await client.query(api.sites.getByDomain, { domain });
      if (!site) {
        console.error(
          `No knowledge found for "${domain}". Try "radar search" or "radar explore" to discover or create knowledge for this site.`,
        );
        process.exit(1);
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

      const lines = [
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
      ].filter((line) => line !== null);

      console.log(lines.join("\n"));
    });
}
