import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import BootScreen from "./components/BootScreen";
import LoginScreen from "./components/LoginScreen";
import Desktop from "./components/Desktop";
import NetworkHandler from "./components/NetworkHandler";
import { useOSStore } from "./lib/store";
import { preCacheWakeAudio } from "./lib/AuraService";

const queryClient = new QueryClient();

type Phase = "boot" | "login" | "desktop";

function useDisplayFilter() {
  const brightness = useOSStore((s) => s.brightness);
  const warmth = useOSStore((s) => s.warmth);
  const hasFilter = brightness !== 100 || warmth !== 0;
  return hasFilter ? `brightness(${brightness / 100}) sepia(${warmth / 50})` : undefined;
}

// ── Global AURA Wake Glow — clean neon border, NO corner symbols ──────────────
// Fix #4: corner L-brackets removed entirely — only the sleek cycling border.
function AuraWakeGlow() {
  const auraWakeActive   = useOSStore((s) => s.auraWakeActive);
  const auraHearingSound = useOSStore((s) => s.auraHearingSound);

  // Fix #5: pre-cache "Yes, Sir." audio on first render so wake is instant
  useEffect(() => {
    preCacheWakeAudio();
  }, []);

  return (
    <AnimatePresence>
      {auraWakeActive && (
        <motion.div
          key="aura-neon-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          transition={{ duration: 0.2 }}
          className={auraHearingSound ? 'aura-neon-border-active' : 'aura-neon-border'}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            pointerEvents: 'none',
          }}
        />
      )}
    </AnimatePresence>
  );
}

function AppInner() {
  const [phase, setPhase] = useState<Phase>("boot");
  const isLocked = useOSStore((s) => s.isLocked);
  const displayFilter = useDisplayFilter();
  const setLocked = useOSStore((s) => s.setLocked);
  const themeAccent = useOSStore((s) => s.themeAccent);

  useEffect(() => {
    document.documentElement.style.setProperty("--os-accent", themeAccent);
  }, [themeAccent]);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.body.style.background = "#000000";
  }, []);

  return (
    <div
      className="w-full h-[100dvh] flex flex-col overflow-hidden bg-black text-white font-sans"
    >
      <AuraWakeGlow />
      <NetworkHandler />
      <AnimatePresence mode="wait">
        {phase === "boot" && (
          <BootScreen key="boot" onComplete={() => setPhase("login")} />
        )}

        {phase === "login" && (
          <LoginScreen key="login" onLogin={() => setPhase("desktop")} />
        )}

        {phase === "desktop" && (
          <motion.div
            key="desktop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex-1 w-full relative overflow-hidden"
          >
            {/* Desktop — blurred when locked, display-filtered by settings */}
            <motion.div
              className="w-full h-full"
              style={{
                filter: [
                  isLocked ? "blur(8px)" : "",
                  displayFilter ?? "",
                ].filter(Boolean).join(" ") || undefined,
                pointerEvents: isLocked ? "none" : "auto",
                transition: "filter 0.3s",
              }}
            >
              <Desktop />
            </motion.div>

            {/* Lock screen on top */}
            <AnimatePresence>
              {isLocked && (
                <LoginScreen
                  key="lockscreen"
                  isLockMode
                  onLogin={() => setLocked(false)}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppInner />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
