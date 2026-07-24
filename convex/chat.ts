import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const saveChat = mutation({
  args: {
    question: v.string(),
    answer: v.string(),
  },

  handler: async (ctx, args) => {
    await ctx.db.insert("chatHistory", {
      question: args.question,
      answer: args.answer,
      createdAt: Date.now(),
    });
  },
});