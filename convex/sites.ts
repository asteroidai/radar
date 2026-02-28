import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sites").order("desc").collect();
  },
});

export const getByDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sites")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain))
      .unique();
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sites")
      .withSearchIndex("search_sites", (q) => q.search("description", args.query))
      .collect();
  },
});

export const upsert = mutation({
  args: {
    domain: v.string(),
    name: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
    complexity: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ),
    authRequired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sites")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        lastUpdated: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("sites", {
      ...args,
      fileCount: 0,
      lastUpdated: Date.now(),
    });
  },
});
