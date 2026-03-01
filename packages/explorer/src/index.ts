import { BrowserUse } from "browser-use-sdk/v3";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { buildPrompt } from "./prompt.js";

const api = anyApi as any;

function parseArgs(): { url: string; instructions?: string } {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0]!.startsWith("--")) {
    console.error("Usage: pnpm start <url> [--instructions <text>]");
    process.exit(1);
  }

  const url = args[0]!;
  let instructions: string | undefined;

  const instrIdx = args.indexOf("--instructions");
  if (instrIdx !== -1 && instrIdx + 1 < args.length) {
    instructions = args[instrIdx + 1];
  }

  return { url, instructions };
}

function extractDomain(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

async function main(): Promise<void> {
  const { url, instructions } = parseArgs();
  const domain = extractDomain(url);

  const convexUrl = process.env["CONVEX_URL"];
  if (!convexUrl) {
    console.error("Missing CONVEX_URL environment variable");
    process.exit(1);
  }
  // HTTP actions (curl from BU agent) use the .convex.site URL
  const convexSiteUrl = process.env["CONVEX_SITE_URL"] ?? convexUrl.replace(".convex.cloud", ".convex.site");
  if (!process.env["BROWSER_USE_API_KEY"]) {
    console.error("Missing BROWSER_USE_API_KEY environment variable");
    process.exit(1);
  }

  console.log(`Exploring: ${url}`);
  console.log(`Domain: ${domain}`);
  if (instructions) {
    console.log(`Instructions: ${instructions}`);
  }

  // Create exploration record in Convex
  const convex = new ConvexHttpClient(convexUrl);
  const explorationId = await convex.mutation(api.explorations.create, {
    domain,
    url,
  });
  console.log(`Exploration created: ${explorationId}`);

  // Update status to running
  await convex.mutation(api.explorations.updateStatus, {
    id: explorationId,
    status: "running",
  });

  // Build the prompt and run Browser Use
  const prompt = buildPrompt(url, domain, convexSiteUrl, instructions);
  const client = new BrowserUse();
  const run = client.run(prompt, {
    model: "bu-max",
    timeout: 600_000, // 10 min — exploration takes time
  });

  const startTime = Date.now();

  try {
    const result = await run;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Parse the output for file count
    let filesGenerated = 0;
    const output = result.output ?? "";
    const match = output.match(/EXPLORATION_COMPLETE:\s*(\d+)\s*files/);
    if (match) {
      filesGenerated = parseInt(match[1]!, 10);
    }

    // Update exploration as completed
    await convex.mutation(api.explorations.updateStatus, {
      id: explorationId,
      status: "completed",
      sessionId: run.sessionId ?? undefined,
      filesGenerated,
      resultSummary: `Explored ${domain} in ${elapsed}s, submitted ${filesGenerated} files`,
    });

    console.log(`\nExploration completed in ${elapsed}s`);
    console.log(`Files submitted: ${filesGenerated}`);
    console.log(`Cost: $${result.totalCostUsd}`);
    if (run.sessionId) {
      console.log(
        `Session replay: https://cloud.browser-use.com/experimental/session/${run.sessionId}`,
      );
    }
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const message = err instanceof Error ? err.message : String(err);

    await convex.mutation(api.explorations.updateStatus, {
      id: explorationId,
      status: "failed",
      sessionId: run.sessionId ?? undefined,
      resultSummary: `Failed after ${elapsed}s: ${message}`,
    });

    console.error(`\nExploration failed after ${elapsed}s: ${message}`);
    if (run.sessionId) {
      console.log(
        `Session replay: https://cloud.browser-use.com/experimental/session/${run.sessionId}`,
      );
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
