import { useState, useEffect, useRef } from "react";
import {
  Pill,
  Store,
  Check,
  Plus,
  Trash2,
  Send,
  Loader2,
  IndianRupee,
  Clock,
} from "lucide-react";
import {
  fetchLivePharmacies,
  checkMedicineStock,
  sendPrescriptionToPharmacy,
} from "../services/PharmacyService";

interface Props {
  suggestedMeds?: string[];
  patientId: string;
  location?: string;
  coords?: { lat: number; lon: number } | null;
}

interface MedItem {
  name: string;
  loading: boolean;
  data?: any;
}

const PharmacyPrescriptionWidget = ({ suggestedMeds, patientId, location, coords }: Props) => {
  const [pharmacies, setPharmacies] = useState<string[]>([
    `Apollo Pharmacy - ${location || "Sector 62"}`,
  ]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(pharmacies[0]);
  const [medicines, setMedicines] = useState<MedItem[]>([]);
  const [newMedicineName, setNewMedicineName] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sentStatus, setSentStatus] = useState<string | null>(null);
  const [isFetchingPharmacies, setIsFetchingPharmacies] = useState(false);

  useEffect(() => {
    const fetchPharmacies = async () => {
      setIsFetchingPharmacies(true);
      const lat = coords?.lat;
      const lon = coords?.lon;
      const livePharmacies = await fetchLivePharmacies(lat, lon, location);
      setPharmacies(livePharmacies);
      setSelectedPharmacy(livePharmacies[0]);
      setIsFetchingPharmacies(false);
    };
    fetchPharmacies();
  }, [coords, location]);

  const hasLoadedInitialMeds = useRef(false);

  useEffect(() => {
    const fetchStocks = async () => {
      const medsToFetch =
        !hasLoadedInitialMeds.current && suggestedMeds
          ? suggestedMeds
          : medicines.map((m) => m.name);
      hasLoadedInitialMeds.current = true;

      if (medsToFetch.length === 0) return;

      const loadingMeds: MedItem[] = medsToFetch.map((name) => ({ name, loading: true }));
      setMedicines(loadingMeds);

      const resolvedMeds = await Promise.all(
        loadingMeds.map(async (m) => {
          const stockData = await checkMedicineStock(selectedPharmacy, m.name);
          return { name: m.name, loading: false, data: stockData };
        }),
      );
      setMedicines(resolvedMeds);
      setSentStatus(null);
    };

    fetchStocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPharmacy, suggestedMeds]);

  const handleAddMedicine = async () => {
    if (!newMedicineName.trim()) return;
    const medName = newMedicineName.trim();
    setNewMedicineName("");

    setMedicines((prev) => [...prev, { name: medName, loading: true }]);

    const stockData = await checkMedicineStock(selectedPharmacy, medName);

    setMedicines((prev) =>
      prev.map((m) => (m.name === medName ? { name: medName, loading: false, data: stockData } : m)),
    );
    setSentStatus(null);
  };

  const handleRemoveMedicine = (medName: string) => {
    setMedicines((prev) => prev.filter((m) => m.name !== medName));
    setSentStatus(null);
  };

  const handleSendToPharmacy = async () => {
    if (medicines.length === 0) return;
    setIsSending(true);

    const medsToSend = medicines
      .filter((m) => !m.loading && m.data?.inStock)
      .map((m) => m.name);

    try {
      const result = await sendPrescriptionToPharmacy(selectedPharmacy, patientId, medsToSend);
      if (result.success) {
        setSentStatus(result.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      style={{
        background: "rgba(59, 130, 246, 0.05)",
        border: "1px solid rgba(59, 130, 246, 0.2)",
        padding: "1rem",
        borderRadius: "12px",
        marginTop: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <h4 style={{ margin: 0, color: "#60a5fa", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Store size={18} /> Network Pharmacy e-Prescription
        </h4>

        <select
          value={selectedPharmacy}
          onChange={(e) => setSelectedPharmacy(e.target.value)}
          style={{
            padding: "0.4rem 0.8rem",
            borderRadius: "6px",
            background: "var(--bg-elevated)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            outline: "none",
            fontSize: "0.85rem",
          }}
          disabled={!!isSending || !!sentStatus || isFetchingPharmacies}
        >
          {isFetchingPharmacies ? (
            <option>Fetching real pharmacies...</option>
          ) : (
            pharmacies.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))
          )}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {medicines.map((med, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(255,255,255,0.03)",
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              border: "1px solid var(--glass-border)",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <Pill size={16} style={{ color: "#a1a1aa" }} />
              <strong style={{ color: "#e5e7eb", fontSize: "0.9rem" }}>{med.name}</strong>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
              {med.loading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    color: "#9ca3af",
                    fontSize: "0.8rem",
                  }}
                >
                  <Loader2 size={14} className="animate-spin" /> Fetching Stock...
                </div>
              ) : med.data ? (
                <>
                  {med.data.inStock ? (
                    <span
                      style={{
                        color: "#10b981",
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        fontWeight: "bold",
                      }}
                    >
                      <Check size={14} /> In Stock ({med.data.quantity})
                    </span>
                  ) : (
                    <span
                      style={{
                        color: "#ef4444",
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        fontWeight: "bold",
                      }}
                    >
                      Out of Stock
                    </span>
                  )}

                  <span
                    style={{
                      color: "#fbbf24",
                      fontSize: "0.8rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.2rem",
                    }}
                  >
                    <IndianRupee size={12} /> {med.data.price}
                  </span>

                  <span
                    style={{
                      color: "#9ca3af",
                      fontSize: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.2rem",
                    }}
                  >
                    <Clock size={12} /> Exp: {med.data.expiryDate}
                  </span>
                </>
              ) : null}

              {!sentStatus && (
                <button
                  onClick={() => handleRemoveMedicine(med.name)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    opacity: 0.7,
                    padding: "0.2rem",
                  }}
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!sentStatus && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <input
            type="text"
            placeholder="Manual Med: e.g., Dolo 650mg"
            value={newMedicineName}
            onChange={(e) => setNewMedicineName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddMedicine()}
            style={{
              flex: 1,
              padding: "0.6rem 1rem",
              borderRadius: "6px",
              background: "transparent",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
              outline: "none",
            }}
          />
          <button
            onClick={handleAddMedicine}
            disabled={!newMedicineName.trim()}
            style={{
              padding: "0 1rem",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "6px",
              cursor: newMedicineName.trim() ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <Plus size={16} /> Add
          </button>
        </div>
      )}

      {medicines.length > 0 && !sentStatus && (
        <button
          onClick={handleSendToPharmacy}
          disabled={isSending || medicines.filter((m) => m.data?.inStock).length === 0}
          style={{
            width: "100%",
            marginTop: "1.5rem",
            padding: "0.8rem",
            background: "linear-gradient(90deg, #3b82f6, #2563eb)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "1rem",
            cursor: isSending ? "not-allowed" : "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.5rem",
            opacity: medicines.filter((m) => m.data?.inStock).length === 0 ? 0.5 : 1,
          }}
        >
          {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {isSending ? "Sending to Network..." : "Approve & Send to Pharmacy"}
        </button>
      )}

      {sentStatus && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid #10b981",
            borderRadius: "8px",
            color: "#10b981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            fontWeight: "bold",
          }}
        >
          <Check size={20} /> {sentStatus}
        </div>
      )}
    </div>
  );
};

export default PharmacyPrescriptionWidget;
