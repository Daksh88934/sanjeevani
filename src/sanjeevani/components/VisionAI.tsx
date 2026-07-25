import { useState, useRef } from "react";
import type * as React from "react";
import { UploadCloud, Image as ImageIcon, Loader2, FileText, AlertCircle, Save, Download } from "lucide-react";
import { scanRadiologyImage } from "../services/VisionService";
import { saveReportToDB, downloadPDF } from "../services/ReportService";
import { showAlert } from "../services/AlertService";
import { MissingApiKeyError } from "../services/settings";

const VisionAI = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [patientId, setPatientId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveReport = async () => {
    if (!report || !imagePreview) return;
    if (!patientId.trim()) {
      showAlert("Patient ID is mandatory to save reports in the EHR system.", "error");
      return;
    }

    setIsSaving(true);
    try {
      // Cloudinary removed — store the base64 data URL directly in Patient Records.
      await saveReportToDB("VisionAI", patientId, { ...report, imageUrl: imagePreview });
      showAlert("Report saved to Patient Records successfully!", "success");
    } catch (err) {
      showAlert("Failed to save report: " + (err instanceof Error ? err.message : String(err)), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    downloadPDF("VisionAI", patientId || "Anonymous", report);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image file (JPEG, PNG).");
      return;
    }

    setErrorMsg("");
    setReport(null);
    setSelectedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!imagePreview) return;
    setIsProcessing(true);
    setErrorMsg("");
    try {
      const data = await scanRadiologyImage(imagePreview);
      setReport(data);
    } catch (err) {
      setErrorMsg(
        err instanceof MissingApiKeyError
          ? err.message
          : `Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setReport(null);
    setErrorMsg("");
  };

  return (
    <div className="module-container" style={{ display: "flex", gap: "2rem" }}>
      <div className="glass-panel" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="section-header">
          <h2>Vision AI</h2>
          <p>Radiology & Pathology Scanner</p>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed var(--primary)",
                borderRadius: "12px",
                background: "rgba(0, 240, 255, 0.05)",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              <UploadCloud size={64} color="var(--primary)" style={{ marginBottom: "1rem" }} />
              <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>Upload Medical Image</h3>
              <p style={{ color: "var(--text-muted)" }}>
                Drag & Drop or Click to browse (X-Ray, MRI, Dermoscopy)
              </p>
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid var(--glass-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg-dark)",
              }}
            >
              <img
                src={imagePreview}
                alt="Medical Scan Preview"
                style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain" }}
              />
              {isProcessing && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.7)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--primary)",
                  }}
                >
                  <div className="scanner-line"></div>
                  <Loader2 size={48} className="animate-spin" style={{ marginBottom: "1rem" }} />
                  <h3>AI Scanning...</h3>
                </div>
              )}
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />

          {errorMsg && <p style={{ color: "var(--status-red)", textAlign: "center" }}>{errorMsg}</p>}

          <div style={{ display: "flex", gap: "1rem" }}>
            {imagePreview && !isProcessing && !report && (
              <button
                onClick={analyzeImage}
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
                }}
              >
                RUN AI DIAGNOSTICS
              </button>
            )}
            {imagePreview && (
              <button
                onClick={resetScanner}
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
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="section-header">
          <h2>Radiology Report</h2>
          <p>Automated Clinical Findings</p>
        </div>

        {!report ? (
          <div className="empty-state">
            <FileText size={64} style={{ opacity: 0.3 }} />
            <p>Upload and scan an image to generate a diagnostic report.</p>
          </div>
        ) : (
          <div
            className="ehr-card"
            style={{
              flex: 1,
              overflowY: "auto",
              borderLeft: `4px solid ${
                report.severity === "Critical" || report.severity === "Severe"
                  ? "var(--status-red)"
                  : report.severity === "Moderate"
                    ? "var(--status-yellow)"
                    : "var(--status-green)"
              }`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div>
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Image Type
                </span>
                <h3 style={{ margin: "0.2rem 0 0 0", color: "#fff" }}>{report.imageType}</h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Severity
                </span>
                <h3
                  style={{
                    margin: "0.2rem 0 0 0",
                    color:
                      report.severity === "Critical" || report.severity === "Severe"
                        ? "var(--status-red)"
                        : report.severity === "Moderate"
                          ? "var(--status-yellow)"
                          : "var(--status-green)",
                  }}
                >
                  {report.severity.toUpperCase()}
                </h3>
              </div>
            </div>

            <div className="data-group" style={{ marginBottom: "1.5rem" }}>
              <h4
                style={{
                  color: "var(--primary)",
                  marginBottom: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <ImageIcon size={18} /> Findings
              </h4>
              <p style={{ background: "var(--bg-elevated)", padding: "1rem", borderRadius: "8px", lineHeight: 1.6 }}>
                {report.findings}
              </p>
            </div>

            <div className="data-group" style={{ marginBottom: "1.5rem" }}>
              <h4
                style={{
                  color: "var(--accent)",
                  marginBottom: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FileText size={18} /> Impression
              </h4>
              <p
                style={{
                  background: "var(--bg-elevated)",
                  padding: "1rem",
                  borderRadius: "8px",
                  lineHeight: 1.6,
                  fontSize: "1.1rem",
                  fontWeight: 500,
                }}
              >
                {report.impression}
              </p>
            </div>

            <div className="data-group" style={{ marginTop: "auto" }}>
              <div
                className="recommendation-item"
                style={{
                  background: "rgba(255, 42, 42, 0.1)",
                  borderColor: "var(--status-red)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem",
                }}
              >
                <AlertCircle color="var(--status-red)" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ color: "var(--status-red)", display: "block", marginBottom: "0.3rem" }}>
                    AI Recommendation
                  </strong>
                  <span style={{ color: "#e2e8f0" }}>{report.recommendation}</span>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionAI;
