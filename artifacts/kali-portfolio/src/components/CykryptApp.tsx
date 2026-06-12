import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ChevronLeft, ArrowRight, Zap } from "lucide-react";
import WindowChrome from "./WindowChrome";

interface CykryptAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

type Difficulty = "Easy" | "Medium" | "Hard";

interface Challenge {
  id: number;
  title: string;
  difficulty: Difficulty;
  desc: string;
  url: string;
}

const challenges: Challenge[] = [
  {
    id: 1,
    title: "TEMPORAL ENIGMA",
    difficulty: "Hard",
    desc: "You are presented with an animated analog clock surrounded by a Matrix-style rain effect. The clock appears to be ordinary, but it holds a secret sequence that must be unlocked by interacting with it at specific moments in time.",
    url: "https://ctf-web-enigma.vercel.app",
  },
  {
    id: 2,
    title: "PIXEL LABYRINTH",
    difficulty: "Hard",
    desc: "Navigate your mouse through a field of dynamic noise to discover 8 hidden pixels in a specific sequence. Each pixel is invisible until your cursor approaches it, and they must be found in the correct order to reveal the flag.",
    url: "https://ctf-web-pixel-labyrinth.vercel.app",
  },
  {
    id: 3,
    title: "RHYTHM LOCK",
    difficulty: "Medium",
    desc: "Unlock the flag by tapping a sequence of musical notes with precise timing intervals. Like a rhythm game, you must press the correct notes at the right tempo to unlock the sequence.",
    url: "https://ctf-web-rhythm-lock.vercel.app",
  },
  {
    id: 4,
    title: "MEMORY MAZE",
    difficulty: "Medium",
    desc: "A Simon-says style memory game with 5 increasingly difficult levels. Watch as a pattern of cells lights up in sequence, then recreate the exact same pattern from memory.",
    url: "https://ctf-web-memory-maze.vercel.app/",
  },
  {
    id: 5,
    title: "COOKIE MANIPULATION",
    difficulty: "Easy",
    desc: "This challenge tests the participant's ability to inspect browser storage and manipulate hex-encoded cookies to escalate privileges.",
    url: "https://ctf-web-cookiemanipulation.vercel.app/",
  },
  {
    id: 6,
    title: "EMPLOYEE PORTAL (OBSIDIAN VAULT)",
    difficulty: "Medium",
    desc: "This challenge involves inspecting the sterile client-side JavaScript, discovering hidden comments, and interacting with WebAssembly.",
    url: "https://ctf-web-employeeportal.vercel.app/",
  },
  {
    id: 7,
    title: "PROTOTYPE POLLUTION",
    difficulty: "Hard",
    desc: "This challenge involves exploiting a recursive merge function to achieve Prototype Pollution, weaponizing it via a template evaluation gadget.",
    url: "https://ctf-web-prototype-pollution.vercel.app/",
  },
];

const difficultyConfig: Record<Difficulty, { label: string; color: string; glow: string; bg: string }> = {
  Easy: {
    label: "EASY",
    color: "#00ff00",
    glow: "0 0 8px #00ff00, 0 0 16px rgba(0,255,0,0.4)",
    bg: "rgba(0,255,0,0.08)",
  },
  Medium: {
    label: "MEDIUM",
    color: "#ffaa00",
    glow: "0 0 8px #ffaa00, 0 0 16px rgba(255,170,0,0.4)",
    bg: "rgba(255,170,0,0.08)",
  },
  Hard: {
    label: "HARD",
    color: "#ff2244",
    glow: "0 0 8px #ff2244, 0 0 16px rgba(255,34,68,0.4)",
    bg: "rgba(255,34,68,0.08)",
  },
};

function TypingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    idx.current = 0;
    const interval = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 14);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && (
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: "1em",
            background: "#00f0ff",
            marginLeft: 2,
            verticalAlign: "text-bottom",
            animation: "blink 1s step-end infinite",
          }}
        />
      )}
    </span>
  );
}

