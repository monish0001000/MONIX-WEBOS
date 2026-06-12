import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  memo,
} from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Chess, Square, PieceSymbol, Color } from "chess.js";
import {
  RotateCcw,
  Lightbulb,
  Flag,
  RefreshCw,
  LogOut,
  Clock,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Search,
  X,
} from "lucide-react";
import AIWorker from "./chess.worker?worker";
import { supabase, supabaseReady } from "@/lib/supabaseClient";
import { toast } from "sonner";

// ─── Theme System ────────────────────────────────────────────────────────────────
type Theme = "dark" | "light";

interface ThemeConfig {
  // Backgrounds
  bg: string;
  surface: string;
  surfaceBorder: string;
  panel: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textAccent: string;
  // Board
  squareLight: string;
  squareDark: string;
  // Accents
  accent: string;
  accentDim: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  accentHover: string;
  // Enemy (black pieces in dark = pink, in light = charcoal)
  enemy: string;
  enemyBg: string;
  // Controls
  ctrlBorder: string;
  ctrlText: string;
  ctrlHoverBorder: string;
  ctrlHoverText: string;
  // Piece fills
  wFill: string;
  wStroke: string;
  bFill: string;
  bStroke: string;
  // Highlights
  selectedBg: string;
  selectedBorder: string;
  legalDot: string;
  legalCapture: string;
  hintFrom: string;
  hintTo: string;
  lastMoveBg: string;
  lastMoveBorder: string;
  checkBg: string;
  checkBorder: string;
  // Grid bg lines
  gridLine: string;
  // Timer active/inactive
  timerActive: string;
  timerInactive: string;
}

const DARK_THEME: ThemeConfig = {
  bg: "#050505",
  surface: "#0a0a14",
  surfaceBorder: "#1a1a2e",
  panel: "#080810",
  textPrimary: "#e0f0ff",
  textSecondary: "#7090b0",
  textMuted: "#304050",
  textAccent: "#00e5ff",
  squareLight: "#0d2233",
  squareDark: "#071525",
  accent: "#00e5ff",
  accentDim: "#005566",
  accentBg: "rgba(0,229,255,0.08)",
  accentBorder: "rgba(0,229,255,0.5)",
  accentText: "#00e5ff",
  accentHover: "rgba(0,229,255,0.15)",
  enemy: "#ff0080",
  enemyBg: "rgba(255,0,128,0.08)",
  ctrlBorder: "#1e2a35",
  ctrlText: "#607080",
  ctrlHoverBorder: "#00e5ff88",
  ctrlHoverText: "#00e5ff",
  wFill: "#ddeeff",
  wStroke: "#00e5ff",
  bFill: "#100820",
  bStroke: "#ff0080",
  selectedBg: "rgba(0,229,255,0.25)",
  selectedBorder: "rgba(0,229,255,0.7)",
  legalDot: "rgba(0,229,255,0.65)",
  legalCapture: "rgba(0,229,255,0.55)",
  hintFrom: "rgba(255,200,0,0.3)",
  hintTo: "rgba(255,200,0,0.2)",
  lastMoveBg: "rgba(255,160,0,0.22)",
  lastMoveBorder: "rgba(255,160,0,0.6)",
  checkBg: "rgba(255,40,40,0.4)",
  checkBorder: "#ff2222",
  gridLine: "rgba(0,229,255,0.03)",
  timerActive: "#00e5ff",
  timerInactive: "#203040",
};

const LIGHT_THEME: ThemeConfig = {
  bg: "#f0f2f5",
  surface: "#ffffff",
  surfaceBorder: "#dde3ec",
  panel: "#f8fafc",
  textPrimary: "#1a2535",
  textSecondary: "#4a6080",
  textMuted: "#a0b0c0",
  textAccent: "#1a7fcc",
  squareLight: "#e8eff7",
  squareDark: "#b0c8de",
  accent: "#1a7fcc",
  accentDim: "#c0daf0",
  accentBg: "rgba(26,127,204,0.08)",
  accentBorder: "rgba(26,127,204,0.45)",
  accentText: "#1a7fcc",
  accentHover: "rgba(26,127,204,0.14)",
  enemy: "#1a2535",
  enemyBg: "rgba(26,37,53,0.07)",
  ctrlBorder: "#ccd6e0",
  ctrlText: "#607080",
  ctrlHoverBorder: "#1a7fcc",
  ctrlHoverText: "#1a7fcc",
  wFill: "#f5f8ff",
  wStroke: "#1a7fcc",
  bFill: "#1a2535",
  bStroke: "#0a1220",
  selectedBg: "rgba(26,127,204,0.2)",
  selectedBorder: "rgba(26,127,204,0.7)",
  legalDot: "rgba(26,127,204,0.55)",
  legalCapture: "rgba(26,127,204,0.5)",
  hintFrom: "rgba(220,150,0,0.25)",
  hintTo: "rgba(220,150,0,0.15)",
  lastMoveBg: "rgba(200,130,0,0.18)",
  lastMoveBorder: "rgba(200,130,0,0.55)",
  checkBg: "rgba(220,40,40,0.25)",
  checkBorder: "#cc2222",
  gridLine: "rgba(0,0,0,0.03)",
  timerActive: "#1a7fcc",
  timerInactive: "#c8d8e8",
};

// ─── SVG Piece renderer — memoized & theme-aware ─────────────────────────────
const PieceSVG = memo(function PieceSVG({
  type,
  color,
  th,
}: {
  type: PieceSymbol;
  color: "w" | "b";
  th: ThemeConfig;
}) {
  const fill = color === "w" ? th.wFill : th.bFill;
  const stroke = color === "w" ? th.wStroke : th.bStroke;
  const glow = color === "w"
    ? th === DARK_THEME ? "drop-shadow(0 0 5px rgba(0,229,255,0.7))" : "drop-shadow(0 1px 3px rgba(26,127,204,0.4))"
    : th === DARK_THEME ? "drop-shadow(0 0 5px rgba(255,0,128,0.7))" : "drop-shadow(0 1px 3px rgba(0,0,0,0.5))";

  const commonProps = {
    viewBox: "0 0 45 45" as const,
    style: { width: "100%", height: "100%", filter: glow },
  };

  const paths: Record<PieceSymbol, React.ReactElement> = {
    k: (
      <svg {...commonProps}>
        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round">
          <path d="M22.5 11.63V6M20 8h5" strokeLinecap="round" />
          <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" />
          <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s.5-1.5-2-1.5-2 1.5-2 1.5v6.5c-2.5-7.5-12-10.5-16-4-3 6 5 10 5 10V37z" />
          <path d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0" strokeLinecap="round" />
        </g>
      </svg>
    ),
    q: (
      <svg {...commonProps}>
        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round">
          <circle cx="6" cy="12" r="2.75" />
          <circle cx="14" cy="9" r="2.75" />
          <circle cx="22.5" cy="8" r="2.75" />
          <circle cx="31" cy="9" r="2.75" />
          <circle cx="39" cy="12" r="2.75" />
          <path d="M9 26c8.5-8.5 15.5-8.5 27 0l2.5-12.5L31 25l-.3-14.1-8.2 13.4-8.2-13.5L14 25 6.5 13.5 9 26zM9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4" />
          <path d="M11.5 30c3.5-1 18.5-1 22 0" strokeLinecap="round" />
          <path d="M12 33.5c4-1.5 17-1.5 21 0" strokeLinecap="round" />
        </g>
      </svg>
    ),
    r: (
      <svg {...commonProps}>
        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round">
          <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" />
          <path d="M34 14l-3 3H14l-3-3" />
          <path d="M31 17v12.5H14V17" />
          <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
          <path d="M11 14h23" strokeLinecap="round" />
        </g>
      </svg>
    ),
    b: (
      <svg {...commonProps}>
        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round">
          <g fill="none" strokeLinecap="round">
            <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2" />
            <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
            <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
          </g>
          <path d="M17.5 26h10M15 30h15" strokeLinecap="round" />
        </g>
      </svg>
    ),
    n: (
      <svg {...commonProps}>
        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round">
          <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
          <path d="M24 18c.38 5.12-5.39 6.37-8 9-3 3.5-5 7-4.5 14.5" />
          <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" />
          <path d="M14.933 15.75a5 5 0 0 1-2.233 6.59 5 5 0 0 1-6.59-2.233 5 5 0 0 1 2.233-6.59 5 5 0 0 1 6.59 2.233z" strokeWidth="1.5" />
        </g>
      </svg>
    ),
    p: (
      <svg {...commonProps}>
        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round">
          <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
        </g>
      </svg>
    ),
  };
  return paths[type];
});

// ─── Difficulty Config ────────────────────────────────────────────────────────
// Each level builds on the previous: depth increases, randomness drops,
// evaluation quality improves, and ultimately Monish activates quiescence + full PST.
// randomRate  = probability of playing a random legal move instead of searching
// moveNoise   = centipawn noise added to root scores (humanises mid-level AI)
// usePST      = whether positional tables are used in evaluation
// useQuiescence = extend search at tactical positions (avoids horizon blunders)
// aggressive  = bonus weight on queens & rooks (Monish king-hunt style)
// timeMs      = search time budget for iterative deepening
const DIFFICULTIES = [
  // ── Beginner tiers ────────────────────────────────────────────────────────
  {
    name: "Easy",
    depth: 1, timeMs: 150,
    randomRate: 0.60, moveNoise: 0,
    usePST: false, useQuiescence: false, aggressive: false,
    hex: "#4ade80",
    tip: "Plays randomly 60% of the time",
  },
  {
    name: "Medium",
    depth: 2, timeMs: 300,
    randomRate: 0.30, moveNoise: 80,
    usePST: false, useQuiescence: false, aggressive: false,
    hex: "#86efac",
    tip: "Thinks 2 moves ahead with frequent blunders",
  },
  {
    name: "Hard",
    depth: 2, timeMs: 400,
    randomRate: 0.10, moveNoise: 50,
    usePST: true, useQuiescence: false, aggressive: false,
    hex: "#fbbf24",
    tip: "Rare blunders, basic positional play",
  },
  // ── Intermediate tiers ───────────────────────────────────────────────────
  {
    name: "Expert",
    depth: 3, timeMs: 500,
    randomRate: 0, moveNoise: 35,
    usePST: true, useQuiescence: false, aggressive: false,
    hex: "#f97316",
    tip: "3-ply search with slight evaluation noise",
  },
  {
    name: "Master",
    depth: 3, timeMs: 700,
    randomRate: 0, moveNoise: 12,
    usePST: true, useQuiescence: false, aggressive: false,
    hex: "#ef4444",
    tip: "Solid 3-ply, minimal imprecision",
  },
  {
    name: "Legend",
    depth: 4, timeMs: 900,
    randomRate: 0, moveNoise: 0,
    usePST: true, useQuiescence: false, aggressive: false,
    hex: "#a855f7",
    tip: "Clean 4-ply with full positional evaluation",
  },
  // ── Elite tiers ──────────────────────────────────────────────────────────
  {
    name: "Grandmaster",
    depth: 4, timeMs: 1200,
    randomRate: 0, moveNoise: 0,
    usePST: true, useQuiescence: true, aggressive: false,
    hex: "#00e5ff",
    tip: "4-ply + quiescence — won't miss hanging pieces",
  },
  {
    name: "God",
    depth: 5, timeMs: 1800,
    randomRate: 0, moveNoise: 0,
    usePST: true, useQuiescence: true, aggressive: false,
    hex: "#ff0080",
    tip: "5-ply deep search with quiescence",
  },
  // ── Maximum difficulty ────────────────────────────────────────────────────
  {
    name: "Monish",
    depth: 6, timeMs: 2500,
    randomRate: 0, moveNoise: 0,
    usePST: true, useQuiescence: true, aggressive: true,
    hex: "#ff6600",
    tip: "Max depth · quiescence · aggressive king-hunting",
  },
];


