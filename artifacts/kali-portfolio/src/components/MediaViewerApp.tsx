import { motion } from "framer-motion";
import { Music, Volume2, FileQuestion, Download } from "lucide-react";
import WindowChrome from "./WindowChrome";

export type MediaType = "image" | "video" | "audio" | "unknown";

interface MediaViewerAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
  fileName: string;
  fileUrl: string;
  fileType: MediaType;
}

// ─── Vinyl / waveform decorative element for audio ───────────────────────────
function VinylIcon() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
      {/* Outer spinning ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, #050505 0%, #1a1a1a 25%, #050505 50%, #1a1a1a 75%, #050505 100%)",
          border: "2px solid rgba(0,240,255,0.2)",
          boxShadow: "0 0 30px rgba(0,240,255,0.15), inset 0 0 20px rgba(0,0,0,0.8)",
        }}
      />
      {/* Groove rings */}
      {[40, 55, 70, 85].map((r) => (
        <div key={r} className="absolute rounded-full"
          style={{ width: r, height: r, border: "1px solid rgba(255,255,255,0.06)" }} />
      ))}
      {/* Center label */}
      <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full"
        style={{ background: "radial-gradient(circle, #00f0ff22, #050505)", border: "1px solid rgba(0,240,255,0.4)" }}>
        <Music size={18} style={{ color: "#00f0ff", filter: "drop-shadow(0 0 6px rgba(0,240,255,0.8))" }} />
      </div>
    </div>
  );
}

// ─── Waveform bars ────────────────────────────────────────────────────────────
function Waveform() {
  const bars = [3, 6, 9, 12, 8, 14, 10, 6, 11, 7, 13, 9, 5, 10, 8, 12, 6, 9, 11, 7];
  return (
    <div className="flex items-end gap-0.5 h-10">
      {bars.map((h, i) => (
        <motion.div key={i}
          animate={{ scaleY: [1, 1.8, 0.6, 1.4, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.07, ease: "easeInOut" }}
          style={{
            width: 3,
            height: h * 2.5,
            background: `linear-gradient(to top, #00f0ff, #00ff88)`,
            borderRadius: 2,
            boxShadow: "0 0 4px rgba(0,240,255,0.4)",
            transformOrigin: "bottom",
          }}
        />
      ))}
    </div>
  );
}

export default function MediaViewerApp({
  onClose, onMinimize, isActive, onFocus,
  initialX, initialY, zIndex,
  fileName, fileUrl, fileType,
}: MediaViewerAppProps) {

  const triggerDownload = () => {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const dimensions: Record<MediaType, { w: number; h: number }> = {
    image:   { w: 820, h: 580 },
    video:   { w: 860, h: 560 },
    audio:   { w: 500, h: 320 },
    unknown: { w: 460, h: 260 },
  };

  const { w, h } = dimensions[fileType];

  return (
    <WindowChrome
      title={`Viewing: ${fileName}`}
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX ?? (typeof window !== "undefined" ? window.innerWidth / 2 - w / 2 : 100)}
      initialY={initialY ?? (typeof window !== "undefined" ? window.innerHeight / 2 - h / 2 : 60)}
      width={w}
      height={h}
      zIndex={zIndex}
    >
      <div className="flex flex-col items-center justify-center w-full h-full bg-[#050505] font-mono overflow-hidden relative">

        {/* ── Image ── */}
        {fileType === "image" && (
          <div className="flex items-center justify-center w-full h-full p-3">
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain rounded"
              style={{ boxShadow: "0 0 40px rgba(0,0,0,0.9)" }}
              draggable={false}
            />
          </div>
        )}

        {/* ── Video ── */}
        {fileType === "video" && (
          <div className="flex items-center justify-center w-full h-full bg-black">
            <video
              src={fileUrl}
              controls
              autoPlay
              className="max-w-full max-h-full outline-none"
              style={{ boxShadow: "0 0 40px rgba(0,0,0,0.9)" }}
            />
          </div>
        )}

        {/* ── Audio ── */}
        {fileType === "audio" && (
          <div className="flex flex-col items-center justify-center gap-6 w-full h-full px-8">
            <VinylIcon />
            <Waveform />
            <div className="text-center">
              <div className="text-[10px] tracking-[0.2em] text-white/30 mb-1 flex items-center justify-center gap-1">
                <Volume2 size={10} /> NOW PLAYING
              </div>
              <div className="text-[13px] text-white/80 tracking-wider truncate max-w-xs" title={fileName}>
                {fileName}
              </div>
            </div>
            <audio
              src={fileUrl}
              controls
              autoPlay
              className="w-full outline-none"
              style={{ accentColor: "#00f0ff" }}
            />
          </div>
        )}

        {/* ── Unknown / fallback ── */}
        {fileType === "unknown" && (
          <div className="flex flex-col items-center justify-center gap-5 w-full h-full px-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full"
              style={{ background: "rgba(0,240,255,0.05)", border: "1px solid rgba(0,240,255,0.2)" }}>
              <FileQuestion size={28} style={{ color: "#00f0ff" }} />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.2em] text-white/30 mb-2">UNSUPPORTED MEDIA TYPE</div>
              <div className="text-[13px] text-white/60 truncate max-w-xs" title={fileName}>{fileName}</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={triggerDownload}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-[11px] tracking-widest font-bold"
              style={{
                background: "rgba(0,240,255,0.08)",
                border: "1px solid rgba(0,240,255,0.3)",
                color: "#00f0ff",
                boxShadow: "0 0 16px rgba(0,240,255,0.12)",
              }}
            >
              <Download size={13} /> DOWNLOAD FILE
            </motion.button>
          </div>
        )}

        {/* ── File name badge ── */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full"
          style={{
            background: "rgba(0,0,0,0.7)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(8px)",
          }}>
          <span className="text-[9px] text-white/30 tracking-widest truncate max-w-[300px] block">{fileName}</span>
        </div>
      </div>
    </WindowChrome>
  );
}
