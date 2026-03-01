"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const ASTEROID_API_BASE = "https://odyssey.asteroid.ai/agents/v2";
const DEFAULT_AGENT_ID = "de63ae2d-575d-4d82-aeaa-ea1087193392";
const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled"]);
const POLL_INTERVAL_MS = 5_000;
const MAX_POLL_MS = 15 * 60 * 1_000; // 15 minutes

export const run = internalAction({
  args: { explorationId: v.id("explorations") },
  handler: async (ctx, args) => {
    const exploration = await ctx.runQuery(internal.explorations._get, {
      id: args.explorationId,
    });
    if (!exploration) {
      throw new Error(`Exploration ${args.explorationId} not found`);
    }

    const apiKey = process.env.ASTEROID_API_KEY;
    if (!apiKey) {
      await ctx.runMutation(internal.explorations._updateStatus, {
        id: args.explorationId,
        status: "failed",
        resultSummary: "Missing ASTEROID_API_KEY environment variable",
      });
      return;
    }

    const agentId = process.env.ASTEROID_AGENT_ID ?? DEFAULT_AGENT_ID;
    const headers = {
      "Content-Type": "application/json",
      "X-Asteroid-Agents-Api-Key": apiKey,
    };

    // Start execution
    let executionId: string;
    try {
      const execRes = await fetch(
        `${ASTEROID_API_BASE}/agents/${agentId}/execute`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            inputs: {
              url: exploration.url,
              instructions: exploration.instructions ?? "Explore the site thoroughly",
            },
          }),
        },
      );

      if (!execRes.ok) {
        const body = await execRes.text();
        throw new Error(`Asteroid API ${execRes.status}: ${body}`);
      }

      const execData = (await execRes.json()) as { executionId: string };
      executionId = execData.executionId;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await ctx.runMutation(internal.explorations._updateStatus, {
        id: args.explorationId,
        status: "failed",
        resultSummary: `Failed to start Asteroid execution: ${message}`,
      });
      return;
    }

    const liveUrl = `https://platform.asteroid.ai/executions/${executionId}`;

    await ctx.runMutation(internal.explorations._updateStatus, {
      id: args.explorationId,
      status: "running",
      executionId,
      liveUrl,
    });

    // Poll for completion
    const startTime = Date.now();
    let finalStatus = "failed";
    let resultSummary = "";

    while (Date.now() - startTime < MAX_POLL_MS) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

      try {
        const pollRes = await fetch(
          `${ASTEROID_API_BASE}/executions/${executionId}`,
          { headers },
        );

        if (!pollRes.ok) continue;

        const execution = (await pollRes.json()) as {
          status: string;
          result?: string;
        };

        if (TERMINAL_STATUSES.has(execution.status)) {
          finalStatus = execution.status === "completed" ? "completed" : "failed";
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          resultSummary =
            execution.status === "completed"
              ? `Explored ${exploration.domain} in ${elapsed}s via Asteroid`
              : `Asteroid execution ${execution.status} after ${elapsed}s`;
          break;
        }
      } catch {
        // best-effort polling, continue
      }
    }

    if (!resultSummary) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      resultSummary = `Asteroid execution timed out after ${elapsed}s`;
    }

    await ctx.runMutation(internal.explorations._updateStatus, {
      id: args.explorationId,
      status: finalStatus as "completed" | "failed",
      executionId,
      liveUrl,
      resultSummary,
    });
  },
});
