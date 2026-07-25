import { useState, useEffect } from "react";
import type * as React from "react";
import {
  Stethoscope,
  Mic,
  Pill,
  ScanEye,
  Users,
  Activity,
  Dna,
  Palette,
  Camera,
  ShieldCheck,
  Database,
  Menu,
  X,
  Settings as SettingsIcon,
} from "lucide-react";
import PatientKiosk from "./components/PatientKiosk";
import DoctorDashboard from "./components/DoctorDashboard";
import EpidemicAlert from "./components/EpidemicAlert";
import AutoScribe from "./components/AutoScribe";
import PharmaAI from "./components/PharmaAI";
import VisionAI from "./components/VisionAI";
import MultiAgent from "./components/MultiAgent";
import DigitalTwin from "./components/DigitalTwin";
import GenomicScanner from "./components/GenomicScanner";
import ArtTherapy from "./components/ArtTherapy";
import PainTracker from "./components/PainTracker";
import CustomAlert from "./components/CustomAlert";
import PatientFollowUp from "./components/PatientFollowUp";
import GuardianDashboard from "./components/GuardianDashboard";
import PatientRecords from "./components/PatientRecords";
import Settings from "./components/Settings";
import { epidemicService } from "./services/EpidemicService";
import "./styles/sanjeevani.css";

type ModuleId =
  | "triage"
  | "guardian"
  | "records"
  | "scribe"
  | "pharma"
  | "vision"
  | "multi-agent"
  | "digital-twin"
  | "genomic"
  | "art-therapy"
  | "pain-tracker"
  | "settings";

const SanjeevaniApp = () => {
  const [activeModule, setActiveModule] = useState<ModuleId>("triage");
  const [triageQueue, setTriageQueue] = useState<any[]>([]);
  const [followUpPatientId, setFollowUpPatientId] = useState<string | null>(null);
  const [outbreakData, setOutbreakData] = useState<any>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Check URL for magic links (?followup=<patientId>)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const followupId = params.get("followup");
    if (followupId) {
      setFollowUpPatientId(followupId);
      // Clean URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleTriageComplete = (newTriageData: any) => {
    setTriageQueue((prevQueue) => {
      if (prevQueue.some((item) => item.id === newTriageData.id)) return prevQueue;
      return [newTriageData, ...prevQueue];
    });
    const outbreakResult = epidemicService.addCase(newTriageData);
    if (outbreakResult) setOutbreakData(outbreakResult);
  };

  const navItems: { id: ModuleId; icon: React.ReactNode; label: string }[] = [
    { id: "triage", icon: <Stethoscope size={20} />, label: "AI ER Triage" },
    { id: "guardian", icon: <ShieldCheck size={20} />, label: "Guardian Monitor" },
    { id: "records", icon: <Database size={20} />, label: "Patient Records" },
    { id: "scribe", icon: <Mic size={20} />, label: "Auto-Scribe" },
    { id: "pharma", icon: <Pill size={20} />, label: "Pharma AI" },
    { id: "vision", icon: <ScanEye size={20} />, label: "Vision AI" },
    { id: "multi-agent", icon: <Users size={20} />, label: "Multi-Agent AI" },
    { id: "digital-twin", icon: <Activity size={20} />, label: "AI Digital Twin" },
    { id: "genomic", icon: <Dna size={20} />, label: "Genomic AI" },
    { id: "art-therapy", icon: <Palette size={20} />, label: "Art Therapy" },
    { id: "pain-tracker", icon: <Camera size={20} />, label: "Pain Tracker" },
    { id: "settings", icon: <SettingsIcon size={20} />, label: "Settings" },
  ];

  return (
    <div className="sanjeevani-app">
      <div className="super-app-layout">
        {/* Mobile Nav Toggle Header */}
        <div className="mobile-nav-header">
          <div className="mobile-logo">
            <h1>SANJEEVANI</h1>
          </div>
          <button className="mobile-menu-btn" onClick={() => setIsNavOpen(!isNavOpen)}>
            {isNavOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        <CustomAlert />

        {/* Sci-Fi Sidebar Navigation */}
        <nav className={`sci-fi-sidebar ${isNavOpen ? "open" : ""}`}>
          <div className="sidebar-logo">
            <div className="logo-pulse"></div>
            <h1>SANJEEVANI</h1>
            <span>AI COMMAND CENTER</span>
          </div>

          <ul className="nav-menu">
            {navItems.map((item) => (
              <li
                key={item.id}
                className={activeModule === item.id ? "active" : ""}
                onClick={() => {
                  setActiveModule(item.id);
                  setIsNavOpen(false);
                }}
              >
                {item.icon} <span>{item.label}</span>
              </li>
            ))}
          </ul>

          <div className="system-status">
            <div className="status-dot"></div>
            <span>SYSTEMS ONLINE</span>
          </div>

          <button
            onClick={() => {
              const id = window.prompt("Enter the Patient ID you just discharged (e.g., PT-1234):");
              if (id) setFollowUpPatientId(id);
            }}
            style={{
              background: "rgba(59, 130, 246, 0.2)",
              color: "#93c5fd",
              border: "1px solid #3b82f6",
              margin: "1rem",
              padding: "0.5rem",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            Test Guardian Alert SMS
          </button>
        </nav>

        {/* Main Content Area */}
        <main className="module-content">
          {activeModule === "triage" && (
            <div className="app-container">
              <PatientKiosk onTriageComplete={handleTriageComplete} />
              <DoctorDashboard triageQueue={triageQueue} />
              <EpidemicAlert outbreakData={outbreakData} onClose={() => setOutbreakData(null)} />
            </div>
          )}

          {activeModule === "guardian" && <GuardianDashboard />}
          {activeModule === "records" && <PatientRecords />}
          {activeModule === "scribe" && <AutoScribe />}
          {activeModule === "pharma" && <PharmaAI />}
          {activeModule === "vision" && <VisionAI />}
          {activeModule === "multi-agent" && <MultiAgent />}
          {activeModule === "digital-twin" && <DigitalTwin />}
          {activeModule === "genomic" && <GenomicScanner />}
          {activeModule === "art-therapy" && <ArtTherapy />}
          {activeModule === "pain-tracker" && <PainTracker />}
          {activeModule === "settings" && <Settings />}

          {followUpPatientId && (
            <PatientFollowUp patientId={followUpPatientId} onClose={() => setFollowUpPatientId(null)} />
          )}
        </main>
      </div>
    </div>
  );
};

export default SanjeevaniApp;
