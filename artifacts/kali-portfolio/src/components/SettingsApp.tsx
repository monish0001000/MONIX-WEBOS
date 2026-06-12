import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Monitor, Info, Check, AppWindow, LayoutDashboard, Activity, MousePointer2, Sparkles } from "lucide-react";
import WindowChrome from "./WindowChrome";
import { useOSStore } from "@/lib/store";

interface SettingsAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
  onOpenTaskManager?: () => void;
}

type Tab = "personalization" | "taskbar" | "themes" | "cursor" | "system";

const TABS: { id: Tab; label: string; icon: React.ReactNode; locked?: boolean }[] = [
  { id: "personalization", label: "Personalization", icon: <Palette size={15} /> },
  { id: "system",          label: "System",          icon: <Info size={15} /> },
  { id: "themes",          label: "Themes & Colors", icon: <Sparkles size={15} />, locked: true },
  { id: "cursor",          label: "Mouse & Cursor",  icon: <MousePointer2 size={15} />, locked: true },
  { id: "taskbar",         label: "Taskbar",         icon: <LayoutDashboard size={15} />, locked: true },
];

function LockedSection({ children, label = "KERNEL LOCKED — IN DEVELOPMENT" }: { children: React.ReactNode; label?: string }) {
  return (
    <div style={{ position: "relative" }}>
      {/* Blurred, grayscale, non-interactive content underneath */}
      <div style={{ opacity: 0.35, filter: "grayscale(1)", pointerEvents: "none", userSelect: "none" }}>
        {children}
      </div>

      {/* Overlay badge */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        background: "rgba(5,5,5,0.55)",
        backdropFilter: "blur(4px)",
        borderRadius: 10,
        border: "1px solid rgba(255,50,50,0.2)",
        boxShadow: "0 0 40px rgba(255,30,30,0.08), inset 0 0 60px rgba(0,0,0,0.3)",
        zIndex: 10,
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          padding: "24px 36px",
          background: "linear-gradient(135deg, rgba(255,20,20,0.08), rgba(0,0,0,0.4))",
          border: "1px solid rgba(255,60,60,0.35)",
          borderRadius: 12,
          boxShadow: "0 0 30px rgba(255,30,30,0.15), 0 0 60px rgba(0,0,0,0.5)",
        }}>
          <div style={{ fontSize: 28, lineHeight: 1 }}>🔒</div>
          <div style={{
            fontFamily: "monospace",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: "0.18em",
            color: "#ff4444",
            textShadow: "0 0 12px rgba(255,60,60,0.8), 0 0 30px rgba(255,30,30,0.4)",
            textAlign: "center",
          }}>
            ACCESS DENIED
          </div>
          <div style={{
            fontFamily: "monospace",
            fontSize: 9,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.12em",
            textAlign: "center",
            maxWidth: 240,
            lineHeight: 1.6,
          }}>
            {label}
          </div>
          <div style={{
            padding: "5px 14px",
            background: "rgba(255,40,40,0.1)",
            border: "1px solid rgba(255,60,60,0.3)",
            borderRadius: 20,
            fontFamily: "monospace",
            fontSize: 8,
            color: "rgba(255,100,100,0.7)",
            letterSpacing: "0.15em",
            marginTop: 4,
          }}>
            REQUIRES MONIX PRO LICENSE
          </div>
        </div>
      </div>
    </div>
  );
}

const ACCENT_COLORS = [
  { label: "Cyber Cyan",    hex: "#00f0ff" },
  { label: "Hacker Green",  hex: "#00ff88" },
  { label: "Blood Red",     hex: "#ff2244" },
  { label: "Deep Purple",   hex: "#a855f7" },
  { label: "Neon Pink",     hex: "#ff0099" },
  { label: "Sunset Orange", hex: "#ff6600" },
  { label: "Gold",          hex: "#ffd700" },
  { label: "Cobalt Blue",   hex: "#0066ff" },
  { label: "Ice Blue",      hex: "#60a5fa" },
  { label: "Pure White",    hex: "#ffffff" },
  { label: "Matrix Green",  hex: "#39ff14" },
];

