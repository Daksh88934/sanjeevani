import { useState, useEffect, useRef } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  HeartPulse,
  Stethoscope,
  HelpCircle,
  ShieldAlert,
  FileText,
  CheckSquare,
  Edit2,
  Check,
  DollarSign,
  AlertOctagon,
  Volume2,
  BookOpen,
  X,
  Save,
  Download,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import PharmacyPrescriptionWidget from "./PharmacyPrescriptionWidget";
import AnatomicalHeatmap from "./AnatomicalHeatmap";
import { saveReportToDB, downloadPDF } from "../services/ReportService";
import { showAlert } from "../services/AlertService";
import { useMutation, localApi } from "../services/localDb";

const parseWaitTimeToSeconds = (str: string) => {
  const match = str.match(/(\d+)/);
  if (match) {
    return parseInt(match[1]) * 60;
  }
  return 0;
};

const formatTimeLeft = (seconds: number) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

interface Props {
  data: any;
}

const TriageCard = ({ data }: Props) => {
  const [waitTime, setWaitTime] = useState(data.estimatedWaitTime || "Calculating...");
  const [isEditingWaitTime, setIsEditingWaitTime] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() =>
    parseWaitTimeToSeconds(data.estimatedWaitTime || "0 mins"),
  );
  const [isTimeOver, setIsTimeOver] = useState(false);
  const [showQrExpanded, setShowQrExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDischarging, setIsDischarging] = useState(false);

  // Local DB mutations (replaces Convex useMutation).
  const dischargePatient = useMutation(localApi.patients.dischargePatient);
  const saveRecordToLocal = useMutation(localApi.records.saveRecord);

  const [showContactModal, setShowContactModal] = useState(false);
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const handleDischargeInit = () => {
    setShowContactModal(true);
  };

  const executeDischargeAndDispatch = async () => {
    if (!contactPhone && !contactEmail) {
      showAlert("Please provide at least a WhatsApp Number or Email.", "error");
      return;
    }

    setIsDischarging(true);
    try {
      const link = await dischargePatient({
        patientId: data.patientId,
        diagnosis: data.suspectedCondition,
        medications: data.suggestedMedications || [],
        dischargeNotes: data.clinicalNotes || "Standard discharge.",
        riskLevel: data.priority,
        contactPhone: contactPhone || undefined,
        contactEmail: contactEmail || undefined,
      });

      if (link) {
        setShowContactModal(false);
        showAlert("Discharged successfully. Dispatching alert...", "success");

        const origin = window.location.origin;
        const magicLink = `${origin}/?followup=${encodeURIComponent(data.patientId)}`;
        const message = `Hello, this is Sanjeevani AI Hospital. You have been placed under our Autonomous Guardian AI. Please click this link in 24 hours to report your symptoms, or immediately if you feel worse: ${magicLink}`;

        if (contactPhone) {
          const cleanPhone = contactPhone.replace(/\D/g, "");
          const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
          window.open(waUrl, "_blank");
        } else if (contactEmail) {
          const mailUrl = `mailto:${contactEmail}?subject=Sanjeevani AI Guardian Follow-Up&body=${encodeURIComponent(message)}`;
          window.open(mailUrl, "_self");
        }
      } else {
        showAlert("Failed to discharge patient.", "error");
      }
    } catch (err) {
      showAlert("Failed to discharge: " + (err instanceof Error ? err.message : String(err)), "error");
    } finally {
      setIsDischarging(false);
    }
  };

  const handleSaveReport = async () => {
    setIsSaving(true);
    try {
      const payload = { ...data, estimatedWaitTime: waitTime };

      // Save into the unified local Patient Records store (replaces Mongo + Convex).
      await saveReportToLocal({
        patientId: data.patientId,
        type: "Triage",
        data: payload,
      });

      showAlert("Triage Record saved to Patient Records successfully!", "success");
    } catch (err) {
      showAlert("Failed to save report: " + (err instanceof Error ? err.message : String(err)), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const payload = { ...data, estimatedWaitTime: waitTime };
      await downloadPDF("Triage", data.patientId, payload);
      showAlert("PDF downloaded successfully!", "success");
    } catch (err) {
      console.error("PDF generation failed:", err);
      showAlert("Failed to generate PDF.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const alarmAudio = useRef(
    new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"),
  );

  useEffect(() => {
    alarmAudio.current.volume = 1.0;
    alarmAudio.current.loop = true;
  }, []);

  useEffect(() => {
    if (isEditingWaitTime || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimeOver(true);
          alarmAudio.current.play().catch((e) => console.log("Audio play blocked by browser", e));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isEditingWaitTime, timeLeft]);

  const handleSaveWaitTime = () => {
    setIsEditingWaitTime(false);
    setIsTimeOver(false);
    setTimeLeft(parseWaitTimeToSeconds(waitTime));
    alarmAudio.current.pause();
    alarmAudio.current.currentTime = 0;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "red":
        return <AlertTriangle size={18} />;
      case "yellow":
        return <Clock size={18} />;
      case "green":
        return <CheckCircle size={18} />;
      default:
        return <Activity size={18} />;
    }
  };

  const ePrescriptionPayload = JSON.stringify({
    patientId: data.patientId,
    diagnosis: data.suspectedCondition,
    medicines: data.suggestedMedications,
    priority: data.priority,
    timestamp: data.timestamp,
  });

  return (
    <>
      {showQrExpanded && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "var(--bg-panel)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backdropFilter: "blur(5px)",
          }}
          onClick={() => setShowQrExpanded(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: "2rem",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.5rem",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQrExpanded(false)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#666",
              }}
            >
              <X size={24} />
            </button>
            <h3 style={{ color: "#111", margin: 0, textAlign: "center" }}>Scan E-Prescription</h3>
            <QRCodeCanvas value={ePrescriptionPayload} size={256} level="H" includeMargin={true} />
            <p style={{ color: "#666", fontSize: "0.9rem", margin: 0, textAlign: "center" }}>
              Patient: {data.patientId}
              <br />
              {data.suspectedCondition}
            </p>
          </div>
        </div>
      )}

      <div className="glass-panel ehr-card" ref={reportRef}>
        <div className="ehr-header">
          <div className="patient-info" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div>
              <h3>Patient: {data.patientId}</h3>
              <p>{new Date(data.timestamp).toLocaleTimeString()}</p>
            </div>
            <div
              style={{
                background: "#fff",
                padding: "4px",
                borderRadius: "4px",
                cursor: "pointer",
                border: "2px solid #8b5cf6",
              }}
              onClick={() => setShowQrExpanded(!showQrExpanded)}
              title="Scan for E-Prescription"
            >
              <QRCodeCanvas value={ePrescriptionPayload} size={48} level="H" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {data.safetyReview?.isApproved && (
              <div
                className="department-badge"
                style={{
                  padding: "0.2rem 0.6rem",
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid #10b981",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  color: "#10b981",
                }}
              >
                <CheckSquare size={14} /> Multi-Agent Safety Verified
              </div>
            )}
            <div
              className="department-badge"
              style={{
                padding: "0.2rem 0.6rem",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--glass-border)",
                borderRadius: "20px",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                color: "#a1a1aa",
              }}
            >
              <Stethoscope size={14} /> {data.department}
            </div>
            <div className={`priority-badge ${data.priority}`}>
              <div className="priority-dot"></div>
              {data.priority.toUpperCase()} PRIORITY
              {getPriorityIcon(data.priority)}
            </div>
          </div>
        </div>

        {isTimeOver && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.2)",
              padding: "0.8rem",
              margin: "0 1.5rem",
              border: "1px solid #ef4444",
              borderRadius: "8px",
              color: "#fca5a5",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: "bold",
              animation: "pulse 2s infinite",
            }}
          >
            <Volume2 className="animate-bounce" size={20} /> ALARM: Wait time is over for Patient{" "}
            {data.patientId}. Please assign a bed immediately!
          </div>
        )}

        <div className="ehr-body">
          <div
            style={{
              background: isTimeOver ? "rgba(239, 68, 68, 0.1)" : "rgba(59, 130, 246, 0.1)",
              padding: "0.8rem 1.2rem",
              borderRadius: "8px",
              border: isTimeOver ? "1px solid #ef4444" : "1px solid rgba(59, 130, 246, 0.3)",
              marginBottom: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: isTimeOver ? "#ef4444" : "#93c5fd",
              }}
            >
              <Clock size={18} className={!isTimeOver && timeLeft > 0 ? "animate-pulse" : ""} />{" "}
              <strong>Estimated Wait Time:</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {isEditingWaitTime ? (
                <>
                  <input
                    type="text"
                    value={waitTime}
                    onChange={(e) => setWaitTime(e.target.value)}
                    style={{
                      background: "var(--bg-elevated)",
                      color: "#fff",
                      border: "1px solid #60a5fa",
                      borderRadius: "4px",
                      padding: "0.3rem 0.6rem",
                      width: "120px",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handleSaveWaitTime}
                    style={{
                      background: "#10b981",
                      border: "none",
                      color: "#fff",
                      borderRadius: "4px",
                      cursor: "pointer",
                      padding: "0.3rem",
                    }}
                  >
                    <Check size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: isTimeOver ? "#ef4444" : "#fff",
                      fontFamily: "monospace",
                    }}
                  >
                    {formatTimeLeft(timeLeft)}
                  </span>
                  <button
                    onClick={() => setIsEditingWaitTime(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#9ca3af",
                      cursor: "pointer",
                      display: "flex",
                      padding: "0.2rem",
                    }}
                    title="Edit Wait Time"
                  >
                    <Edit2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <div>
              <div className="data-group">
                <h4>Symptoms Extracted</h4>
                <div className="tag-list">
                  {data.symptoms.map((sym: string, i: number) => (
                    <span key={i} className="tag" style={{ borderColor: `var(--status-${data.priority})` }}>
                      {sym}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  background: "var(--bg-elevated)",
                  padding: "1rem",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  marginTop: "1.5rem",
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
                  <h4 style={{ margin: 0, color: "#e4e4e7", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <ShieldAlert size={16} color="#8b5cf6" /> AI Risk Confidence Meter
                  </h4>
                  <span style={{ fontWeight: "bold", fontSize: "1.2rem", color: `var(--status-${data.priority})` }}>
                    {data.urgencyScore}%
                  </span>
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "4px",
                    overflow: "hidden",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${data.urgencyScore}%`,
                      background: `var(--status-${data.priority})`,
                      transition: "width 1s ease-in-out",
                    }}
                  ></div>
                </div>

                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#a1a1aa",
                    background: "rgba(255,255,255,0.05)",
                    padding: "0.8rem",
                    borderRadius: "8px",
                    borderLeft: `3px solid var(--status-${data.priority})`,
                  }}
                >
                  <strong style={{ color: "#d4d4d8" }}>AI Reasoning:</strong> {data.aiReasoning}
                </div>
              </div>
            </div>

            <AnatomicalHeatmap affectedPart={data.affectedBodyPart} />
          </div>

          <div
            style={{
              background: "linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))",
              padding: "1rem",
              borderRadius: "12px",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div style={{ background: "rgba(139, 92, 246, 0.2)", padding: "0.8rem", borderRadius: "50%", color: "#c4b5fd" }}>
              <Activity size={24} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#a1a1aa",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "0.2rem",
                }}
              >
                Suggested Bed Allocation
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#fff" }}>
                {data.suggestedBedAllocation}
              </div>
            </div>
          </div>

          <div className="data-group recommendations">
            <h4>AI Diagnosis & Clinical Pathway</h4>
            <div
              className="recommendation-item"
              style={{
                borderColor: `var(--status-${data.priority})`,
                color: "#fff",
                background: `var(--status-${data.priority}-bg)`,
              }}
            >
              <strong>Suspected:</strong> {data.suspectedCondition}
            </div>

            {data.ddxMatrix && data.ddxMatrix.length > 0 && (
              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  margin: "1rem 0",
                }}
              >
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#a1a1aa",
                    textTransform: "uppercase",
                    marginBottom: "0.8rem",
                    fontWeight: "bold",
                  }}
                >
                  Differential Diagnosis (DDx) Matrix
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {data.ddxMatrix.map((dx: any, idx: number) => (
                    <div key={idx}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.9rem",
                          marginBottom: "0.2rem",
                        }}
                      >
                        <span style={{ color: "#e4e4e7" }}>{dx.condition}</span>
                        <span
                          style={{
                            color: idx === 0 ? "#10b981" : "#9ca3af",
                            fontWeight: idx === 0 ? "bold" : "normal",
                          }}
                        >
                          {dx.probability}%
                        </span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "6px",
                          background: "rgba(255,255,255,0.1)",
                          borderRadius: "3px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${dx.probability}%`,
                            background: idx === 0 ? "#10b981" : "#6366f1",
                            transition: "width 1s ease-in-out",
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              className="clinical-notes"
              style={{
                padding: "0.8rem",
                background: "transparent",
                borderRadius: "8px",
                borderLeft: "3px solid #8b5cf6",
                margin: "0.5rem 0",
                fontSize: "0.9rem",
                color: "#d4d4d8",
              }}
            >
              <strong>Clinical Notes:</strong> {data.clinicalNotes}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    color: "#fbbf24",
                    marginBottom: "0.5rem",
                    fontWeight: 500,
                  }}
                >
                  <HelpCircle size={16} /> Possible Causes
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1.2rem",
                    fontSize: "0.85rem",
                    color: "#a1a1aa",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.3rem",
                  }}
                >
                  {data.possibleCauses?.map((cause: string, i: number) => <li key={i}>{cause}</li>)}
                </ul>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    color: "#38bdf8",
                    marginBottom: "0.5rem",
                    fontWeight: 500,
                  }}
                >
                  <ShieldAlert size={16} /> Precautions & Safety
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1.2rem",
                    fontSize: "0.85rem",
                    color: "#a1a1aa",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.3rem",
                  }}
                >
                  {data.precautionsAndSafety?.map((prec: string, i: number) => <li key={i}>{prec}</li>)}
                </ul>
              </div>
            </div>

            <div className="data-group" style={{ marginTop: "1rem" }}>
              <h4>Expected Treatment Plan</h4>
              <p>{data.expectedTreatmentPlan}</p>

              {data.clinicalCitation && (
                <div
                  style={{
                    marginTop: "0.8rem",
                    padding: "0.6rem",
                    background: "rgba(56, 189, 248, 0.05)",
                    borderLeft: "3px solid #38bdf8",
                    borderRadius: "0 8px 8px 0",
                    fontSize: "0.85rem",
                    color: "#bae6fd",
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "flex-start",
                  }}
                >
                  <BookOpen size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong
                      style={{
                        display: "block",
                        color: "#7dd3fc",
                        marginBottom: "2px",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                      }}
                    >
                      Clinical Evidence Source
                    </strong>
                    {data.clinicalCitation}
                  </div>
                </div>
              )}
            </div>

            {data.billingInfo && (
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.05)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  padding: "1rem",
                  borderRadius: "8px",
                  marginTop: "1rem",
                  display: "flex",
                  gap: "1rem",
                  alignItems: "center",
                }}
              >
                <div style={{ background: "rgba(16, 185, 129, 0.2)", padding: "0.6rem", borderRadius: "50%", color: "#10b981" }}>
                  <DollarSign size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#a1a1aa",
                      textTransform: "uppercase",
                      marginBottom: "0.2rem",
                    }}
                  >
                    Agent 3: Auto Medical Billing
                  </div>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "4px",
                        fontSize: "0.9rem",
                        color: "#fff",
                        fontWeight: "bold",
                      }}
                    >
                      ICD-10: {data.billingInfo.icd10Code}
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: "bold", color: "#10b981" }}>
                      Est. Cost: {data.billingInfo.estimatedCostINR}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.3rem" }}>
                    {data.billingInfo.billingNotes}
                  </div>
                </div>
              </div>
            )}

            {data.pastMedicalHistory && (
              <div
                className="data-group"
                style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)" }}
              >
                <h4 style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FileText size={16} /> Past Medical History (from OCR Scan)
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
                  {data.pastMedicalHistory.pastDiagnoses?.length > 0 && (
                    <div>
                      <strong style={{ color: "#9ca3af", fontSize: "0.8rem", textTransform: "uppercase" }}>
                        Previous Diagnoses
                      </strong>
                      <ul style={{ margin: "0.2rem 0 0 1rem", color: "#e5e7eb", fontSize: "0.9rem" }}>
                        {data.pastMedicalHistory.pastDiagnoses.map((d: string, i: number) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.pastMedicalHistory.currentMedications?.length > 0 && (
                    <div>
                      <strong style={{ color: "#9ca3af", fontSize: "0.8rem", textTransform: "uppercase" }}>
                        Current Medications
                      </strong>
                      <ul style={{ margin: "0.2rem 0 0 1rem", color: "#e5e7eb", fontSize: "0.9rem" }}>
                        {data.pastMedicalHistory.currentMedications.map((m: string, i: number) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.pastMedicalHistory.allergies?.length > 0 && (
                    <div>
                      <strong style={{ color: "#ef4444", fontSize: "0.8rem", textTransform: "uppercase" }}>
                        Known Allergies
                      </strong>
                      <ul style={{ margin: "0.2rem 0 0 1rem", color: "#fca5a5", fontSize: "0.9rem" }}>
                        {data.pastMedicalHistory.allergies.map((a: string, i: number) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.pastMedicalHistory.labResults && data.pastMedicalHistory.labResults !== "null" && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <strong style={{ color: "#9ca3af", fontSize: "0.8rem", textTransform: "uppercase" }}>
                        Lab Results Summary
                      </strong>
                      <p style={{ margin: "0.2rem 0 0 0", color: "#e5e7eb", fontSize: "0.9rem" }}>
                        {data.pastMedicalHistory.labResults}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="data-group">
              <h4 style={{ textTransform: "uppercase", fontSize: "0.8rem", color: "#9ca3af", letterSpacing: "1px" }}>
                Immediate Actions Required
              </h4>
              {data.recommendations.map((rec: string, i: number) => (
                <div
                  key={i}
                  className="recommendation-item"
                  style={{
                    padding: "0.4rem 0.8rem",
                    background: "rgba(255,255,255,0.03)",
                    marginTop: "0.3rem",
                  }}
                >
                  <CheckCircle size={16} style={{ color: "#10b981" }} /> {rec}
                </div>
              ))}
            </div>

            {data.allergyAlert && (
              <div
                style={{
                  background: data.allergyAlert.hasRisk ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                  border: `1px solid ${data.allergyAlert.hasRisk ? "#ef4444" : "#10b981"}`,
                  padding: "1rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  display: "flex",
                  gap: "1rem",
                  alignItems: "center",
                }}
              >
                <div style={{ color: data.allergyAlert.hasRisk ? "#ef4444" : "#10b981" }}>
                  {data.allergyAlert.hasRisk ? <AlertOctagon size={24} /> : <CheckCircle size={24} />}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#a1a1aa",
                      textTransform: "uppercase",
                      marginBottom: "0.2rem",
                    }}
                  >
                    Agent 4: Pharmacovigilance Review
                  </div>
                  <div
                    style={{
                      color: data.allergyAlert.hasRisk ? "#fca5a5" : "#a7f3d0",
                      fontWeight: data.allergyAlert.hasRisk ? "bold" : "normal",
                      fontSize: "0.95rem",
                    }}
                  >
                    {data.allergyAlert.alertMessage}
                  </div>
                </div>
              </div>
            )}

            <PharmacyPrescriptionWidget
              suggestedMeds={data.suggestedMedications}
              patientId={data.patientId}
              location={data.location}
              coords={data.coords}
            />
          </div>

          <div className="data-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4>Vitals & Objective Findings</h4>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                {data.measuredBpm && (
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid #ef4444",
                      padding: "0.4rem 1rem",
                      borderRadius: "20px",
                      color: "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontWeight: "bold",
                      boxShadow: "0 0 10px rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    <HeartPulse size={18} className="animate-pulse" /> {data.measuredBpm} BPM (Live rPPG)
                  </div>
                )}
                {data.visualPainIndex && (
                  <div
                    style={{
                      background: "rgba(245, 158, 11, 0.1)",
                      border: "1px solid #f59e0b",
                      padding: "0.4rem 1rem",
                      borderRadius: "20px",
                      color: "#f59e0b",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    <Activity size={18} /> Pain Index: {data.visualPainIndex}/10
                  </div>
                )}
                {data.mentalDistressIndex && (
                  <div
                    style={{
                      background:
                        data.mentalDistressIndex === "High"
                          ? "rgba(239, 68, 68, 0.1)"
                          : data.mentalDistressIndex === "Medium"
                            ? "rgba(245, 158, 11, 0.1)"
                            : "rgba(16, 185, 129, 0.1)",
                      border: `1px solid ${
                        data.mentalDistressIndex === "High"
                          ? "#ef4444"
                          : data.mentalDistressIndex === "Medium"
                            ? "#f59e0b"
                            : "#10b981"
                      }`,
                      padding: "0.4rem 1rem",
                      borderRadius: "20px",
                      color:
                        data.mentalDistressIndex === "High"
                          ? "#ef4444"
                          : data.mentalDistressIndex === "Medium"
                            ? "#f59e0b"
                            : "#10b981",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontWeight: "bold",
                    }}
                    title={`Agent 6 Sentiment Analysis: ${data.sentimentReasoning}`}
                  >
                    <Activity size={18} /> Distress (MDI): {data.mentalDistressIndex}
                  </div>
                )}
              </div>
            </div>
            <div
              className="vitals-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "0.5rem",
                marginTop: "0.5rem",
              }}
            >
              {data.vitalsToCheck.map((vital: any, i: number) => (
                <div
                  key={i}
                  className="vital-item"
                  style={{
                    padding: "0.6rem",
                    background: "var(--bg-elevated)",
                    borderRadius: "8px",
                    border: "1px solid var(--glass-border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.2rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      color: "#fff",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    <HeartPulse size={14} style={{ color: "#ef4444" }} />{" "}
                    {typeof vital === "object" ? vital.name : vital}
                  </div>
                  {typeof vital === "object" && vital.reason && (
                    <span style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>{vital.reason}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="data-group original-transcript">
            <h4>Clinical Interaction Log ({data.language})</h4>
            {data.chatHistory && data.chatHistory.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  background: "transparent",
                  padding: "1rem",
                  borderRadius: "8px",
                }}
              >
                {data.chatHistory.map((msg: any, idx: number) => (
                  <div key={idx} style={{ color: msg.role === "user" ? "#93c5fd" : "#c4b5fd", fontSize: "0.9rem" }}>
                    <strong>{msg.role === "user" ? "Patient" : "AI Doctor"}:</strong> {msg.content}
                  </div>
                ))}
              </div>
            ) : (
              <p>"{data.originalTranscript}"</p>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginTop: "1.5rem",
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
                minWidth: "160px",
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
              {isSaving ? <Activity size={18} className="animate-spin" /> : <Save size={18} />}
              {isSaving ? "Saving..." : "Save Triage Record"}
            </button>

            <button
              onClick={handleDischargeInit}
              disabled={isDischarging}
              style={{
                flex: 1,
                minWidth: "160px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.8rem",
                borderRadius: "8px",
                border: "1px solid #ef4444",
                background: "rgba(239, 68, 68, 0.2)",
                color: "#fca5a5",
                fontWeight: "bold",
                cursor: isDischarging ? "not-allowed" : "pointer",
              }}
            >
              {isDischarging ? <Activity size={18} className="animate-spin" /> : <ShieldAlert size={18} />}
              {isDischarging ? "Discharging..." : "Discharge to Guardian AI"}
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              style={{
                flex: 1,
                minWidth: "160px",
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
                cursor: isDownloading ? "not-allowed" : "pointer",
              }}
            >
              {isDownloading ? <Activity size={18} className="animate-spin" /> : <Download size={18} />}
              {isDownloading ? "Downloading..." : "Download PDF"}
            </button>
          </div>
        </div>
      </div>

      {showContactModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "var(--bg-panel)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backdropFilter: "blur(5px)",
          }}
        >
          <div
            style={{
              background: "#18181b",
              padding: "2rem",
              borderRadius: "16px",
              width: "90%",
              maxWidth: "400px",
              border: "1px solid #3f3f46",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowContactModal(false)}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "none",
                border: "none",
                color: "#a1a1aa",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ color: "#fff", marginTop: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShieldAlert color="#ef4444" /> Omni-Channel Guardian
            </h3>
            <p style={{ color: "#a1a1aa", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Enter the patient's WhatsApp number or Email. The AI will send them a magic link to track their
              recovery.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ color: "#e4e4e7", fontSize: "0.8rem", marginBottom: "0.3rem", display: "block" }}>
                  WhatsApp Number (with country code)
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+919876543210"
                  style={{
                    width: "100%",
                    padding: "0.8rem",
                    background: "var(--bg-elevated)",
                    border: "1px solid #52525b",
                    borderRadius: "8px",
                    color: "#fff",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ textAlign: "center", color: "#71717a", fontSize: "0.8rem" }}>OR</div>

              <div>
                <label style={{ color: "#e4e4e7", fontSize: "0.8rem", marginBottom: "0.3rem", display: "block" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="patient@example.com"
                  style={{
                    width: "100%",
                    padding: "0.8rem",
                    background: "var(--bg-elevated)",
                    border: "1px solid #52525b",
                    borderRadius: "8px",
                    color: "#fff",
                    outline: "none",
                  }}
                />
              </div>

              <button
                onClick={executeDischargeAndDispatch}
                disabled={isDischarging}
                style={{
                  width: "100%",
                  padding: "1rem",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: isDischarging ? "not-allowed" : "pointer",
                  marginTop: "0.5rem",
                }}
              >
                {isDischarging ? "Dispatching..." : "Confirm & Send Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TriageCard;
