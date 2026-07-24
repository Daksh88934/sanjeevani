import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addAvailability = mutation({
  args: {
    doctorId: v.string(),
    availableDate: v.string(),
    availableTime: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("doctorAvailability", args);
  },
});

export const getAvailability = query({
  handler: async (ctx) => {
    return await ctx.db.query("doctorAvailability").collect();
  },
});