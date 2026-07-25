import { useState } from "react";
import type * as React from "react";
import { Pill, Search, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { checkDrugInteractions } from "../services/AIEngine";
import { MissingApiKeyError } from "../services/settings";

const PharmaAI = () => {
  const [drugs, setDrugs] = useState<string[]>([]);
  const [currentDrug, setCurrentDrug] = useState("");
  const [genes, setGenes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const addDrug = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentDrug.trim() && !drugs.includes(currentDrug.trim())) {
      setDrugs([...drugs, currentDrug.trim()]);
      setCurrentDrug("");
    }
  };

  const removeDrug = (drugToRemove: string) => {
    setDrugs(drugs.filter((d) => d !== drugToRemove));
  };

  const analyzePolypharmacy = async () => {
    if (drugs.length < 2) {
      setErrorMsg("Please add at least 2 medications to check for interactions.");
      return;
    }
    setErrorMsg("");
    setResult(null);
    setIsProcessing(true);
    try {
      const data = await checkDrugInteractions(drugs, genes);
      setResult(data);
    } catch (err) {
      setErrorMsg(
        err instanceof MissingApiKeyError
          ? err.message
          : "AI Analysis failed. Try rewording the medications.",
      );
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="module-container" style={{ display: "flex", gap: "2rem" }}>
      <div className="glass-panel" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="section-header">
          <h2>Pharmacogenomics</h2>
          <p>Polypharmacy Risk Predictor</p>
        </div>

        <form onSubmit={addDrug} style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
          <input
            type="text"
            placeholder="Enter medication name (e.g., Warfarin, Aspirin)"
            value={currentDrug}
            onChange={(e) => setCurrentDrug(e.target.value)}
            style={{
              flex: 1,
              padding: "1rem",
              borderRadius: "8px",
              border: "1px solid var(--glass-border)",
              background: "var(--bg-elevated)",
              color: "#fff",
              fontSize: "1rem",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0 1.5rem",
              borderRadius: "8px",
              border: "none",
              background: "var(--primary)",
              color: "#000",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Add Drug
          </button>
        </form>

        <div className="tag-list" style={{ marginBottom: "2rem", minHeight: "50px" }}>
          {drugs.map((drug) => (
            <span
              key={drug}
              className="tag"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "1rem",
                padding: "0.5rem 1rem",
              }}
            >
              <Pill size={16} /> {drug}
              <button
                onClick={() => removeDrug(drug)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--status-red)",
                  cursor: "pointer",
                  marginLeft: "0.5rem",
                }}
              >
                ✕
              </button>
            </span>
          ))}
          {drugs.length === 0 && <span style={{ color: "var(--text-muted)" }}>No medications added yet.</span>}
        </div>

        <h4 style={{ color: "var(--primary)", marginBottom: "0.5rem", fontFamily: "JetBrains Mono" }}>
          GENETIC / METABOLIC PROFILE (Optional)
        </h4>
        <input
          type="text"
          placeholder="e.g., CYP2C9 poor metabolizer, HLA-B*1502 positive"
          value={genes}
          onChange={(e) => setGenes(e.target.value)}
          style={{
            width: "100%",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid var(--glass-border)",
            background: "var(--bg-elevated)",
            color: "#fff",
            fontSize: "1rem",
            marginBottom: "2rem",
          }}
        />

        {errorMsg && <p style={{ color: "var(--status-red)", marginBottom: "1rem" }}>{errorMsg}</p>}

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={analyzePolypharmacy}
            disabled={isProcessing || drugs.length < 2}
            style={{
              flex: 2,
              padding: "1.2rem",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(90deg, var(--primary), var(--accent))",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1.1rem",
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "1rem",
              opacity: drugs.length < 2 ? 0.5 : 1,
            }}
          >
            {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}
            {isProcessing ? "ANALYZING PATHWAYS..." : "ANALYZE INTERACTIONS"}
          </button>
          <button
            onClick={() => {
              setDrugs([]);
              setCurrentDrug("");
              setGenes("");
              setResult(null);
              setErrorMsg("");
            }}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: "1.2rem",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1.1rem",
              cursor: isProcessing ? "not-allowed" : "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="section-header">
          <h2>Risk Matrix</h2>
          <p>Interaction Analysis Results</p>
        </div>

        {!result ? (
          <div className="empty-state">
            <Pill size={64} style={{ opacity: 0.3 }} />
            <p>Add 2 or more drugs to view the AI Risk Matrix.</p>
          </div>
        ) : (
          <div
            className="ehr-card"
            style={{
              flex: 1,
              overflowY: "auto",
              borderLeft: `4px solid ${
                result.riskLevel === "Severe"
                  ? "var(--status-red)"
                  : result.riskLevel === "Moderate"
                    ? "var(--status-yellow)"
                    : "var(--status-green)"
              }`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              {result.riskLevel === "Severe" ? (
                <AlertTriangle size={40} color="var(--status-red)" />
              ) : (
                <CheckCircle size={40} color="var(--status-green)" />
              )}
              <div>
                <h3
                  style={{
                    fontSize: "1.8rem",
                    margin: 0,
                    color:
                      result.riskLevel === "Severe"
                        ? "var(--status-red)"
                        : result.riskLevel === "Moderate"
                          ? "var(--status-yellow)"
                          : "var(--status-green)",
                  }}
                >
                  {result.riskLevel.toUpperCase()} RISK
                </h3>
                <p style={{ color: "var(--text-muted)" }}>{result.summary}</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {result.interactions.length === 0 ? (
                <div
                  className="recommendation-item"
                  style={{ background: "var(--status-green-bg)", borderColor: "var(--status-green)" }}
                >
                  No known severe interactions detected.
                </div>
              ) : (
                result.interactions.map((interaction: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      background: "var(--bg-elevated)",
                      borderRadius: "8px",
                      padding: "1.5rem",
                      border: "1px solid rgba(255,42,42,0.2)",
                    }}
                  >
                    <h4 style={{ color: "var(--status-red)", marginBottom: "0.5rem", fontSize: "1.1rem" }}>
                      ⚠️ {interaction.drugsInvolved.join(" ↔ ")}
                    </h4>
                    <p style={{ marginBottom: "1rem", fontSize: "0.95rem", color: "#e2e8f0" }}>
                      <strong>Mechanism:</strong> {interaction.mechanism}
                    </p>
                    <div className="recommendation-item" style={{ margin: 0 }}>
                      <strong>AI Suggestion:</strong> {interaction.recommendation}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PharmaAI;
