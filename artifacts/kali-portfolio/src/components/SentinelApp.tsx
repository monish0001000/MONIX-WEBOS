import { useState, useEffect, useCallback, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, Shield } from "lucide-react";
import WindowChrome from "./WindowChrome";

import homepageImg from "@assets/Homepage_1775230172411.webp";
import livestreamImg from "@assets/livestream_1775230172412.webp";
import firewallImg from "@assets/firewall_1775230172410.webp";
import aiImg from "@assets/ai_1775230172409.webp";
import policiesImg from "@assets/policies_1775230172413.webp";
import siemImg from "@assets/SIEM_1775230172413.webp";
import edrImg from "@assets/EDR_1775230172410.webp";

const SLIDES = [
  { src: homepageImg,    caption: "SENTINEL.CORE — Dashboard Overview",         sub: "System health, live threat stream & predictive risk intelligence" },
  { src: livestreamImg,  caption: "Real-time Traffic Analysis",                  sub: "Live packet interception & network flow monitoring interface" },
  { src: firewallImg,    caption: "Kernel Firewall Block Event",                 sub: "Active enforcement: IP/port control & geo-blocking rules" },
  { src: aiImg,          caption: "AI Threat Scoring",                           sub: "Sentinel AI assistant — intelligent threat analysis & recommendations" },
  { src: policiesImg,    caption: "Zero Trust Security Policies",                sub: "Next-gen firewall traffic rules with process-level identity enforcement" },
  { src: siemImg,        caption: "Digital Forensics (SIEM)",                    sub: "Persistent event storage, search & analysis across security layers" },
  { src: edrImg,         caption: "Network Nodes (EDR) Monitoring",              sub: "Remote endpoint monitoring — CPU, RAM & disk telemetry in real time" },
];

interface SentinelAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

type Tab = "dashboard" | "gallery" | "threatfeed";

const ThreatFeedIframe = memo(function ThreatFeedIframe() {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#050a0e" }}>
      <iframe
        src="https://threatmap.checkpoint.com/ThreatPortal/livemap.html"
        title="Check Point Global Threat Map"
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        sandbox="allow-scripts allow-same-origin allow-popups"
        referrerPolicy="no-referrer"
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        }}
      />
    </div>
  );
});

