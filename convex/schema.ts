import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    role: v.string(), // patient or doctor
    createdAt: v.number(),
  }),

  appointments: defineTable({
    patientId: v.string(),
    doctorId: v.string(),
    date: v.string(),
    time: v.string(),
    status: v.string(),
    createdAt: v.number(),
  }),

  chatHistory: defineTable({
    question: v.string(),
    answer: v.string(),
    createdAt: v.number(),
  }),

  patientRecords: defineTable({
    patientId: v.string(),
    diagnosis: v.string(),
    prescription: v.string(),
    notes: v.string(),
    createdAt: v.number(),
  }),

  medicineReminders: defineTable({
    patientId: v.string(),
    medicineName: v.string(),
    dosage: v.string(),
    reminderTime: v.string(),
    createdAt: v.number(),
  }),

  doctorAvailability: defineTable({
    doctorId: v.string(),
    availableDate: v.string(),
    availableTime: v.string(),
    status: v.string(),
  }),

  emergencyContacts: defineTable({
    patientId: v.string(),
    name: v.string(),
    relation: v.string(),
    phone: v.string(),
  }),

  feedback: defineTable({
    userId: v.string(),
    rating: v.number(),
    comment: v.string(),
    createdAt: v.number(),
  }),
});