import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TerminalSquare, FolderOpen, Monitor, Github, Trash2,
  Lock, Settings, Power, Search, Globe, Shield, Sparkles,
  Crown, Activity, Map, FileCode, PenTool, Phone, FileWarning,
  LogOut, RefreshCw, LayoutGrid, Wifi, Cpu, Wrench,
} from "lucide-react";
import { useOSStore } from "@/lib/store";

interface StartMenuProps {
  open: boolean;
  onClose: () => void;
  onOpenWindow: (id: string) => void;
}

type Category = "all" | "internet" | "system" | "accessories";

interface AppDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  categories: Category[];
}

const ALL_APPS: AppDef[] = [
  {
    id: "browser",
    label: "Browser",
    icon: <Globe size={20} strokeWidth={1.6} />,
    color: "#7ec8e3",
    bg: "rgba(126,200,227,0.1)",
    categories: ["internet"],
  },
  {
    id: "github",
    label: "GitHub",
    icon: <Github size={20} strokeWidth={1.6} />,
    color: "#e0e0e0",
    bg: "rgba(224,224,224,0.1)",
    categories: ["internet"],
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: <Monitor size={20} strokeWidth={1.6} />,
    color: "#90d090",
    bg: "rgba(144,208,144,0.1)",
    categories: ["internet"],
  },
  {
    id: "threatmap",
    label: "Threat Map",
    icon: <Map size={20} strokeWidth={1.6} />,
    color: "#ff6060",
    bg: "rgba(255,96,96,0.1)",
    categories: ["internet"],
  },
  {
    id: "terminal",
    label: "Terminal",
    icon: <TerminalSquare size={20} strokeWidth={1.6} />,
    color: "#c8e6c9",
    bg: "rgba(200,230,201,0.1)",
    categories: ["system"],
  },
  {
    id: "files",
    label: "Files",
    icon: <FolderOpen size={20} strokeWidth={1.6} />,
    color: "#90bfff",
    bg: "rgba(144,191,255,0.1)",
    categories: ["system"],
  },
  {
    id: "sentinel",
    label: "Sentinel SOC",
    icon: <Shield size={20} strokeWidth={1.6} />,
    color: "#00c4ff",
    bg: "rgba(0,163,255,0.1)",
    categories: ["system"],
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings size={20} strokeWidth={1.6} />,
    color: "#00d4ff",
    bg: "rgba(0,212,255,0.08)",
    categories: ["system"],
  },
  {
    id: "securecomm",
    label: "MONIX-COMM",
    icon: <Phone size={20} strokeWidth={1.6} />,
    color: "#00ffff",
    bg: "rgba(0,255,255,0.08)",
    categories: ["system"],
  },
  {
    id: "dossier",
    label: "Dossier",
    icon: <FileWarning size={20} strokeWidth={1.6} />,
    color: "#ff4444",
    bg: "rgba(255,68,68,0.08)",
    categories: ["system"],
  },
  {
    id: "trash",
    label: "Trash",
    icon: <Trash2 size={20} strokeWidth={1.6} />,
    color: "#aaaacc",
    bg: "rgba(170,170,204,0.1)",
    categories: ["system"],
  },
  {
    id: "aura",
    label: "AURA AI",
    icon: <Sparkles size={20} strokeWidth={1.6} />,
    color: "#c084fc",
    bg: "rgba(168,85,247,0.1)",
    categories: ["accessories"],
  },
  {
    id: "notepad",
    label: "Notepad",
    icon: <PenTool size={20} strokeWidth={1.6} />,
    color: "#7ecfff",
    bg: "rgba(126,207,255,0.08)",
    categories: ["accessories"],
  },
  {
    id: "codepad",
    label: "CodePad",
    icon: <FileCode size={20} strokeWidth={1.6} />,
    color: "#00c4ff",
    bg: "rgba(0,196,255,0.1)",
    categories: ["accessories"],
  },
  {
    id: "chess",
    label: "Grandmaster",
    icon: <Crown size={20} strokeWidth={1.6} />,
    color: "#ffd700",
    bg: "rgba(255,215,0,0.1)",
    categories: ["accessories"],
  },
];

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: "all",        label: "All Apps",    icon: <LayoutGrid size={14} strokeWidth={1.6} /> },
  { id: "internet",   label: "Internet",    icon: <Wifi size={14} strokeWidth={1.6} /> },
  { id: "system",     label: "System",      icon: <Cpu size={14} strokeWidth={1.6} /> },
  { id: "accessories",label: "Accessories", icon: <Wrench size={14} strokeWidth={1.6} /> },
];

