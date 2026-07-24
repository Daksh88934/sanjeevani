import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addFeedback = mutation({
  args: {
    userId: v.string(),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("feedback", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getFeedback = query({
  handler: async (ctx) => {
    return await ctx.db.query("feedback").collect();
  },
});