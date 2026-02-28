import { v } from "convex/values";
import { query } from "./_generated/server";

export const leaderboard = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("contributors")
      .withIndex("by_points")
      .order("desc")
      .collect();
  },
});

export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contributors")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();
  },
});
