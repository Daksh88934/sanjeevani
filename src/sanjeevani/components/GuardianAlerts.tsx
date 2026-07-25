import { useQuery, useMutation, localApi } from "../services/localDb";
import { ShieldAlert, CheckCircle, AlertTriangle } from "lucide-react";

const GuardianAlerts = () => {
  const alerts = useQuery(localApi.patients.getActiveAlerts);
  const resolveMutation = useMutation(localApi.patients.markAlertResolved);

  const activeAlerts: any[] = Array.isArray(alerts) ? alerts : [];
  const markResolved = resolveMutation;

  if (activeAlerts.length === 0) return null;

  return (
    <div
      style={{
        marginBottom: "2rem",
        padding: "1.5rem",
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.4)",
        borderRadius: "12px",
      }}
    >
      <h3
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "#ef4444",
          margin: "0 0 1rem 0",
        }}
      >
        <ShieldAlert size={24} /> Autonomous Guardian Alerts (Readmission Risk)
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {activeAlerts.map((alert) => (
          <div
            key={alert._id}
            style={{
              background: "var(--bg-elevated)",
              padding: "1rem",
              borderRadius: "8px",
              borderLeft: "4px solid #ef4444",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <strong style={{ color: "#fff", fontSize: "1.1rem" }}>
                  Patient ID: {alert.patientId}
                </strong>
                <p
                  style={{
                    margin: "0.5rem 0",
                    color: "#fca5a5",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <AlertTriangle size={16} />{" "}
                  {alert.isCritical ? "CRITICAL RELAPSE RISK" : "OBSERVATION NEEDED"}
                </p>
                <p style={{ margin: "0.5rem 0", color: "#e5e7eb", fontSize: "0.9rem" }}>
                  <strong>New Symptom:</strong> "{alert.reportedSymptoms}"
                </p>
                <p
                  style={{
                    margin: "0 0 0.5rem 0",
                    color: "#93c5fd",
                    fontSize: "0.9rem",
                    fontStyle: "italic",
                  }}
                >
                  <strong>AI RAG Analysis:</strong> {alert.aiRiskAssessment}
                </p>
              </div>
              <button
                onClick={() => markResolved({ alertId: alert._id })}
                style={{
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontWeight: "bold",
                }}
              >
                <CheckCircle size={16} /> Mark Resolved
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuardianAlerts;
