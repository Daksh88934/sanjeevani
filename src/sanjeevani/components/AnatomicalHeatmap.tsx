import { useState, useEffect } from "react";

interface Props {
  affectedPart: string;
}

interface GlowStyle {
  fill: string;
  stroke: string;
  strokeWidth: string;
  filter: string;
  transition: string;
}

const AnatomicalHeatmap = ({ affectedPart }: Props) => {
  const [scanPos, setScanPos] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let pos = 0;
    let direction = 1;

    const animateScan = () => {
      pos += 2 * direction;
      if (pos > 500) direction = -1;
      if (pos < 0) direction = 1;
      setScanPos(pos);
      animationFrameId = requestAnimationFrame(animateScan);
    };

    animateScan();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const part = affectedPart ? affectedPart.toLowerCase().trim() : "general";

  const getGlow = (partName: string): GlowStyle => {
    const isActive = part === partName;
    return {
      fill: isActive ? "rgba(255, 42, 42, 0.4)" : "rgba(0, 240, 255, 0.05)",
      stroke: isActive ? "#ff2a2a" : "#00f0ff",
      strokeWidth: isActive ? "3" : "1.5",
      filter: isActive
        ? "drop-shadow(0 0 10px rgba(255, 42, 42, 0.8))"
        : "drop-shadow(0 0 2px rgba(0, 240, 255, 0.4))",
      transition: "all 0.5s ease",
    };
  };

  const getCalloutCoords = () => {
    switch (part) {
      case "head":
        return { x: 150, y: 60 };
      case "chest":
        return { x: 150, y: 150 };
      case "abdomen":
        return { x: 150, y: 220 };
      case "left arm":
      case "left_arm":
        return { x: 220, y: 180 };
      case "right arm":
      case "right_arm":
        return { x: 80, y: 180 };
      case "left leg":
      case "left_leg":
        return { x: 180, y: 350 };
      case "right leg":
      case "right_leg":
        return { x: 120, y: 350 };
      default:
        return null;
    }
  };

  const callout = getCalloutCoords();

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "250px",
        maxHeight: "400px",
        background:
          "radial-gradient(circle at center, rgba(0, 240, 255, 0.05) 0%, rgba(5, 8, 14, 1) 80%)",
        borderRadius: "var(--panel-radius)",
        border: "1px solid var(--glass-border)",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        boxShadow: "inset 0 0 30px rgba(0, 240, 255, 0.05)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          color: "var(--primary)",
          fontFamily: "JetBrains Mono",
          fontSize: "0.65rem",
          opacity: 0.7,
        }}
      >
        SYS.SCAN_v9.2.1 <br />
        BIO_METRICS: ONLINE
        <br />
        TARGET: {part.toUpperCase()}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 10,
          right: 10,
          color: "var(--primary)",
          fontFamily: "JetBrains Mono",
          fontSize: "0.65rem",
          opacity: 0.7,
          textAlign: "right",
        }}
      >
        DEPTH: 45.2mm <br />
        RESOLUTION: 4K_UHD
        <br />
        STATUS: ABNORMALITY DETECTED
      </div>

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 300 500"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        style={{ maxWidth: "100%", maxHeight: "100%" }}
      >
        <defs>
          <pattern
            id="hexagons"
            width="20"
            height="34.64"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(0.5)"
          >
            <path
              d="M20 0L40 11.547L40 34.641L20 46.188L0 34.641L0 11.547Z"
              fill="none"
              stroke="rgba(0, 240, 255, 0.1)"
              strokeWidth="1"
            />
          </pattern>
          <radialGradient id="holoGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="300" height="500" fill="url(#hexagons)" />
        <ellipse cx="150" cy="250" rx="100" ry="220" fill="url(#holoGlow)" />

        <g className="anatomical-paths">
          <path
            d="M 130 50 C 130 30, 170 30, 170 50 C 170 70, 160 80, 150 80 C 140 80, 130 70, 130 50 Z"
            style={getGlow("head")}
          />
          <path d="M 140 80 L 160 80 L 165 95 L 135 95 Z" style={getGlow("neck")} />
          <path
            d="M 120 95 L 180 95 C 190 95, 195 110, 190 140 L 180 180 L 120 180 L 110 140 C 105 110, 110 95, 120 95 Z"
            style={getGlow("chest")}
          />
          <path
            d="M 120 180 L 180 180 L 175 250 C 160 260, 140 260, 125 250 Z"
            style={getGlow("abdomen")}
          />
          <path
            d="M 115 100 C 100 100, 90 110, 85 130 L 70 210 L 85 215 L 100 140 Z"
            style={getGlow("right arm")}
          />
          <path
            d="M 70 210 C 65 240, 60 260, 50 270 L 65 275 C 75 260, 80 240, 85 215 Z"
            style={getGlow("right arm")}
          />
          <path
            d="M 185 100 C 200 100, 210 110, 215 130 L 230 210 L 215 215 L 200 140 Z"
            style={getGlow("left arm")}
          />
          <path
            d="M 230 210 C 235 240, 240 260, 250 270 L 235 275 C 225 260, 220 240, 215 215 Z"
            style={getGlow("left arm")}
          />
          <path d="M 125 250 L 150 255 L 140 360 L 115 360 Z" style={getGlow("right leg")} />
          <path
            d="M 115 360 L 140 360 L 130 460 C 120 470, 110 470, 105 460 Z"
            style={getGlow("right leg")}
          />
          <path d="M 175 250 L 150 255 L 160 360 L 185 360 Z" style={getGlow("left leg")} />
          <path
            d="M 185 360 L 160 360 L 170 460 C 180 470, 190 470, 195 460 Z"
            style={getGlow("left leg")}
          />
        </g>

        <g transform={`translate(0, ${scanPos})`}>
          <line
            x1="0"
            y1="0"
            x2="300"
            y2="0"
            stroke="rgba(0, 255, 157, 0.8)"
            strokeWidth="2"
            filter="drop-shadow(0 0 5px #00ff9d)"
          />
          <rect x="0" y="-10" width="300" height="20" fill="url(#holoGlow)" opacity="0.5" />
        </g>

        {callout && (
          <g>
            <circle
              cx={callout.x}
              cy={callout.y}
              r="15"
              fill="none"
              stroke="var(--status-red)"
              strokeWidth="2"
              strokeDasharray="5,5"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 ${callout.x} ${callout.y}`}
                to={`360 ${callout.x} ${callout.y}`}
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>
            <circle
              cx={callout.x}
              cy={callout.y}
              r="3"
              fill="var(--status-red)"
              filter="drop-shadow(0 0 5px #ff2a2a)"
            />
            <polyline
              points={`${callout.x},${callout.y} ${callout.x > 150 ? 250 : 50},${callout.y - 30} ${callout.x > 150 ? 280 : 20},${callout.y - 30}`}
              fill="none"
              stroke="var(--status-red)"
              strokeWidth="2"
              opacity="0.8"
            />
            <rect
              x={callout.x > 150 ? 170 : 10}
              y={callout.y - 65}
              width="120"
              height="30"
              fill="rgba(255, 42, 42, 0.1)"
              stroke="var(--status-red)"
              strokeWidth="1"
              rx="4"
            />
            <text
              x={callout.x > 150 ? 175 : 15}
              y={callout.y - 45}
              fill="var(--status-red)"
              fontSize="9"
              fontFamily="JetBrains Mono"
              fontWeight="bold"
            >
              [ {part.toUpperCase()} ] ABNORMAL
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default AnatomicalHeatmap;
