import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addEmergencyContact = mutation({
  args: {
    patientId: v.string(),
    name: v.string(),
    relation: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("emergencyContacts", args);
  },
});

export const getEmergencyContacts = query({
  handler: async (ctx) => {
    return await ctx.db.query("emergencyContacts").collect();
  },
});