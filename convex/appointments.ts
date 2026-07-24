import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createAppointment = mutation({
  args: {
    patientId: v.string(),
    doctorId: v.string(),
    date: v.string(),
    time: v.string(),
    status: v.string(),
  },

  handler: async (ctx, args) => {
    return await ctx.db.insert("appointments", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getAppointments = query({
  handler: async (ctx) => {
    return await ctx.db.query("appointments").collect();
  },
});