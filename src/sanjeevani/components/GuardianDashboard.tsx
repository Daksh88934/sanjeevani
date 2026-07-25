import { useState } from "react";
import { useQuery, useMutation, localApi } from "../services/localDb";
import {
  ShieldCheck,
  AlertTriangle,
  Activity,
  CheckCircle,
  Clock,
  User,
  Phone,
  Mail,
  Trash2,
} from "lucide-react";

const GuardianDashboard = () => {
  const patients = useQuery(localApi.patients.getAllDischargedPatients) || [];
  const alerts = useQuery(localApi.patients.getAllGuardianAlerts) || [];
  const resolveAlert = useMutation(localApi.patients.markAlertResolved);
  const deletePatient = useMutation(localApi.patients.deleteDischargedPatient);

  const [filter, setFilter] = useState<"all" | "critical" | "pending">("all");

  const patientList: any[] = Array.isArray(patients) ? patients : [];
  const alertList: any[] = Array.isArray(alerts) ? alerts : [];

  const mergedData = patientList.map((patient) => {
    const patientAlerts = alertList.filter((a) => a.patientId === patient.patientId);
    const latestAlert = patientAlerts.length > 0 ? patientAlerts[0] : null;
    return { ...patient, latestAlert };
  });

  const filteredData = mergedData.filter((p) => {
    if (filter === "critical") return p.latestAlert && p.latestAlert.isCritical && !p.latestAlert.isRead;
    if (filter === "pending") return !p.latestAlert;
    return true;
  });

  const handleResolve = async (alertId: string) => {
    try {
      await resolveAlert({ alertId });
    } catch (err) {
      console.error("Failed to resolve alert", err);
    }
  };

  return (
    <div className="guardian-dashboard" style={{ padding: "2rem", height: "100%", overflowY: "auto" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          borderBottom: "1px solid rgba(16, 185, 129, 0.2)",
          paddingBottom: "1rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "0.8rem", margin: 0 }}>
            <ShieldCheck size={32} /> Centralized Guardian Monitor
          </h1>
          <p style={{ color: "#a1a1aa", marginTop: "0.5rem" }}>
            Global surveillance of all discharged patients
          </p>
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setFilter("all")}
            style={{
              padding: "0.5rem 1rem",
              background: filter === "all" ? "rgba(59, 130, 246, 0.2)" : "transparent",
              border: `1px solid ${filter === "all" ? "#3b82f6" : "#3f3f46"}`,
              color: filter === "all" ? "#93c5fd" : "#a1a1aa",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            All Patients
          </button>
          <button
            onClick={() => setFilter("critical")}
            style={{
              padding: "0.5rem 1rem",
              background: filter === "critical" ? "rgba(239, 68, 68, 0.2)" : "transparent",
              border: `1px solid ${filter === "critical" ? "#ef4444" : "#3f3f46"}`,
              color: filter === "critical" ? "#fca5a5" : "#a1a1aa",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Critical Alerts
          </button>
          <button
            onClick={() => setFilter("pending")}
            style={{
              padding: "0.5rem 1rem",
              background: filter === "pending" ? "rgba(161, 161, 170, 0.2)" : "transparent",
              border: `1px solid ${filter === "pending" ? "#a1a1aa" : "#3f3f46"}`,
              color: filter === "pending" ? "#e4e4e7" : "#a1a1aa",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Pending Follow-up
          </button>
        </div>
      </header>

      {filteredData.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "400px",
            color: "#71717a",
          }}
        >
          <ShieldCheck size={64} style={{ opacity: 0.2, marginBottom: "1rem" }} />
          <p>No patients match the current filter.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {filteredData.map((patient) => (
            <div
              key={patient._id}
              style={{
                background: "#18181b",
                border: `1px solid ${
                  patient.latestAlert?.isCritical && !patient.latestAlert?.isRead
                    ? "#ef4444"
                    : patient.latestAlert && !patient.latestAlert?.isCritical
                      ? "#10b981"
                      : "#3f3f46"
                }`,
                borderRadius: "12px",
                padding: "1.5rem",
                position: "relative",
                boxShadow:
                  patient.latestAlert?.isCritical && !patient.latestAlert?.isRead
                    ? "0 0 20px rgba(239, 68, 68, 0.1)"
                    : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  borderBottom: "1px solid #27272a",
                  paddingBottom: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, color: "#e4e4e7", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <User size={18} /> {patient.patientId}
                  </h3>
                  <p style={{ margin: "0.2rem 0 0 0", color: "#a1a1aa", fontSize: "0.9rem" }}>
                    Discharged: {new Date(patient.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  {patient.contactPhone && (
                    <a
                      href={`https://wa.me/${patient.contactPhone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#10b981", cursor: "pointer" }}
                    >
                      <Phone size={18} title={`WhatsApp: ${patient.contactPhone}`} />
                    </a>
                  )}
                  {patient.contactEmail && (
                    <a href={`mailto:${patient.contactEmail}`} style={{ color: "#3b82f6", cursor: "pointer" }}>
                      <Mail size={18} title={`Email: ${patient.contactEmail}`} />
                    </a>
                  )}
                  <button
                    onClick={async () => {
                      if (window.confirm(`Delete patient ${patient.patientId} from Guardian Monitor?`)) {
                        try {
                          await deletePatient({ patientDocId: patient._id });
                        } catch (e) {
                          console.error("Failed to delete", e);
                        }
                      }
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      opacity: 0.7,
                      padding: 0,
                    }}
                    title="Delete Patient Record"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <p
                  style={{
                    margin: "0 0 0.5rem 0",
                    fontSize: "0.8rem",
                    color: "#71717a",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Original Diagnosis
                </p>
                <div
                  style={{
                    background: "#09090b",
                    padding: "0.8rem",
                    borderRadius: "6px",
                    color: "#d4d4d8",
                    fontSize: "0.9rem",
                  }}
                >
                  {patient.diagnosis}
                </div>
              </div>

              <div>
                <p
                  style={{
                    margin: "0 0 0.5rem 0",
                    fontSize: "0.8rem",
                    color: "#71717a",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Guardian Status
                </p>

                {!patient.latestAlert ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      color: "#a1a1aa",
                      fontSize: "0.9rem",
                      background: "#27272a",
                      padding: "0.8rem",
                      borderRadius: "6px",
                    }}
                  >
                    <Clock size={16} /> Awaiting 24h follow-up from patient...
                  </div>
                ) : (
                  <div
                    style={{
                      background:
                        patient.latestAlert.isCritical && !patient.latestAlert.isRead
                          ? "rgba(239, 68, 68, 0.1)"
                          : "rgba(16, 185, 129, 0.1)",
                      border: `1px solid ${
                        patient.latestAlert.isCritical && !patient.latestAlert.isRead
                          ? "rgba(239, 68, 68, 0.3)"
                          : "rgba(16, 185, 129, 0.3)"
                      }`,
                      padding: "1rem",
                      borderRadius: "6px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <span
                        style={{
                          color: patient.latestAlert.isCritical ? "#fca5a5" : "#6ee7b7",
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontSize: "0.9rem",
                        }}
                      >
                        {patient.latestAlert.isCritical ? (
                          <AlertTriangle size={16} />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        {patient.latestAlert.isCritical ? "CRITICAL RELAPSE RISK" : "STABLE RECOVERY"}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#71717a" }}>
                        {new Date(patient.latestAlert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div style={{ color: "#e4e4e7", fontSize: "0.9rem", marginBottom: "0.8rem" }}>
                      <strong style={{ color: "#a1a1aa" }}>Patient reports:</strong> "
                      {patient.latestAlert.reportedSymptoms}"
                    </div>

                    <div
                      style={{
                        color: "#93c5fd",
                        fontSize: "0.85rem",
                        marginBottom: !patient.latestAlert.isRead ? "1rem" : 0,
                      }}
                    >
                      <Activity size={14} style={{ display: "inline", marginRight: "4px" }} />
                      {patient.latestAlert.aiRiskAssessment}
                    </div>

                    {!patient.latestAlert.isRead && (
                      <button
                        onClick={() => handleResolve(patient.latestAlert._id)}
                        style={{
                          width: "100%",
                          padding: "0.5rem",
                          background: patient.latestAlert.isCritical ? "#ef4444" : "#10b981",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        Acknowledge & Resolve
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuardianDashboard;
