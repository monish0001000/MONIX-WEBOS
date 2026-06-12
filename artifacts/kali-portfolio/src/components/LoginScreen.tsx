import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useOSStore } from "@/lib/store";
import wallpaperFallback from "@assets/kali-ferrofluid_1775178957082.jpg";

interface LoginScreenProps {
  onLogin: () => void;
  isLockMode?: boolean;
}

const CORRECT_PASSWORD = "2005";
const USERNAME = "monish";

export default function LoginScreen({ onLogin, isLockMode = false }: LoginScreenProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [time, setTime] = useState(new Date());
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentWallpaper = useOSStore((s) => s.currentWallpaper);

  const bgImage = isLockMode ? currentWallpaper : wallpaperFallback;

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
    return () => clearTimeout(timeout);
  }, []);

  const handleSubmit = () => {
    if (isLockMode) {
      if (password === CORRECT_PASSWORD || password === "") {
        setError(false);
        onLogin();
      } else {
        triggerError();
      }
    } else {
      if (password === CORRECT_PASSWORD || password === "") {
        setError(false);
        onLogin();
      } else {
        triggerError();
      }
    }
  };

  const triggerError = () => {
    setError(true);
    setShake(true);
    setPassword("");
    setTimeout(() => {
      setShake(false);
      setError(false);
      inputRef.current?.focus();
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <motion.div
      className="fixed inset-0 select-none font-sans"
      style={{ background: "#000000", zIndex: isLockMode ? 99999 : 40 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Blurred background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(16px) brightness(0.35)",
          transform: "scale(1.05)",
        }}
      />

      {/* Dark overlay */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 0,
        }}
      >
        {/* Time */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 200,
              color: "rgba(255,255,255,0.95)",
              letterSpacing: "-2px",
              lineHeight: 1,
              fontFamily: "'Ubuntu', sans-serif",
            }}
          >
            {format(time, "HH:mm")}
          </div>
          <div
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.6)",
              marginTop: 8,
              fontWeight: 300,
              letterSpacing: "0.05em",
            }}
          >
            {format(time, "EEEE, MMMM d")}
          </div>
        </div>

        {/* Login card */}
        <motion.div
          animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1e3a6e 0%, #367BF0 100%)",
              border: "3px solid rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
              marginBottom: 4,
            }}
          >
            <svg viewBox="0 0 48 48" width="44" height="44" fill="none">
              <circle cx="24" cy="18" r="9" fill="rgba(255,255,255,0.9)" />
              <path
                d="M6 42c0-9.94 8.06-18 18-18s18 8.06 18 18"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Username */}
          <div
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.9)",
              fontWeight: 400,
              letterSpacing: "0.04em",
            }}
          >
            {USERNAME}
            {isLockMode && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>
                (locked)
              </span>
            )}
          </div>

          {/* Password field */}
          <div style={{ position: "relative", width: 220 }}>
            <div
              onClick={() => inputRef.current?.focus()}
              style={{
                width: "100%",
                height: 38,
                background: "rgba(255,255,255,0.1)",
                border: focused
                  ? "1px solid rgba(54,123,240,0.8)"
                  : "1px solid rgba(255,255,255,0.2)",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                paddingLeft: 12,
                paddingRight: 36,
                boxSizing: "border-box",
                cursor: "text",
                backdropFilter: "blur(4px)",
                transition: "border-color 0.2s",
                boxShadow: focused ? "0 0 0 2px rgba(54,123,240,0.2)" : "none",
              }}
            >
              {password.length > 0 ? (
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {Array.from({ length: password.length }).map((_, i) => (
                    <div
                      key={i}
                      style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.9)" }}
                    />
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: "0.03em" }}>
                  Password
                </span>
              )}
            </div>

            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={{ position: "absolute", opacity: 0, top: 0, left: 0, width: "100%", height: "100%", cursor: "text" }}
              autoComplete="off"
              autoFocus
            />

            <button
              onClick={handleSubmit}
              style={{
                position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                width: 24, height: 24, background: "rgba(54,123,240,0.7)",
                border: "none", borderRadius: 3, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", color: "white",
              }}
            >
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ fontSize: 12, color: "#f87171", letterSpacing: "0.02em" }}
              >
                Incorrect password. Try again.
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4, letterSpacing: "0.03em" }}>
            {isLockMode ? "Enter password to unlock" : "Press Enter to log in"}
          </div>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 36,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingLeft: 20, paddingRight: 20,
          background: "rgba(0,0,0,0.4)", borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>MONIX OS</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>monish</div>
      </div>
    </motion.div>
  );
}
