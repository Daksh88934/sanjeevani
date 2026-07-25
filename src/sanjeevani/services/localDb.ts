/**
 * Local persistence layer for Sanjeevani AI.
 *
 * Replaces the original Convex + MongoDB backend with a localStorage-backed
 * store + a tiny pub/sub layer. Exposes a `localApi` object and `useQuery` /
 * `useMutation` hooks that mirror the shape of the Convex calls used in the
 * original components, so ported components need almost no changes.
 *
 * Data is per-browser only (no cross-device sync) — acceptable because no
 * backend was approved for this port.
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types (kept loose to mirror the original `data: v.any()` schema)
// ---------------------------------------------------------------------------

export interface SavedRecord {
  _id: string;
  patientId: string;
  type: string;
  data: any;
  savedAt: number;
}

export interface DischargedPatient {
  _id: string;
  patientId: string;
  diagnosis: string;
  medications: string[];
  dischargeNotes: string;
  riskLevel: string;
  contactPhone?: string;
  contactEmail?: string;
  contactLink: string;
  timestamp: string;
}

export interface GuardianAlert {
  _id: string;
  patientId: string;
  reportedSymptoms: string;
  aiRiskAssessment: string;
  isCritical: boolean;
  timestamp: string;
  isRead: boolean;
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

const KEYS = {
  records: "sanjeevani_saved_records",
  patients: "sanjeevani_discharged_patients",
  alerts: "sanjeevani_guardian_alerts",
} as const;

export const DB_CHANGE_EVENT = "sanjeevani-db-change";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // localStorage may be full (base64 images are large) — best-effort.
    console.warn("Sanjeevani localDb write failed", err);
  }
  window.dispatchEvent(new Event(DB_CHANGE_EVENT));
}

const genId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

// ---------------------------------------------------------------------------
// Records (Patient Records dashboard) — replaces convex/records.js
// ---------------------------------------------------------------------------

export function saveRecord(args: {
  patientId: string;
  type: string;
  data: any;
}): string {
  const records = read<SavedRecord[]>(KEYS.records, []);
  const record: SavedRecord = {
    _id: genId("rec"),
    patientId: args.patientId,
    type: args.type,
    data: args.data,
    savedAt: Date.now(),
  };
  records.push(record);
  write(KEYS.records, records);
  return record._id;
}

export function getAllRecords(): SavedRecord[] {
  const records = read<SavedRecord[]>(KEYS.records, []);
  return records.sort((a, b) => b.savedAt - a.savedAt);
}

export function deleteRecord(recordId: string): void {
  const records = read<SavedRecord[]>(KEYS.records, []);
  write(
    KEYS.records,
    records.filter((r) => r._id !== recordId),
  );
}

// ---------------------------------------------------------------------------
// Discharged patients + Guardian alerts — replaces convex/patients.js
// ---------------------------------------------------------------------------

export function dischargePatient(args: {
  patientId: string;
  diagnosis: string;
  medications: string[];
  dischargeNotes: string;
  riskLevel: string;
  contactPhone?: string;
  contactEmail?: string;
}): string {
  const patients = read<DischargedPatient[]>(KEYS.patients, []);
  const contactLink = `/?followup=${encodeURIComponent(args.patientId)}`;
  const patient: DischargedPatient = {
    ...args,
    contactLink,
    timestamp: new Date().toISOString(),
    _id: genId("pat"),
  };
  patients.push(patient);
  write(KEYS.patients, patients);
  return contactLink;
}

export function getPatientDischargeInfo(
  patientId: string,
): DischargedPatient | null {
  const patients = read<DischargedPatient[]>(KEYS.patients, []);
  return patients.find((p) => p.patientId === patientId) ?? null;
}

export function logGuardianAlert(args: {
  patientId: string;
  reportedSymptoms: string;
  aiRiskAssessment: string;
  isCritical: boolean;
}): void {
  const alerts = read<GuardianAlert[]>(KEYS.alerts, []);
  const alert: GuardianAlert = {
    ...args,
    isRead: false,
    timestamp: new Date().toISOString(),
    _id: genId("alert"),
  };
  alerts.push(alert);
  write(KEYS.alerts, alerts);
}

export function getActiveAlerts(): GuardianAlert[] {
  const alerts = read<GuardianAlert[]>(KEYS.alerts, []);
  return alerts
    .filter((a) => !a.isRead)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
}

export function markAlertResolved(alertId: string): void {
  const alerts = read<GuardianAlert[]>(KEYS.alerts, []);
  write(
    KEYS.alerts,
    alerts.map((a) => (a._id === alertId ? { ...a, isRead: true } : a)),
  );
}

export function getAllDischargedPatients(): DischargedPatient[] {
  const patients = read<DischargedPatient[]>(KEYS.patients, []);
  return patients.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function getAllGuardianAlerts(): GuardianAlert[] {
  const alerts = read<GuardianAlert[]>(KEYS.alerts, []);
  return alerts.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function deleteDischargedPatient(patientDocId: string): void {
  const patients = read<DischargedPatient[]>(KEYS.patients, []);
  const patient = patients.find((p) => p._id === patientDocId);
  if (!patient) return;

  // Delete the patient + all of their alerts (mirrors convex impl).
  write(
    KEYS.patients,
    patients.filter((p) => p._id !== patientDocId),
  );
  const alerts = read<GuardianAlert[]>(KEYS.alerts, []);
  write(
    KEYS.alerts,
    alerts.filter((a) => a.patientId !== patient.patientId),
  );
}

// ---------------------------------------------------------------------------
// Convex-shaped API + hooks so ported components keep their existing calls.
// ---------------------------------------------------------------------------

export const localApi = {
  records: {
    getAllRecords: () => getAllRecords(),
    saveRecord: (args: { patientId: string; type: string; data: any }) =>
      saveRecord(args),
    deleteRecord: (args: { recordId: string }) => deleteRecord(args.recordId),
  },
  patients: {
    getAllDischargedPatients: () => getAllDischargedPatients(),
    getAllGuardianAlerts: () => getAllGuardianAlerts(),
    getActiveAlerts: () => getActiveAlerts(),
    getPatientDischargeInfo: (args: { patientId: string }) =>
      getPatientDischargeInfo(args.patientId),
    dischargePatient: (args: {
      patientId: string;
      diagnosis: string;
      medications: string[];
      dischargeNotes: string;
      riskLevel: string;
      contactPhone?: string;
      contactEmail?: string;
    }) => dischargePatient(args),
    logGuardianAlert: (args: {
      patientId: string;
      reportedSymptoms: string;
      aiRiskAssessment: string;
      isCritical: boolean;
    }) => logGuardianAlert(args),
    markAlertResolved: (args: { alertId: string }) =>
      markAlertResolved(args.alertId),
    deleteDischargedPatient: (args: { patientDocId: string }) =>
      deleteDischargedPatient(args.patientDocId),
  },
};

/**
 * Mirrors `useQuery` from convex/react. Reads synchronously from localStorage
 * and re-runs whenever any localDb mutation fires the change event.
 */
