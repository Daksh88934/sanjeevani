import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addPatientRecord = mutation({
  args: {
    patientId: v.string(),
    diagnosis: v.string(),
    prescription: v.string(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("patientRecords", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getPatientRecords = query({
  handler: async (ctx) => {
    return await ctx.db.query("patientRecords").collect();
  },
});