export default function StartMenu({ open, onClose, onOpenWindow }: StartMenuProps) {
  const setLocked = useOSStore((s) => s.setLocked);
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");

  const filteredApps = useMemo(() => {
    let apps = activeCategory === "all"
      ? ALL_APPS
      : ALL_APPS.filter((a) => a.categories.includes(activeCategory));
    if (search.trim()) {
      const q = search.toLowerCase();
      apps = apps.filter((a) => a.label.toLowerCase().includes(q));
    }
    return apps;
  }, [activeCategory, search]);

  function handleOpen(id: string) {
    onOpenWindow(id);
    onClose();
    setSearch("");
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 490 }}
            onClick={() => { onClose(); setSearch(""); }}
          />

          {/* Menu panel */}
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: "fixed",
              bottom: 52,
              left: 8,
              width: "min(520px, calc(100vw - 16px))",
              maxHeight: "calc(100dvh - 64px)",
              zIndex: 500,
              background: "rgba(8, 8, 14, 0.92)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 10,
              boxShadow: "0 -16px 56px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,212,255,0.05)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              fontFamily: "inherit",
            }}
          >
            {/* ── Body: sidebar + main ───────────────────────────────────── */}
            <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

              {/* Left Sidebar */}
              <div
                style={{
                  width: 128,
                  flexShrink: 0,
                  borderRight: "1px solid rgba(255,255,255,0.07)",
                  padding: "14px 0 10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  background: "rgba(0,0,0,0.25)",
                }}
              >
                {/* User identity */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "linear-gradient(135deg, #1e3a6e 0%, #367BF0 100%)",
                      border: "2px solid rgba(0,212,255,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <svg viewBox="0 0 48 48" width="18" height="18" fill="none">
                      <circle cx="24" cy="18" r="9" fill="rgba(255,255,255,0.9)" />
                      <path d="M6 42c0-9.94 8.06-18 18-18s18 8.06 18 18" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.92)" }}>monish</div>
                    <div style={{ fontSize: 9, color: "rgba(0,212,255,0.6)", marginTop: 1, letterSpacing: "0.04em" }}>MONIX OS</div>
                  </div>
                </div>

                {/* Category list */}
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setActiveCategory(cat.id); setSearch(""); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 14px",
                        background: isActive ? "rgba(0,212,255,0.12)" : "transparent",
                        border: "none",
                        borderLeft: isActive ? "2px solid #00d4ff" : "2px solid transparent",
                        borderRight: "none",
                        borderTop: "none",
                        borderBottom: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      <span style={{ color: isActive ? "#00d4ff" : "rgba(255,255,255,0.45)" }}>{cat.icon}</span>
                      <span style={{ fontSize: 11.5, fontWeight: isActive ? 600 : 400, color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.55)" }}>
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Main app grid */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 8px" }}>
                {filteredApps.length === 0 ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.2)", fontSize: 12 }}>
                    No apps found
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))",
                      gap: 6,
                    }}
                  >
                    {filteredApps.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => handleOpen(app.id)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 6,
                          padding: "11px 4px 9px",
                          background: app.bg,
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: 8,
                          cursor: "pointer",
                          minWidth: 0,
                          transition: "background 0.13s, border-color 0.13s, transform 0.1s, box-shadow 0.13s",
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = "rgba(0,212,255,0.12)";
                          el.style.borderColor = "rgba(0,212,255,0.35)";
                          el.style.transform = "translateY(-1px)";
                          el.style.boxShadow = "0 0 12px rgba(0,212,255,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = app.bg;
                          el.style.borderColor = "rgba(255,255,255,0.06)";
                          el.style.transform = "translateY(0)";
                          el.style.boxShadow = "none";
                        }}
                      >
                        <div style={{ color: app.color }}>{app.icon}</div>
                        <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.78)", fontWeight: 500, textAlign: "center", lineHeight: 1.3 }}>
                          {app.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Bottom bar: Search + Power ─────────────────────────────── */}
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.07)",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(0,0,0,0.2)",
              }}
            >
              {/* Search */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  padding: "5px 10px",
                }}
              >
                <Search size={12} color="rgba(255,255,255,0.35)" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setActiveCategory("all"); }}
                  placeholder="Search apps..."
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: 11.5,
                    color: "rgba(255,255,255,0.85)",
                    width: "100%",
                    caretColor: "#00d4ff",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && filteredApps.length > 0) {
                      handleOpen(filteredApps[0].id);
                    }
                    if (e.key === "Escape") { onClose(); setSearch(""); }
                  }}
                />
              </div>

              {/* Power buttons */}
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <PowerBtn
                  icon={<LogOut size={13} />}
                  label="Log Out"
                  color="rgba(255,255,255,0.6)"
                  hoverColor="rgba(255,255,255,0.9)"
                  onClick={() => { setLocked(true); onClose(); }}
                />
                <PowerBtn
                  icon={<RefreshCw size={13} />}
                  label="Restart"
                  color="rgba(255,170,0,0.7)"
                  hoverColor="#ffaa00"
                  onClick={() => window.location.reload()}
                />
                <PowerBtn
                  icon={<Power size={13} />}
                  label="Shutdown"
                  color="rgba(239,68,68,0.7)"
                  hoverColor="#ef4444"
                  onClick={() => { setLocked(true); onClose(); }}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PowerBtn({
  icon,
  label,
  color,
  hoverColor,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  hoverColor: string;
  onClick: () => void;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        padding: "5px 9px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 6,
        cursor: "pointer",
        transition: "background 0.13s, border-color 0.13s",
        color,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = "rgba(255,255,255,0.1)";
        el.style.borderColor = "rgba(255,255,255,0.18)";
        el.style.color = hoverColor;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = "rgba(255,255,255,0.04)";
        el.style.borderColor = "rgba(255,255,255,0.08)";
        el.style.color = color;
      }}
    >
      {icon}
      <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.02em" }}>{label}</span>
    </button>
  );
}
