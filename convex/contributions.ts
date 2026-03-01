import { v } from "convex/values";
import { query } from "./_generated/server";

export const list = query({
  args: {
    limit: v.optional(v.number()),
    contributorName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    if (args.contributorName) {
      return await ctx.db
        .query("contributions")
        .withIndex("by_contributor", (q) =>
          q.eq("contributorName", args.contributorName!),
        )
        .order("desc")
        .take(limit);
    }
    return await ctx.db
      .query("contributions")
      .order("desc")
      .take(limit);
  },
});

export const listByFile = query({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contributions")
      .withIndex("by_file", (q) => q.eq("fileId", args.fileId))
      .order("desc")
      .collect();
  },
});
