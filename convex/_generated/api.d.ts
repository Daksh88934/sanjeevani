/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as appointments from "../appointments.js";
import type * as chat from "../chat.js";
import type * as doctorAvailability from "../doctorAvailability.js";
import type * as emergencyContacts from "../emergencyContacts.js";
import type * as feedback from "../feedback.js";
import type * as medicineReminders from "../medicineReminders.js";
import type * as patientRecords from "../patientRecords.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  appointments: typeof appointments;
  chat: typeof chat;
  doctorAvailability: typeof doctorAvailability;
  emergencyContacts: typeof emergencyContacts;
  feedback: typeof feedback;
  medicineReminders: typeof medicineReminders;
  patientRecords: typeof patientRecords;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