type GameMode = "pve" | "pvp" | "online";
type PlayerColor = "w" | "b";
type GamePhase = "setup" | "online_name" | "online_lobby" | "playing" | "over" | "review";

interface GameState {
  phase: GamePhase;
  mode: GameMode;
  playerColor: PlayerColor;
  diffIdx: number;
  winner: string | null;
  endReason: "checkmate" | "stalemate" | "draw" | "resign" | null;
}

// ─── Tooltip wrapper ──────────────────────────────────────────────────────────
function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-mono whitespace-nowrap bg-black/90 text-white border border-gray-700 rounded pointer-events-none z-50">
          {label}
        </div>
      )}
    </div>
  );
}

// ─── Timer display ────────────────────────────────────────────────────────────
function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Captured pieces panel ────────────────────────────────────────────────────
// Piece values used for material-advantage display only (AI logic lives in the worker)
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
};

const CapturedPanel = memo(function CapturedPanel({
  pieces, label, th,
}: { pieces: PieceSymbol[]; label: string; th: ThemeConfig }) {
  const grouped = useMemo(() => {
    const g: Partial<Record<PieceSymbol, number>> = {};
    pieces.forEach((p) => { g[p] = (g[p] ?? 0) + 1; });
    return (["q","r","b","n","p"] as PieceSymbol[]).filter((t) => g[t]).map((t) => ({ type: t, count: g[t]! }));
  }, [pieces]);

  const material = useMemo(() => pieces.reduce((s, p) => s + PIECE_VALUES[p], 0), [pieces]);
  const pieceColor = label.includes("WHITE") ? "b" : "w";

  return (
    <div style={{ background: th.surface, border: `1px solid ${th.surfaceBorder}` }} className="rounded-sm p-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span style={{ color: th.textMuted }} className="text-[10px] font-mono tracking-widest uppercase">{label}</span>
        {material > 0 && (
          <span style={{ color: th.textAccent }} className="text-[10px] font-mono">+{Math.round(material / 100)}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1 min-h-[20px]">
        {grouped.length === 0 ? (
          <span style={{ color: th.textMuted }} className="text-[10px] font-mono">—</span>
        ) : (
          grouped.map(({ type, count }) => (
            <div key={type} className="flex items-center gap-0.5">
              <div className="w-4 h-4 shrink-0">
                <PieceSVG type={type} color={pieceColor} th={th} />
              </div>
              {count > 1 && (
                <span style={{ color: th.textSecondary }} className="text-[9px] font-mono">×{count}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

// ─── Square component (memoized) ──────────────────────────────────────────────
const BoardSquare = memo(function BoardSquare({
  sq, piece, isSelected, isLegal, isHintFrom, isHintTo, isCheck,
  isLastMoveFrom, isLastMoveTo,
  isDragTarget, isDragFrom, onClick, onDragStart, onDragOver, onDrop, onDragEnd,
  squareBg, th,
}: {
  sq: Square; piece: { type: PieceSymbol; color: "w" | "b" } | null;
  isSelected: boolean; isLegal: boolean; isHintFrom: boolean; isHintTo: boolean;
  isCheck: boolean; isLastMoveFrom: boolean; isLastMoveTo: boolean;
  isDragTarget: boolean; isDragFrom: boolean;
  onClick: () => void; onDragStart: () => void; onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void; onDragEnd: () => void;
  squareBg: string; th: ThemeConfig;
}) {
  return (
    <div
      className="relative cursor-pointer select-none"
      style={{ backgroundColor: squareBg, aspectRatio: "1" }}
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Last move highlight — rendered first so other overlays sit on top */}
      {(isLastMoveFrom || isLastMoveTo) && !isSelected && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: th.lastMoveBg,
            border: `1.5px solid ${th.lastMoveBorder}`,
            // slightly stronger on the destination square
            opacity: isLastMoveTo ? 1 : 0.75,
          }}
        />
      )}

      {/* Selection / check / hint overlays */}
      {isSelected && <div className="absolute inset-0 pointer-events-none" style={{ background: th.selectedBg, border: `1.5px solid ${th.selectedBorder}` }} />}
      {isCheck && <div className="absolute inset-0 pointer-events-none animate-pulse" style={{ background: th.checkBg, border: `2px solid ${th.checkBorder}` }} />}
      {isHintFrom && <div className="absolute inset-0 pointer-events-none" style={{ background: th.hintFrom, border: `1.5px solid rgba(255,200,0,0.6)` }} />}
      {isHintTo && <div className="absolute inset-0 pointer-events-none" style={{ background: th.hintTo, border: `1px solid rgba(255,200,0,0.4)` }} />}
      {isDragTarget && !isSelected && <div className="absolute inset-0 pointer-events-none" style={{ background: th.selectedBg }} />}

      {/* Legal move dot */}
      {isLegal && !piece && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[30%] h-[30%] rounded-full" style={{ backgroundColor: th.legalDot }} />
        </div>
      )}
      {/* Legal capture ring */}
      {isLegal && piece && (
        <div className="absolute inset-0 pointer-events-none" style={{ border: `3px solid ${th.legalCapture}` }} />
      )}

      {/* Piece */}
      {piece && (
        <div
          className="absolute inset-[4%] select-none"
          style={{ opacity: isDragFrom ? 0.4 : 1, cursor: "grab", transition: "opacity 0.1s" }}
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <PieceSVG type={piece.type} color={piece.color} th={th} />
        </div>
      )}
    </div>
  );
});

// ─── Review snapshot type ────────────────────────────────────────────────────
interface ReviewSnap {
  fen: string;          // board position after this move
  san: string;          // move in SAN notation
  moveFrom: Square;     // squares for last-move highlight
  moveTo: Square;
  capturedBy: "w" | "b" | null;
  captured: PieceSymbol | null;
}

// ─── Chess Game-Over Button ───────────────────────────────────────────────────
function ChessBtn({
  onClick, label, accent, dim,
}: { onClick: () => void; label: string; accent?: boolean; dim?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px 0",
        fontSize: 11,
        fontFamily: "monospace",
        letterSpacing: "0.1em",
        borderRadius: 7,
        cursor: "pointer",
        transition: "opacity 0.15s, background 0.15s",
        background: accent ? "rgba(0,212,255,0.12)" : "transparent",
        border: accent
          ? "1px solid rgba(0,212,255,0.4)"
          : dim
          ? "1px solid rgba(255,255,255,0.1)"
          : "1px solid rgba(0,212,255,0.2)",
        color: accent
          ? "#00d4ff"
          : dim
          ? "rgba(255,255,255,0.45)"
          : "rgba(0,212,255,0.7)",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
    >
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MonixChess() {
  const [theme, setTheme] = useState<Theme>("dark");
  const th = theme === "dark" ? DARK_THEME : LIGHT_THEME;

  const chessRef = useRef(new Chess());
  const chess = chessRef.current;
  const [boardKey, setBoardKey] = useState(0); // trigger re-renders efficiently
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [hint, setHint] = useState<{ from: Square; to: Square } | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [captured, setCaptured] = useState<{ w: PieceSymbol[]; b: PieceSymbol[] }>({ w: [], b: [] });
  const [checkSquare, setCheckSquare] = useState<Square | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [dragFrom, setDragFrom] = useState<Square | null>(null);
  const [dragOver, setDragOver] = useState<Square | null>(null);
  const [promotionPending, setPromotionPending] = useState<{ from: Square; to: Square } | null>(null);
  const [showCheckWarning, setShowCheckWarning] = useState(false);
  const [logExpanded, setLogExpanded] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);
  const reviewListRef = useRef<HTMLDivElement>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiWorker = useRef<Worker | null>(null);

  // ── Last-move highlighting ────────────────────────────────────────────────
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  // ── Post-game review state ──────────────────────────────────────────────
  // Full snapshot captured the moment the game ends
  const [reviewSnaps, setReviewSnaps] = useState<ReviewSnap[]>([]);
  // -1 = before any move (initial position); 0..n-1 = after snap[i]
  const [reviewIdx, setReviewIdx] = useState(-1);
  const reviewInitialFen = useRef<string>("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");


  // Timers (seconds)
  const [timers, setTimers] = useState({ w: 600, b: 600 }); // 10 min each
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    phase: "setup",
    mode: "pve",
    playerColor: "w",
    diffIdx: 0,
    winner: null,
    endReason: null,
  });

  // ── Online P2P state ───────────────────────────────────────────────────────
  const [aliasInput, setAliasInput] = useState("");
  const [onlineAlias, setOnlineAlias] = useState("");
  const [myUid] = useState(() => crypto.randomUUID());
  const [onlinePlayers, setOnlinePlayers] = useState<Array<{ alias: string; uid: string }>>([]);
  const [incomingChallenge, setIncomingChallenge] = useState<{ alias: string; uid: string; matchId: string } | null>(null);
  const [waitingFor, setWaitingFor] = useState<{ alias: string; uid: string } | null>(null);
  const [isOnlineBlack, setIsOnlineBlack] = useState(false);
  const lobbyChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const matchChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const onlineMatchIdRef = useRef<string | null>(null);

  // ── Online HUD + ping ──────────────────────────────────────────────────────
  const [opponentHudAlias, setOpponentHudAlias] = useState("");
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const activeOnlineMatchRef = useRef<{ mode: GameMode; phase: GamePhase; isOnlineBlack: boolean }>({
    mode: "pve",
    phase: "setup",
    isOnlineBlack: false,
  });
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pongTimeoutRef  = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const pingStartRef    = useRef<number>(0);

  // ── In-match chat ──────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; ts: number }>>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Cooperative action requests ────────────────────────────────────────────
  const [pendingUndoFrom, setPendingUndoFrom] = useState<string | null>(null);
  const [pendingDrawFrom, setPendingDrawFrom] = useState<string | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const diff = DIFFICULTIES[gameState.diffIdx];
  const isFlipped =
    gameState.mode === "online" ? isOnlineBlack :
    gameState.mode === "pve" && gameState.playerColor === "b";
  const files = isFlipped ? ["h","g","f","e","d","c","b","a"] : ["a","b","c","d","e","f","g","h"];
  const ranks = isFlipped ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1];
  const currentTurn = chess.turn();
  const opponentDisplayName = gameState.mode === "pve" ? "Computer" : (opponentHudAlias || "Opponent");

  activeOnlineMatchRef.current = {
    mode: gameState.mode,
    phase: gameState.phase,
    isOnlineBlack,
  };

  const broadcastPlayerDisconnected = useCallback(() => {
    const active = activeOnlineMatchRef.current;
    if (active.mode !== "online" || active.phase !== "playing" || !matchChannelRef.current) return;
    matchChannelRef.current.send({
      type: "broadcast",
      event: "player_disconnected",
      payload: { uid: myUid },
    });
  }, [myUid]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      broadcastPlayerDisconnected();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      broadcastPlayerDisconnected();
      if (aiWorker.current) { aiWorker.current.terminate(); aiWorker.current = null; }
      if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
      if (pingIntervalRef.current) { clearInterval(pingIntervalRef.current); pingIntervalRef.current = null; }
      if (pongTimeoutRef.current) { clearTimeout(pongTimeoutRef.current); pongTimeoutRef.current = null; }
      lobbyChannelRef.current?.unsubscribe(); lobbyChannelRef.current = null;
      matchChannelRef.current?.unsubscribe(); matchChannelRef.current = null;
    };
  }, [broadcastPlayerDisconnected]);

  // Board to display during review (derived, not stored as state)
  const reviewBoard = useMemo(() => {
    if (gameState.phase !== "review") return null;
    const fen = reviewIdx < 0 ? reviewInitialFen.current : reviewSnaps[reviewIdx]?.fen;
    if (!fen) return null;
    try { return new Chess(fen).board(); } catch { return null; }
  }, [gameState.phase, reviewIdx, reviewSnaps]);

  // ── Timer tick ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    if (gameState.phase !== "playing") return;
    timerIntervalRef.current = setInterval(() => {
      setTimers((t) => {
        const side = currentTurn;
        const next = { ...t, [side]: Math.max(0, t[side] - 1) };
        if (next[side] === 0) {
          setGameState((gs) => ({ ...gs, phase: "over", winner: side === "w" ? "BLACK" : "WHITE", endReason: "draw" }));
        }
        return next;
      });
    }, 1000);
    return () => { if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; } };
  }, [gameState.phase, currentTurn]);

  // ── Sync after every chess mutation ────────────────────────────────────────
  // lm = last move {from, to} to highlight; pass null to keep existing
  const syncBoard = useCallback((lm?: { from: Square; to: Square } | null) => {
    const h = chess.history({ verbose: true });
    const cap: { w: PieceSymbol[]; b: PieceSymbol[] } = { w: [], b: [] };
    h.forEach((m) => { if (m.captured) { if (m.color === "w") cap.w.push(m.captured as PieceSymbol); else cap.b.push(m.captured as PieceSymbol); } });
    setCaptured(cap);
    setMoveHistory(chess.history());
    setBoardKey((k) => k + 1);
    if (lm !== undefined) setLastMove(lm);

    if (chess.inCheck()) {
      const turn = chess.turn();
      const b = chess.board();
      outer: for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = b[r][c];
          if (p?.type === "k" && p.color === turn) {
            setCheckSquare((String.fromCharCode(97 + c) + (8 - r)) as Square);
            setShowCheckWarning(true);
            setTimeout(() => setShowCheckWarning(false), 2000);
            break outer;
          }
        }
      }
    } else {
      setCheckSquare(null);
    }
  }, [chess]);

  const checkGameOver = useCallback(() => {
    const isOver = chess.isCheckmate() || chess.isStalemate() || chess.isDraw();
    if (!isOver) return;

    // ── Snapshot the full game for the review mode ──────────────────────────
    const verboseHistory = chess.history({ verbose: true });
    const snaps: ReviewSnap[] = [];
    const replayGame = new Chess();
    for (const m of verboseHistory) {
      replayGame.move(m);
      snaps.push({
        fen: replayGame.fen(),
        san: m.san,
        moveFrom: m.from as Square,
        moveTo: m.to as Square,
        capturedBy: m.captured ? m.color as "w" | "b" : null,
        captured: m.captured ? (m.captured as PieceSymbol) : null,
      });
    }
    setReviewSnaps(snaps);
    setReviewIdx(snaps.length - 1); // start at the final position

    if (chess.isCheckmate()) {
      setGameState((gs) => ({ ...gs, phase: "over", winner: chess.turn() === "w" ? "BLACK" : "WHITE", endReason: "checkmate" }));
    } else if (chess.isStalemate()) {
      setGameState((gs) => ({ ...gs, phase: "over", winner: null, endReason: "stalemate" }));
    } else if (chess.isDraw()) {
      setGameState((gs) => ({ ...gs, phase: "over", winner: null, endReason: "draw" }));
    }
  }, [chess]);

  // ── AI turn detection ──────────────────────────────────────────────────────
  const isPlayerTurn = useCallback(() => {
    if (gameState.mode === "pvp") return true;
    if (gameState.mode === "online") {
      const myColor = isOnlineBlack ? "b" : "w";
      return chess.turn() === myColor;
    }
    return chess.turn() === gameState.playerColor;
  }, [chess, gameState, isOnlineBlack]);

  const doAiMove = useCallback(() => {
    if (chess.isGameOver() || isAiThinking) return;
    setIsAiThinking(true);
    setHint(null);
    const aiColor = (gameState.playerColor === "w" ? "b" : "w") as Color;

    // Reuse or lazily create the worker
    if (!aiWorker.current) aiWorker.current = new AIWorker();

    // Release thinking lock on worker error (prevents permanent freeze)
    aiWorker.current.onerror = (err) => {
      console.error("[AI Worker] Uncaught error:", err.message);
      setIsAiThinking(false);
    };

    aiWorker.current.onmessage = (e) => {
      if (e.data.messageId !== "doAiMove") return;
      if (e.data.error) {
        console.error("[AI Worker] Reported error:", e.data.error);
        setIsAiThinking(false);
        return;
      }
      const move = e.data.move;
      if (move) {
        try {
          chess.move(move);
          syncBoard({ from: move.from as Square, to: move.to as Square });
          checkGameOver();
        } catch (err) {
          console.error("[AI] Invalid move received from worker:", move, err);
        }
      }
      setIsAiThinking(false);
    };

    aiWorker.current.postMessage({
      fen: chess.fen(),
      depth: diff.depth,
      aiColor,
      messageId: "doAiMove",
      timeMs: diff.timeMs,
      randomRate: diff.randomRate,
      moveNoise: diff.moveNoise,
      usePST: diff.usePST,
      useQuiescence: diff.useQuiescence,
      aggressive: diff.aggressive,
    });
  }, [chess, diff.depth, gameState.playerColor, isAiThinking, syncBoard, checkGameOver]);

  useEffect(() => {
    if (gameState.phase === "playing" && gameState.mode === "pve" && !isPlayerTurn() && !chess.isGameOver() && !isAiThinking) {
      // Small delay so the board renders the player's last move before the AI starts computing
      const t = setTimeout(() => doAiMove(), 80);
      return () => clearTimeout(t);
    }
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [boardKey, gameState.phase, doAiMove, isAiThinking]);

  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [moveHistory]);

  // ── Online P2P broadcast helper (must be declared before handleSquareClick/handleDrop) ──
  const broadcastOnlineMove = useCallback((from: Square, to: Square, promotion?: string) => {
    if (gameState.mode !== "online" || !matchChannelRef.current) return;
    matchChannelRef.current.send({
      type: "broadcast",
      event: "move",
      payload: { from, to, promotion: promotion || "q" },
    });
  }, [gameState.mode]);

  // ── Move handling ──────────────────────────────────────────────────────────
  const handleSquareClick = useCallback((sq: Square) => {
    if (!isPlayerTurn() || isAiThinking || gameState.phase !== "playing") return;
    if (selected) {
      if (legalMoves.includes(sq)) {
        const piece = chess.get(selected);
        const isPromo = piece?.type === "p" && ((piece.color === "w" && sq[1] === "8") || (piece.color === "b" && sq[1] === "1"));
        if (isPromo) { setPromotionPending({ from: selected, to: sq }); setSelected(null); setLegalMoves([]); return; }
        chess.move({ from: selected, to: sq });
        broadcastOnlineMove(selected, sq);
        syncBoard({ from: selected, to: sq }); checkGameOver();
        setSelected(null); setLegalMoves([]); setHint(null);
        return;
      }
      const piece = chess.get(sq);
      if (piece && piece.color === chess.turn()) {
        setSelected(sq);
        setLegalMoves(chess.moves({ square: sq, verbose: true }).map((m) => m.to as Square));
        return;
      }
      setSelected(null); setLegalMoves([]);
      return;
    }
    const piece = chess.get(sq);
    if (piece && piece.color === chess.turn()) {
      setSelected(sq);
      setLegalMoves(chess.moves({ square: sq, verbose: true }).map((m) => m.to as Square));
    }
  }, [chess, selected, legalMoves, isPlayerTurn, isAiThinking, gameState.phase, syncBoard, checkGameOver, broadcastOnlineMove]);

  const handleDragStart = useCallback((sq: Square) => {
    if (!isPlayerTurn() || isAiThinking || gameState.phase !== "playing") return;
    const piece = chess.get(sq);
    if (!piece || piece.color !== chess.turn()) return;
    setDragFrom(sq); setSelected(sq);
    setLegalMoves(chess.moves({ square: sq, verbose: true }).map((m) => m.to as Square));
  }, [chess, isPlayerTurn, isAiThinking, gameState.phase]);

  const handleDrop = useCallback((sq: Square) => {
    if (!dragFrom) { setDragFrom(null); setDragOver(null); return; }
    if (legalMoves.includes(sq)) {
      const piece = chess.get(dragFrom);
      const isPromo = piece?.type === "p" && ((piece.color === "w" && sq[1] === "8") || (piece.color === "b" && sq[1] === "1"));
      if (isPromo) { setPromotionPending({ from: dragFrom, to: sq }); }
      else {
        chess.move({ from: dragFrom, to: sq });
        broadcastOnlineMove(dragFrom, sq);
        syncBoard({ from: dragFrom, to: sq }); checkGameOver(); setHint(null);
      }
    }
    setDragFrom(null); setDragOver(null); setSelected(null); setLegalMoves([]);
  }, [chess, dragFrom, legalMoves, syncBoard, checkGameOver, broadcastOnlineMove]);

  const handlePromotion = (piece: PieceSymbol) => {
    if (!promotionPending) return;
    chess.move({ from: promotionPending.from, to: promotionPending.to, promotion: piece });
    broadcastOnlineMove(promotionPending.from, promotionPending.to, piece);
    syncBoard({ from: promotionPending.from, to: promotionPending.to }); checkGameOver(); setPromotionPending(null);
  };

  const handleUndo = useCallback(() => {
    if (isAiThinking) return;
    chess.undo();
    if (gameState.mode === "pve") chess.undo();
    // Recalculate last move from history after undo
    const h = chess.history({ verbose: true });
    const prevLm = h.length > 0
      ? { from: h[h.length - 1].from as Square, to: h[h.length - 1].to as Square }
      : null;
    syncBoard(prevLm); setSelected(null); setLegalMoves([]); setHint(null);
  }, [chess, isAiThinking, gameState.mode, syncBoard]);

  const handleHint = useCallback(() => {
    if (!isPlayerTurn() || isAiThinking) return;

    if (!aiWorker.current) aiWorker.current = new AIWorker();

    // Release thinking lock on worker error
    aiWorker.current.onerror = (err) => {
      console.error("[AI Worker] Hint error:", err.message);
    };

    aiWorker.current.onmessage = (e) => {
      if (e.data.messageId !== "handleHint") return;
      if (e.data.error) {
        console.error("[AI Worker] Hint reported error:", e.data.error);
        return;
      }
      const m = e.data.move;
      if (m) setHint({ from: m.from as Square, to: m.to as Square });
    };

    // Hint always uses clean config (no noise/randomness) for accurate suggestion
    aiWorker.current.postMessage({
      fen: chess.fen(),
      depth: Math.max(diff.depth, 3),
      aiColor: chess.turn(),
      messageId: "handleHint",
      timeMs: 1000,
      randomRate: 0,
      moveNoise: 0,
      usePST: true,
      useQuiescence: true,
      aggressive: false,
    });
  }, [chess, diff.depth, isPlayerTurn, isAiThinking]);

  const handleResign = useCallback(() => {
    setGameState((gs) => ({ ...gs, phase: "over", winner: chess.turn() === "w" ? "BLACK" : "WHITE", endReason: "resign" }));
  }, [chess]);

  const handleReset = useCallback(() => {
    chess.reset(); syncBoard(null);
    setSelected(null); setLegalMoves([]); setHint(null); setLastMove(null);
    setReviewSnaps([]); setReviewIdx(-1);
    setTimers({ w: 600, b: 600 });
    setGameState((gs) => ({ ...gs, phase: "playing", winner: null, endReason: null }));
  }, [chess, syncBoard]);

  const handleQuit = useCallback(() => {
    broadcastPlayerDisconnected();
    lobbyChannelRef.current?.unsubscribe(); lobbyChannelRef.current = null;
    matchChannelRef.current?.unsubscribe(); matchChannelRef.current = null;
    setOnlinePlayers([]); setIncomingChallenge(null); setWaitingFor(null);
    chess.reset(); syncBoard(null);
    setSelected(null); setLegalMoves([]); setHint(null); setLastMove(null);
    setReviewSnaps([]); setReviewIdx(-1); setTimers({ w: 600, b: 600 });
    setGameState({ phase: "setup", mode: "pve", playerColor: "w", diffIdx: 0, winner: null, endReason: null });
  }, [broadcastPlayerDisconnected, chess, syncBoard]);

  // ── Review navigation ─────────────────────────────────────────────────────
  const enterReview = useCallback(() => {
    setGameState((gs) => ({ ...gs, phase: "review" }));
    setReviewIdx(reviewSnaps.length - 1);
  }, [reviewSnaps]);

  const exitReview = useCallback(() => {
    setGameState((gs) => ({ ...gs, phase: "over" }));
  }, []);

  const reviewPrev = useCallback(() => setReviewIdx((i) => Math.max(-1, i - 1)), []);
  const reviewNext = useCallback(() => setReviewIdx((i) => Math.min(reviewSnaps.length - 1, i + 1)), [reviewSnaps.length]);

  // Scroll review move list to current index
  useEffect(() => {
    if (reviewListRef.current && gameState.phase === "review") {
      const el = reviewListRef.current.querySelector(`[data-review-idx="${reviewIdx}"]`) as HTMLElement | null;
      if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [reviewIdx, gameState.phase]);

  // ── Online P2P helpers ─────────────────────────────────────────────────────
  const startOnlineMatch = useCallback((matchId: string, playAsBlack: boolean, oppAlias: string = "") => {
    // Clear previous match channel + ping loop
    if (pingIntervalRef.current) { clearInterval(pingIntervalRef.current); pingIntervalRef.current = null; }
    if (pongTimeoutRef.current)  { clearTimeout(pongTimeoutRef.current);   pongTimeoutRef.current  = null; }
    matchChannelRef.current?.unsubscribe();
    matchChannelRef.current = null;
    onlineMatchIdRef.current = matchId;

    // Reset new-feature state
    setOpponentHudAlias(oppAlias);
    setPingMs(null);
    setIsDisconnected(false);
    setChatMessages([]);
    setChatInput("");
    setPendingUndoFrom(null);
    setPendingDrawFrom(null);

    setIsOnlineBlack(playAsBlack);
    chess.reset(); syncBoard(null);
    setSelected(null); setLegalMoves([]); setHint(null); setLastMove(null);
    setTimers({ w: 600, b: 600 });

    const ch = supabase.channel(`chess_match_${matchId}`);

    // ── Existing: move broadcast ──────────────────────────────────────────
    ch.on("broadcast", { event: "move" }, ({ payload }: any) => {
      try {
        const move = chess.move({ from: payload.from, to: payload.to, promotion: payload.promotion || "q" });
        if (move) {
          syncBoard({ from: payload.from as Square, to: payload.to as Square });
          checkGameOver();
        }
      } catch (_) {}
    });

    // ── Ping / pong (latency) ─────────────────────────────────────────────
    ch.on("broadcast", { event: "ping" }, () => {
      ch.send({ type: "broadcast", event: "pong", payload: {} });
    });
    ch.on("broadcast", { event: "pong" }, () => {
      const latency = Date.now() - pingStartRef.current;
      setPingMs(latency);
      if (pongTimeoutRef.current) { clearTimeout(pongTimeoutRef.current); pongTimeoutRef.current = null; }
    });

    // ── Chat ──────────────────────────────────────────────────────────────
    ch.on("broadcast", { event: "chat" }, ({ payload }: any) => {
      setChatMessages(prev => [...prev, { sender: payload.sender as string, text: payload.text as string, ts: Date.now() }]);
    });

    // ── Cooperative: undo request ─────────────────────────────────────────
    ch.on("broadcast", { event: "undo_request" }, ({ payload }: any) => {
      setPendingUndoFrom(payload.alias as string);
    });
    ch.on("broadcast", { event: "undo_accept" }, () => {
      chess.undo(); chess.undo();
      const h = chess.history({ verbose: true });
      const prevLm = h.length > 0
        ? { from: h[h.length - 1].from as Square, to: h[h.length - 1].to as Square }
        : null;
      syncBoard(prevLm);
      setSelected(null); setLegalMoves([]); setHint(null);
      toast.success("Undo accepted — move reverted.");
    });
    ch.on("broadcast", { event: "undo_decline" }, () => {
      toast.error("Undo request declined.");
    });

    // ── Cooperative: draw offer ───────────────────────────────────────────
    ch.on("broadcast", { event: "draw_request" }, ({ payload }: any) => {
      setPendingDrawFrom(payload.alias as string);
    });
    ch.on("broadcast", { event: "draw_accept" }, () => {
      setGameState(gs => ({ ...gs, phase: "over", winner: null, endReason: "draw" }));
    });
    ch.on("broadcast", { event: "draw_decline" }, () => {
      toast.error("Draw offer declined.");
    });

    // ── Cooperative: resign broadcast ─────────────────────────────────────
    ch.on("broadcast", { event: "resign" }, () => {
      const myColor = playAsBlack ? "b" : "w";
      setGameState(gs => ({ ...gs, phase: "over", winner: myColor === "w" ? "WHITE" : "BLACK", endReason: "resign" }));
      toast.success("Opponent resigned. YOU WIN!");
    });

    ch.on("broadcast", { event: "player_disconnected" }, ({ payload }: any) => {
      if (payload?.uid === myUid) return;
      const myColor = playAsBlack ? "b" : "w";
      setIsDisconnected(true);
      setGameState(gs => ({ ...gs, phase: "over", winner: myColor === "w" ? "WHITE" : "BLACK", endReason: "resign" }));
      toast.success("Opponent left the match. You Win!");
    });

    // ── Subscribe + start ping loop ───────────────────────────────────────
    ch.subscribe(() => {
      pingIntervalRef.current = setInterval(() => {
        pingStartRef.current = Date.now();
        ch.send({ type: "broadcast", event: "ping", payload: {} });
        if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
        pongTimeoutRef.current = setTimeout(() => {
          setIsDisconnected(true);
        }, 15000);
      }, 5000);
    });

    matchChannelRef.current = ch;
    setIncomingChallenge(null);
    setWaitingFor(null);
    setGameState(gs => ({ ...gs, phase: "playing", mode: "online", winner: null, endReason: null }));
  }, [chess, syncBoard, checkGameOver]);

  const joinLobby = useCallback((alias: string) => {
    lobbyChannelRef.current?.unsubscribe();
    lobbyChannelRef.current = null;
    const ch = supabase.channel("chess_global_lobby", {
      config: { presence: { key: myUid }, broadcast: { self: false } },
    });
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState<{ alias?: string; uid?: string; status?: string }>();
      const byUid = new Map<string, { alias: string; uid: string }>();

      Object.entries(state).forEach(([presenceKey, presences]) => {
        presences.forEach((presence: any) => {
          const uid = String(presence?.uid || presenceKey);
          const playerAlias = String(presence?.alias || "Anonymous").trim();
          if (!uid || uid === myUid || presence?.status === "offline") return;
          byUid.set(uid, { alias: playerAlias, uid });
        });
      });

      const players = Array.from(byUid.values()).sort((a, b) => a.alias.localeCompare(b.alias));
      setOnlinePlayers(prev => (
        prev.length === players.length && prev.every((p, i) => p.uid === players[i].uid && p.alias === players[i].alias)
          ? prev
          : players
      ));
    });
    ch.on("broadcast", { event: "play_request" }, ({ payload }: any) => {
      if (payload.target_uid === myUid) {
        setIncomingChallenge({ alias: payload.alias, uid: payload.uid, matchId: payload.matchId });
      }
    });
    ch.on("broadcast", { event: "play_accept" }, ({ payload }: any) => {
      if (payload.target_uid === myUid && payload.matchId) {
        setWaitingFor(null);
        startOnlineMatch(payload.matchId, false, payload.alias ?? "");
      }
    });
    ch.on("broadcast", { event: "play_decline" }, ({ payload }: any) => {
      if (payload.target_uid === myUid) setWaitingFor(null);
    });
    ch.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        try {
          await ch.track({ alias, uid: myUid, status: "online", online_at: new Date().toISOString() });
        } catch {
          toast.error("Chess P2P presence failed.");
        }
      }
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        toast.error("Chess P2P connection failed. Rejoin the lobby.");
      }
    });
    lobbyChannelRef.current = ch;
    setGameState(gs => ({ ...gs, phase: "online_lobby" as GamePhase, mode: "online" }));
  }, [myUid, startOnlineMatch]);

  const sendChallenge = useCallback((opponent: { alias: string; uid: string }) => {
    const matchId = `${myUid.slice(0, 8)}_${Date.now()}`;
    setWaitingFor(opponent);
    lobbyChannelRef.current?.send({
      type: "broadcast",
      event: "play_request",
      payload: { alias: onlineAlias, uid: myUid, target_uid: opponent.uid, matchId },
    });
  }, [myUid, onlineAlias]);

  const acceptChallenge = useCallback(() => {
    if (!incomingChallenge) return;
    const { uid, matchId, alias: oppAlias } = incomingChallenge;
    lobbyChannelRef.current?.send({
      type: "broadcast",
      event: "play_accept",
      payload: { alias: onlineAlias, uid: myUid, target_uid: uid, matchId },
    });
    startOnlineMatch(matchId, true, oppAlias);
  }, [incomingChallenge, onlineAlias, myUid, startOnlineMatch]);

  const declineChallenge = useCallback(() => {
    if (!incomingChallenge) return;
    lobbyChannelRef.current?.send({
      type: "broadcast",
      event: "play_decline",
      payload: { uid: myUid, target_uid: incomingChallenge.uid },
    });
    setIncomingChallenge(null);
  }, [incomingChallenge, myUid]);

  const leaveLobby = useCallback(() => {
    lobbyChannelRef.current?.unsubscribe();
    lobbyChannelRef.current = null;
    setOnlinePlayers([]);
    setIncomingChallenge(null);
    setWaitingFor(null);
    setGameState({ phase: "setup", mode: "pve", playerColor: "w", diffIdx: 0, winner: null, endReason: null });
  }, []);

  const startGame = useCallback(() => {
    chess.reset(); syncBoard();
    setSelected(null); setLegalMoves([]); setHint(null); setTimers({ w: 600, b: 600 });
    setGameState((gs) => ({ ...gs, phase: "playing", winner: null, endReason: null }));
  }, [chess, syncBoard]);

  // ── Online cooperative action senders ──────────────────────────────────────
  const sendChat = useCallback(() => {
    const text = chatInput.trim();
    if (!text || !matchChannelRef.current) return;
    matchChannelRef.current.send({ type: "broadcast", event: "chat", payload: { sender: onlineAlias, text } });
    setChatMessages(prev => [...prev, { sender: onlineAlias, text, ts: Date.now() }]);
    setChatInput("");
  }, [chatInput, onlineAlias]);

  const sendUndoRequest = useCallback(() => {
    if (!matchChannelRef.current) return;
    matchChannelRef.current.send({ type: "broadcast", event: "undo_request", payload: { alias: onlineAlias } });
    toast("Undo request sent — waiting for opponent.");
  }, [onlineAlias]);

  const acceptUndo = useCallback(() => {
    if (!matchChannelRef.current) return;
    matchChannelRef.current.send({ type: "broadcast", event: "undo_accept", payload: {} });
    chess.undo(); chess.undo();
    const h = chess.history({ verbose: true });
    const prevLm = h.length > 0 ? { from: h[h.length - 1].from as Square, to: h[h.length - 1].to as Square } : null;
    syncBoard(prevLm);
    setSelected(null); setLegalMoves([]); setHint(null);
    setPendingUndoFrom(null);
    toast.success("Undo accepted.");
  }, [chess, syncBoard]);

  const declineUndo = useCallback(() => {
    if (!matchChannelRef.current) return;
    matchChannelRef.current.send({ type: "broadcast", event: "undo_decline", payload: {} });
    setPendingUndoFrom(null);
  }, []);

  const sendDrawOffer = useCallback(() => {
    if (!matchChannelRef.current) return;
    matchChannelRef.current.send({ type: "broadcast", event: "draw_request", payload: { alias: onlineAlias } });
    toast("Draw offered — waiting for opponent.");
  }, [onlineAlias]);

  const acceptDraw = useCallback(() => {
    if (!matchChannelRef.current) return;
    matchChannelRef.current.send({ type: "broadcast", event: "draw_accept", payload: {} });
    setPendingDrawFrom(null);
    setGameState(gs => ({ ...gs, phase: "over", winner: null, endReason: "draw" }));
  }, []);

  const declineDraw = useCallback(() => {
    if (!matchChannelRef.current) return;
    matchChannelRef.current.send({ type: "broadcast", event: "draw_decline", payload: {} });
    setPendingDrawFrom(null);
  }, []);

  const sendOnlineResign = useCallback(() => {
    if (!matchChannelRef.current) return;
    matchChannelRef.current.send({ type: "broadcast", event: "resign", payload: {} });
    const myColor = isOnlineBlack ? "b" : "w";
    setGameState(gs => ({ ...gs, phase: "over", winner: myColor === "w" ? "BLACK" : "WHITE", endReason: "resign" }));
  }, [isOnlineBlack]);

  // ── Chat auto-scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ── Board memoization ──────────────────────────────────────────────────────
  const boardData = useMemo(() => chess.board(), [boardKey]);

  // ─── ONLINE NAME ENTRY SCREEN ─────────────────────────────────────────────
  if (gameState.phase === "online_name") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4" style={{ background: th.bg }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-4xl font-black tracking-[0.2em] mb-1" style={{ color: th.accent }}>MONIX</div>
            <div className="text-[10px] font-mono tracking-[0.5em] uppercase" style={{ color: th.textMuted }}>Online P2P Lobby</div>
          </div>
          {!supabaseReady && (
            <div className="mb-4 p-3 rounded-sm text-center text-[11px] font-mono" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              ⚠ Supabase not configured — online mode requires VITE_SUPABASE_URL &amp; VITE_SUPABASE_ANON_KEY
            </div>
          )}
          <div className="rounded-sm p-6 space-y-4" style={{ background: th.surface, border: `1px solid ${th.surfaceBorder}` }}>
            <div className="text-[10px] font-mono tracking-widest uppercase mb-3" style={{ color: th.textAccent }}>// Enter Your Alias</div>
            <input
              type="text"
              maxLength={20}
              placeholder="e.g. Shadow_X"
              value={aliasInput}
              onChange={e => setAliasInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && aliasInput.trim() && supabaseReady) { setOnlineAlias(aliasInput.trim()); joinLobby(aliasInput.trim()); } }}
              autoFocus
              className="w-full bg-transparent outline-none font-mono text-sm"
              style={{ border: `1px solid ${th.accentBorder}`, color: th.textPrimary, padding: "10px 12px", borderRadius: 2 }}
            />
            <button
              onClick={() => { if (aliasInput.trim() && supabaseReady) { setOnlineAlias(aliasInput.trim()); joinLobby(aliasInput.trim()); } }}
              disabled={!aliasInput.trim() || !supabaseReady}
              className="w-full py-3 text-xs font-mono tracking-[0.3em] uppercase transition-all"
              style={{ border: `1px solid ${th.accentBorder}`, background: th.accentBg, color: th.accentText, opacity: (!aliasInput.trim() || !supabaseReady) ? 0.4 : 1 }}
            >
              ENTER LOBBY <ChevronRight className="inline w-3.5 h-3.5" />
            </button>
            <button onClick={handleQuit} className="w-full py-2 text-[10px] font-mono tracking-wider" style={{ color: th.textMuted }}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── ONLINE LOBBY SCREEN ──────────────────────────────────────────────────
  if (gameState.phase === "online_lobby") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4" style={{ background: th.bg }}>
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-lg font-black tracking-widest font-mono" style={{ color: th.accent }}>ONLINE LOBBY</div>
              <div className="text-[10px] font-mono mt-0.5" style={{ color: th.textMuted }}>
                You: <span style={{ color: th.textPrimary }}>{onlineAlias}</span>
                <span className="ml-2" style={{ color: "#10b981" }}>● LIVE</span>
              </div>
            </div>
            <button onClick={leaveLobby} className="text-[10px] font-mono px-3 py-1.5 transition-colors"
              style={{ border: `1px solid ${th.ctrlBorder}`, color: th.ctrlText }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#ff444488"; (e.currentTarget as HTMLElement).style.color = "#ff4444"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = th.ctrlBorder; (e.currentTarget as HTMLElement).style.color = th.ctrlText; }}
            >
              ← Leave
            </button>
          </div>

          {/* Incoming challenge toast */}
          <AnimatePresence>
            {incomingChallenge && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 rounded-sm"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.4)", boxShadow: "0 0 16px rgba(16,185,129,0.15)" }}
              >
                <div className="text-xs font-mono font-bold mb-3" style={{ color: "#10b981" }}>
                  ⚔ <span style={{ color: th.textPrimary }}>{incomingChallenge.alias}</span> challenged you!
                </div>
                <div className="flex gap-2">
                  <button onClick={acceptChallenge} className="flex-1 py-2 text-[10px] font-mono tracking-wider transition-all"
                    style={{ border: "1px solid rgba(16,185,129,0.6)", background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                    ✓ ACCEPT
                  </button>
                  <button onClick={declineChallenge} className="flex-1 py-2 text-[10px] font-mono tracking-wider transition-all"
                    style={{ border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.08)", color: "#f87171" }}>
                    ✗ DECLINE
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Waiting indicator */}
          <AnimatePresence>
            {waitingFor && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="mb-4 p-3 text-center rounded-sm text-[10px] font-mono"
                style={{ border: `1px solid ${th.accentBorder}`, color: th.textAccent, background: th.accentBg }}>
                <span className="animate-pulse">⏳ Waiting for {waitingFor.alias} to respond...</span>
                <button onClick={() => setWaitingFor(null)} className="ml-3 opacity-50 hover:opacity-100">✗</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Players list */}
          <div className="rounded-sm" style={{ background: th.surface, border: `1px solid ${th.surfaceBorder}` }}>
            <div className="px-4 py-2.5 border-b text-[10px] font-mono tracking-widest uppercase flex items-center gap-2"
              style={{ borderColor: th.surfaceBorder, color: th.textAccent }}>
              // Online Players
              <span style={{ color: th.textMuted }}>({onlinePlayers.length})</span>
            </div>
            {onlinePlayers.length === 0 ? (
              <div className="px-4 py-8 text-center text-[11px] font-mono" style={{ color: th.textMuted }}>
                No players online yet. Share the URL to invite someone.
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: th.surfaceBorder }}>
                {onlinePlayers.map((p) => (
                  <div key={p.uid} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#10b981", fontSize: 8 }}>●</span>
                      <span className="text-sm font-mono" style={{ color: th.textPrimary }}>{p.alias}</span>
                    </div>
                    <button
                      onClick={() => sendChallenge(p)}
                      disabled={!!waitingFor}
                      className="text-[10px] font-mono px-3 py-1.5 tracking-wider transition-all"
                      style={{ border: `1px solid ${th.accentBorder}`, color: th.accentText, background: th.accentBg, opacity: waitingFor ? 0.4 : 1 }}
                    >
                      CHALLENGE
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-3 text-center text-[9px] font-mono" style={{ color: th.textMuted }}>
            Refreshes automatically · Challenges expire when you leave
          </div>
        </div>
      </div>
    );
  }

  // ─── SETUP SCREEN ──────────────────────────────────────────────────────────
  if (gameState.phase === "setup") {
    return (
      <div
        className="min-h-[100dvh] flex flex-col items-center justify-center p-4 relative overflow-hidden"
        style={{ background: th.bg }}
      >
        {/* Background grid lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {theme === "dark" && Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute w-px top-0 bottom-0" style={{ left: `${(i + 1) * 5}%`, background: th.gridLine }} />
          ))}
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
          style={{ color: th.textSecondary, border: `1px solid ${th.surfaceBorder}`, background: th.surface }}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-sm hover:opacity-80 transition-opacity"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="relative z-10 w-full max-w-md">
          {/* Branding */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-1">
              <div className="h-px w-8 bg-gradient-to-r from-transparent" style={{ backgroundImage: `linear-gradient(to right, transparent, ${th.accent})` }} />
              <h1 className="text-4xl sm:text-5xl font-black tracking-[0.2em]" style={{ color: th.accent }}>MONIX</h1>
              <div className="h-px w-8" style={{ backgroundImage: `linear-gradient(to left, transparent, ${th.accent})` }} />
            </div>
            <p className="text-[10px] font-mono tracking-[0.5em] uppercase" style={{ color: th.textMuted }}>Chess · Cyber Edition</p>
          </div>

          <div className="rounded-sm p-5 sm:p-6 space-y-5" style={{ background: th.surface, border: `1px solid ${th.surfaceBorder}` }}>
            {/* Mode */}
            <div>
              <div className="text-[10px] font-mono tracking-widest uppercase mb-2.5" style={{ color: th.textAccent }}>// Mode</div>
              <div className="grid grid-cols-2 gap-2">
                {(["pve","pvp"] as GameMode[]).map((m) => (
                  <button key={m} onClick={() => setGameState((gs) => ({ ...gs, mode: m }))}
                    className="py-2.5 text-xs font-mono tracking-wider transition-all duration-150"
                    style={gameState.mode === m
                      ? { border: `1px solid ${th.accentBorder}`, background: th.accentBg, color: th.accentText }
                      : { border: `1px solid ${th.ctrlBorder}`, color: th.ctrlText, background: "transparent" }}
                  >
                    {m === "pve" ? "vs COMPUTER" : "LOCAL 2P"}
                  </button>
                ))}
              </div>
            </div>

            {/* P2P Multiplayer */}
            <div>
              <div className="text-[10px] font-mono tracking-widest uppercase mb-2.5" style={{ color: "#10b981" }}>// P2P MULTIPLAYER</div>
              <button
                onClick={() => setGameState(gs => ({ ...gs, mode: "online", phase: "online_name" as GamePhase }))}
                className="w-full py-2.5 text-xs font-mono tracking-wider transition-all duration-150 flex items-center justify-center gap-2"
                style={{ border: "1px solid rgba(16,185,129,0.45)", color: "#10b981", background: "rgba(16,185,129,0.06)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.8)"; (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.12)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.45)"; (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.06)"; }}
              >
                <span>⚡</span> ONLINE LOBBY
              </button>
            </div>

            {/* Color */}
            {gameState.mode === "pve" && (
              <div>
                <div className="text-[10px] font-mono tracking-widest uppercase mb-2.5" style={{ color: th.textAccent }}>// Play As</div>
                <div className="grid grid-cols-2 gap-2">
                  {(["w","b"] as PlayerColor[]).map((c) => (
                    <button key={c} onClick={() => setGameState((gs) => ({ ...gs, playerColor: c }))}
                      className="py-2.5 text-xs font-mono tracking-wider transition-all duration-150"
                      style={gameState.playerColor === c
                        ? { border: `1px solid ${th.accentBorder}`, background: th.accentBg, color: th.accentText }
                        : { border: `1px solid ${th.ctrlBorder}`, color: th.ctrlText, background: "transparent" }}
                    >
                      {c === "w" ? "◻ WHITE" : "◼ BLACK"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Difficulty */}
            {gameState.mode === "pve" && (
              <div>
                <div className="text-[10px] font-mono tracking-widest uppercase mb-2.5" style={{ color: th.textAccent }}>
                  // Difficulty — <span style={{ color: diff.hex }}>{diff.name.toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {DIFFICULTIES.map((d, i) => (
                    <button key={d.name} onClick={() => setGameState((gs) => ({ ...gs, diffIdx: i }))}
                      className="py-2 text-[10px] font-mono tracking-wider transition-all duration-150"
                      style={gameState.diffIdx === i
                        ? { border: `1px solid ${d.hex}`, color: d.hex, background: d.hex + "18", boxShadow: `0 0 12px ${d.hex}25` }
                        : { border: `1px solid ${th.ctrlBorder}`, color: th.textMuted, background: "transparent" }}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
                {/* Per-difficulty tip */}
                {diff.tip && (
                  <div className="mt-2 text-[10px] font-mono text-center" style={{ color: diff.hex + "cc" }}>
                    ⚡ {diff.tip}
                  </div>
                )}
              </div>
            )}

            {/* Start */}
            <button onClick={startGame}
              className="w-full py-3.5 text-xs font-mono tracking-[0.3em] uppercase transition-all duration-200 hover:opacity-90 active:scale-[0.99]"
              style={{ border: `1px solid ${th.accentBorder}`, background: th.accentBg, color: th.accentText }}
            >
              INITIALIZE MATCH <ChevronRight className="inline w-3.5 h-3.5 -mt-0.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── GAME SCREEN ──────────────────────────────────────────────────────────
  const playerTimerColor = (side: "w" | "b") =>
    currentTurn === side && gameState.phase === "playing" ? th.timerActive : th.timerInactive;

  // Determine which last-move squares to highlight in the current view
  const reviewLastMove = reviewIdx >= 0 ? reviewSnaps[reviewIdx] : null;
  const activeLmFrom = gameState.phase === "review" ? reviewLastMove?.moveFrom ?? null : lastMove?.from ?? null;
  const activeLmTo   = gameState.phase === "review" ? reviewLastMove?.moveTo   ?? null : lastMove?.to   ?? null;

  const renderBoard = (overrideBoard?: ReturnType<Chess["board"]> | null) => {
    const source = overrideBoard ?? boardData;
    return (
      <div
        className="grid border"
        style={{
          gridTemplateColumns: "repeat(8, 1fr)",
          borderColor: th.surfaceBorder,
          boxShadow: theme === "dark" ? `0 0 40px ${th.accentBg}` : "0 4px 24px rgba(0,0,0,0.12)",
          width: "100%",
        }}
      >
        {ranks.map((rank) =>
          files.map((file) => {
            const sq = (file + rank) as Square;
            const col = file.charCodeAt(0) - 97;
            const row = 8 - rank;
            const isLight = (row + col) % 2 === 0;
            const piece = source[row]?.[col] ?? null;
            const isReview = gameState.phase === "review";

            return (
              <BoardSquare
                key={sq}
                sq={sq}
                piece={piece}
                isSelected={!isReview && selected === sq}
                isLegal={!isReview && legalMoves.includes(sq)}
                isHintFrom={!isReview && (hint?.from === sq)}
                isHintTo={!isReview && (hint?.to === sq)}
                isLastMoveFrom={activeLmFrom === sq}
                isLastMoveTo={activeLmTo === sq}
                isCheck={!isReview && (checkSquare === sq)}
                isDragTarget={!isReview && (dragOver === sq && legalMoves.includes(sq))}
                isDragFrom={!isReview && (dragFrom === sq)}
                onClick={() => !isReview && handleSquareClick(sq)}
                onDragStart={() => !isReview && handleDragStart(sq)}
                onDragOver={(e) => { e.preventDefault(); if (!isReview) setDragOver(sq); }}
                onDrop={() => !isReview && handleDrop(sq)}
                onDragEnd={() => { if (!isReview) { setDragFrom(null); setDragOver(null); } }}
                squareBg={isLight ? th.squareLight : th.squareDark}
                th={th}
              />
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: th.bg }}>
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {theme === "dark" && Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="absolute w-px top-0 bottom-0" style={{ left: `${(i + 1) * 3.33}%`, background: th.gridLine }} />
        ))}
      </div>

      {/* ── Header ── */}
      <header
        className="relative z-10 flex items-center justify-between px-3 sm:px-4 py-2.5"
        style={{ borderBottom: `1px solid ${th.surfaceBorder}`, background: th.surface }}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-lg sm:text-xl font-black tracking-[0.2em]" style={{ color: th.accent }}>MONIX</span>
          <span className="text-[9px] font-mono hidden sm:inline" style={{ color: th.textMuted }}>CHESS</span>
          {gameState.mode === "pve" ? (
            <span className="text-[9px] font-mono px-1.5 py-0.5 border" style={{ borderColor: diff.hex + "80", color: diff.hex }}>
              {diff.name.toUpperCase()}
            </span>
          ) : gameState.mode === "online" ? (
            <span className="text-[9px] font-mono px-1.5 py-0.5 border" style={{ borderColor: "rgba(16,185,129,0.5)", color: "#10b981" }}>ONLINE</span>
          ) : (
            <span className="text-[9px] font-mono px-1.5 py-0.5 border" style={{ borderColor: th.accentBorder, color: th.accentText }}>2P</span>
          )}
        </div>

        {/* Turn indicator + check warning */}
        <div className="flex items-center gap-2">
          {showCheckWarning && (
            <div className="text-[10px] font-mono px-2 py-1 border animate-pulse"
              style={{ borderColor: th.checkBorder, color: th.checkBorder, background: th.checkBg }}>
              ⚡ CHECK!
            </div>
          )}
          <div className="text-[10px] font-mono px-2 py-1 border"
            style={currentTurn === "w"
              ? { borderColor: th.accentBorder, color: th.accentText, background: th.accentBg }
              : { borderColor: th.enemy + "80", color: th.enemy, background: th.enemyBg }}>
            {currentTurn === "w" ? "◻ WHITE" : "◼ BLACK"}
            {isAiThinking ? " [AI]" : ""}
          </div>

          {/* Theme toggle */}
          <Tip label={theme === "dark" ? "Switch to Light" : "Switch to Dark"}>
            <button
              onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
              className="w-7 h-7 flex items-center justify-center rounded-sm transition-opacity hover:opacity-70"
              style={{ color: th.textSecondary, border: `1px solid ${th.ctrlBorder}` }}
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </Tip>

          <Tip label="Quit to Main Menu">
            <button
              onClick={handleQuit}
              className="flex items-center gap-1 text-[10px] font-mono px-2 py-1.5 border transition-colors"
              style={{ border: `1px solid ${th.ctrlBorder}`, color: th.ctrlText }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#ff444488"; (e.currentTarget as HTMLElement).style.color = "#ff4444"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = th.ctrlBorder; (e.currentTarget as HTMLElement).style.color = th.ctrlText; }}
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">QUIT</span>
            </button>
          </Tip>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row gap-3 p-2.5 sm:p-3 lg:p-4 items-start justify-center">

        {/* Left / top panel */}
        <div className="w-full lg:w-48 xl:w-52 order-2 lg:order-1 flex flex-row lg:flex-col gap-2">
          {/* Black timer */}
          <div className="flex-1 lg:flex-none rounded-sm px-3 py-2 flex items-center justify-between"
            style={{ background: th.surface, border: `1px solid ${th.surfaceBorder}` }}>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: th.textMuted }}>◼ BLACK</div>
              {gameState.mode === "pvp" && (
                <div className="text-[9px] font-mono" style={{ color: th.textMuted }}>Player 2</div>
              )}
              {gameState.mode === "online" && (
                <div className="text-[9px] font-mono" style={{ color: "#10b981" }}>
                  {isOnlineBlack ? onlineAlias : opponentDisplayName}
                </div>
              )}
            </div>
            <div className="text-sm font-mono font-bold tabular-nums" style={{ color: playerTimerColor("b") }}>
              {formatTime(timers.b)}
            </div>
          </div>

          {/* Captured by white (black pieces taken) */}
          <div className="hidden lg:block">
            <CapturedPanel pieces={captured.w} label="WHITE TOOK" th={th} />
          </div>
        </div>

        {/* Board column */}
        <div className="order-1 lg:order-2 w-full flex flex-col items-center" style={{ maxWidth: "min(100%, 560px)" }}>
          {/* ── Online HUD (above board) ── */}
          {gameState.mode === "online" && gameState.phase === "playing" && (
            <div className="w-full mb-2 flex items-center justify-between px-3 py-2 rounded-sm"
              style={{
                background: "rgba(5,5,20,0.75)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(0,229,255,0.15)",
                boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "rgba(0,229,255,0.5)" }}>OPP</span>
                <span className="text-[11px] font-mono font-bold" style={{ color: "#e0f0ff" }}>
                  {opponentDisplayName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {pingMs !== null && (
                  <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>{pingMs}ms</span>
                )}
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      pingMs === null ? "#607080"
                      : pingMs < 100 ? "#10b981"
                      : pingMs < 300 ? "#f59e0b"
                      : "#ef4444",
                    boxShadow:
                      pingMs === null ? "none"
                      : pingMs < 100 ? "0 0 6px #10b981"
                      : pingMs < 300 ? "0 0 6px #f59e0b"
                      : "0 0 6px #ef4444",
                  }}
                />
              </div>
            </div>
          )}

          {/* File labels top */}
          <div className="flex w-full mb-0.5" style={{ paddingLeft: "20px" }}>
            {files.map((f) => (
              <div key={f} className="flex-1 text-center text-[9px] font-mono" style={{ color: th.textMuted }}>{f}</div>
            ))}
          </div>

          <div className="flex w-full">
            {/* Rank labels left */}
            <div className="flex flex-col justify-around mr-0.5" style={{ width: "20px" }}>
              {ranks.map((r) => (
                <div key={r} className="text-[9px] font-mono text-right pr-1 leading-none" style={{ color: th.textMuted }}>{r}</div>
              ))}
            </div>

            {/* Board */}
            <div className="flex-1">{renderBoard(gameState.phase === "review" ? reviewBoard : undefined)}</div>

            {/* Rank labels right */}
            <div className="flex flex-col justify-around ml-0.5" style={{ width: "20px" }}>
              {ranks.map((r) => (
                <div key={r} className="text-[9px] font-mono pl-1 leading-none" style={{ color: th.textMuted }}>{r}</div>
              ))}
            </div>
          </div>

          {/* File labels bottom */}
          <div className="flex w-full mt-0.5" style={{ paddingLeft: "20px" }}>
            {files.map((f) => (
              <div key={f} className="flex-1 text-center text-[9px] font-mono" style={{ color: th.textMuted }}>{f}</div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-1.5 mt-3 flex-wrap justify-center">
            {gameState.phase === "review" ? (
              <>
                <Tip label="Previous move">
                  <button
                    onClick={reviewPrev}
                    disabled={reviewIdx < 0}
                    className="flex items-center gap-1 px-3 py-2 text-[10px] font-mono border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ border: `1px solid ${th.ctrlBorder}`, color: th.ctrlText }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = th.ctrlHoverBorder; el.style.color = th.ctrlHoverText; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = th.ctrlBorder; el.style.color = th.ctrlText; }}
                  >
                    <ChevronLeft className="w-3 h-3" /> PREV
                  </button>
                </Tip>
                <div className="flex items-center justify-center px-4 py-2 text-[10px] font-mono border"
                  style={{ border: `1px solid ${th.surfaceBorder}`, color: th.textMuted }}>
                  MOVE {reviewIdx + 1} / {reviewSnaps.length}
                </div>
                <Tip label="Next move">
                  <button
                    onClick={reviewNext}
                    disabled={reviewIdx >= reviewSnaps.length - 1}
                    className="flex items-center gap-1 px-3 py-2 text-[10px] font-mono border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ border: `1px solid ${th.ctrlBorder}`, color: th.ctrlText }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = th.ctrlHoverBorder; el.style.color = th.ctrlHoverText; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = th.ctrlBorder; el.style.color = th.ctrlText; }}
                  >
                    NEXT <ChevronRight className="w-3 h-3" />
                  </button>
                </Tip>
                <Tip label="Exit review mode">
                  <button
                    onClick={exitReview}
                    className="flex items-center gap-1 px-3 py-2 text-[10px] font-mono border transition-all hover:opacity-80 ml-2"
                    style={{ border: `1px solid ${th.accentBorder}`, color: th.accentBg, background: th.accentText }}
                  >
                    <X className="w-3 h-3" /> EXIT
                  </button>
                </Tip>
              </>
            ) : gameState.mode !== "online" ? (
              <>
                <Tip label="Undo last move">
                  <button
                    onClick={handleUndo}
                    disabled={chess.history().length === 0 || isAiThinking}
                    className="flex items-center gap-1 px-3 py-2 text-[10px] font-mono border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ border: `1px solid ${th.ctrlBorder}`, color: th.ctrlText }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = th.ctrlHoverBorder; el.style.color = th.ctrlHoverText; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = th.ctrlBorder; el.style.color = th.ctrlText; }}
                  >
                    <RotateCcw className="w-3 h-3" /> UNDO
                  </button>
                </Tip>
                {gameState.mode === "pve" && (
                  <Tip label="Show best move hint">
                    <button
                      onClick={handleHint}
                      disabled={!isPlayerTurn() || isAiThinking}
                      className="flex items-center gap-1 px-3 py-2 text-[10px] font-mono border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ border: `1px solid ${th.ctrlBorder}`, color: th.ctrlText }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#d97706"; el.style.color = "#d97706"; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = th.ctrlBorder; el.style.color = th.ctrlText; }}
                    >
                      <Lightbulb className="w-3 h-3" /> HINT
                    </button>
                  </Tip>
                )}
                <Tip label="Resign current game">
                  <button
                    onClick={handleResign}
                    disabled={isAiThinking}
                    className="flex items-center gap-1 px-3 py-2 text-[10px] font-mono border transition-all disabled:opacity-30"
                    style={{ border: `1px solid ${th.ctrlBorder}`, color: th.ctrlText }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#ef444488"; el.style.color = "#ef4444"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = th.ctrlBorder; el.style.color = th.ctrlText; }}
                  >
                    <Flag className="w-3 h-3" /> RESIGN
                  </button>
                </Tip>
                <Tip label="Restart with same settings">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 px-3 py-2 text-[10px] font-mono border transition-all"
                    style={{ border: `1px solid ${th.ctrlBorder}`, color: th.ctrlText }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#a855f788"; el.style.color = "#a855f7"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = th.ctrlBorder; el.style.color = th.ctrlText; }}
                  >
                    <RefreshCw className="w-3 h-3" /> RESET
                  </button>
                </Tip>
              </>
            ) : null}
          </div>

          {/* ── Online Cooperative Actions ── */}
          {gameState.mode === "online" && gameState.phase === "playing" && (
            <div className="flex gap-2 mt-2 w-full flex-wrap justify-center">
              <button
                onClick={sendUndoRequest}
                className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono border transition-all"
                style={{ border: "1px solid rgba(0,229,255,0.25)", color: "rgba(0,229,255,0.7)", background: "rgba(0,229,255,0.05)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,229,255,0.7)"; (e.currentTarget as HTMLElement).style.color = "#00e5ff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,229,255,0.25)"; (e.currentTarget as HTMLElement).style.color = "rgba(0,229,255,0.7)"; }}
              >
                ↶ UNDO
              </button>
              <button
                onClick={sendDrawOffer}
                className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono border transition-all"
                style={{ border: "1px solid rgba(16,185,129,0.25)", color: "rgba(16,185,129,0.7)", background: "rgba(16,185,129,0.05)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.7)"; (e.currentTarget as HTMLElement).style.color = "#10b981"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(16,185,129,0.25)"; (e.currentTarget as HTMLElement).style.color = "rgba(16,185,129,0.7)"; }}
              >
                🤝 DRAW
              </button>
              <button
                onClick={sendOnlineResign}
                className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono border transition-all"
                style={{ border: "1px solid rgba(239,68,68,0.25)", color: "rgba(239,68,68,0.7)", background: "rgba(239,68,68,0.05)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.7)"; (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.25)"; (e.currentTarget as HTMLElement).style.color = "rgba(239,68,68,0.7)"; }}
              >
                🏳️ RESIGN
              </button>
            </div>
          )}

          {/* ── Online Chat ── */}
          {gameState.mode === "online" && gameState.phase === "playing" && (
            <div className="w-full mt-3 rounded-sm flex flex-col"
              style={{
                background: "rgba(5,5,20,0.8)",
                border: "1px solid rgba(0,229,255,0.12)",
                maxHeight: "200px",
              }}
            >
              <div className="px-3 py-1.5 border-b text-[9px] font-mono tracking-widest uppercase"
                style={{ borderColor: "rgba(0,229,255,0.1)", color: "rgba(0,229,255,0.5)" }}>
                // MATCH CHAT
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ minHeight: "80px", maxHeight: "120px" }}>
                {chatMessages.length === 0 ? (
                  <div className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>No messages yet. Say hello!</div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className="text-[10px] font-mono leading-relaxed">
                      <span style={{ color: msg.sender === onlineAlias ? "#00e5ff" : "#ff0080", marginRight: 6 }}>
                        {msg.sender}:
                      </span>
                      <span style={{ color: "rgba(224,240,255,0.85)" }}>{msg.text}</span>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex border-t" style={{ borderColor: "rgba(0,229,255,0.1)" }}>
                <input
                  type="text"
                  maxLength={120}
                  placeholder="Type a message…"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") sendChat(); }}
                  className="flex-1 bg-transparent outline-none text-[10px] font-mono px-3 py-2"
                  style={{ color: "#e0f0ff" }}
                />
                <button
                  onClick={sendChat}
                  className="px-3 py-2 text-[10px] font-mono transition-all"
                  style={{ color: "rgba(0,229,255,0.6)", borderLeft: "1px solid rgba(0,229,255,0.1)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#00e5ff"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(0,229,255,0.6)"; }}
                >
                  SEND
                </button>
              </div>
            </div>
          )}

          {/* Mobile: captured + log (collapsible) */}
          <div className="lg:hidden w-full mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <CapturedPanel pieces={captured.w} label="WHITE TOOK" th={th} />
              <CapturedPanel pieces={captured.b} label="BLACK TOOK" th={th} />
            </div>

            <div className="rounded-sm" style={{ background: th.surface, border: `1px solid ${th.surfaceBorder}` }}>
              <button
                onClick={() => setLogExpanded(!logExpanded)}
                className="w-full flex items-center justify-between px-3 py-2"
              >
                <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: th.textAccent }}>
                  // Move Log ({moveHistory.length} moves)
                </span>
                {logExpanded ? <ChevronUp className="w-3 h-3" style={{ color: th.textMuted }} /> : <ChevronDown className="w-3 h-3" style={{ color: th.textMuted }} />}
              </button>
              {logExpanded && (
                <div ref={historyRef} className="px-3 pb-3 overflow-y-auto max-h-36">
                  {moveHistory.length === 0 ? (
                    <span className="text-[10px] font-mono" style={{ color: th.textMuted }}>No moves yet</span>
                  ) : (
                    Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                      <div key={i} className="flex gap-2 text-[10px] font-mono py-0.5">
                        <span className="w-5" style={{ color: th.textMuted }}>{i + 1}.</span>
                        <span style={{ color: th.accentText }} className="w-10">{moveHistory[i * 2]}</span>
                        <span style={{ color: th.enemy }}>{moveHistory[i * 2 + 1] ?? ""}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-full lg:w-48 xl:w-52 order-3 flex flex-row lg:flex-col gap-2">
          {/* White timer */}
          <div className="flex-1 lg:flex-none rounded-sm px-3 py-2 flex items-center justify-between"
            style={{ background: th.surface, border: `1px solid ${th.surfaceBorder}` }}>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: th.textMuted }}>◻ WHITE</div>
              {gameState.mode === "pvp" && (
                <div className="text-[9px] font-mono" style={{ color: th.textMuted }}>Player 1</div>
              )}
            </div>
            <div className="text-sm font-mono font-bold tabular-nums" style={{ color: playerTimerColor("w") }}>
              {formatTime(timers.w)}
            </div>
          </div>

          {/* Captured by black */}
          <div className="hidden lg:block">
            <CapturedPanel pieces={captured.b} label="BLACK TOOK" th={th} />
          </div>

          {/* Move log — desktop */}
          <div className="hidden lg:flex flex-col rounded-sm flex-1" style={{ background: th.surface, border: `1px solid ${th.surfaceBorder}`, minHeight: "180px" }}>
            <div className="px-3 pt-2.5 pb-1.5 border-b text-[10px] font-mono tracking-widest uppercase flex items-center gap-1.5"
              style={{ borderColor: th.surfaceBorder, color: th.textAccent }}>
              <Clock className="w-3 h-3" />
              Move Log
            </div>
            <div ref={historyRef} className="flex-1 p-2 overflow-y-auto" style={{ maxHeight: "240px" }}>
              {moveHistory.length === 0 ? (
                <span className="text-[10px] font-mono" style={{ color: th.textMuted }}>No moves yet.</span>
              ) : (
                Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                  <div key={i} className="flex gap-2 text-[10px] font-mono py-[3px] hover:bg-white/5 rounded-sm px-1">
                    <span className="w-5 shrink-0" style={{ color: th.textMuted }}>{i + 1}.</span>
                    <span className="w-10 shrink-0" style={{ color: th.accentText }}>{moveHistory[i * 2]}</span>
                    <span style={{ color: th.enemy }}>{moveHistory[i * 2 + 1] ?? ""}</span>
                  </div>
                ))
              )}
            </div>
            <div className="px-3 py-2 border-t text-[10px] font-mono" style={{ borderColor: th.surfaceBorder, color: th.textMuted }}>
              {moveHistory.length} moves · Depth {diff.depth}
            </div>
          </div>
        </div>
      </div>

      {/* ── Promotion Modal ── */}
      {promotionPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="rounded-sm p-5 text-center" style={{ background: th.surface, border: `1px solid ${th.accentBorder}`, boxShadow: `0 0 40px ${th.accentBg}` }}>
            <div className="text-[10px] font-mono tracking-widest uppercase mb-3" style={{ color: th.textAccent }}>// Promote Pawn</div>
            <div className="flex gap-2">
              {(["q","r","b","n"] as PieceSymbol[]).map((p) => (
                <button key={p} onClick={() => handlePromotion(p)}
                  className="w-14 h-14 border transition-all"
                  style={{ border: `1px solid ${th.ctrlBorder}` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = th.accentBorder; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = th.ctrlBorder; }}
                >
                  <PieceSVG type={p} color={chess.turn()} th={th} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Disconnect Modal ── */}
      <AnimatePresence>
        {isDisconnected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-xs text-center rounded-sm p-8"
              style={{ background: "rgba(8,8,20,0.9)", border: "1px solid rgba(239,68,68,0.35)", boxShadow: "0 0 40px rgba(239,68,68,0.2)" }}
            >
              <div className="text-3xl mb-4" style={{ filter: "drop-shadow(0 0 12px rgba(239,68,68,0.8))" }}>⚡</div>
              <div className="text-sm font-mono font-bold tracking-widest mb-2" style={{ color: "#ef4444" }}>
                OPPONENT LEFT THE MATCH
              </div>
              <div className="text-[10px] font-mono mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
                Opponent left the match. You Win!
              </div>
              <button
                onClick={handleQuit}
                className="w-full py-2.5 text-[10px] font-mono tracking-wider transition-all"
                style={{ border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444", background: "rgba(239,68,68,0.08)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.18)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"; }}
              >
                RETURN TO MENU
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pending Undo Request Modal ── */}
      <AnimatePresence>
        {pendingUndoFrom && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs rounded-sm p-4"
            style={{ background: "rgba(5,5,20,0.95)", border: "1px solid rgba(0,229,255,0.3)", boxShadow: "0 4px 32px rgba(0,0,0,0.7)" }}
          >
            <div className="text-[10px] font-mono font-bold mb-3" style={{ color: "#00e5ff" }}>
              ↶ <span style={{ color: "#e0f0ff" }}>{pendingUndoFrom}</span> requests to undo the last move.
            </div>
            <div className="flex gap-2">
              <button
                onClick={acceptUndo}
                className="flex-1 py-2 text-[10px] font-mono tracking-wider transition-all"
                style={{ border: "1px solid rgba(16,185,129,0.5)", background: "rgba(16,185,129,0.1)", color: "#10b981" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.1)"; }}
              >
                ✓ ACCEPT
              </button>
              <button
                onClick={declineUndo}
                className="flex-1 py-2 text-[10px] font-mono tracking-wider transition-all"
                style={{ border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.08)", color: "#f87171" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.18)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"; }}
              >
                ✗ DECLINE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pending Draw Offer Modal ── */}
      <AnimatePresence>
        {pendingDrawFrom && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs rounded-sm p-4"
            style={{ background: "rgba(5,5,20,0.95)", border: "1px solid rgba(16,185,129,0.3)", boxShadow: "0 4px 32px rgba(0,0,0,0.7)" }}
          >
            <div className="text-[10px] font-mono font-bold mb-3" style={{ color: "#10b981" }}>
              🤝 <span style={{ color: "#e0f0ff" }}>{pendingDrawFrom}</span> offers a draw.
            </div>
            <div className="flex gap-2">
              <button
                onClick={acceptDraw}
                className="flex-1 py-2 text-[10px] font-mono tracking-wider transition-all"
                style={{ border: "1px solid rgba(16,185,129,0.5)", background: "rgba(16,185,129,0.1)", color: "#10b981" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.1)"; }}
              >
                ✓ ACCEPT
              </button>
              <button
                onClick={declineDraw}
                className="flex-1 py-2 text-[10px] font-mono tracking-wider transition-all"
                style={{ border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.08)", color: "#f87171" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.18)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"; }}
              >
                ✗ DECLINE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Game Over Overlay ── */}
      <AnimatePresence>
        {gameState.phase === "over" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
          >
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.91 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="w-full max-w-sm text-center"
              style={{
                background: "rgba(0,0,0,0.62)",
                backdropFilter: "blur(28px)",
                WebkitBackdropFilter: "blur(28px)",
                border: "1px solid rgba(0,212,255,0.22)",
                borderRadius: 14,
                boxShadow: "0 0 0 1px rgba(0,212,255,0.07), 0 0 48px rgba(0,212,255,0.14), inset 0 1px 0 rgba(255,255,255,0.05)",
                padding: "36px 28px 28px",
              }}
            >
              {/* Neon knight icon */}
              <div style={{
                fontSize: 52,
                lineHeight: 1,
                marginBottom: 14,
                filter: "drop-shadow(0 0 18px rgba(0,212,255,0.7)) drop-shadow(0 0 6px rgba(0,212,255,0.4))",
                color: "#00d4ff",
              }}>
                ♞
              </div>

              <div style={{
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: "0.16em",
                marginBottom: 8,
                color: "rgba(255,255,255,0.95)",
                fontFamily: "monospace",
                textShadow: "0 0 20px rgba(0,212,255,0.3)",
              }}>
                {gameState.endReason === "checkmate" ? "CHECKMATE"
                  : gameState.endReason === "stalemate" ? "STALEMATE"
                  : gameState.endReason === "resign" ? "RESIGNED"
                  : "DRAW"}
              </div>

              {gameState.winner && (
                <div style={{
                  fontSize: 12,
                  fontFamily: "monospace",
                  letterSpacing: "0.16em",
                  marginBottom: 6,
                  color: "#00d4ff",
                  textShadow: "0 0 10px rgba(0,212,255,0.5)",
                }}>
                  {gameState.winner} WINS
                </div>
              )}
              {!gameState.winner && (
                <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: 6, color: "rgba(255,255,255,0.35)" }}>
                  GAME DRAWN
                </div>
              )}

              <div style={{ fontSize: 10, fontFamily: "monospace", marginBottom: 28, color: "rgba(255,255,255,0.28)", letterSpacing: "0.06em" }}>
                {moveHistory.length} moves played
              </div>

              <div className="flex gap-2">
                <ChessBtn
                  onClick={handleReset}
                  label="REMATCH"
                  accent
                />
                {reviewSnaps.length > 0 && (
                  <ChessBtn onClick={enterReview} label="ANALYZE" />
                )}
                <ChessBtn onClick={handleQuit} label="MENU" dim />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
