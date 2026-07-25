import { useState, useEffect } from "react";
import { KeyRound, ShieldCheck, Eye, EyeOff, ExternalLink, CheckCircle2 } from "lucide-react";
import {
  getOpenRouterKey,
  setOpenRouterKey,
  OPENROUTER_KEY_STORAGE,
} from "../services/settings";

const Settings = () => {
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setKey(getOpenRouterKey());
    // Mark as "saved" if a key already exists on mount.
    if (getOpenRouterKey()) setSaved(true);
  }, []);

  const handleSave = () => {
    setOpenRouterKey(key);
    setSaved(!!key.trim());
    if (key.trim()) {
      // brief confirmation pulse handled by `saved` state
      setTimeout(() => setSaved(true), 50);
    }
  };

  const handleClear = () => {
    setOpenRouterKey("");
    setKey("");
    setSaved(false);
  };

  const hasKey = !!key.trim();

  return (
    <div className="module-container">
      <div className="settings-panel">
        <div className="section-header">
          <h2 style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <KeyRound size={24} /> Settings
          </h2>
          <p>Configure your OpenRouter API key for AI features</p>
        </div>

        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div
            style={{
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              borderRadius: "12px",
              padding: "1.2rem 1.4rem",
              display: "flex",
              gap: "1rem",
              alignItems: "flex-start",
            }}
          >
            <ShieldCheck size={22} style={{ color: "#60a5fa", flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: "0.92rem", color: "#cbd5e1", lineHeight: 1.6 }}>
              <strong style={{ color: "#e2e8f0" }}>Why do I need a key?</strong>
              <br />
              Sanjeevani's AI (triage, vision, multi-agent debate, etc.) calls the
              OpenRouter API directly from your browser. Your key is stored only in this
              browser's <code style={{ color: "#93c5fd" }}>localStorage</code> (key:{" "}
              <code style={{ color: "#93c5fd" }}>{OPENROUTER_KEY_STORAGE}</code>) and is never
              sent anywhere except OpenRouter. No key is ever committed to the source code.
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                color: "var(--text-muted)",
                fontSize: "0.9rem",
                marginBottom: "0.6rem",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              OpenRouter API Key
            </label>
            <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
              <input
                type={showKey ? "text" : "password"}
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setSaved(false);
                }}
                placeholder="sk-or-v1-..."
                className="settings-key-input"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                title={showKey ? "Hide key" : "Show key"}
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--glass-border)",
                  color: "#a1a1aa",
                  borderRadius: "10px",
                  padding: "0.7rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.6rem" }}>
              Get a free key at{" "}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#60a5fa", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}
              >
                openrouter.ai/keys <ExternalLink size={12} />
              </a>
              . Free models are used by default; a key with credits works too.
            </p>
          </div>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <button
              onClick={handleSave}
              disabled={!key.trim()}
              style={{
                flex: 1,
                padding: "0.9rem",
                borderRadius: "10px",
                border: "none",
                background: hasKey
                  ? "linear-gradient(90deg, var(--primary), var(--accent))"
                  : "var(--bg-elevated)",
                color: hasKey ? "#000" : "var(--text-muted)",
                fontWeight: "bold",
                fontSize: "1rem",
                cursor: hasKey ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              <KeyRound size={18} /> Save Key
            </button>
            {key.trim() && (
              <button
                onClick={handleClear}
                style={{
                  padding: "0.9rem 1.4rem",
                  borderRadius: "10px",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#fca5a5",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            )}
          </div>

          {saved && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                color: "#10b981",
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                padding: "0.8rem 1.2rem",
                borderRadius: "10px",
                fontSize: "0.9rem",
              }}
            >
              <CheckCircle2 size={18} /> API key saved. AI modules are ready to use.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
