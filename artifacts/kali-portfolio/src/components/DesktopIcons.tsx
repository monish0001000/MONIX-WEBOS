import { useRef, memo } from "react";
import { motion } from "framer-motion";

interface DesktopIconsProps {
  onOpenWindow: (id: string) => void;
  selectedIcon: string | null;
  onSelectIcon: (id: string | null) => void;
  dragConstraintsRef: React.RefObject<HTMLDivElement | null>;
  onLongPress?: (x: number, y: number) => void;
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <linearGradient id="trashBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6a6a82" />
          <stop offset="100%" stopColor="#3a3a50" />
        </linearGradient>
        <linearGradient id="trashLid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a7a96" />
          <stop offset="100%" stopColor="#5a5a72" />
        </linearGradient>
      </defs>
      <rect x="7" y="11" width="22" height="20" rx="2.5" fill="url(#trashBody)" stroke="#8080a0" strokeWidth="0.8"/>
      <rect x="10" y="14.5" width="16" height="13" rx="1.5" fill="#252538" opacity="0.6"/>
      <rect x="6.5" y="8" width="23" height="4" rx="2" fill="url(#trashLid)" stroke="#9090b0" strokeWidth="0.7"/>
      <rect x="13.5" y="5.5" width="9" height="3" rx="1.5" fill="#6a6a88" stroke="#9090b4" strokeWidth="0.6"/>
      <line x1="13" y1="16" x2="13" y2="28" stroke="#a0a0c0" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="18" y1="16" x2="18" y2="28" stroke="#a0a0c0" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="23" y1="16" x2="23" y2="28" stroke="#a0a0c0" strokeWidth="1.8" strokeLinecap="round"/>
      <rect x="15" y="8" width="6" height="4" rx="1" fill="#5a5a78" opacity="0.5"/>
    </svg>
  );
}

function FileSystemIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <linearGradient id="diskGrad" x1="0.3" y1="0.1" x2="0.7" y2="0.9">
          <stop offset="0%" stopColor="#2a4a8c" />
          <stop offset="100%" stopColor="#0f1f4a" />
        </linearGradient>
        <radialGradient id="diskShine" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#4a7ee0" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0a1a44" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="18" cy="18" r="15" fill="url(#diskGrad)" stroke="#2a5ab8" strokeWidth="1.2"/>
      <circle cx="18" cy="18" r="15" fill="url(#diskShine)"/>
      <circle cx="18" cy="18" r="11" fill="none" stroke="#3a6ad0" strokeWidth="0.8" strokeDasharray="2 3"/>
      <circle cx="18" cy="18" r="7.5" fill="none" stroke="#2a50a8" strokeWidth="0.8"/>
      <circle cx="18" cy="18" r="4" fill="#1a3a7a" stroke="#4a80e0" strokeWidth="1"/>
      <circle cx="18" cy="18" r="2" fill="#5090f0"/>
      <circle cx="18" cy="18" r="0.8" fill="#90c0ff"/>
      <line x1="18" y1="3.5" x2="18" y2="7" stroke="#5080d0" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="18" y1="29" x2="18" y2="32.5" stroke="#5080d0" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="3.5" y1="18" x2="7" y2="18" stroke="#5080d0" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="29" y1="18" x2="32.5" y2="18" stroke="#5080d0" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7.8" y1="7.8" x2="10.3" y2="10.3" stroke="#3a60c0" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="25.7" y1="25.7" x2="28.2" y2="28.2" stroke="#3a60c0" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="28.2" y1="7.8" x2="25.7" y2="10.3" stroke="#3a60c0" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="10.3" y1="25.7" x2="7.8" y2="28.2" stroke="#3a60c0" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <linearGradient id="houseWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2060c8" />
          <stop offset="100%" stopColor="#0d3a80" />
        </linearGradient>
        <linearGradient id="houseRoof" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#2a74e0" />
          <stop offset="100%" stopColor="#1250aa" />
        </linearGradient>
        <linearGradient id="houseDoor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d2a60" />
          <stop offset="100%" stopColor="#071a40" />
        </linearGradient>
      </defs>
      <path d="M3 16.5L18 4.5l15 12V32H3V16.5z" fill="url(#houseWall)" stroke="#3a80e8" strokeWidth="0.8" strokeLinejoin="round"/>
      <path d="M2 17L18 4l16 13" fill="url(#houseRoof)" stroke="#5090f0" strokeWidth="1.2" strokeLinejoin="round"/>
      <rect x="13.5" y="21.5" width="9" height="10.5" rx="1.2" fill="url(#houseDoor)" stroke="#2460b0" strokeWidth="0.8"/>
      <rect x="7" y="18" width="6.5" height="7" rx="1.2" fill="#1a50a8" stroke="#3a70d0" strokeWidth="0.7"/>
      <rect x="22.5" y="18" width="6.5" height="7" rx="1.2" fill="#1a50a8" stroke="#3a70d0" strokeWidth="0.7"/>
      <line x1="10.25" y1="18" x2="10.25" y2="25" stroke="#4a80d8" strokeWidth="0.6" strokeLinecap="round"/>
      <line x1="7" y1="21.5" x2="13.5" y2="21.5" stroke="#4a80d8" strokeWidth="0.6" strokeLinecap="round"/>
      <line x1="25.75" y1="18" x2="25.75" y2="25" stroke="#4a80d8" strokeWidth="0.6" strokeLinecap="round"/>
      <line x1="22.5" y1="21.5" x2="29" y2="21.5" stroke="#4a80d8" strokeWidth="0.6" strokeLinecap="round"/>
      <circle cx="21.5" cy="27" r="0.8" fill="#4a80e8"/>
      <path d="M15.5 7L18 5l2.5 2v4h-5V7z" fill="#70a8f8" opacity="0.7"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <rect width="36" height="36" rx="6" fill="#161b22"/>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18 5C11.373 5 6 10.373 6 17c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.386-1.332-1.756-1.332-1.756-1.09-.745.082-.73.082-.73 1.205.085 1.838 1.237 1.838 1.237 1.07 1.835 2.807 1.305 3.492.998.109-.776.42-1.305.762-1.605-2.665-.303-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.124-.304-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23A11.51 11.51 0 0118 10.8c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.872.118 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.805 5.624-5.475 5.922.43.37.814 1.102.814 2.222 0 1.606-.015 2.898-.015 3.293 0 .319.192.694.801.576C26.565 26.796 30 22.3 30 17c0-6.627-5.373-12-12-12z"
        fill="white"
      />
    </svg>
  );
}

function BrowserIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <path d="M 18 5.25 A 12.75 12.75 0 0 1 29.04 24.375"
        fill="none" stroke="#FBBC04" strokeWidth="4.6" strokeLinecap="butt"/>
      <path d="M 29.04 24.375 A 12.75 12.75 0 0 1 6.96 24.375"
        fill="none" stroke="#34A853" strokeWidth="4.6" strokeLinecap="butt"/>
      <path d="M 6.96 24.375 A 12.75 12.75 0 0 1 18 5.25"
        fill="none" stroke="#EA4335" strokeWidth="4.6" strokeLinecap="butt"/>
      <circle cx="18" cy="18" r="11" fill="white"/>
      <circle cx="18" cy="18" r="7" fill="#4285F4"/>
    </svg>
  );
}

function SentinelIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <linearGradient id="sentBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1a2e" />
          <stop offset="100%" stopColor="#040c18" />
        </linearGradient>
        <linearGradient id="sentShield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00a3ff" />
          <stop offset="100%" stopColor="#0060cc" />
        </linearGradient>
        <radialGradient id="sentGlow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#00c4ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#00a3ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="36" height="36" rx="5" fill="url(#sentBg)" stroke="#0a3a6a" strokeWidth="0.8"/>
      <path d="M18 4 L30 9 L30 20 C30 27 18 33 18 33 C18 33 6 27 6 20 L6 9 Z" fill="url(#sentShield)" opacity="0.18"/>
      <path d="M18 6 L28 10.5 L28 20 C28 26 18 31.5 18 31.5 C18 31.5 8 26 8 20 L8 10.5 Z" fill="none" stroke="url(#sentShield)" strokeWidth="1.4"/>
      <circle cx="18" cy="18" r="4.5" fill="url(#sentGlow)"/>
      <circle cx="18" cy="18" r="2.5" fill="#00c4ff"/>
      <circle cx="18" cy="18" r="1" fill="#80e4ff"/>
      <line x1="18" y1="13.5" x2="18" y2="10" stroke="#00a3ff" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
      <line x1="22.5" y1="18" x2="26" y2="18" stroke="#00a3ff" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
      <line x1="13.5" y1="18" x2="10" y2="18" stroke="#00a3ff" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
    </svg>
  );
}

function PortfolioIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <linearGradient id="monitorBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a1e" />
          <stop offset="100%" stopColor="#0d1f0d" />
        </linearGradient>
        <linearGradient id="monitorScreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1a0a" />
          <stop offset="100%" stopColor="#030f03" />
        </linearGradient>
      </defs>
      <rect x="2" y="4" width="32" height="22" rx="2.5" fill="url(#monitorBody)" stroke="#2a7a2a" strokeWidth="1.2"/>
      <rect x="4" y="6" width="28" height="18" rx="1.5" fill="url(#monitorScreen)"/>
      <rect x="4" y="6" width="28" height="3" rx="1.5" fill="#1a4a1a"/>
      <circle cx="8" cy="7.5" r="1" fill="#e05555"/>
      <circle cx="12" cy="7.5" r="1" fill="#e0a020"/>
      <circle cx="16" cy="7.5" r="1" fill="#30c030"/>
      <path d="M6 13.5h8" stroke="#00ff00" strokeWidth="1.2" strokeLinecap="round" opacity="0.9"/>
      <path d="M6 16.5h14" stroke="#00cc00" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
      <path d="M6 19.5h10" stroke="#00aa00" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
      <text x="21" y="20" fontSize="6" fill="#00ff00" fontFamily="monospace" opacity="0.8">_</text>
      <rect x="13" y="26" width="10" height="2.5" rx="1" fill="#1a4a1a" stroke="#2a7a2a" strokeWidth="0.8"/>
      <rect x="9" y="28.5" width="18" height="2" rx="1" fill="#1a3a1a" stroke="#2a6a2a" strokeWidth="0.7"/>
    </svg>
  );
}

function AuraIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <radialGradient id="auraBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3b1579" />
          <stop offset="100%" stopColor="#1a0840" />
        </radialGradient>
        <radialGradient id="auraGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="36" height="36" rx="8" fill="url(#auraBg)"/>
      <circle cx="18" cy="17" r="9" fill="url(#auraGlow)" opacity="0.6"/>
      <circle cx="18" cy="17" r="6" fill="none" stroke="#a855f7" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.7"/>
      <path d="M18 10 L20 15 L25 15 L21 18 L23 23 L18 20 L13 23 L15 18 L11 15 L16 15 Z" fill="#c084fc" opacity="0.9"/>
      <circle cx="18" cy="17" r="2" fill="#e9d5ff"/>
      <circle cx="25" cy="9" r="1.2" fill="#c084fc" opacity="0.8"/>
      <circle cx="11" cy="27" r="0.9" fill="#a855f7" opacity="0.6"/>
      <circle cx="28" cy="24" r="0.8" fill="#c084fc" opacity="0.5"/>
    </svg>
  );
}

function CyberChefIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <linearGradient id="ccBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a1a00" />
          <stop offset="100%" stopColor="#1a0800" />
        </linearGradient>
        <linearGradient id="ccShield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff7a00" />
          <stop offset="100%" stopColor="#cc4400" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="6" fill="url(#ccBg)" stroke="#6a2800" strokeWidth="0.8"/>
      <path d="M18 4 L29 8.5 L29 18 C29 24.5 18 32 18 32 C18 32 7 24.5 7 18 L7 8.5 Z" fill="url(#ccShield)" opacity="0.18"/>
      <path d="M18 5.5 L27.5 9.5 L27.5 18 C27.5 23.5 18 30 18 30 C18 30 8.5 23.5 8.5 18 L8.5 9.5 Z" fill="none" stroke="#ff7a00" strokeWidth="1.3"/>
      <line x1="24" y1="14" x2="24" y2="21" stroke="#ff9933" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="21" y1="11" x2="27" y2="11" stroke="#ff9933" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="21" y1="24" x2="27" y2="24" stroke="#ff6600" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="14" cy="18" r="3.5" fill="none" stroke="#ffbb44" strokeWidth="1.4"/>
      <line x1="14" y1="13.5" x2="14" y2="11" stroke="#ffaa22" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="11.5" y1="15.5" x2="9.5" y2="13.5" stroke="#ffaa22" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function CodeStudioIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <linearGradient id="csBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#001a3a" />
          <stop offset="100%" stopColor="#000d1f" />
        </linearGradient>
        <linearGradient id="csAccent" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00aaff" />
          <stop offset="100%" stopColor="#0066ff" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="6" fill="url(#csBg)" stroke="#003380" strokeWidth="0.8"/>
      <rect x="3" y="7" width="30" height="22" rx="2" fill="#001530" stroke="#003a8c" strokeWidth="0.8"/>
      <rect x="3" y="7" width="30" height="5" rx="2" fill="#002060"/>
      <circle cx="7.5" cy="9.5" r="1.2" fill="#ff5f5f"/>
      <circle cx="11.5" cy="9.5" r="1.2" fill="#ffbe2e"/>
      <circle cx="15.5" cy="9.5" r="1.2" fill="#27c93f"/>
      <path d="M8 17 L13 20.5 L8 24" stroke="url(#csAccent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <line x1="16" y1="24" x2="28" y2="24" stroke="#0066ff" strokeWidth="1.8" strokeLinecap="round" opacity="0.7"/>
      <line x1="16" y1="20.5" x2="22" y2="20.5" stroke="#00aaff" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      <rect x="10" y="28" width="16" height="2" rx="1" fill="#002060" stroke="#003a8c" strokeWidth="0.6"/>
    </svg>
  );
}

function TaskManagerIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <linearGradient id="tmiBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#001a10" />
          <stop offset="100%" stopColor="#000a06" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="6" fill="url(#tmiBg)" stroke="#004422" strokeWidth="0.8"/>
      <rect x="4" y="6" width="28" height="18" rx="2" fill="#001a0a" stroke="#003318" strokeWidth="0.8"/>
      <rect x="4" y="6" width="28" height="5" rx="2" fill="#002a14"/>
      <circle cx="8" cy="8.5" r="1.2" fill="#ff5f5f"/>
      <circle cx="12" cy="8.5" r="1.2" fill="#ffbe2e"/>
      <circle cx="16" cy="8.5" r="1.2" fill="#27c93f"/>
      <rect x="7" y="15" width="6" height="6" rx="1" fill="none" stroke="#00ff88" strokeWidth="0.8" opacity="0.7"/>
      <rect x="7" y="17" width="6" height="2" rx="0.5" fill="#00ff88" opacity="0.4"/>
      <rect x="15" y="15" width="14" height="1.5" rx="0.5" fill="#00f0ff" opacity="0.5"/>
      <rect x="15" y="18" width="9" height="1.5" rx="0.5" fill="#00ff88" opacity="0.4"/>
      <rect x="15" y="21" width="11" height="1.5" rx="0.5" fill="#00f0ff" opacity="0.3"/>
      <line x1="4" y1="27" x2="32" y2="27" stroke="#003318" strokeWidth="0.6"/>
      <rect x="7" y="29" width="4" height="4" rx="0.5" fill="#00ff88" opacity="0.6"/>
      <rect x="13" y="29" width="4" height="4" rx="0.5" fill="#00f0ff" opacity="0.5"/>
      <rect x="19" y="29" width="4" height="4" rx="0.5" fill="#00ff88" opacity="0.3"/>
      <rect x="25" y="29" width="4" height="4" rx="0.5" fill="#00f0ff" opacity="0.4"/>
    </svg>
  );
}

function ChessIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <linearGradient id="chBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a1200" />
          <stop offset="100%" stopColor="#0a0800" />
        </linearGradient>
        <linearGradient id="chGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe566" />
          <stop offset="100%" stopColor="#c8960a" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="6" fill="url(#chBg)" stroke="#3a2800" strokeWidth="0.8"/>
      {/* Board squares */}
      <rect x="4" y="4" width="7" height="7" rx="1" fill="#2a1e00" opacity="0.6"/>
      <rect x="11" y="4" width="7" height="7" rx="1" fill="#8B6914" opacity="0.4"/>
      <rect x="18" y="4" width="7" height="7" rx="1" fill="#2a1e00" opacity="0.6"/>
      <rect x="25" y="4" width="7" height="7" rx="1" fill="#8B6914" opacity="0.4"/>
      <rect x="4" y="11" width="7" height="7" rx="1" fill="#8B6914" opacity="0.4"/>
      <rect x="11" y="11" width="7" height="7" rx="1" fill="#2a1e00" opacity="0.6"/>
      <rect x="18" y="11" width="7" height="7" rx="1" fill="#8B6914" opacity="0.4"/>
      <rect x="25" y="11" width="7" height="7" rx="1" fill="#2a1e00" opacity="0.6"/>
      {/* Crown (king) shape */}
      <path d="M10 28 L10 24 L13 26 L18 21 L23 26 L26 24 L26 28 Z" fill="url(#chGold)" opacity="0.9"/>
      <rect x="9" y="28" width="18" height="3" rx="1" fill="url(#chGold)" opacity="0.85"/>
      {/* Crown points */}
      <circle cx="10" cy="23" r="1.5" fill="#ffe566"/>
      <circle cx="18" cy="20" r="1.5" fill="#ffe566"/>
      <circle cx="26" cy="23" r="1.5" fill="#ffe566"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <linearGradient id="stBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#001428" />
          <stop offset="100%" stopColor="#00060f" />
        </linearGradient>
        <radialGradient id="stGlow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="36" height="36" rx="6" fill="url(#stBg)" stroke="#002244" strokeWidth="0.8"/>
      <circle cx="18" cy="18" r="10" fill="url(#stGlow)" opacity="0.3"/>
      {/* Gear outer */}
      <path
        d="M18 10.5 L19.5 8.5 L21.5 9.5 L21.5 11.5 C22.5 11.9 23.4 12.5 24.1 13.2 L26 12.8 L27.3 14.6 L26 16.2 C26.2 16.8 26.3 17.4 26.3 18 C26.3 18.6 26.2 19.2 26 19.8 L27.3 21.4 L26 23.2 L24.1 22.8 C23.4 23.5 22.5 24.1 21.5 24.5 L21.5 26.5 L19.5 27.5 L18 25.5 L16.5 27.5 L14.5 26.5 L14.5 24.5 C13.5 24.1 12.6 23.5 11.9 22.8 L10 23.2 L8.7 21.4 L10 19.8 C9.8 19.2 9.7 18.6 9.7 18 C9.7 17.4 9.8 16.8 10 16.2 L8.7 14.6 L10 12.8 L11.9 13.2 C12.6 12.5 13.5 11.9 14.5 11.5 L14.5 9.5 L16.5 8.5 Z"
        stroke="#00d4ff" strokeWidth="1.2" fill="none" opacity="0.7"
      />
      <circle cx="18" cy="18" r="3.5" stroke="#00d4ff" strokeWidth="1.5" fill="none" opacity="0.9"/>
      <circle cx="18" cy="18" r="1.5" fill="#00d4ff" opacity="0.85"/>
    </svg>
  );
}

function CykryptIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <radialGradient id="ckBg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#001a1a" />
          <stop offset="100%" stopColor="#000a0a" />
        </radialGradient>
        <radialGradient id="ckGlow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="36" height="36" rx="6" fill="url(#ckBg)" stroke="#003a3a" strokeWidth="0.8"/>
      <circle cx="18" cy="18" r="12" fill="url(#ckGlow)" opacity="0.3"/>
      <circle cx="18" cy="18" r="10" fill="none" stroke="#00f0ff" strokeWidth="1" opacity="0.4"/>
      <path d="M13 11 L13 25 M13 11 L21 11 C24 11 25.5 13 25.5 15 C25.5 17 24 18.5 21 18.5 L13 18.5" stroke="#00f0ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="18" cy="18" r="2" fill="#00f0ff" opacity="0.8"/>
    </svg>
  );
}

function DossierIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <linearGradient id="dossBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0000" />
          <stop offset="100%" stopColor="#0a0000" />
        </linearGradient>
        <linearGradient id="dossRed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cc0000" />
          <stop offset="100%" stopColor="#880000" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="5" fill="url(#dossBg)" stroke="#4a0000" strokeWidth="0.8"/>
      <rect x="5" y="6" width="26" height="24" rx="2" fill="#120000" stroke="#660000" strokeWidth="0.8"/>
      <rect x="5" y="6" width="26" height="5" rx="2" fill="#220000"/>
      <rect x="13" y="4" width="10" height="4" rx="1.5" fill="#1a0000" stroke="#550000" strokeWidth="0.7"/>
      <line x1="9" y1="15" x2="27" y2="15" stroke="#cc0000" strokeWidth="0.8" strokeLinecap="round" opacity="0.7"/>
      <line x1="9" y1="18.5" x2="27" y2="18.5" stroke="#880000" strokeWidth="0.7" strokeLinecap="round" opacity="0.5"/>
      <line x1="9" y1="22" x2="20" y2="22" stroke="#880000" strokeWidth="0.7" strokeLinecap="round" opacity="0.5"/>
      <rect x="18" y="21" width="9" height="5" rx="1" fill="#1a0000" stroke="#cc0000" strokeWidth="0.7" opacity="0.9"/>
      <text x="20" y="25" fontSize="4" fill="#cc0000" fontFamily="monospace" fontWeight="bold">TOP</text>
      <circle cx="10" cy="8.5" r="1" fill="#cc0000" opacity="0.9"/>
    </svg>
  );
}

function SecureCommIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <linearGradient id="scBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#001a1a" />
          <stop offset="100%" stopColor="#000d0d" />
        </linearGradient>
        <radialGradient id="scGlow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#00ffff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#00ffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="scShield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00e5ff" />
          <stop offset="100%" stopColor="#007acc" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="6" fill="url(#scBg)" stroke="#003a3a" strokeWidth="0.8"/>
      <circle cx="18" cy="18" r="13" fill="url(#scGlow)" opacity="0.35"/>
      {/* Shield */}
      <path d="M18 5 L28 9 L28 19 C28 25.5 18 32 18 32 C18 32 8 25.5 8 19 L8 9 Z" fill="url(#scShield)" opacity="0.15"/>
      <path d="M18 6.5 L27 10 L27 19 C27 24.5 18 30.5 18 30.5 C18 30.5 9 24.5 9 19 L9 10 Z" fill="none" stroke="#00e5ff" strokeWidth="1.3" opacity="0.8"/>
      {/* Phone handset */}
      <path d="M13 13 C13 13 14 11 15.5 12 L17 13.5 C17.5 14 17.5 15 17 15.5 L16 16.5 C16 16.5 17 19 19.5 20 L20.5 19 C21 18.5 22 18.5 22.5 19 L24 20.5 C25 22 23 23 23 23 C23 23 19 24 14 18 C11 14.5 13 13 13 13 Z" fill="#00ffff" opacity="0.92" strokeWidth="0"/>
      {/* Signal arcs */}
      <path d="M21 10 C23.5 11.5 25 14 25 17" stroke="#00ffff" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6"/>
      <path d="M22.5 8 C26 10 28 13.5 28 17.5" stroke="#00ffff" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.35"/>
    </svg>
  );
}

function ThreatModelerIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <linearGradient id="tmBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a0030" />
          <stop offset="100%" stopColor="#0a0018" />
        </linearGradient>
        <linearGradient id="tmPink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e879f9" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="6" fill="url(#tmBg)" stroke="#4a007a" strokeWidth="0.8"/>
      <circle cx="9" cy="9" r="4" fill="url(#tmPink)" opacity="0.9"/>
      <circle cx="27" cy="9" r="4" fill="none" stroke="#e879f9" strokeWidth="1.3" opacity="0.8"/>
      <circle cx="9" cy="27" r="4" fill="none" stroke="#a855f7" strokeWidth="1.3" opacity="0.8"/>
      <circle cx="27" cy="27" r="4" fill="none" stroke="#e879f9" strokeWidth="1.3" opacity="0.6"/>
      <circle cx="18" cy="18" r="4.5" fill="none" stroke="#c084fc" strokeWidth="1.5"/>
      <circle cx="18" cy="18" r="1.5" fill="#e879f9" opacity="0.9"/>
      <line x1="13" y1="9" x2="14.5" y2="14" stroke="#c084fc" strokeWidth="1.1" strokeLinecap="round" opacity="0.7"/>
      <line x1="23" y1="9" x2="21.5" y2="14" stroke="#c084fc" strokeWidth="1.1" strokeLinecap="round" opacity="0.7"/>
      <line x1="9" y1="13" x2="14" y2="14.5" stroke="#a855f7" strokeWidth="1.1" strokeLinecap="round" opacity="0.7"/>
      <line x1="9" y1="23" x2="14" y2="21.5" stroke="#a855f7" strokeWidth="1.1" strokeLinecap="round" opacity="0.7"/>
      <line x1="27" y1="13" x2="22" y2="14.5" stroke="#a855f7" strokeWidth="1.1" strokeLinecap="round" opacity="0.7"/>
      <line x1="27" y1="23" x2="22" y2="21.5" stroke="#a855f7" strokeWidth="1.1" strokeLinecap="round" opacity="0.7"/>
      <line x1="13" y1="27" x2="14.5" y2="22" stroke="#c084fc" strokeWidth="1.1" strokeLinecap="round" opacity="0.7"/>
      <line x1="23" y1="27" x2="21.5" y2="22" stroke="#c084fc" strokeWidth="1.1" strokeLinecap="round" opacity="0.7"/>
    </svg>
  );
}

const ICONS_COL1 = [
  { id: "home",       label: "Home",        icon: <HomeIcon />,       window: "files"     },
  { id: "trash",      label: "Trash",       icon: <TrashIcon />,      window: "trash"     },
  { id: "filesystem", label: "File System", icon: <FileSystemIcon />, window: "files"     },
  { id: "github",     label: "GitHub",      icon: <GitHubIcon />,     window: "github"    },
  { id: "portfolio",  label: "Portfolio",   icon: <PortfolioIcon />,  window: "portfolio" },
  { id: "browser",    label: "Browser",     icon: <BrowserIcon />,    window: "browser"   },
  { id: "sentinel",   label: "Sentinel SOC",icon: <SentinelIcon />,   window: "sentinel"  },
  { id: "aura",       label: "AURA AI",     icon: <AuraIcon />,       window: "aura"      },
];

const ICONS_COL2 = [
  { id: "chess",        label: "Chess",          icon: <ChessIcon />,          window: "chess"        },
  { id: "cyberchef",    label: "CyberChef",     icon: <CyberChefIcon />,      window: "cyberchef"    },
  { id: "codestudio",   label: "Code Studio",   icon: <CodeStudioIcon />,     window: "codestudio"   },
  { id: "threatmodeler",label: "Threat Modeler",icon: <ThreatModelerIcon />,  window: "threatmodeler"},
  { id: "cykrypt",      label: "CYKRYPT",        icon: <CykryptIcon />,        window: "cykrypt"      },
  { id: "settings",     label: "Settings",      icon: <SettingsIcon />,       window: "settings"     },
  { id: "securecomm",   label: "MONIX-COMM",    icon: <SecureCommIcon />,     window: "securecomm"   },
];

