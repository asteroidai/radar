import type { Command } from "commander";
import { minimatch } from "minimatch";
import { getConvexClient, api } from "../convex-client.js";

export function registerList(program: Command) {
  program
    .command("list")
    .description(
      "List knowledge files for a domain with frontmatter summaries (no body content)",
    )
    .argument("<domain>", "Website domain, e.g. github.com")
    .option(
      "--glob <pattern>",
      'Glob pattern to filter files, e.g. "flows/*"',
    )
    .action(async (domain: string, opts: { glob?: string }) => {
      const client = getConvexClient();

      const site = await client.query(api.sites.getByDomain, { domain });
      if (!site) {
        console.error(`No site found for "${domain}".`);
        process.exit(1);
      }

      let files = await client.query(api.files.listBySite, {
        siteId: site._id,
      });

      if (opts.glob) {
        files = files.filter((f) => minimatch(f.path, opts.glob!));
      }

      if (files.length === 0) {
        console.log(
          `No files found for "${domain}"${opts.glob ? ` matching "${opts.glob}"` : ""}.`,
        );
        return;
      }

      const formatted = files
        .map(
          (f) =>
            `- **${f.path}** — ${f.title} [${f.confidence}]\n  ${f.summary}\n  Tags: ${f.tags.join(", ")}`,
        )
        .join("\n");

      console.log(
        `${files.length} file(s) for ${domain}${opts.glob ? ` (matching "${opts.glob}")` : ""}:\n\n${formatted}`,
      );
    });
}