export default function SentinelApp({
  onClose,
  onMinimize,
  isActive,
  onFocus,
  initialX,
  initialY,
  zIndex,
}: SentinelAppProps) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((idx: number, dir: number) => {
    setDirection(dir);
    setCurrentSlide((idx + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => {
    goTo(currentSlide + 1, 1);
  }, [currentSlide, goTo]);

  const prev = useCallback(() => {
    goTo(currentSlide - 1, -1);
  }, [currentSlide, goTo]);

  useEffect(() => {
    if (activeTab !== "gallery") return;
    autoRef.current = setInterval(next, 4000);
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [activeTab, next]);

  const resetAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(next, 4000);
  }, [next]);

  const handleNext = () => { next(); resetAuto(); };
  const handlePrev = () => { prev(); resetAuto(); };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "60%" : "-60%",
      opacity: 0,
      scale: 0.97,
    }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? "-60%" : "60%",
      opacity: 0,
      scale: 0.97,
    }),
  };

  return (
    <WindowChrome
      title="Sentinel SOC · Security Operations Center"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={920}
      height={600}
      zIndex={zIndex}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          background: "linear-gradient(180deg, #080c10 0%, #060a0e 100%)",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Ubuntu Mono', monospace",
          overflow: "hidden",
        }}
      >
        {/* ── GitHub Notice Banner ── */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "7px 12px",
            background: "rgba(255, 195, 0, 0.06)",
            borderBottom: "1px solid rgba(255, 195, 0, 0.35)",
            borderLeft: "3px solid rgba(255, 195, 0, 0.8)",
          }}
        >
          <Shield size={13} color="#ffc300" strokeWidth={2} style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: 10.5,
              color: "rgba(255, 195, 0, 0.85)",
              flex: 1,
              lineHeight: 1.4,
              letterSpacing: "0.01em",
            }}
          >
            <span style={{ color: "#ffc300", fontWeight: 700 }}>NOTE:</span> This is a frontend
            architectural showcase. The production backend (Python Kernel &amp; WFP) requires local
            system core files to execute.
          </span>
          <a
            href="https://github.com/monish0001000/Sentinel_SOC.git"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              background: "rgba(255, 195, 0, 0.12)",
              border: "1px solid rgba(255, 195, 0, 0.45)",
              borderRadius: 4,
              color: "#ffc300",
              fontSize: 10,
              fontWeight: 700,
              textDecoration: "none",
              letterSpacing: "0.06em",
              flexShrink: 0,
              whiteSpace: "nowrap",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,195,0,0.22)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,195,0,0.12)";
            }}
          >
            <ExternalLink size={10} strokeWidth={2.2} />
            View on GitHub
          </a>
        </div>

        {/* ── Tab Bar ── */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 0,
            padding: "0 12px",
            background: "rgba(255,255,255,0.025)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {(["dashboard", "gallery", "threatfeed"] as Tab[]).map((tab) => {
            const labels: Record<Tab, string> = {
              dashboard: "⬡  Live Dashboard",
              gallery: "▶  Production Gallery",
              threatfeed: "🌐  Global Threat Feed",
            };
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "9px 18px",
                  background: "transparent",
                  border: "none",
                  borderBottom: isSelected
                    ? "2px solid #00a3ff"
                    : "2px solid transparent",
                  cursor: "pointer",
                  fontSize: 11,
                  fontFamily: "inherit",
                  color: isSelected ? "#00c4ff" : "rgba(255,255,255,0.4)",
                  fontWeight: isSelected ? 600 : 400,
                  letterSpacing: "0.04em",
                  transition: "color 0.15s, border-color 0.15s",
                  whiteSpace: "nowrap",
                  marginBottom: -1,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected)
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected)
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)";
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          {/* Live Dashboard */}
          {activeTab === "dashboard" && (
            <div style={{ width: "100%", height: "100%", position: "relative" }}>
              <iframe
                src="https://monish-sentinel-soc.vercel.app"
                title="Sentinel SOC Live Dashboard"
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  display: "block",
                  background: "#050a0e",
                }}
                allow="clipboard-read; clipboard-write"
              />
              {/* Subtle scan-line overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background:
                    "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)",
                }}
              />
            </div>
          )}

          {/* Global Threat Feed */}
          {activeTab === "threatfeed" && (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#050a0e" }}>
              {/* Info bar */}
              <div
                style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  background: "rgba(0,163,255,0.05)",
                  borderBottom: "1px solid rgba(0,163,255,0.15)",
                }}
              >
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 6px #00ff88", flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: "rgba(0,196,255,0.8)", fontFamily: "inherit", letterSpacing: "0.06em" }}>
                  LIVE — Check Point Global Threat Intelligence Map
                </span>
                <a
                  href="https://threatmap.checkpoint.com/ThreatPortal/livemap.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "3px 10px",
                    background: "rgba(0,163,255,0.1)",
                    border: "1px solid rgba(0,163,255,0.3)",
                    borderRadius: 4,
                    color: "#00c4ff",
                    fontSize: 10,
                    fontWeight: 700,
                    textDecoration: "none",
                    letterSpacing: "0.05em",
                    flexShrink: 0,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,163,255,0.2)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,163,255,0.1)"; }}
                >
                  <ExternalLink size={9} strokeWidth={2.2} />
                  Open Full
                </a>
              </div>
              {/* Memoized iframe */}
              <div style={{ flex: 1, overflow: "hidden" }}>
                <ThreatFeedIframe />
              </div>
            </div>
          )}

          {/* Production Gallery */}
          {activeTab === "gallery" && (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: "#05080c",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Slide area */}
              <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                <AnimatePresence custom={direction} initial={false} mode="wait">
                  <motion.div
                    key={currentSlide}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.38, ease: [0.32, 0, 0.67, 0] }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={SLIDES[currentSlide].src}
                      alt={SLIDES[currentSlide].caption}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        display: "block",
                      }}
                      draggable={false}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Left arrow */}
                <button
                  onClick={handlePrev}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                    width: 34,
                    height: 34,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,163,255,0.12)",
                    border: "1px solid rgba(0,163,255,0.3)",
                    borderRadius: 6,
                    cursor: "pointer",
                    color: "#00c4ff",
                    transition: "background 0.15s, border-color 0.15s",
                    backdropFilter: "blur(8px)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(0,163,255,0.25)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,163,255,0.6)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(0,163,255,0.12)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,163,255,0.3)";
                  }}
                >
                  <ChevronLeft size={18} strokeWidth={2} />
                </button>

                {/* Right arrow */}
                <button
                  onClick={handleNext}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                    width: 34,
                    height: 34,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,163,255,0.12)",
                    border: "1px solid rgba(0,163,255,0.3)",
                    borderRadius: 6,
                    cursor: "pointer",
                    color: "#00c4ff",
                    transition: "background 0.15s, border-color 0.15s",
                    backdropFilter: "blur(8px)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(0,163,255,0.25)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,163,255,0.6)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(0,163,255,0.12)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,163,255,0.3)";
                  }}
                >
                  <ChevronRight size={18} strokeWidth={2} />
                </button>

                {/* Scan-line overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                      "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 6px)",
                  }}
                />
              </div>

              {/* Caption bar */}
              <div
                style={{
                  flexShrink: 0,
                  padding: "10px 16px",
                  background: "rgba(0,163,255,0.05)",
                  borderTop: "1px solid rgba(0,163,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#00c4ff",
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {SLIDES[currentSlide].caption}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.4)",
                      marginTop: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {SLIDES[currentSlide].sub}
                  </div>
                </div>

                {/* Dot indicators */}
                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                  {SLIDES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        goTo(i, i > currentSlide ? 1 : -1);
                        resetAuto();
                      }}
                      style={{
                        width: i === currentSlide ? 18 : 6,
                        height: 6,
                        borderRadius: 3,
                        background: i === currentSlide ? "#00a3ff" : "rgba(255,255,255,0.2)",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        transition: "width 0.3s ease, background 0.3s ease",
                      }}
                    />
                  ))}
                </div>

                {/* Counter */}
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.3)",
                    flexShrink: 0,
                    letterSpacing: "0.06em",
                  }}
                >
                  {String(currentSlide + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </WindowChrome>
  );
}
