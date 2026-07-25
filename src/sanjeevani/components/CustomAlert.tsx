import { useState, useEffect } from "react";
import { setAlertListener } from "../services/AlertService";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

interface AlertItem {
  id: number;
  message: string;
  type: string;
}

const CustomAlert = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    setAlertListener((message: string, type: string) => {
      const id = Date.now() + Math.random();
      setAlerts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      }, 5000);
    });
    return () => setAlertListener(null);
  }, []);

  const removeAlert = (id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {alerts.map((alert) => {
        let bgColor = "rgba(59, 130, 246, 0.95)"; // info
        let borderColor = "rgba(59, 130, 246, 0.5)";
        let Icon = Info;

        if (alert.type === "error") {
          bgColor = "rgba(239, 68, 68, 0.95)";
          borderColor = "rgba(239, 68, 68, 0.5)";
          Icon = AlertCircle;
        } else if (alert.type === "success") {
          bgColor = "rgba(16, 185, 129, 0.95)";
          borderColor = "rgba(16, 185, 129, 0.5)";
          Icon = CheckCircle;
        }

        return (
          <div
            key={alert.id}
            style={{
              background: bgColor,
              color: "#fff",
              padding: "1rem 1.5rem",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              border: `1px solid ${borderColor}`,
              backdropFilter: "blur(10px)",
              animation: "slideIn 0.3s ease-out forwards",
              minWidth: "300px",
              maxWidth: "450px",
            }}
          >
            <Icon size={24} style={{ flexShrink: 0 }} />
            <div
              style={{
                flex: 1,
                fontSize: "0.95rem",
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              {alert.message}
            </div>
            <button
              onClick={() => removeAlert(alert.id)}
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                opacity: 0.8,
              }}
            >
              <X size={18} />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CustomAlert;