const INSTALLED_APPS = [
  { name: "Terminal",              id: "terminal",      version: "5.2.1",  category: "System",      color: "#c8e6c9" },
  { name: "File Explorer",         id: "files",         version: "3.1.0",  category: "System",      color: "#90bfff" },
  { name: "Web Browser",          id: "browser",       version: "118.0",  category: "Internet",     color: "#7ec8e3" },
  { name: "GitHub",                id: "github",        version: "1.0.0",  category: "Developer",    color: "#e0e0e0" },
  { name: "Portfolio",             id: "portfolio",     version: "1.0.0",  category: "Productivity", color: "#90d090" },
  { name: "Sentinel SOC",          id: "sentinel",      version: "2.4.1",  category: "Security",     color: "#00c4ff" },
  { name: "AURA AI",               id: "aura",          version: "0.9.3",  category: "AI",           color: "#c084fc" },
  { name: "CyberChef",             id: "cyberchef",     version: "10.5.2", category: "Security",     color: "#ff7a00" },
  { name: "Code Studio",           id: "codestudio",    version: "1.84.2", category: "Developer",    color: "#00aaff" },
  { name: "Threat Modeler",        id: "threatmodeler", version: "1.2.0",  category: "Security",     color: "#e879f9" },
  { name: "Grandmaster Chess",     id: "chess",         version: "3.0.0",  category: "Games",        color: "#ffd700" },
  { name: "CYKRYPT — CTF Arena",   id: "cykrypt",       version: "2.1.0",  category: "Security",     color: "#00f0ff" },
  { name: "System Monitor",        id: "taskmanager",   version: "1.0.0",  category: "System",       color: "#00ff88" },
  { name: "Settings",              id: "settings",      version: "1.0.0",  category: "System",       color: "#00d4ff" },
];

