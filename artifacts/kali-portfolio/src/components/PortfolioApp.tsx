import { useState } from "react";
import WindowChrome from "./WindowChrome";

interface PortfolioAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

export default function PortfolioApp({
  onClose,
  onMinimize,
  isActive,
  onFocus,
  initialX,
  initialY,
  zIndex,
}: PortfolioAppProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <WindowChrome
      title="Portfolio — monishsrmportfolio.vercel.app"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={900}
      height={580}
      zIndex={zIndex}
    >
      <div style={{ width: "100%", height: "100%", position: "relative", background: "#fff" }}>
        {!loaded && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#0d0d0d",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              zIndex: 2,
            }}
          >
            {/* Spinner */}
            <div
              style={{
                width: 36,
                height: 36,
                border: "3px solid rgba(54,123,240,0.2)",
                borderTop: "3px solid #367BF0",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "'Ubuntu', sans-serif" }}>
              Loading portfolio…
            </span>
          </div>
        )}
        <iframe
          src="https://monishsrmportfolio.vercel.app"
          title="Portfolio"
          onLoad={() => setLoaded(true)}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.3s",
          }}
        />
      </div>
    </WindowChrome>
  );
}
