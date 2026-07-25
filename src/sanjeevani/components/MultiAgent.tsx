import { useState, useRef } from "react";
import { runMultiAgentDebate } from "../services/AIEngine";
import { saveReportToDB, downloadPDF } from "../services/ReportService";
import { showAlert } from "../services/AlertService";
import { MissingApiKeyError } from "../services/settings";
import {
  Users,
  HeartPulse,
  Brain,
  Pill,
  PlayCircle,
  Loader2,
  CheckCircle,
  Activity,
  Wind,
  Stethoscope,
  Droplet,
  Smile,
  Sun,
  Crosshair,
  Skull,
  FileBarChart,
  Dna,
  Save,
  Download,
} from "lucide-react";

const MultiAgent = () => {
  const [caseDescription, setCaseDescription] = useState("");
  const [isDebating, setIsDebating] = useState(false);
  const [debateLog, setDebateLog] = useState<any[]>([]);
  const [consensus, setConsensus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [patientId, setPatientId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSaveReport = async () => {
    if (!consensus) return;
    if (!patientId.trim()) {
      showAlert("Patient ID is mandatory to save reports in the EHR system.", "error");
      return;
    }
    setIsSaving(true);
    try {
      const reportData = {
        caseDescription,
        consensus,
        disagreements: debateLog
          .map((log) => `${log.specialty.toUpperCase()} (${log.agent}): ${log.message}`)
          .join("\n\n"),
      };
      await saveReportToDB("MultiAgent", patientId, reportData);
      showAlert("Consensus Report saved to Patient Records successfully!", "success");
    } catch (err) {
      showAlert("Failed to save report: " + (err instanceof Error ? err.message : String(err)), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    const reportData = {
      caseDescription,
      consensus,
      disagreements: debateLog
        .map((log) => `${log.specialty.toUpperCase()} (${log.agent}): ${log.message}`)
        .join("\n\n"),
    };
    downloadPDF("MultiAgent", patientId || "Anonymous", reportData);
  };

  const startDebate = async () => {
    if (!caseDescription.trim()) return;
    setIsDebating(true);
    setDebateLog([]);
    setConsensus(null);
    setErrorMsg("");

    try {
      const result = await runMultiAgentDebate(caseDescription);

      let currentLog: any[] = [];
      for (let i = 0; i < result.debate.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        currentLog = [...currentLog, result.debate[i]];
        setDebateLog(currentLog);
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setConsensus(result.consensus);
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      setErrorMsg(
        err instanceof MissingApiKeyError
          ? err.message
          : (err instanceof Error ? err.message : "Failed to run the Multi-Agent debate."),
      );
    } finally {
      setIsDebating(false);
    }
  };

  const getAgentIcon = (specialty: string) => {
    const s = specialty.toLowerCase();
    if (s.includes("cardio")) return <HeartPulse size={24} color="#ff4d4d" />;
    if (s.includes("neuro")) return <Brain size={24} color="#a855f7" />;
    if (s.includes("pharma") || s.includes("tox")) return <Pill size={24} color="#3b82f6" />;
    if (s.includes("pulm") || s.includes("lung")) return <Wind size={24} color="#38bdf8" />;
    if (s.includes("gastro")) return <Stethoscope size={24} color="#f59e0b" />;
    if (s.includes("hemato") || s.includes("blood")) return <Droplet size={24} color="#ef4444" />;
    if (s.includes("psych") || s.includes("mind")) return <Smile size={24} color="#ec4899" />;
    if (s.includes("derma") || s.includes("skin")) return <Sun size={24} color="#facc15" />;
    if (s.includes("trauma") || s.includes("surg")) return <Crosshair size={24} color="#dc2626" />;
    if (s.includes("endo")) return <Activity size={24} color="#10b981" />;
    if (s.includes("onco")) return <Dna size={24} color="#8b5cf6" />;
    if (s.includes("patho")) return <FileBarChart size={24} color="#64748b" />;
    return <Users size={24} color="#00f0ff" />;
  };

  const getAgentColor = (specialty: string) => {
    const s = specialty.toLowerCase();
    if (s.includes("cardio")) return "rgba(255, 77, 77, 0.1)";
    if (s.includes("neuro")) return "rgba(168, 85, 247, 0.1)";
    if (s.includes("pharma") || s.includes("tox")) return "rgba(59, 130, 246, 0.1)";
    if (s.includes("pulm")) return "rgba(56, 189, 248, 0.1)";
    if (s.includes("gastro")) return "rgba(245, 158, 11, 0.1)";
    if (s.includes("hemato")) return "rgba(239, 68, 68, 0.1)";
    if (s.includes("psych")) return "rgba(236, 72, 153, 0.1)";
    if (s.includes("derma")) return "rgba(250, 204, 21, 0.1)";
    if (s.includes("trauma")) return "rgba(220, 38, 38, 0.1)";
    if (s.includes("endo")) return "rgba(16, 185, 129, 0.1)";
    if (s.includes("onco")) return "rgba(139, 92, 246, 0.1)";
    if (s.includes("patho")) return "rgba(100, 116, 139, 0.1)";
    return "rgba(0, 240, 255, 0.05)";
  };

  const getAgentBorder = (specialty: string) => {
    const s = specialty.toLowerCase();
    if (s.includes("cardio")) return "#ff4d4d";
    if (s.includes("neuro")) return "#a855f7";
    if (s.includes("pharma") || s.includes("tox")) return "#3b82f6";
    if (s.includes("pulm")) return "#38bdf8";
    if (s.includes("gastro")) return "#f59e0b";
    if (s.includes("hemato")) return "#ef4444";
    if (s.includes("psych")) return "#ec4899";
    if (s.includes("derma")) return "#facc15";
    if (s.includes("trauma")) return "#dc2626";
    if (s.includes("endo")) return "#10b981";
    if (s.includes("onco")) return "#8b5cf6";
    if (s.includes("patho")) return "#64748b";
    return "#00f0ff";
  };

  return (
    <div className="module-container" style={{ display: "flex", gap: "2rem" }}>
      <div className="glass-panel" style={{ flex: "0 0 35%", display: "flex", flexDirection: "column" }}>
        <div className="section-header">
          <h2>Agentic Committee</h2>
          <p>Multi-Specialist AI Debate</p>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div
            style={{
              background: "var(--bg-elevated)",
              padding: "1.5rem",
              borderRadius: "12px",
              border: "1px solid var(--glass-border)",
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h3
              style={{
                color: "var(--primary)",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexShrink: 0,
              }}
            >
              <Users size={20} /> Active AI Board (13 Specialists)
            </h3>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                overflowY: "auto",
                flex: 1,
                paddingRight: "10px",
              }}
            >
              {[
                { key: "cardio", name: "Cardio", icon: HeartPulse, color: "#ff4d4d" },
                { key: "neuro", name: "Neuro", icon: Brain, color: "#a855f7" },
                { key: "pharma", name: "Pharma", icon: Pill, color: "#3b82f6" },
                { key: "pulm", name: "Pulmono", icon: Wind, color: "#38bdf8" },
                { key: "gastro", name: "Gastro", icon: Stethoscope, color: "#f59e0b" },
                { key: "hemato", name: "Hemato", icon: Droplet, color: "#ef4444" },
                { key: "psych", name: "Psych", icon: Smile, color: "#ec4899" },
                { key: "derma", name: "Derma", icon: Sun, color: "#facc15" },
                { key: "trauma", name: "Trauma", icon: Crosshair, color: "#dc2626" },
                { key: "tox", name: "Toxico", icon: Skull, color: "#10b981" },
                { key: "endo", name: "Endo", icon: Activity, color: "#10b981" },
                { key: "onco", name: "Onco", icon: Dna, color: "#8b5cf6" },
                { key: "patho", name: "Patho", icon: FileBarChart, color: "#64748b" },
              ].map((agent) => {
                const isActive = debateLog.some((log) =>
                  log.specialty.toLowerCase().includes(agent.key),
                );
                const ItemIcon = agent.icon;
                return (
                  <li
                    key={agent.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      color: isActive ? "#fff" : "#64748b",
                      fontSize: "0.9rem",
                      background: isActive ? getAgentColor(agent.key) : "transparent",
                      padding: isActive ? "6px 10px" : "2px 0",
                      borderRadius: "8px",
                      border: isActive ? `1px solid ${getAgentBorder(agent.key)}` : "1px solid transparent",
                      transition: "all 0.3s ease",
                      boxShadow: isActive ? `0 0 10px ${getAgentColor(agent.key)}` : "none",
                    }}
                  >
                    <ItemIcon size={16} color={isActive ? agent.color : "#64748b"} /> {agent.name}
                  </li>
                );
              })}
            </ul>
          </div>

          <textarea
            value={caseDescription}
            onChange={(e) => setCaseDescription(e.target.value)}
            placeholder="Describe the complex patient case here... (e.g., Patient is a 55yr old male with sudden numbness in left arm, history of hypertension, currently taking Lisinopril but complains of chest tightness today.)"
            style={{
              flex: 1,
              width: "100%",
              padding: "1rem",
              borderRadius: "8px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--glass-border)",
              color: "#fff",
              fontSize: "1rem",
              resize: "none",
              fontFamily: "inherit",
            }}
          />

          <button
            onClick={startDebate}
            disabled={isDebating || !caseDescription.trim()}
            style={{
              padding: "1.2rem",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(90deg, var(--primary), var(--accent))",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1.1rem",
              cursor: isDebating || !caseDescription.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            {isDebating ? (
              <>
                <Loader2 className="animate-spin" size={20} /> DEBATING...
              </>
            ) : (
              <>
                <PlayCircle size={20} /> START AI DEBATE
              </>
            )}
          </button>

          {errorMsg && <p style={{ color: "var(--status-red)", textAlign: "center" }}>{errorMsg}</p>}
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0" }}>
        <div
          className="section-header"
          style={{
            padding: "1.5rem",
            borderBottom: "1px solid var(--glass-border)",
            margin: 0,
            background: "transparent",
          }}
        >
          <h2 style={{ fontSize: "1.2rem" }}>Live Debate Transcript</h2>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            background: "var(--bg-dark)",
          }}
        >
          {debateLog.length === 0 && !isDebating && !consensus && (
            <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)" }}>
              <Users size={64} style={{ opacity: 0.2, marginBottom: "1rem" }} />
              <p>Submit a case to start the multi-agent debate.</p>
            </div>
          )}

          {debateLog.map((log, index) => (
            <div key={index} style={{ display: "flex", gap: "1rem", animation: "fadeIn 0.5s ease-out" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: getAgentColor(log.specialty),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `2px solid ${getAgentBorder(log.specialty)}`,
                  flexShrink: 0,
                }}
              >
                {getAgentIcon(log.specialty)}
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  padding: "1rem 1.5rem",
                  borderRadius: "0 12px 12px 12px",
                  border: "1px solid var(--glass-border)",
                  flex: 1,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <strong style={{ color: getAgentBorder(log.specialty) }}>{log.agent}</strong>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                    {log.specialty}
                  </span>
                </div>
                <p style={{ margin: 0, color: "#e2e8f0", lineHeight: 1.6 }}>{log.message}</p>
              </div>
            </div>
          ))}

          {isDebating && (
            <div style={{ display: "flex", gap: "1rem", animation: "pulse 1.5s infinite" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Loader2 className="animate-spin" size={20} color="var(--primary)" />
              </div>
              <div style={{ padding: "1rem", color: "var(--text-muted)" }}>Agents are processing...</div>
            </div>
          )}

          {consensus && (
            <div
              style={{
                background: "linear-gradient(145deg, rgba(0, 240, 255, 0.1), rgba(0, 0, 0, 0.4))",
                border: "1px solid var(--primary)",
                padding: "2rem",
                borderRadius: "12px",
                marginTop: "1rem",
                animation: "fadeIn 1s ease-out",
              }}
            >
              <h3
                style={{
                  color: "var(--primary)",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <CheckCircle size={24} /> Final Unified Consensus
              </h3>
              <p style={{ color: "#fff", lineHeight: 1.7, fontSize: "1.1rem" }}>{consensus}</p>

              <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  Assign Patient ID (Mandatory)*
                </label>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="e.g. PAT-90812"
                  style={{
                    padding: "0.8rem",
                    borderRadius: "8px",
                    border: "1px solid var(--glass-border)",
                    background: "var(--bg-elevated)",
                    color: "#fff",
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginTop: "1rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={handleSaveReport}
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    minWidth: "140px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.8rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "var(--primary)",
                    color: "#000",
                    fontWeight: "bold",
                    cursor: isSaving ? "not-allowed" : "pointer",
                  }}
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {isSaving ? "Saving..." : "Save Report"}
                </button>
                <button
                  onClick={handleDownload}
                  style={{
                    flex: 1,
                    minWidth: "140px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.8rem",
                    borderRadius: "8px",
                    border: "1px solid var(--primary)",
                    background: "transparent",
                    color: "var(--primary)",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  <Download size={18} />
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    setCaseDescription("");
                    setDebateLog([]);
                    setConsensus(null);
                    setErrorMsg("");
                    setPatientId("");
                  }}
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    minWidth: "140px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.8rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "transparent",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: isSaving ? "not-allowed" : "pointer",
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>
    </div>
  );
};

export default MultiAgent;
