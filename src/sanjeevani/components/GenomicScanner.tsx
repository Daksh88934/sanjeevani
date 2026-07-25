import { useState } from "react";
import { analyzeGenomicSequence } from "../services/AIEngine";
import { saveReportToDB, downloadPDF } from "../services/ReportService";
import { showAlert } from "../services/AlertService";
import { MissingApiKeyError } from "../services/settings";
import {
  Dna,
  Fingerprint,
  Loader2,
  Search,
  AlertOctagon,
  ShieldCheck,
  Activity,
  Database,
  GitMerge,
  Network,
  CheckCircle,
  Target,
  Save,
  Download,
} from "lucide-react";

const GenomicScanner = () => {
  const [sequence, setSequence] = useState(
    "ATGCGTACGTTAGCTAGCTAGCTGATCGATCGTAGCTAGCTAGCTAGCTGATCGATCGATCGTAGCTAGCTAGCTAGCTGATCGATCG",
  );
  const [isScanning, setIsScanning] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [patientId, setPatientId] = useState("");

  const handleSaveReport = async () => {
    if (!report) return;
    if (!patientId.trim()) {
      showAlert("Patient ID is mandatory to save reports in the EHR system.", "error");
      return;
    }
    setIsSaving(true);
    try {
      await saveReportToDB("Genomic", patientId, report);
      showAlert("Report saved to Patient Records successfully!", "success");
    } catch (err) {
      showAlert("Failed to save report: " + (err instanceof Error ? err.message : String(err)), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    downloadPDF("Genomic", patientId || "Anonymous", report);
  };

  const handleScan = async () => {
    if (!sequence.trim() || sequence.length < 20) {
      setErrorMsg("Please enter a valid DNA sequence (at least 20 base pairs).");
      return;
    }

    setIsScanning(true);
    setReport(null);
    setErrorMsg("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const data = await analyzeGenomicSequence(sequence);
      setReport(data);
    } catch (err) {
      setErrorMsg(
        err instanceof MissingApiKeyError
          ? err.message
          : (err instanceof Error ? err.message : "Failed to analyze sequence."),
      );
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskColor = (risk?: string) => {
    if (!risk) return "#22c55e";
    if (risk.toLowerCase().includes("high")) return "#ff4d4d";
    if (risk.toLowerCase().includes("medium")) return "#eab308";
    return "#22c55e";
  };

  return (
    <div className="module-container" style={{ display: "flex", gap: "2rem" }}>
      <div className="glass-panel" style={{ flex: "0 0 35%", display: "flex", flexDirection: "column" }}>
        <div className="section-header" style={{ marginBottom: "1.5rem" }}>
          <h2>CRISPR Genomic AI</h2>
          <p>Advanced Clinical Anomaly Detector</p>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div
            style={{
              position: "relative",
              flex: 1,
              background: "var(--bg-dark)",
              border: "1px solid var(--glass-border)",
              borderRadius: "12px",
              overflow: "hidden",
              padding: "1.5rem",
              fontFamily: "monospace",
              color: "var(--primary)",
              wordWrap: "break-word",
              letterSpacing: "2px",
              lineHeight: 1.8,
            }}
          >
            <textarea
              value={sequence}
              onChange={(e) => setSequence(e.target.value.toUpperCase().replace(/[^ATCG\n ]/g, ""))}
              style={{
                width: "100%",
                height: "100%",
                background: "transparent",
                border: "none",
                color: "inherit",
                fontFamily: "inherit",
                resize: "none",
                letterSpacing: "inherit",
                lineHeight: "inherit",
                outline: "none",
              }}
              disabled={isScanning}
              placeholder="Paste raw ATCG sequence block here..."
            />

            {isScanning && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "8px",
                  background: "#00f0ff",
                  boxShadow: "0 0 30px #00f0ff, 0 0 60px #00f0ff",
                  animation: "laserScan 2s ease-in-out infinite alternate",
                }}
              />
            )}
          </div>

          <style>{`
            @keyframes laserScan {
              0% { top: 0%; }
              100% { top: 100%; }
            }
          `}</style>

          <button
            onClick={handleScan}
            disabled={isScanning || !sequence.trim()}
            style={{
              padding: "1.2rem",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(90deg, #10b981, #059669)",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1.1rem",
              cursor: isScanning || !sequence.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)",
            }}
          >
            {isScanning ? (
              <>
                <Loader2 className="animate-spin" size={20} /> SEQUENCING DNA BASE PAIRS...
              </>
            ) : (
              <>
                <Search size={20} /> INITIATE DEEP GENOMIC SCAN
              </>
            )}
          </button>

          {errorMsg && <p style={{ color: "var(--status-red)", textAlign: "center", margin: 0 }}>{errorMsg}</p>}

          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              color: "var(--text-muted)",
              fontSize: "0.9rem",
              marginTop: "auto",
              padding: "1rem",
              background: "var(--bg-elevated)",
              borderRadius: "8px",
              border: "1px solid var(--glass-border)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Dna size={16} /> 3B Base Pairs
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Fingerprint size={16} /> Identity Protected
            </span>
          </div>
        </div>
      </div>

      <div
        className="glass-panel"
        style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0", background: "transparent", overflowY: "auto" }}
      >
        <div
          className="section-header"
          style={{
            padding: "1.5rem 2rem",
            background: "var(--bg-elevated)",
            borderBottom: "1px solid var(--glass-border)",
            margin: 0,
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <h2 style={{ fontSize: "1.2rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Database size={20} color="var(--primary)" /> Clinical Genomic Analysis Report
          </h2>
        </div>

        <div style={{ flex: 1, padding: "2rem", display: "flex", flexDirection: "column" }}>
          {!report && !isScanning && (
            <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)" }}>
              <Dna size={64} style={{ opacity: 0.2, marginBottom: "1rem" }} />
              <p>Upload a DNA sequence to detect hereditary markers and CRISPR targets.</p>
            </div>
          )}

          {isScanning && (
            <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)", animation: "pulse 1.5s infinite" }}>
              <Dna size={80} color="var(--primary)" style={{ animation: "spin 4s linear infinite", marginBottom: "1rem" }} />
              <p style={{ color: "var(--primary)", letterSpacing: "2px" }}>
                CROSS-REFERENCING 50,000 CLINICAL MUTATIONS...
              </p>
            </div>
          )}

          {report && (
            <div style={{ animation: "fadeIn 0.5s ease-out", display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1.5rem",
                  background: "var(--bg-elevated)",
                  borderRadius: "12px",
                  borderLeft: `4px solid ${getRiskColor(report.riskLevel)}`,
                  border: `1px solid ${getRiskColor(report.riskLevel)}40`,
                  gap: "1rem",
                }}
              >
                <div>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      margin: "0 0 0.2rem 0",
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Detected Mutation
                  </p>
                  <h3 style={{ color: "#fff", margin: "0 0 0.5rem 0", fontSize: "1.8rem" }}>
                    {report.detectedMutation}
                  </h3>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      margin: 0,
                      fontSize: "1.1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Activity size={16} color={getRiskColor(report.riskLevel)} /> {report.associatedDisease}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.6rem 1.2rem",
                      background: `${getRiskColor(report.riskLevel)}20`,
                      color: getRiskColor(report.riskLevel),
                      borderRadius: "20px",
                      fontWeight: "bold",
                      fontSize: "1rem",
                      border: `1px solid ${getRiskColor(report.riskLevel)}`,
                    }}
                  >
                    {report.riskLevel?.toUpperCase()} RISK
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
                {[
                  { icon: <Target size={14} />, label: "Locus", value: report.chromosomeLocation },
                  { icon: <AlertOctagon size={14} />, label: "Significance", value: report.clinicalSignificance },
                  { icon: <Network size={14} />, label: "Inheritance", value: report.inheritancePattern },
                  { icon: <GitMerge size={14} />, label: "Frequency", value: report.variantFrequency },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      padding: "1.2rem",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.8rem",
                        margin: "0 0 0.5rem 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      {item.icon} {item.label}
                    </p>
                    <h4 style={{ color: "#fff", margin: 0, fontSize: "1.1rem" }}>{item.value}</h4>
                  </div>
                ))}
              </div>

              {report.proteinImpactScore && (
                <div
                  style={{
                    background: "var(--bg-elevated)",
                    padding: "1.5rem",
                    borderRadius: "12px",
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem" }}>
                    <h4 style={{ color: "#e2e8f0", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Activity size={18} color="#f59e0b" /> Protein Impact Severity
                    </h4>
                    <span style={{ color: "#f59e0b", fontWeight: "bold" }}>
                      {report.proteinImpactScore} / 100
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "12px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "6px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${report.proteinImpactScore}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                        borderRadius: "6px",
                        boxShadow: "0 0 10px #f59e0b",
                      }}
                    />
                  </div>
                </div>
              )}

              <div
                style={{
                  background: "var(--bg-elevated)",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <h4
                  style={{
                    color: "var(--primary)",
                    margin: "0 0 1rem 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <AlertOctagon size={18} /> Pathogenic Mechanism
                </h4>
                <p style={{ color: "#cbd5e1", lineHeight: 1.7, margin: 0 }}>{report.description}</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.05)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    padding: "1.5rem",
                    borderRadius: "12px",
                  }}
                >
                  <h4
                    style={{
                      color: "#10b981",
                      margin: "0 0 1rem 0",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <CheckCircle size={18} /> Recommended Therapies
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem" }}>
                    {report.recommendedTherapies?.map((therapy: string, index: number) => (
                      <span
                        key={index}
                        style={{
                          background: "rgba(16, 185, 129, 0.15)",
                          color: "#10b981",
                          padding: "0.5rem 1rem",
                          borderRadius: "20px",
                          fontSize: "0.9rem",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                        }}
                      >
                        {therapy}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(0, 240, 255, 0.05)",
                    border: "1px solid rgba(0, 240, 255, 0.3)",
                    padding: "1.5rem",
                    borderRadius: "12px",
                  }}
                >
                  <h4
                    style={{
                      color: "#00f0ff",
                      margin: "0 0 1rem 0",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <ShieldCheck size={18} /> CRISPR-Cas9 Target
                  </h4>
                  <div
                    style={{
                      padding: "1rem",
                      background: "var(--bg-dark)",
                      borderRadius: "8px",
                      fontFamily: "monospace",
                      color: "#fff",
                      borderLeft: "3px solid #00f0ff",
                      fontSize: "0.9rem",
                      lineHeight: 1.5,
                      wordBreak: "break-all",
                    }}
                  >
                    {report.crisprTarget}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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
                    setSequence(
                      "ATGCGTACGTTAGCTAGCTAGCTGATCGATCGTAGCTAGCTAGCTAGCTGATCGATCGATCGTAGCTAGCTAGCTAGCTGATCGATCG",
                    );
                    setReport(null);
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
        </div>
      </div>
    </div>
  );
};

export default GenomicScanner;
