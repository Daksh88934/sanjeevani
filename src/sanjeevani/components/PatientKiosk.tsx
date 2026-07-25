import { useState, useRef, useEffect } from "react";
import type * as React from "react";
import {
  Mic,
  MicOff,
  Loader2,
  AlertCircle,
  Send,
  FileText,
  Camera,
  CheckCircle,
  MapPin,
  Volume2,
} from "lucide-react";
import { startListening } from "../services/SpeechService";
import {
  processTriage,
  generateFollowUpQuestion,
  runSafetyReviewAgent,
  runBillingAgent,
  runPharmacovigilanceAgent,
} from "../services/AIEngine";
import { scanMedicalRecord, scanRadiologyImage } from "../services/VisionService";
import { MissingApiKeyError } from "../services/settings";
import TouchlessVitals from "./TouchlessVitals";
import CustomLanguageSelector from "./CustomLanguageSelector";

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

interface Props {
  onTriageComplete: (data: any) => void;
}

const PatientKiosk = ({ onTriageComplete }: Props) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState("hi-IN");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [step, setStep] = useState<"symptoms" | "followup" | "vitals">("symptoms");
  const [currentTriageData, setCurrentTriageData] = useState<any>(null);

  const [showTextFallback] = useState(true);
  const [manualText, setManualText] = useState("");
  const [patientLocation, setPatientLocation] = useState("");
  const [patientCoords, setPatientCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [patientId, setPatientId] = useState("");

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentFollowUpQuestion, setCurrentFollowUpQuestion] = useState("");

  const [pastMedicalHistory, setPastMedicalHistory] = useState<any>(null);
  const [isScanningReport, setIsScanningReport] = useState(false);

  const [visualFindings, setVisualFindings] = useState<string | null>(null);
  const [isScanningVision, setIsScanningVision] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Surface a friendly message for missing-key errors.
  const friendlyError = (err: unknown): string => {
    if (err instanceof MissingApiKeyError) return err.message;
    return err instanceof Error ? err.message : String(err);
  };

  useEffect(() => {
    const loadVoices = () => {
      if (!("speechSynthesis" in window)) return;
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const langMap = new Map<string, string>();
        voices.forEach((v) => {
          if (v.lang && !langMap.has(v.lang)) {
            try {
              const label =
                new Intl.DisplayNames(["en"], { type: "language" }).of(v.lang) || v.lang;
              langMap.set(v.lang, `${label} (${v.lang})`);
            } catch {
              langMap.set(v.lang, v.lang);
            }
          }
        });
      }
    };

    loadVoices();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const compressImage = (file: File, maxWidth = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(
          new Error(
            "Please upload a valid image file (JPG/PNG). PDFs are not supported for this scan.",
          ),
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to process image."));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.6));
        };
        img.onerror = () => reject(new Error("Failed to load image. It might be corrupted."));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read the file."));
      reader.readAsDataURL(file);
    });
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 0.85;
      utterance.rate = 0.9;
      utterance.lang = language;

      const voices = window.speechSynthesis.getVoices();

      let bestVoice: SpeechSynthesisVoice | null = null;
      let highestScore = -1;

      for (const v of voices) {
        const isExactLang = v.lang === language;
        const isPrefixLang = v.lang.startsWith(language.split("-")[0]);

        if (isExactLang || isPrefixLang) {
          let score = 0;
          if (isExactLang) score += 50;

          const name = v.name.toLowerCase();
          if (
            name.includes("male") ||
            name.includes("hemant") ||
            name.includes("madhur") ||
            name.includes("david") ||
            name.includes("mark") ||
            name.includes("guy") ||
            name.includes("pablo")
          ) {
            score += 20;
          }
          if (
            name.includes("google") ||
            name.includes("premium") ||
            name.includes("natural") ||
            name.includes("online")
          ) {
            score += 15;
          }
          if (name.includes("microsoft")) {
            score += 10;
          }

          if (score > highestScore) {
            highestScore = score;
            bestVoice = v;
          }
        }
      }

      if (bestVoice) utterance.voice = bestVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  const fetchLiveLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setPatientCoords({ lat: latitude, lon: longitude });
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          const data = await response.json();
          const area =
            data.address.suburb ||
            data.address.neighbourhood ||
            data.address.city_district ||
            data.address.city ||
            data.address.town ||
            "Unknown Area";
          setPatientLocation(area);
        } catch (err) {
          console.error("Geocoding failed", err);
          setErrorMsg("Failed to fetch address. Please enter manually.");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setErrorMsg("Location access denied. Please enter manually.");
      },
    );
  };

  const toggleListening = () => {
    if (!patientId.trim()) {
      setErrorMsg("Please assign a Patient ID before starting.");
      return;
    }
    setErrorMsg(null);
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      setTranscript("");
      setInterimTranscript("");
      recognitionRef.current = startListening(
        language,
        (interim, final) => {
          if (interim) setInterimTranscript(interim);
          if (final) {
            setTranscript((prev) => prev + " " + final);
            setInterimTranscript("");
          }
        },
        () => {
          setIsListening(false);
        },
        (errorType) => {
          setIsListening(false);
          if (errorType.includes("no-speech")) {
            setErrorMsg("No speech detected. Please check your mic or try speaking closer.");
          } else if (errorType.includes("not-allowed")) {
            setErrorMsg("Microphone access denied. Please allow mic access or use text input.");
          } else {
            setErrorMsg(errorType);
          }
        },
      );
      setIsListening(true);
    }
  };

  const handleFollowUpCycle = async (newHistory: ChatMessage[]) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      let languageName = language;
      try {
        languageName = new Intl.DisplayNames(["en"], { type: "language" }).of(language) || language;
      } catch {
        /* keep default */
      }

      const aiFollowUp = await generateFollowUpQuestion(
        newHistory,
        languageName,
        pastMedicalHistory,
        visualFindings,
      );

      const aiQuestion = aiFollowUp.question;
      const canTriage = newHistory.length >= 3;

      if ((aiFollowUp.readyForTriage && canTriage) || newHistory.length >= 6) {
        const triageData = await processTriage(
          newHistory,
          languageName,
          pastMedicalHistory,
          visualFindings,
          patientId,
        );
        setCurrentTriageData(triageData);
        setStep("vitals");
      } else if (aiQuestion && aiQuestion.trim() !== "") {
        setCurrentFollowUpQuestion(aiQuestion);
        setChatHistory([...newHistory, { role: "ai", content: aiQuestion }]);
        speakText(aiQuestion);
      } else {
        throw new Error("AI failed to generate a follow-up question.");
      }
    } catch (err) {
      console.error("AI Cycle Error:", err);
      setChatHistory(newHistory.slice(0, -1));
      setManualText(newHistory[newHistory.length - 1].content);
      setErrorMsg(friendlyError(err));

      if (newHistory.length === 1) {
        setStep("symptoms");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!patientId.trim()) {
      setErrorMsg("Please assign a Patient ID before starting.");
      return;
    }
    const finalTranscript = manualText || transcript;
    if (!finalTranscript) return;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    if (step === "symptoms") {
      const newHistory: ChatMessage[] = [{ role: "user", content: finalTranscript }];
      setChatHistory(newHistory);
      setTranscript("");
      setManualText("");
      setStep("followup");
      await handleFollowUpCycle(newHistory);
    } else if (step === "followup") {
      const newHistory: ChatMessage[] = [
        ...chatHistory,
        { role: "user", content: finalTranscript },
      ];
      setChatHistory(newHistory);
      setTranscript("");
      setManualText("");
      await handleFollowUpCycle(newHistory);
    }
  };

  const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningReport(true);
    setErrorMsg(null);

    try {
      const compressedBase64 = await compressImage(file, 1000);
      const historyData = await scanMedicalRecord(compressedBase64);
      setPastMedicalHistory(historyData);
    } catch (err) {
      setErrorMsg(friendlyError(err));
    } finally {
      setIsScanningReport(false);
    }
  };

  const handleVitalsComplete = async (bpm: number, painIndex: number) => {
    setIsProcessing(true);

    let waitTime = "45 mins";
    if (currentTriageData.priority === "red") waitTime = "Immediate (0 mins)";
    else if (currentTriageData.priority === "yellow") waitTime = "15 mins";
    else waitTime = `${Math.floor(Math.random() * 30) + 30} mins`;

    let safetyReview, billingInfo, allergyAlert;
    try {
      [safetyReview, billingInfo, allergyAlert] = await Promise.all([
        runSafetyReviewAgent(currentTriageData).catch((e) => {
          console.error("Safety AI Error:", e);
          return { safetyNotes: "Safety AI temporarily unavailable.", isApproved: true };
        }),
        runBillingAgent(currentTriageData).catch((e) => {
          console.error("Billing AI Error:", e);
          return {
            icd10Code: "PENDING",
            estimatedCostINR: "PENDING",
            billingNotes: "Billing AI temporarily unavailable.",
          };
        }),
        runPharmacovigilanceAgent(currentTriageData, pastMedicalHistory).catch((e) => {
          console.error("Pharma AI Error:", e);
          return { hasRisk: false, alertMessage: "Pharma AI temporarily unavailable." };
        }),
      ]);
    } catch (error) {
      console.error("Critical Multi-Agent Failure:", error);
      safetyReview = { safetyNotes: "Safety AI Error.", isApproved: true };
      billingInfo = { icd10Code: "ERROR", estimatedCostINR: "ERROR", billingNotes: "Billing AI Error." };
      allergyAlert = { hasRisk: false, alertMessage: "Pharma AI Error." };
    }

    const finalData = {
      ...currentTriageData,
      measuredBpm: bpm,
      visualPainIndex: painIndex,
      estimatedWaitTime: waitTime,
      safetyReview,
      billingInfo,
      allergyAlert,
      location: patientLocation,
      coords: patientCoords,
    };

    setIsProcessing(false);
    onTriageComplete(finalData);

    speakText(`Evaluation complete. Your estimated wait time is ${waitTime}.`);

    setStep("symptoms");
    setTranscript("");
    setManualText("");
    setChatHistory([]);
    setCurrentTriageData(null);
    setCurrentFollowUpQuestion("");
  };

  const handleVisionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningVision(true);
    setErrorMsg(null);

    try {
      const compressedBase64 = await compressImage(file, 600);
      const analysis = await scanRadiologyImage(compressedBase64);
      const findingString = `Visual findings: ${analysis.findings}. Impression: ${analysis.impression}. Severity: ${analysis.severity}.`;
      setVisualFindings(findingString);
      speakText("Visual symptom successfully analyzed by AI. Please continue speaking your symptoms.");
    } catch (err) {
      console.error("Vision Upload Error:", err);
      setErrorMsg("Failed to analyze image: " + friendlyError(err));
    } finally {
      setIsScanningVision(false);
    }
  };

  return (
    <div className="kiosk-section">
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <CustomLanguageSelector language={language} setLanguage={setLanguage} disabled={step === "vitals"} />

        <div style={{ flex: 1, minWidth: "200px", display: "flex" }}>
          <input
            type="text"
            placeholder="Assign Patient ID (Mandatory)*"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            disabled={step === "vitals"}
            style={{
              width: "100%",
              padding: "0.8rem",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              border: "1px solid var(--glass-border)",
              outline: "none",
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: "200px", display: "flex", position: "relative" }}>
          <input
            type="text"
            placeholder="Enter Location/Area"
            value={patientLocation}
            onChange={(e) => setPatientLocation(e.target.value)}
            disabled={step === "vitals"}
            style={{
              width: "100%",
              padding: "0.8rem",
              paddingRight: "2.5rem",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              border: "1px solid var(--glass-border)",
              outline: "none",
            }}
          />
          <button
            onClick={fetchLiveLocation}
            disabled={step === "vitals" || isLocating}
            style={{
              position: "absolute",
              right: "0.5rem",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: isLocating ? "#a1a1aa" : "#60a5fa",
              cursor: "pointer",
              padding: "0.2rem",
            }}
            title="Get Live Location"
          >
            {isLocating ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
          </button>
        </div>
      </div>

      {step === "symptoms" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                padding: "1rem",
                borderRadius: "12px",
                border: "1px dashed rgba(255,255,255,0.2)",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  color: "#93c5fd",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.9rem",
                }}
              >
                <FileText size={16} /> Hold-to-Scan Old Reports
              </h4>
              <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "0 0 0.5rem 0" }}>
                Upload a messy prescription or past report. AI will read it automatically.
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  id="report-upload"
                  style={{ display: "none" }}
                  onChange={handleReportUpload}
                />
                <label
                  htmlFor="report-upload"
                  style={{
                    background: "#3b82f6",
                    color: "#fff",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                  }}
                >
                  {isScanningReport ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                  {isScanningReport ? "Scanning..." : "Upload"}
                </label>

                {pastMedicalHistory && (
                  <div
                    style={{
                      color: "#10b981",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.8rem",
                      background: "rgba(16, 185, 129, 0.1)",
                      padding: "0.3rem 0.6rem",
                      borderRadius: "4px",
                    }}
                  >
                    <CheckCircle size={14} /> OCR Extracted!
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                background: "rgba(139, 92, 246, 0.05)",
                padding: "1rem",
                borderRadius: "12px",
                border: "1px dashed rgba(139, 92, 246, 0.3)",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  color: "#c4b5fd",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.9rem",
                }}
              >
                <Camera size={16} /> Computer Vision Scan
              </h4>
              <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "0 0 0.5rem 0" }}>
                Agent 7: Upload photo of rash, wound, or symptom for visual AI diagnosis.
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  id="vision-upload"
                  style={{ display: "none" }}
                  onChange={handleVisionUpload}
                />
                <label
                  htmlFor="vision-upload"
                  style={{
                    background: "#8b5cf6",
                    color: "#fff",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                  }}
                >
                  {isScanningVision ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
                  {isScanningVision ? "Vision AI Analyzing..." : "Scan Symptom"}
                </label>

                {visualFindings && (
                  <div
                    style={{
                      color: "#c4b5fd",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.8rem",
                      background: "rgba(139, 92, 246, 0.2)",
                      padding: "0.3rem 0.6rem",
                      borderRadius: "4px",
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={visualFindings}
                  >
                    <CheckCircle size={14} style={{ flexShrink: 0 }} /> Visual Added
                  </div>
                )}
              </div>
            </div>
          </div>

          {errorMsg && errorMsg.includes("Vision") && (
            <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "0.5rem" }}>{errorMsg}</p>
          )}
        </>
      )}

      {step === "symptoms" ? (
        <>
          <div className="section-header">
            <h2>Sanjeevani Kiosk</h2>
            <p>Multi-Agent AI Healthcare System</p>
          </div>

          <div className="kiosk-content">
            <button
              className={`mic-button ${isListening ? "listening" : ""}`}
              onClick={toggleListening}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 size={48} className="animate-spin" />
              ) : isListening ? (
                <Mic size={48} />
              ) : (
                <MicOff size={48} />
              )}
            </button>

            <div className="status-text">
              {isProcessing
                ? "Analyzing Symptoms..."
                : isListening
                  ? "Listening... Tap mic again to stop"
                  : "Tap the microphone and describe your problem"}
            </div>

            {errorMsg && (
              <div
                className="error-message"
                style={{
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "rgba(239, 68, 68, 0.1)",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  width: "100%",
                  maxWidth: "500px",
                  fontSize: "0.9rem",
                  lineHeight: 1.4,
                }}
              >
                <AlertCircle size={24} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="glass-panel transcript-box">
              {transcript} <span style={{ opacity: 0.7 }}>{interimTranscript}</span>
            </div>

            {!isListening && transcript.trim().length > 0 && !isProcessing && (
              <button
                onClick={handleSubmit}
                style={{
                  marginTop: "1rem",
                  padding: "0.8rem 2rem",
                  background: "linear-gradient(90deg, #8b5cf6, #3b82f6)",
                  color: "white",
                  border: "none",
                  borderRadius: "30px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 15px rgba(139, 92, 246, 0.4)",
                  transition: "all 0.3s ease",
                }}
              >
                <Send size={18} /> Analyze Symptoms
              </button>
            )}

            {showTextFallback && !isProcessing && (
              <div
                className="text-fallback-area"
                style={{
                  width: "100%",
                  maxWidth: "500px",
                  display: "flex",
                  gap: "0.5rem",
                  marginTop: "1rem",
                }}
              >
                <input
                  type="text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Or type your symptoms here..."
                  style={{
                    flex: 1,
                    padding: "0.8rem",
                    borderRadius: "8px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--glass-border)",
                    color: "white",
                    outline: "none",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                <button
                  onClick={handleSubmit}
                  style={{
                    padding: "0 1rem",
                    background: "var(--primary)",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Send size={18} />
                </button>
              </div>
            )}
          </div>
        </>
      ) : step === "followup" ? (
        <>
          <div className="section-header">
            <h2>AI Doctor Evaluation</h2>
            <p>Please answer the follow-up question.</p>
          </div>

          <div className="kiosk-content" style={{ alignItems: "stretch" }}>
            <div
              className="chat-history"
              style={{
                background: "transparent",
                padding: "1rem",
                borderRadius: "12px",
                minHeight: "150px",
                maxHeight: "300px",
                overflowY: "auto",
                marginBottom: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    background:
                      msg.role === "user" ? "rgba(59, 130, 246, 0.2)" : "rgba(139, 92, 246, 0.2)",
                    border:
                      msg.role === "user"
                        ? "1px solid rgba(59, 130, 246, 0.3)"
                        : "1px solid rgba(139, 92, 246, 0.3)",
                    padding: "0.8rem 1rem",
                    borderRadius: "12px",
                    maxWidth: "80%",
                    color: "#fff",
                  }}
                >
                  <strong
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.8rem",
                      color: msg.role === "user" ? "#93c5fd" : "#c4b5fd",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span>{msg.role === "user" ? "You" : "AI Doctor"}</span>
                    {msg.role === "ai" && (
                      <button
                        onClick={() => speakText(msg.content)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#c4b5fd",
                          cursor: "pointer",
                          padding: "0.2rem",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title="Repeat Audio"
                      >
                        <Volume2 size={14} />
                      </button>
                    )}
                  </strong>
                  {msg.content}
                </div>
              ))}
              {isProcessing && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    color: "#a1a1aa",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem",
                  }}
                >
                  <Loader2 size={16} className="animate-spin" /> <em>Analyzing responses...</em>
                </div>
              )}
            </div>

            {errorMsg && (
              <div
                style={{
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "rgba(239, 68, 68, 0.1)",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <button
                className={`mic-button ${isListening ? "listening" : ""}`}
                onClick={toggleListening}
                disabled={isProcessing}
                style={{ width: "60px", height: "60px", marginBottom: "1rem" }}
              >
                {isProcessing ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : isListening ? (
                  <Mic size={24} />
                ) : (
                  <MicOff size={24} />
                )}
              </button>

              <div className="glass-panel transcript-box" style={{ width: "100%" }}>
                {transcript} <span style={{ opacity: 0.7 }}>{interimTranscript}</span>
              </div>

              <div
                className="text-fallback-area"
                style={{ width: "100%", display: "flex", gap: "0.5rem", marginTop: "1rem" }}
              >
                <input
                  type="text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Type your answer here..."
                  disabled={isProcessing}
                  style={{
                    flex: 1,
                    padding: "0.8rem",
                    borderRadius: "8px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--glass-border)",
                    color: "white",
                    outline: "none",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  style={{
                    padding: "0 1.5rem",
                    background: "var(--primary)",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Send size={18} /> Reply
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <TouchlessVitals onComplete={handleVitalsComplete} />
      )}
      {currentFollowUpQuestion && null}
    </div>
  );
};

export default PatientKiosk;
