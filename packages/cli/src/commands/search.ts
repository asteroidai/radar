import type { Command } from "commander";
import { getConvexClient, api } from "../convex-client.js";

export function registerSearch(program: Command) {
  program
    .command("search")
    .description(
      "Full-text search across all knowledge file content. Returns matching files with frontmatter.",
    )
    .argument("<query>", "Search query text")
    .option("--domain <domain>", "Filter results to a specific domain")
    .action(async (query: string, opts: { domain?: string }) => {
      const client = getConvexClient();

      const results = await client.query(api.files.search, {
        query,
        domain: opts.domain,
      });

      if (results.length === 0) {
        console.log(
          `No results found for "${query}"${opts.domain ? ` in ${opts.domain}` : ""}. Try broader search terms or check if the site has been explored.`,
        );
        return;
      }

      const formatted = results
        .map(
          (f) =>
            `### ${f.domain}/${f.path}\n**${f.title}** [${f.confidence}]\n${f.summary}\nTags: ${f.tags.join(", ")}`,
        )
        .join("\n\n");

      console.log(`Found ${results.length} result(s):\n\n${formatted}`);
    });
}
