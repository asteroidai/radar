import type { Command } from "commander";
import { normalizeUrl } from "../urls.js";
import { getConvexClient, api } from "../convex-client.js";

export function registerExplore(program: Command) {
  program
    .command("explore")
    .description(
      "Trigger a Browser Use exploration of a website. Queues an automated agent to navigate the site and generate knowledge files.",
    )
    .argument(
      "<url>",
      'URL of the site to explore, e.g. "https://amazon.com" or "github.com"',
    )
    .action(async (url: string) => {
      const { domain, url: normalizedUrl } = normalizeUrl(url);
      const client = getConvexClient();

      const explorationId = await client.mutation(api.explorations.create, {
        domain,
        url: normalizedUrl,
      });

      console.log(
        `Exploration queued for ${domain}.\n\nExploration ID: ${explorationId}\nURL: ${normalizedUrl}\n\nThe Browser Use agent will explore the site and generate knowledge files. Check the Radar web UI for real-time progress.`,
      );
    });
}
