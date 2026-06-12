import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NetworkHandler() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline  = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online",  handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online",  handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          key="network-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 w-screen h-[100dvh] flex flex-col items-center justify-center"
          style={{
            zIndex: 99999,
            background: "rgba(0,0,0,0.93)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            cursor: "default",
          }}
        >
          <img
            src="/internet_handler.webp"
            alt="Connection Lost"
            className="max-w-[80vw] max-h-[80vh] object-contain animate-pulse"
            draggable={false}
          />
          <p
            style={{
              marginTop: 24,
              fontFamily: "monospace",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.22em",
              color: "#ff2244",
              textShadow: "0 0 12px rgba(255,34,68,0.8), 0 0 24px rgba(255,34,68,0.4)",
              textAlign: "center",
            }}
          >
            CONNECTION SEVERED — AWAITING SIGNAL...
          </p>
          <p
            style={{
              marginTop: 8,
              fontFamily: "monospace",
              fontSize: 10,
              letterSpacing: "0.16em",
              color: "rgba(255,255,255,0.2)",
              textAlign: "center",
            }}
          >
            MONIX OS will resume automatically when your network is restored
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
