import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Cpu, MemoryStick } from "lucide-react";
import WindowChrome from "./WindowChrome";
import { useOSStore, type OSProcess } from "@/lib/store";

interface TaskManagerAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

function formatUptime(launchedAt: number): string {
  const elapsed = Math.floor((Date.now() - launchedAt) / 1000);
  if (elapsed < 60) return `${elapsed}s`;
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
  return `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function GaugeBar({ value, max, color, glowColor }: { value: number; max: number; color: string; glowColor: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ width: "100%", height: 10, background: "rgba(255,255,255,0.05)", borderRadius: 6, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
      <motion.div
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ height: "100%", background: `linear-gradient(90deg, ${color}99, ${color})`, borderRadius: 6, boxShadow: `0 0 8px ${glowColor}` }}
      />
    </div>
  );
}

export default function TaskManagerApp({
  onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex,
}: TaskManagerAppProps) {
  const activeProcesses = useOSStore((s) => s.activeProcesses);
  const killProcess = useOSStore((s) => s.killProcess);

  const [tick, setTick] = useState(0);
  const [killTarget, setKillTarget] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [fps, setFps] = useState(60);
  const [cpu, setCpu] = useState(22);
  const [ram, setRam] = useState(4.6);

  const targetCpu = useRef(22);
  const targetRam = useRef(4.6);

  // Uptime ticker — forces re-render every second
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // FPS counter
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;
    const measure = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(measure);
    };
    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Simulated CPU / RAM gauges (visual ambiance)
  useEffect(() => {
    const id = setInterval(() => {
      targetCpu.current = Math.max(0, 35 + (Math.random() - 0.5) * 60);
      targetRam.current = Math.max(0, 5.5 + (Math.random() - 0.5) * 5);
      setCpu((prev) => Math.round(lerp(prev, targetCpu.current, 0.4) * 10) / 10);
      setRam((prev) => Math.round(lerp(prev, targetRam.current, 0.35) * 100) / 100);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const cpuColor = cpu > 70 ? "#ff4444" : cpu > 40 ? "#ffaa00" : "#00ff88";
  const ramColor = (ram / 16) * 100 > 70 ? "#ff4444" : (ram / 16) * 100 > 40 ? "#ffaa00" : "#00f0ff";

  const filtered = activeProcesses.filter(
    (p) =>
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.pid.toLowerCase().includes(filter.toLowerCase())
  );

  const handleKill = (proc: OSProcess) => {
    setKillTarget(proc.id);
    setTimeout(() => {
      killProcess(proc.id);
      setKillTarget(null);
    }, 280);
  };

  return (
    <WindowChrome
      title="System Monitor — Process Manager"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={720}
      height={540}
      zIndex={zIndex}
    >
      <style>{`
        .tm-scroll::-webkit-scrollbar { width: 5px; }
        .tm-scroll::-webkit-scrollbar-track { background: transparent; }
        .tm-scroll::-webkit-scrollbar-thumb { background: rgba(0,240,255,0.25); border-radius: 3px; }
        @keyframes tmPulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes tmScanline { from{top:-100%} to{top:100%} }
      `}</style>

      <div style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column", fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace", overflow: "hidden" }}>

        {/* ── Header ── */}
        <div style={{ padding: "10px 16px 8px", borderBottom: "1px solid rgba(0,240,255,0.1)", display: "flex", alignItems: "center", gap: 8 }}>
          <Activity size={13} color="#00f0ff" />
          <span style={{ fontSize: 11, color: "rgba(0,240,255,0.7)", letterSpacing: "0.15em" }}>
            MONIX SYSTEM MONITOR
          </span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(0,240,255,0.35)", letterSpacing: "0.1em", animation: "tmPulse 2s ease-in-out infinite" }}>
            ● LIVE
          </span>
        </div>

        {/* ── Gauges ── */}
        <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, flexShrink: 0 }}>
          {/* CPU */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Cpu size={13} color={cpuColor} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>CPU</span>
              </div>
              <motion.span key={Math.round(cpu)} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} style={{ fontSize: 18, fontWeight: 700, color: cpuColor, textShadow: `0 0 10px ${cpuColor}88`, letterSpacing: "0.02em" }}>
                {Math.round(cpu)}%
              </motion.span>
            </div>
            <GaugeBar value={cpu} max={100} color={cpuColor} glowColor={`${cpuColor}66`} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>8-CORE · MONIX ARCH X86_64</span>
              <motion.span key={fps} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} style={{ fontSize: 10, fontWeight: 700, color: "#00ff88", textShadow: "0 0 8px rgba(0,255,136,0.8)", letterSpacing: "0.05em" }}>
                <span style={{ fontSize: 8, color: "rgba(0,255,136,0.5)", marginRight: 4 }}>WEB FPS</span>{fps}
              </motion.span>
            </div>
          </div>
          {/* RAM */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MemoryStick size={13} color={ramColor} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>RAM</span>
              </div>
              <motion.span key={ram.toFixed(1)} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} style={{ fontSize: 18, fontWeight: 700, color: ramColor, textShadow: `0 0 10px ${ramColor}88`, letterSpacing: "0.02em" }}>
                {ram.toFixed(1)} GB
              </motion.span>
            </div>
            <GaugeBar value={ram} max={16} color={ramColor} glowColor={`${ramColor}66`} />
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>
              {ram.toFixed(1)} / 16 GB USED · DDR5
            </span>
          </div>
        </div>

        {/* ── Process Table Header ── */}
        <div style={{ padding: "8px 16px 4px", borderBottom: "1px solid rgba(0,240,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: "rgba(0,240,255,0.5)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Active Processes · {activeProcesses.length}
          </span>
          <input
            type="text"
            placeholder="filter…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              background: "rgba(0,240,255,0.04)",
              border: "1px solid rgba(0,240,255,0.15)",
              borderRadius: 3,
              color: "rgba(0,240,255,0.8)",
              fontFamily: "inherit",
              fontSize: 10,
              padding: "3px 8px",
              outline: "none",
              width: 140,
              letterSpacing: "0.04em",
            }}
          />
        </div>

        {/* Column labels */}
        <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 110px 105px 90px 90px", padding: "5px 16px", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(0,240,255,0.35)", borderBottom: "1px solid rgba(0,240,255,0.06)", flexShrink: 0 }}>
          <span></span>
          <span>Process Name</span>
          <span>PID</span>
          <span>Status</span>
          <span>Uptime</span>
          <span style={{ textAlign: "center" }}>Action</span>
        </div>

        {/* ── Process Rows ── */}
        <div className="tm-scroll" style={{ flex: 1, overflowY: "auto" }}>
          <AnimatePresence initial={false}>
            {filtered.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8, paddingTop: 32, color: "rgba(0,240,255,0.2)", fontSize: 12, letterSpacing: "0.08em" }}
              >
                <span style={{ fontSize: 26 }}>◈</span>
                <span>NO ACTIVE PROCESSES</span>
              </motion.div>
            )}

            {filtered.map((proc) => {
              const isBeingKilled = killTarget === proc.id;
              return (
                <motion.div
                  key={proc.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: isBeingKilled ? 0.3 : 1, x: 0, backgroundColor: isBeingKilled ? "rgba(255,30,30,0.1)" : "transparent" }}
                  exit={{ opacity: 0, x: 20, transition: { duration: 0.18 } }}
                  transition={{ duration: 0.2 }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "30px 1fr 110px 105px 90px 90px",
                    padding: "8px 16px",
                    alignItems: "center",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => { if (!isBeingKilled) (e.currentTarget as HTMLDivElement).style.background = "rgba(0,240,255,0.035)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  {/* Icon */}
                  <span style={{ fontSize: 15, lineHeight: 1 }}>{proc.icon}</span>

                  {/* Name */}
                  <span style={{ fontSize: 11, color: proc.isMinimized ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.85)", letterSpacing: "0.03em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: 8 }}>
                    {proc.name}
                  </span>

                  {/* PID */}
                  <span style={{ fontSize: 11, color: "rgba(0,240,255,0.6)", letterSpacing: "0.08em", fontVariantNumeric: "tabular-nums" }}>
                    {proc.pid}
                  </span>

                  {/* Status */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: proc.isMinimized ? "#f59e0b" : "#22d3ee", boxShadow: proc.isMinimized ? "0 0 6px #f59e0b" : "0 0 6px #22d3ee", flexShrink: 0 }} />
                    <span style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: proc.isMinimized ? "rgba(245,158,11,0.75)" : "rgba(34,211,238,0.8)" }}>
                      {proc.isMinimized ? "Suspended" : "Running"}
                    </span>
                  </div>

                  {/* Uptime */}
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", letterSpacing: "0.04em", fontVariantNumeric: "tabular-nums" }}>
                    {tick >= 0 ? formatUptime(proc.launchedAt) : ""}
                  </span>

                  {/* Kill */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <motion.button
                      whileHover={isBeingKilled ? {} : { scale: 1.06 }}
                      whileTap={isBeingKilled ? {} : { scale: 0.94 }}
                      onClick={() => !isBeingKilled && handleKill(proc)}
                      style={{
                        background: isBeingKilled ? "rgba(255,30,30,0.25)" : "rgba(255,30,30,0.06)",
                        border: "1px solid rgba(255,30,30,0.45)",
                        borderRadius: 3,
                        color: isBeingKilled ? "#ff7777" : "#ff4444",
                        fontFamily: "inherit",
                        fontSize: 9,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        padding: "3px 8px",
                        cursor: isBeingKilled ? "not-allowed" : "pointer",
                        boxShadow: isBeingKilled ? "0 0 10px rgba(255,30,30,0.35)" : "0 0 4px rgba(255,30,30,0.15)",
                        transition: "box-shadow 0.2s, background 0.2s, color 0.2s",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        if (!isBeingKilled) {
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 14px rgba(255,30,30,0.5)";
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,30,30,0.16)";
                          (e.currentTarget as HTMLButtonElement).style.color = "#ff6666";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isBeingKilled) {
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 4px rgba(255,30,30,0.15)";
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,30,30,0.06)";
                          (e.currentTarget as HTMLButtonElement).style.color = "#ff4444";
                        }
                      }}
                    >
                      {isBeingKilled ? "Killing…" : "End Task"}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: "7px 16px", borderTop: "1px solid rgba(0,240,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "rgba(0,240,255,0.012)" }}>
          <span style={{ fontSize: 9, color: "rgba(0,240,255,0.25)", letterSpacing: "0.1em" }}>
            MONIX OS · PROCESS MANAGER v2.0 · {activeProcesses.length} PROCESSES
          </span>
          <span style={{ fontSize: 9, color: "rgba(0,240,255,0.2)", letterSpacing: "0.08em" }}>
            CTRL+SHIFT+ESC — TOGGLE
          </span>
        </div>
      </div>
    </WindowChrome>
  );
}