function useUptime() {
  const [uptime, setUptime] = useState(0);
  useEffect(() => {
    setUptime(Math.floor(performance.now() / 1000));
    const id = setInterval(() => setUptime((u) => u + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = uptime % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function CyberpunkSlider({
  label,
  value,
  min,
  max,
  unit,
  accentColor,
  glowColor,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  accentColor: string;
  glowColor: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>
          {label}
        </span>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 16,
            fontWeight: 700,
            color: accentColor,
            textShadow: `0 0 10px ${glowColor}`,
            letterSpacing: "0.05em",
          }}
        >
          {value}{unit}
        </span>
      </div>

      <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: 4,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            width: `${pct}%`,
            height: 4,
            background: `linear-gradient(90deg, ${accentColor}66, ${accentColor})`,
            borderRadius: 4,
            boxShadow: `0 0 8px ${glowColor}`,
            transition: "width 0.05s",
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
            zIndex: 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `calc(${pct}% - 8px)`,
            width: 16,
            height: 16,
            background: accentColor,
            borderRadius: "50%",
            boxShadow: `0 0 10px ${glowColor}, 0 0 20px ${glowColor}66`,
            border: "2px solid rgba(0,0,0,0.4)",
            transition: "left 0.05s",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
}

function PersonalizationTab() {
  const { wallpapers, currentWallpaper, setWallpaper } = useOSStore();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <p style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(0,240,255,0.5)", letterSpacing: "0.15em", marginBottom: 16 }}>
          SELECT WALLPAPER
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {wallpapers.map((wp, i) => {
            const isSelected = currentWallpaper === wp;
            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.04, boxShadow: "0 0 22px rgba(0,240,255,0.35)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setWallpaper(wp)}
                style={{
                  position: "relative",
                  aspectRatio: "16/9",
                  borderRadius: 8,
                  overflow: "hidden",
                  cursor: "pointer",
                  border: isSelected ? "2px solid #00f0ff" : "2px solid rgba(255,255,255,0.06)",
                  boxShadow: isSelected ? "0 0 20px rgba(0,240,255,0.45)" : "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              >
                <img
                  src={wp}
                  alt={`Wallpaper ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  draggable={false}
                />
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,240,255,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        background: "#00f0ff",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 14px rgba(0,240,255,0.8)",
                      }}
                    >
                      <Check size={13} color="#000" />
                    </div>
                  </div>
                )}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "4px 6px",
                    background: "rgba(0,0,0,0.6)",
                    fontFamily: "monospace",
                    fontSize: 9,
                    color: isSelected ? "#00f0ff" : "rgba(255,255,255,0.5)",
                    letterSpacing: "0.08em",
                  }}
                >
                  WP_{String(i + 1).padStart(2, "0")}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DisplayTab() {
  const brightness = useOSStore((s) => s.brightness);
  const warmth = useOSStore((s) => s.warmth);
  const setBrightness = useOSStore((s) => s.setBrightness);
  const setWarmth = useOSStore((s) => s.setWarmth);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <p style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(0,240,255,0.5)", letterSpacing: "0.15em", marginBottom: 20 }}>
          DISPLAY CONTROLS
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "18px 20px" }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", marginBottom: 14 }}>
              ☀ BRIGHTNESS
            </div>
            <CyberpunkSlider
              label="Screen Brightness"
              value={brightness}
              min={10}
              max={150}
              unit="%"
              accentColor="#00f0ff"
              glowColor="rgba(0,240,255,0.6)"
              onChange={setBrightness}
            />
            <p style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 10, letterSpacing: "0.08em" }}>
              RANGE: 10% – 150% · DEFAULT: 100%
            </p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "18px 20px" }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,120,0,0.5)", letterSpacing: "0.12em", marginBottom: 14 }}>
              🌙 NIGHT MODE / WARMTH
            </div>
            <CyberpunkSlider
              label="Color Temperature"
              value={warmth}
              min={0}
              max={50}
              unit="%"
              accentColor="#ffaa00"
              glowColor="rgba(255,170,0,0.6)"
              onChange={setWarmth}
            />
            <p style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 10, letterSpacing: "0.08em" }}>
              RANGE: 0% – 50% · DEFAULT: 0% (COOL)
            </p>
          </div>
        </div>
      </div>
      <div
        style={{
          padding: "12px 16px",
          background: "rgba(0,240,255,0.04)",
          border: "1px solid rgba(0,240,255,0.12)",
          borderRadius: 8,
          fontFamily: "monospace",
          fontSize: 10,
          color: "rgba(0,240,255,0.4)",
          letterSpacing: "0.1em",
        }}
      >
        ↑ CHANGES APPLY GLOBALLY IN REAL-TIME
      </div>
    </div>
  );
}

function AppsTab() {
  const categories = Array.from(new Set(INSTALLED_APPS.map((a) => a.category)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <p style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(0,240,255,0.5)", letterSpacing: "0.15em", margin: 0 }}>
        INSTALLED APPLICATIONS — {INSTALLED_APPS.length} TOTAL
      </p>

      {categories.map((cat) => (
        <div key={cat}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.18em", marginBottom: 8, paddingLeft: 2 }}>
            {cat.toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {INSTALLED_APPS.filter((a) => a.category === cat).map((app) => (
              <div
                key={app.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 14px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 7,
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: app.color,
                      boxShadow: `0 0 6px ${app.color}80`,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
                    {app.name}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em" }}>
                    v{app.version}
                  </span>
                  <div
                    style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: "rgba(0,240,255,0.06)",
                      border: "1px solid rgba(0,240,255,0.12)",
                      fontFamily: "monospace",
                      fontSize: 9,
                      color: "rgba(0,240,255,0.5)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    INSTALLED
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CursorTab() {
  const cursorStyle = useOSStore((s) => s.cursorStyle);
  const setCursorStyle = useOSStore((s) => s.setCursorStyle);
  const cursorColor = useOSStore((s) => s.cursorColor);
  const setCursorColor = useOSStore((s) => s.setCursorColor);

  const CURSOR_SHAPES = [
    { id: "default",    label: "Arrow Pointer", desc: "Classic OS arrow",     preview: "↖" },
    { id: "crosshair",  label: "Crosshair",     desc: "Precision targeting",  preview: "⊕" },
    { id: "target",     label: "Target Ring",   desc: "Center ring pointer",  preview: "◎" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <p style={{ fontFamily: "monospace", fontSize: 10, color: "var(--os-accent)", letterSpacing: "0.15em", margin: 0, opacity: 0.7 }}>
        MOUSE & CURSOR CUSTOMIZATION
      </p>

      {/* Style selector */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em" }}>
          POINTER SHAPE
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {CURSOR_SHAPES.map((shape) => {
            const isActive = cursorStyle === shape.id;
            return (
              <motion.button
                key={shape.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setCursorStyle(shape.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  padding: "16px 12px",
                  borderRadius: 10,
                  border: isActive ? `1px solid var(--os-accent)` : "1px solid rgba(255,255,255,0.07)",
                  background: isActive ? "rgba(var(--os-accent-r,0),240,255,0.06)" : "rgba(255,255,255,0.02)",
                  cursor: "pointer",
                  boxShadow: isActive ? `0 0 18px color-mix(in srgb, var(--os-accent) 25%, transparent)` : "none",
                  transition: "all 0.2s",
                  position: "relative",
                }}
              >
                <span style={{
                  fontSize: 26,
                  color: isActive ? cursorColor : "rgba(255,255,255,0.5)",
                  filter: isActive ? `drop-shadow(0 0 8px ${cursorColor}99)` : "none",
                  transition: "all 0.2s",
                }}>
                  {shape.preview}
                </span>
                <div style={{ fontFamily: "monospace", fontSize: 10, color: isActive ? "var(--os-accent)" : "rgba(255,255,255,0.5)", fontWeight: isActive ? 700 : 400, letterSpacing: "0.04em" }}>
                  {shape.label}
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 8, color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em" }}>
                  {shape.desc}
                </div>
                {isActive && (
                  <div style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%", background: "var(--os-accent)", boxShadow: "0 0 6px var(--os-accent)" }} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Color selector */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em" }}>
          CURSOR COLOR
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(11, 1fr)",
          gap: 8,
          padding: "14px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10,
        }}>
          {ACCENT_COLORS.map((color) => {
            const isSelected = cursorColor === color.hex;
            return (
              <motion.button
                key={color.hex}
                title={color.label}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCursorColor(color.hex)}
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  borderRadius: "50%",
                  background: color.hex,
                  border: isSelected ? `2px solid #ffffff` : "2px solid transparent",
                  cursor: "pointer",
                  boxShadow: isSelected ? `0 0 12px ${color.hex}cc, 0 0 4px ${color.hex}` : `0 0 6px ${color.hex}55`,
                  padding: 0,
                  outline: "none",
                  transition: "all 0.15s",
                  position: "relative",
                }}
              >
                {isSelected && (
                  <Check size={9} color="#000" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
                )}
              </motion.button>
            );
          })}
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>
          SELECTED: <span style={{ color: cursorColor, textShadow: `0 0 8px ${cursorColor}` }}>{ACCENT_COLORS.find(c => c.hex === cursorColor)?.label ?? cursorColor}</span>
        </div>
      </div>

      <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>
        ↑ CURSOR CHANGES APPLY INSTANTLY ACROSS THE ENTIRE OS
      </div>
    </div>
  );
}

function ThemesTab() {
  const themeAccent = useOSStore((s) => s.themeAccent);
  const setThemeAccent = useOSStore((s) => s.setThemeAccent);

  const UI_PREVIEWS = [
    { label: "Taskbar Active", sample: "bg" },
    { label: "Start Menu Border", sample: "border" },
    { label: "Window Focus Ring", sample: "glow" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <p style={{ fontFamily: "monospace", fontSize: 10, color: "var(--os-accent)", letterSpacing: "0.15em", margin: 0, opacity: 0.7 }}>
        GLOBAL THEME ENGINE
      </p>

      {/* Live preview banner */}
      <div style={{
        padding: "16px 20px",
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${themeAccent}44`,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: `0 0 24px ${themeAccent}18`,
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${themeAccent}22, ${themeAccent}08)`,
          border: `1px solid ${themeAccent}55`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 0 16px ${themeAccent}44`,
        }}>
          <Sparkles size={20} color={themeAccent} />
        </div>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 13, color: themeAccent, fontWeight: 700, textShadow: `0 0 12px ${themeAccent}88` }}>
            {ACCENT_COLORS.find(c => c.hex === themeAccent)?.label ?? "Custom Color"}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginTop: 3 }}>
            ACTIVE ACCENT · {themeAccent.toUpperCase()} · LIVE ACROSS ALL UI
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {UI_PREVIEWS.map((p) => (
            <div key={p.label} title={p.label} style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: p.sample === "bg" ? `${themeAccent}22` : "transparent",
              border: p.sample === "border" ? `1px solid ${themeAccent}` : p.sample === "glow" ? `1px solid ${themeAccent}55` : "1px solid rgba(255,255,255,0.1)",
              boxShadow: p.sample === "glow" ? `0 0 8px ${themeAccent}88` : "none",
            }} />
          ))}
        </div>
      </div>

      {/* Color swatches */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em" }}>
          SELECT ACCENT COLOR
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(11, 1fr)",
          gap: 10,
          padding: "18px",
          background: "rgba(255,255,255,0.015)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
        }}>
          {ACCENT_COLORS.map((color) => {
            const isSelected = themeAccent === color.hex;
            return (
              <motion.button
                key={color.hex}
                title={color.label}
                whileHover={{ scale: 1.25, y: -2 }}
                whileTap={{ scale: 0.88 }}
                onClick={() => setThemeAccent(color.hex)}
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  borderRadius: "50%",
                  background: color.hex,
                  border: isSelected ? "2.5px solid #ffffff" : "2px solid transparent",
                  cursor: "pointer",
                  boxShadow: isSelected
                    ? `0 0 20px ${color.hex}cc, 0 0 8px ${color.hex}, 0 0 2px #fff`
                    : `0 0 8px ${color.hex}44`,
                  padding: 0,
                  outline: "none",
                  transition: "all 0.15s",
                  position: "relative",
                }}
              >
                {isSelected && (
                  <Check size={10} color={color.hex === "#ffffff" ? "#000" : "#000"} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Labels row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(11, 1fr)", gap: 10, padding: "0 18px" }}>
          {ACCENT_COLORS.map((color) => (
            <div key={color.hex} style={{
              fontFamily: "monospace",
              fontSize: 7,
              color: themeAccent === color.hex ? color.hex : "rgba(255,255,255,0.2)",
              textAlign: "center",
              letterSpacing: "0.02em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textShadow: themeAccent === color.hex ? `0 0 6px ${color.hex}` : "none",
              transition: "all 0.2s",
            }}>
              {color.label.split(" ")[0]}
            </div>
          ))}
        </div>
      </div>

      {/* Info callout */}
      <div style={{
        padding: "12px 16px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 8,
        fontFamily: "monospace",
        fontSize: 9,
        color: "rgba(255,255,255,0.25)",
        letterSpacing: "0.08em",
        lineHeight: 1.7,
      }}>
        ↑ THE ACCENT COLOR IS APPLIED GLOBALLY — START MENU, WINDOW BORDERS,
        HOVER EFFECTS, AND ACTIVE INDICATORS REACT INSTANTLY.
      </div>
    </div>
  );
}

function TaskbarTab() {
  const [taskbarLocation, setTaskbarLocation] = useState("Bottom");
  const [combineButtons, setCombineButtons] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [autoHide, setAutoHide] = useState(false);

  const locations = ["Bottom", "Top", "Left", "Right"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "relative" }}>
      {/* KERNEL LOCKED overlay */}
      <div
        style={{
          position: "absolute",
          inset: -8,
          zIndex: 10,
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          background: "rgba(5,5,5,0.65)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          borderRadius: 8,
          border: "1px solid rgba(255,50,50,0.15)",
        }}
      >
        <motion.div
          animate={{
            boxShadow: [
              "0 0 20px rgba(255,50,50,0.3), 0 0 40px rgba(255,50,50,0.1)",
              "0 0 30px rgba(255,50,50,0.5), 0 0 60px rgba(255,50,50,0.2)",
              "0 0 20px rgba(255,50,50,0.3), 0 0 40px rgba(255,50,50,0.1)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "rgba(255,30,30,0.08)",
            border: "1px solid rgba(255,60,60,0.4)",
            borderRadius: 10,
            padding: "18px 28px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 13,
              fontWeight: 800,
              color: "#ff4444",
              letterSpacing: "0.12em",
              textShadow: "0 0 12px rgba(255,60,60,0.8)",
            }}
          >
            UNABLE TO ACCESS
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              color: "rgba(255,100,100,0.7)",
              letterSpacing: "0.2em",
              marginTop: 6,
              border: "1px solid rgba(255,60,60,0.3)",
              borderRadius: 4,
              padding: "4px 12px",
              background: "rgba(255,30,30,0.06)",
            }}
          >
            KERNEL LOCKED
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 10, letterSpacing: "0.1em" }}>
            TASKBAR CONTROLS RESERVED FOR FUTURE KERNEL UPDATE
          </div>
        </motion.div>
      </div>
      <p style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(0,240,255,0.5)", letterSpacing: "0.15em", margin: 0 }}>
        MONIX TASKBAR SETTINGS
      </p>

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", marginBottom: 8 }}>
          TASKBAR LOCATION
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
          {locations.map((loc) => (
            <motion.button
              key={loc}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTaskbarLocation(loc)}
              style={{
                padding: "10px",
                borderRadius: 7,
                border: taskbarLocation === loc ? "1px solid rgba(0,240,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
                background: taskbarLocation === loc ? "rgba(0,240,255,0.08)" : "rgba(255,255,255,0.02)",
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: 11,
                color: taskbarLocation === loc ? "#00f0ff" : "rgba(255,255,255,0.5)",
                fontWeight: taskbarLocation === loc ? 600 : 400,
                textAlign: "center",
                transition: "all 0.2s",
                boxShadow: taskbarLocation === loc ? "0 0 12px rgba(0,240,255,0.1)" : "none",
              }}
            >
              {loc}
            </motion.button>
          ))}
        </div>
        <p style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 4, letterSpacing: "0.08em" }}>
          SIMULATED · VISUAL ONLY
        </p>
      </div>

      {[
        { label: "Combine Taskbar Buttons", desc: "Group windows from the same app", value: combineButtons, set: setCombineButtons },
        { label: "Show Window Labels",      desc: "Display app name next to icon",  value: showLabels,      set: setShowLabels      },
        { label: "Auto-hide Taskbar",       desc: "Hide when not in use",           value: autoHide,        set: setAutoHide        },
      ].map(({ label, desc, value, set }) => (
        <div
          key={label}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{label}</div>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 3, letterSpacing: "0.08em" }}>{desc}</div>
          </div>
          <motion.div
            onClick={() => set((v: boolean) => !v)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              background: value ? "rgba(0,240,255,0.25)" : "rgba(255,255,255,0.08)",
              border: value ? "1px solid rgba(0,240,255,0.4)" : "1px solid rgba(255,255,255,0.12)",
              cursor: "pointer",
              position: "relative",
              flexShrink: 0,
              transition: "background 0.2s, border-color 0.2s",
              boxShadow: value ? "0 0 10px rgba(0,240,255,0.2)" : "none",
            }}
          >
            <motion.div
              animate={{ x: value ? 22 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              style={{
                position: "absolute",
                top: 3,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: value ? "#00f0ff" : "rgba(255,255,255,0.4)",
                boxShadow: value ? "0 0 8px rgba(0,240,255,0.7)" : "none",
              }}
            />
          </motion.div>
        </div>
      ))}
    </div>
  );
}

