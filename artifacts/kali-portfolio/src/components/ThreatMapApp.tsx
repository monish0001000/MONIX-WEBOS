import WindowChrome from "./WindowChrome";

interface ThreatMapAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

export default function ThreatMapApp({
  onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex,
}: ThreatMapAppProps) {
  return (
    <WindowChrome
      title="Live Cyber Threat Map"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={900}
      height={560}
      zIndex={zIndex}
    >
      <div className="w-full h-full flex flex-col bg-black overflow-hidden">
        <div
          style={{
            height: 28,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 12px",
            background: "rgba(0,0,0,0.6)",
            borderBottom: "1px solid rgba(0,196,255,0.15)",
          }}
        >
          <span style={{ fontSize: 9, color: "rgba(0,196,255,0.5)", fontFamily: "monospace", letterSpacing: "0.1em" }}>
            ◉ LIVE
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
            kaspersky cybermap · real-time attack telemetry
          </span>
        </div>
        <div className="flex-1 relative overflow-hidden">
          <iframe
            src="https://cybermap.kaspersky.com/en/widget/dynamic/dark"
            className="w-full h-full border-none"
            allowFullScreen
            title="Live Cyber Threat Map"
            style={{ display: "block" }}
          />
        </div>
      </div>
    </WindowChrome>
  );
}
