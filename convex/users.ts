import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Add User
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    role: v.string(),
  },

  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Get All Users
export const getUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});