export default function CykryptApp({
  onClose,
  onMinimize,
  isActive,
  onFocus,
  initialX,
  initialY,
  zIndex,
}: CykryptAppProps) {
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [launching, setLaunching] = useState(false);

  const handleSelect = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setView("detail");
  };

  const handleBack = () => {
    setView("list");
    setSelectedChallenge(null);
    setLaunching(false);
  };

  const handleLaunch = () => {
    if (!selectedChallenge) return;
    setLaunching(true);
    setTimeout(() => {
      window.open(selectedChallenge.url, "_blank", "noopener,noreferrer");
      setLaunching(false);
    }, 600);
  };

  return (
    <WindowChrome
      title="CYKRYPT — CTF Arena"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
      width={980}
      height={640}
    >
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes glitch {
          0%   { text-shadow: 2px 0 #00f0ff, -2px 0 #ff0055; transform: none; }
          15%  { text-shadow: -2px 0 #00f0ff,  2px 0 #ff0055; transform: skewX(0.5deg); }
          30%  { text-shadow: 2px 0 #00f0ff, -2px 0 #ff0055; transform: none; }
          100% { text-shadow: 2px 0 #00f0ff, -2px 0 #ff0055; transform: none; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(0,240,255,0.4), 0 0 24px rgba(0,240,255,0.2), inset 0 0 10px rgba(0,240,255,0.05); }
          50%       { box-shadow: 0 0 20px rgba(0,240,255,0.7), 0 0 40px rgba(0,240,255,0.35), inset 0 0 18px rgba(0,240,255,0.1); }
        }
        @keyframes scanline {
          0%   { background-position: 0 0; }
          100% { background-position: 0 100px; }
        }
        .cykrypt-scroll::-webkit-scrollbar { width: 6px; }
        .cykrypt-scroll::-webkit-scrollbar-track { background: #050505; }
        .cykrypt-scroll::-webkit-scrollbar-thumb { background: #00f0ff; border-radius: 3px; }
        .cykrypt-scroll { scrollbar-color: #00f0ff #050505; }
        .glitch-text { animation: glitch 4s ease-in-out infinite; }
      `}</style>

      <div
        className="cykrypt-scroll w-full h-full overflow-y-auto"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,240,255,0.06) 0%, #050505 60%)",
          fontFamily: "sans-serif",
        }}
      >
        <AnimatePresence mode="wait">
          {view === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{ padding: "32px 36px 48px" }}
            >
              {/* Hero Header */}
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                    background: "rgba(0,240,255,0.05)",
                    border: "1px solid rgba(0,240,255,0.15)",
                    borderRadius: 4,
                    padding: "4px 14px",
                  }}
                >
                  <Terminal size={11} color="#00f0ff" />
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: "#00f0ff",
                      letterSpacing: "0.25em",
                    }}
                  >
                    [ LIVE WEB EXPLOITATION HUB ]
                  </span>
                </div>
                <h1
                  className="glitch-text"
                  style={{
                    fontSize: 42,
                    fontWeight: 900,
                    letterSpacing: "0.18em",
                    color: "#ffffff",
                    margin: 0,
                    lineHeight: 1.1,
                  }}
                >
                  CYKRYPT ARENA
                </h1>
                <p
                  style={{
                    marginTop: 10,
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "rgba(0,240,255,0.5)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {challenges.length} ACTIVE MISSIONS &nbsp;·&nbsp; SELECT A TARGET TO BEGIN
                </p>
              </div>

              {/* Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
                  gap: 18,
                }}
              >
                {challenges.map((challenge, i) => {
                  const diff = difficultyConfig[challenge.difficulty];
                  return (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.06 }}
                      whileHover={{
                        y: -4,
                        borderColor: "rgba(0,240,255,0.5)",
                        boxShadow: "0 0 20px rgba(0,240,255,0.15), 0 8px 32px rgba(0,0,0,0.6)",
                      }}
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 10,
                        padding: "20px 20px 18px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        cursor: "pointer",
                        transition: "border-color 0.2s",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {/* Subtle top accent line */}
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 1,
                          background: "linear-gradient(90deg, transparent, rgba(0,240,255,0.3), transparent)",
                        }}
                      />

                      {/* Header row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 10,
                            color: "rgba(0,240,255,0.35)",
                            letterSpacing: "0.15em",
                          }}
                        >
                          #{String(challenge.id).padStart(2, "0")}
                        </span>
                        {/* Difficulty badge */}
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 10,
                            fontWeight: 700,
                            color: diff.color,
                            background: diff.bg,
                            border: `1px solid ${diff.color}`,
                            borderRadius: 20,
                            padding: "2px 10px",
                            letterSpacing: "0.1em",
                            boxShadow: diff.glow,
                          }}
                        >
                          {diff.label}
                        </span>
                      </div>

                      <h3
                        style={{
                          margin: 0,
                          fontFamily: "monospace",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#e0e0e0",
                          letterSpacing: "0.08em",
                          lineHeight: 1.3,
                        }}
                      >
                        {challenge.title}
                      </h3>

                      <p
                        style={{
                          margin: 0,
                          fontSize: 11.5,
                          color: "rgba(180,190,200,0.65)",
                          lineHeight: 1.65,
                          flex: 1,
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {challenge.desc}
                      </p>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSelect(challenge)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 7,
                          marginTop: 4,
                          padding: "9px 0",
                          background: "rgba(0,240,255,0.07)",
                          border: "1px solid rgba(0,240,255,0.25)",
                          borderRadius: 6,
                          color: "#00f0ff",
                          fontSize: 11,
                          fontFamily: "monospace",
                          fontWeight: 700,
                          letterSpacing: "0.15em",
                          cursor: "pointer",
                          transition: "background 0.2s, border-color 0.2s",
                        }}
                      >
                        <Terminal size={12} />
                        VIEW MISSION
                        <ArrowRight size={12} />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              style={{ padding: "32px 48px 56px", maxWidth: 760, margin: "0 auto" }}
            >
              {/* Back button */}
              <motion.button
                whileHover={{ x: -3, color: "#00f0ff" }}
                onClick={handleBack}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "none",
                  border: "none",
                  color: "rgba(0,240,255,0.5)",
                  fontFamily: "monospace",
                  fontSize: 11,
                  letterSpacing: "0.15em",
                  cursor: "pointer",
                  padding: 0,
                  marginBottom: 36,
                  transition: "color 0.2s",
                }}
              >
                <ChevronLeft size={14} />
                RETURN TO HUB
              </motion.button>

              {selectedChallenge && (
                <>
                  {/* Difficulty badge */}
                  <div style={{ marginBottom: 12 }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        fontWeight: 700,
                        color: difficultyConfig[selectedChallenge.difficulty].color,
                        background: difficultyConfig[selectedChallenge.difficulty].bg,
                        border: `1px solid ${difficultyConfig[selectedChallenge.difficulty].color}`,
                        borderRadius: 20,
                        padding: "3px 14px",
                        letterSpacing: "0.1em",
                        boxShadow: difficultyConfig[selectedChallenge.difficulty].glow,
                      }}
                    >
                      {difficultyConfig[selectedChallenge.difficulty].label}
                    </span>
                  </div>

                  {/* Challenge title */}
                  <h2
                    style={{
                      fontSize: 32,
                      fontWeight: 900,
                      fontFamily: "monospace",
                      letterSpacing: "0.14em",
                      color: "#ffffff",
                      margin: "0 0 32px",
                      textShadow: "0 0 20px rgba(0,240,255,0.4), 0 0 40px rgba(0,240,255,0.15)",
                      lineHeight: 1.2,
                    }}
                  >
                    {selectedChallenge.title}
                  </h2>

                  {/* Terminal briefing box */}
                  <div
                    style={{
                      background: "rgba(0,0,0,0.6)",
                      border: "1px solid rgba(0,240,255,0.18)",
                      borderRadius: 8,
                      padding: "24px 28px",
                      marginBottom: 36,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Scanline overlay */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage:
                          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,240,255,0.015) 2px, rgba(0,240,255,0.015) 4px)",
                        pointerEvents: "none",
                      }}
                    />
                    {/* Terminal header bar */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 18,
                        paddingBottom: 12,
                        borderBottom: "1px solid rgba(0,240,255,0.1)",
                      }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff3b30" }} />
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffcc00" }} />
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff55" }} />
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 10,
                          color: "rgba(0,240,255,0.4)",
                          marginLeft: 8,
                          letterSpacing: "0.12em",
                        }}
                      >
                        mission_briefing.sh
                      </span>
                    </div>

                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: 13,
                        color: "rgba(200,220,230,0.85)",
                        lineHeight: 1.85,
                        position: "relative",
                      }}
                    >
                      <span style={{ color: "rgba(0,240,255,0.5)", marginRight: 8 }}>$</span>
                      <TypingText text={selectedChallenge.desc} />
                    </div>
                  </div>

                  {/* Launch button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleLaunch}
                    disabled={launching}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      width: "100%",
                      padding: "18px 0",
                      background: launching
                        ? "rgba(0,240,255,0.06)"
                        : "linear-gradient(135deg, rgba(0,240,255,0.12) 0%, rgba(0,200,220,0.08) 100%)",
                      border: "1px solid rgba(0,240,255,0.45)",
                      borderRadius: 10,
                      color: "#00f0ff",
                      fontSize: 14,
                      fontFamily: "monospace",
                      fontWeight: 700,
                      letterSpacing: "0.2em",
                      cursor: launching ? "wait" : "pointer",
                      animation: launching ? "none" : "pulseGlow 2.5s ease-in-out infinite",
                    }}
                  >
                    {launching ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                        >
                          <Zap size={18} />
                        </motion.div>
                        INITIALIZING...
                      </>
                    ) : (
                      <>
                        <Zap size={18} />
                        INITIALIZE LIVE EXPLOIT
                        <ArrowRight size={16} />
                      </>
                    )}
                  </motion.button>

                  <p
                    style={{
                      fontFamily: "monospace",
                      fontSize: 10,
                      color: "rgba(0,240,255,0.25)",
                      textAlign: "center",
                      marginTop: 14,
                      letterSpacing: "0.1em",
                    }}
                  >
                    OPENS IN NEW TAB · EXTERNAL ENVIRONMENT · PROCEED WITH CAUTION
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </WindowChrome>
  );
}
