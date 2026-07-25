import { useEffect, useState } from "react";
import { AlertTriangle, MapPin, Activity } from "lucide-react";

interface OutbreakData {
  isOutbreak: boolean;
  location: string;
  category: string;
  caseCount: number;
}

interface Props {
  outbreakData: OutbreakData | null;
  onClose?: () => void;
}

const EpidemicAlert = ({ outbreakData, onClose }: Props) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (outbreakData) {
      setVisible(true);
    }
  }, [outbreakData]);

  if (!outbreakData || !visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(10px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <audio
        autoPlay
        loop
        src="https://actions.google.com/sounds/v1/alarms/spaceship_alarm.ogg"
        style={{ display: "none" }}
        ref={(el) => {
          if (el) {
            el.volume = 1.0;
          }
        }}
      />
      <div
        style={{
          background: "linear-gradient(145deg, #450a0a, #7f1d1d)",
          border: "2px solid #ef4444",
          boxShadow: "0 0 50px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.5)",
          borderRadius: "20px",
          padding: "3rem",
          maxWidth: "600px",
          width: "90%",
          textAlign: "center",
          position: "relative",
          animation: "pulseScale 2s infinite",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-40px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#ef4444",
            borderRadius: "50%",
            padding: "1rem",
            boxShadow: "0 0 30px #ef4444",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <AlertTriangle size={60} color="#fff" className="animate-pulse" />
        </div>

        <h1
          style={{
            color: "#fff",
            fontSize: "2.5rem",
            marginTop: "1rem",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          Epidemic Alert
        </h1>

        <p style={{ color: "#fca5a5", fontSize: "1.2rem", marginTop: "1rem", lineHeight: 1.6 }}>
          System has detected a high concentration of incoming patients with similar acute
          symptoms.
        </p>

        <div
          style={{
            background: "var(--bg-elevated)",
            borderRadius: "12px",
            padding: "1.5rem",
            marginTop: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#9ca3af", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Activity size={18} /> Outbreak Category
            </span>
            <span
              style={{
                color: "#fff",
                fontWeight: "bold",
                fontSize: "1.2rem",
                background: "#dc2626",
                padding: "0.2rem 0.8rem",
                borderRadius: "6px",
              }}
            >
              {outbreakData.category}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#9ca3af", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MapPin size={18} /> Affected Location
            </span>
            <span style={{ color: "#fff", fontWeight: "bold", fontSize: "1.2rem" }}>
              {outbreakData.location}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#9ca3af", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertTriangle size={18} /> Critical Threshold
            </span>
            <span style={{ color: "#ef4444", fontWeight: "bold", fontSize: "1.2rem" }}>
              {outbreakData.caseCount} Cases in last 2 hours
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            setVisible(false);
            if (onClose) onClose();
          }}
          style={{
            marginTop: "2.5rem",
            padding: "1rem 3rem",
            background: "transparent",
            border: "2px solid #fca5a5",
            color: "#fca5a5",
            borderRadius: "30px",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => {
            (e.target as HTMLElement).style.background = "#fca5a5";
            (e.target as HTMLElement).style.color = "#450a0a";
          }}
          onMouseOut={(e) => {
            (e.target as HTMLElement).style.background = "transparent";
            (e.target as HTMLElement).style.color = "#fca5a5";
          }}
        >
          Acknowledge Warning
        </button>

        <style>{`
          @keyframes pulseScale {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default EpidemicAlert;
