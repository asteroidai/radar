import { v } from "convex/values";
import { makeFunctionReference } from "convex/server";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("explorations")
      .order("desc")
      .take(limit);
  },
});

export const get = query({
  args: { id: v.id("explorations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    domain: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("explorations", {
      domain: args.domain,
      url: args.url,
      status: "queued",
      startedAt: Date.now(),
    });
  },
});

export const start = mutation({
  args: {
    url: v.string(),
    instructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const domain = new URL(args.url).hostname.replace(/^www\./, "");

    const explorationId = await ctx.db.insert("explorations", {
      domain,
      url: args.url,
      instructions: args.instructions,
      status: "queued",
      startedAt: Date.now(),
    });

    const runRef = makeFunctionReference<"action">(
      "explorationAction:run",
    );
    await ctx.scheduler.runAfter(0, runRef, {
      explorationId,
    });

    return explorationId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("explorations"),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    sessionId: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    filesGenerated: v.optional(v.number()),
    resultSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const patch: Record<string, unknown> = { ...updates };
    if (args.status === "completed" || args.status === "failed") {
      patch.completedAt = Date.now();
    }

    await ctx.db.patch(id, patch);
  },
});

// Internal helpers for the exploration action
export const _get = internalQuery({
  args: { id: v.id("explorations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const _updateStatus = internalMutation({
  args: {
    id: v.id("explorations"),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    sessionId: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    filesGenerated: v.optional(v.number()),
    resultSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const patch: Record<string, unknown> = { ...updates };
    if (args.status === "completed" || args.status === "failed") {
      patch.completedAt = Date.now();
    }

    await ctx.db.patch(id, patch);
  },
});