function SystemInfoTab({ onOpenTaskManager }: { onOpenTaskManager?: () => void }) {
  const uptime = useUptime();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
        <motion.h1
          animate={{
            textShadow: [
              "0 0 10px rgba(0,240,255,0.6), 0 0 30px rgba(0,240,255,0.3)",
              "0 0 20px rgba(0,240,255,0.9), 0 0 50px rgba(0,240,255,0.5)",
              "0 0 10px rgba(0,240,255,0.6), 0 0 30px rgba(0,240,255,0.3)",
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontFamily: "monospace", fontSize: 26, fontWeight: 900, color: "#ffffff", letterSpacing: "0.25em", margin: 0 }}
        >
          MONIX OS
        </motion.h1>
        <div style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(0,240,255,0.6)", letterSpacing: "0.2em", marginTop: 4 }}>
          v1.0.0 · STABLE
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "SYSTEM TYPE",   value: "WEB-OPERATING SYSTEM" },
          { label: "ARCHITECTURE",  value: "React / TypeScript" },
          { label: "KERNEL",        value: "MONIX 6.7 LTS" },
          { label: "UPTIME",        value: uptime, live: true },
          { label: "SHELL",         value: "monix-sh 5.2.1" },
          { label: "DISPLAY",       value: "Chromium Renderer" },
          { label: "MEMORY",        value: "16 GB DDR5" },
          { label: "CPU CORES",     value: "8-Core · x86_64" },
        ].map(({ label, value, live }) => (
          <div
            key={label}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 8,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontFamily: "monospace", fontSize: 8, color: "rgba(0,240,255,0.4)", letterSpacing: "0.15em", marginBottom: 5 }}>
              {label}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                color: live ? "#00ff88" : "rgba(255,255,255,0.8)",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textShadow: live ? "0 0 8px rgba(0,255,136,0.5)" : "none",
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {onOpenTaskManager && (
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(0,255,136,0.3)" }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenTaskManager}
          style={{
            width: "100%",
            padding: "14px 20px",
            background: "rgba(0,255,136,0.06)",
            border: "1px solid rgba(0,255,136,0.25)",
            borderRadius: 10,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Activity size={18} color="#00ff88" style={{ filter: "drop-shadow(0 0 6px rgba(0,255,136,0.8))" }} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#00ff88", fontWeight: 700, letterSpacing: "0.08em" }}>
                Open Task Manager
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(0,255,136,0.45)", marginTop: 2, letterSpacing: "0.08em" }}>
                PROCESSES · CPU · RAM · FPS · UPTIME
              </div>
            </div>
          </div>
          <span style={{ fontFamily: "monospace", fontSize: 18, color: "rgba(0,255,136,0.6)" }}>→</span>
        </motion.button>
      )}

      <div
        style={{
          textAlign: "center",
          padding: "16px 20px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 10,
        }}
      >
        <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", marginBottom: 8 }}>
          DESIGNED & DEVELOPED BY
        </div>
        <motion.div
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{
            fontFamily: "monospace",
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: "0.3em",
            background: "linear-gradient(90deg, #ffd700, #00f0ff, #ffd700, #00f0ff)",
            backgroundSize: "300% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          MONISH
        </motion.div>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", marginTop: 6 }}>
          MONIX OS SIMULATION · ALL RIGHTS RESERVED
        </div>
      </div>
    </div>
  );
}

export default function SettingsApp({
  onClose,
  onMinimize,
  isActive,
  onFocus,
  initialX,
  initialY,
  zIndex,
  onOpenTaskManager,
}: SettingsAppProps) {
  const [activeTab, setActiveTab] = useState<Tab>("personalization");

  return (
    <WindowChrome
      title="Settings"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
      width={820}
      height={580}
    >
      <style>{`
        .settings-scroll::-webkit-scrollbar { width: 5px; }
        .settings-scroll::-webkit-scrollbar-track { background: transparent; }
        .settings-scroll::-webkit-scrollbar-thumb { background: rgba(0,240,255,0.25); border-radius: 3px; }
      `}</style>

      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#050505",
          display: "flex",
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: 200,
            flexShrink: 0,
            borderRight: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.01)",
            display: "flex",
            flexDirection: "column",
            padding: "16px 10px",
            gap: 4,
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.2em",
              padding: "0 8px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              marginBottom: 8,
            }}
          >
            MONIX SETTINGS
          </div>

          {TABS.map((tab) => {
            const isTabActive = activeTab === tab.id;
            const isLocked = tab.locked;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ x: isLocked ? 0 : 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 7,
                  border: "none",
                  cursor: "pointer",
                  background: isTabActive
                    ? isLocked
                      ? "linear-gradient(90deg, rgba(255,50,50,0.08), rgba(255,50,50,0.02))"
                      : "linear-gradient(90deg, color-mix(in srgb, var(--os-accent) 10%, transparent), color-mix(in srgb, var(--os-accent) 3%, transparent))"
                    : "transparent",
                  borderLeft: isTabActive
                    ? isLocked ? "2px solid rgba(255,80,80,0.7)" : "2px solid var(--os-accent)"
                    : "2px solid transparent",
                  color: isLocked
                    ? isTabActive ? "rgba(255,100,100,0.8)" : "rgba(255,100,100,0.45)"
                    : isTabActive ? "var(--os-accent)" : "rgba(255,255,255,0.5)",
                  fontSize: 12,
                  fontWeight: isTabActive ? 600 : 400,
                  textAlign: "left",
                  width: "100%",
                  transition: "all 0.2s",
                  boxShadow: isTabActive && !isLocked ? "inset 0 0 12px color-mix(in srgb, var(--os-accent) 6%, transparent)" : "none",
                  position: "relative",
                }}
              >
                <span style={{ opacity: isTabActive ? 1 : 0.6 }}>{tab.icon}</span>
                <span style={{ flex: 1 }}>{tab.label}</span>
                {isLocked && (
                  <span style={{
                    fontSize: 8,
                    color: "rgba(255,80,80,0.7)",
                    fontFamily: "monospace",
                    letterSpacing: "0.04em",
                    background: "rgba(255,50,50,0.1)",
                    border: "1px solid rgba(255,80,80,0.3)",
                    borderRadius: 3,
                    padding: "1px 4px",
                    flexShrink: 0,
                  }}>
                    🔒
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Content area */}
        <div
          className="settings-scroll"
          style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "personalization" && <PersonalizationTab />}
              {activeTab === "system" && <SystemInfoTab onOpenTaskManager={onOpenTaskManager} />}
              {activeTab === "themes" && (
                <LockedSection label="THEMES ENGINE — UNDER ACTIVE DEVELOPMENT">
                  <ThemesTab />
                </LockedSection>
              )}
              {activeTab === "cursor" && (
                <LockedSection label="CURSOR CUSTOMIZATION — UNDER ACTIVE DEVELOPMENT">
                  <CursorTab />
                </LockedSection>
              )}
              {activeTab === "taskbar" && (
                <LockedSection label="TASKBAR CONFIGURATION — RESTRICTED MODULE">
                  <TaskbarTab />
                </LockedSection>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </WindowChrome>
  );
}
