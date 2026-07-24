import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addMedicineReminder = mutation({
  args: {
    patientId: v.string(),
    medicineName: v.string(),
    dosage: v.string(),
    reminderTime: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("medicineReminders", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getMedicineReminders = query({
  handler: async (ctx) => {
    return await ctx.db.query("medicineReminders").collect();
  },
});