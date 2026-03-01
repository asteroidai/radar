"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { BrowserUse } from "browser-use-sdk/v3";
import { buildPrompt } from "./explorationPrompt";

export const run = internalAction({
  args: { explorationId: v.id("explorations") },
  handler: async (ctx, args) => {
    const exploration = await ctx.runQuery(internal.explorations._get, {
      id: args.explorationId,
    });
    if (!exploration) {
      throw new Error(`Exploration ${args.explorationId} not found`);
    }

    const convexSiteUrl = process.env.CONVEX_SITE_URL;
    if (!convexSiteUrl) {
      await ctx.runMutation(internal.explorations._updateStatus, {
        id: args.explorationId,
        status: "failed",
        resultSummary: "Missing CONVEX_SITE_URL environment variable",
      });
      return;
    }

    const apiKey = process.env.BROWSER_USE_API_KEY;
    if (!apiKey) {
      await ctx.runMutation(internal.explorations._updateStatus, {
        id: args.explorationId,
        status: "failed",
        resultSummary: "Missing BROWSER_USE_API_KEY environment variable",
      });
      return;
    }

    await ctx.runMutation(internal.explorations._updateStatus, {
      id: args.explorationId,
      status: "running",
    });

    const prompt = buildPrompt(
      exploration.url,
      exploration.domain,
      convexSiteUrl,
      exploration.instructions,
    );

    const client = new BrowserUse({ apiKey });
    const run = client.run(prompt, {
      model: "bu-max",
      timeout: 600_000,
    });

    const startTime = Date.now();

    // Poll for sessionId, then keep polling for liveUrl
    (async () => {
      // Phase 1: wait for sessionId (up to 10s)
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 1_000));
        if (run.sessionId) break;
      }
      if (!run.sessionId) return;

      // Store sessionId immediately so the dashboard link works
      await ctx.runMutation(internal.explorations._updateStatus, {
        id: args.explorationId,
        status: "running",
        sessionId: run.sessionId,
      });

      // Phase 2: poll for liveUrl (up to 30s, every 2s)
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 2_000));
        try {
          const session = await client.sessions.get(run.sessionId);
          if (session.liveUrl) {
            await ctx.runMutation(internal.explorations._updateStatus, {
              id: args.explorationId,
              status: "running",
              sessionId: run.sessionId,
              liveUrl: session.liveUrl,
            });
            return;
          }
        } catch {
          // best-effort
        }
      }
    })();

    try {
      const result = await run;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      let filesGenerated = 0;
      const output = result.output ?? "";
      const match = output.match(/EXPLORATION_COMPLETE:\s*(\d+)\s*files/);
      if (match) {
        filesGenerated = parseInt(match[1]!, 10);
      }

      await ctx.runMutation(internal.explorations._updateStatus, {
        id: args.explorationId,
        status: "completed",
        sessionId: run.sessionId ?? undefined,
        filesGenerated,
        resultSummary: `Explored ${exploration.domain} in ${elapsed}s, submitted ${filesGenerated} files`,
      });
    } catch (err) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const message = err instanceof Error ? err.message : String(err);

      await ctx.runMutation(internal.explorations._updateStatus, {
        id: args.explorationId,
        status: "failed",
        sessionId: run.sessionId ?? undefined,
        resultSummary: `Failed after ${elapsed}s: ${message}`,
      });
    }
  },
});
