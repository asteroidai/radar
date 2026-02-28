import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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