export function useQuery(queryFn: (args?: any) => any, args?: any): any {
  const compute = () =>
    args !== undefined ? queryFn(args) : queryFn();

  const [data, setData] = useState<any>(compute);

  // Keep latest fn/args in refs so the subscription stays stable.
  const fnRef = useRef(queryFn);
  fnRef.current = queryFn;
  const argsRef = useRef(args);
  argsRef.current = args;

  // Re-subscribe only when the args actually change (by value).
  const argsKey = args !== undefined ? JSON.stringify(args) : "none";

  useEffect(() => {
    const recompute = () => {
      const a = argsRef.current;
      setData(a !== undefined ? fnRef.current(a) : fnRef.current());
    };
    recompute();
    window.addEventListener(DB_CHANGE_EVENT, recompute);
    return () => window.removeEventListener(DB_CHANGE_EVENT, recompute);
  }, [argsKey]);

  return data;
}

/**
 * Mirrors `useMutation` from convex/react. Returns a stable function that
 * invokes the mutation and resolves with its return value.
 */
export function useMutation(
  mutationFn: (args: any) => any,
): (args: any) => Promise<any> {
  return useCallback(
    (args: any) => {
      try {
        return Promise.resolve(mutationFn(args));
      } catch (err) {
        return Promise.reject(err);
      }
    },
    [mutationFn],
  );
}