const ICONS_COL3 = [
  { id: "dossier",      label: "Dossier",       icon: <DossierIcon />,        window: "dossier"      },
];

const ALL_ICONS = [...ICONS_COL1, ...ICONS_COL2, ...ICONS_COL3];

function IconItem({
  item,
  selectedIcon,
  onSelectIcon,
  onOpenWindow,
  onLongPress,
  dragConstraintsRef,
}: {
  item: { id: string; label: string; icon: React.ReactNode; window: string };
  selectedIcon: string | null;
  onSelectIcon: (id: string | null) => void;
  onOpenWindow: (id: string) => void;
  onLongPress?: (x: number, y: number) => void;
  dragConstraintsRef: React.RefObject<HTMLDivElement | null>;
}) {
  const isSelected = selectedIcon === item.id;
  const lpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lpFired = useRef(false);

  const startLongPress = (x: number, y: number) => {
    lpFired.current = false;
    lpTimer.current = setTimeout(() => {
      lpFired.current = true;
      onLongPress?.(x, y);
    }, 500);
  };
  const cancelLongPress = () => {
    if (lpTimer.current) clearTimeout(lpTimer.current);
  };

  return (
    <motion.div
      key={item.id}
      drag
      dragMomentum={false}
      dragConstraints={dragConstraintsRef}
      dragElastic={0}
      whileDrag={{ scale: 1.06, zIndex: 50, cursor: "grabbing" }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        cursor: "grab",
        padding: "5px 7px 4px",
        userSelect: "none",
        width: 80,
        height: 96,
        justifyContent: "center",
        flexShrink: 0,
        background: isSelected ? "rgba(54,123,240,0.28)" : "transparent",
        border: isSelected
          ? "1px solid rgba(54,123,240,0.55)"
          : "1px solid transparent",
        outline: isSelected ? "1px solid rgba(54,123,240,0.15)" : "none",
        transition: "background 0.1s, border-color 0.1s",
        position: "relative",
        borderRadius: 3,
        pointerEvents: "auto",
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelectIcon(item.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpenWindow(item.window);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        const touch = e.touches[0];
        startLongPress(touch.clientX, touch.clientY);
      }}
      onTouchEnd={(e) => {
        cancelLongPress();
        if (!lpFired.current) {
          e.stopPropagation();
          onOpenWindow(item.window);
        }
      }}
      onTouchMove={cancelLongPress}
    >
      {item.icon}
      <span
        style={{
          fontSize: 11,
          color: "#ffffff",
          textAlign: "center",
          lineHeight: 1.25,
          textShadow:
            "1px 1px 3px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,1), -1px -1px 3px rgba(0,0,0,0.9)",
          wordBreak: "break-word",
          width: "100%",
          fontWeight: 500,
          pointerEvents: "none",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {item.label}
      </span>
    </motion.div>
  );
}

const DesktopIcons = memo(function DesktopIcons({
  onOpenWindow,
  selectedIcon,
  onSelectIcon,
  dragConstraintsRef,
  onLongPress,
}: DesktopIconsProps) {
  return (
    <div
      className="absolute inset-0 overflow-x-auto overflow-y-hidden"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="flex flex-col flex-wrap content-start items-start gap-x-1 gap-y-1 h-full w-max p-2 font-sans"
        style={{ pointerEvents: "none" }}
      >
        {ALL_ICONS.map((item) => (
          <IconItem
            key={item.id}
            item={item}
            selectedIcon={selectedIcon}
            onSelectIcon={onSelectIcon}
            onOpenWindow={onOpenWindow}
            onLongPress={onLongPress}
            dragConstraintsRef={dragConstraintsRef}
          />
        ))}
      </div>
    </div>
  );
});

export default DesktopIcons;
