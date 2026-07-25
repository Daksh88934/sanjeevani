import { useEffect, useRef } from "react";

interface Props {
  signalData: number;
}

const LiveECGGraph = ({ signalData }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const historyRef = useRef<number[]>(new Array(300).fill(0));
  const pointerRef = useRef(0);

  useEffect(() => {
    historyRef.current[pointerRef.current] = signalData;
    pointerRef.current = (pointerRef.current + 1) % historyRef.current.length;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(16, 185, 129, 0.15)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const len = historyRef.current.length;
    const step = width / len;

    for (let i = 0; i < len; i++) {
      const index = (pointerRef.current + i) % len;
      const val = historyRef.current[index];

      const x = i * step;
      const centerY = height / 2;
      const y = centerY - val * (height / 6);

      const opacity = Math.max(0.1, i / len);

      ctx.beginPath();
      ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`;

      if (i > 0) {
        const prevIndex = (pointerRef.current + i - 1) % len;
        const prevVal = historyRef.current[prevIndex];
        const prevX = (i - 1) * step;
        const prevY = centerY - prevVal * (height / 6);

        if (i < len - 5) {
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }
    }

    const headVal = historyRef.current[(pointerRef.current - 1 + len) % len];
    const headX = (len - 1) * step;
    const headY = height / 2 - headVal * (height / 6);

    ctx.fillStyle = "#fff";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#10b981";
    ctx.beginPath();
    ctx.arc(headX, headY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [signalData]);

  return (
    <div
      className="ecg-container"
      style={{
        width: "100%",
        height: "220px",
        background: "var(--bg-dark)",
        borderRadius: "12px",
        border: "1px solid rgba(16, 185, 129, 0.4)",
        overflow: "hidden",
        position: "relative",
        boxShadow: "inset 0 0 20px rgba(16, 185, 129, 0.1)",
      }}
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={220}
        style={{ width: "100%", height: "100%", display: "block" }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(rgba(16, 185, 129, 0.05) 50%, rgba(0,0,0,0) 50%)",
          backgroundSize: "100% 4px",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          color: "#10b981",
          fontSize: "0.75rem",
          fontWeight: "bold",
          letterSpacing: "1px",
        }}
      >
        LEAD II (rPPG EXTRACT){" "}
        <span style={{ opacity: 0.5, marginLeft: "10px" }}>25mm/s 10mm/mV</span>
      </div>
    </div>
  );
};

export default LiveECGGraph;
