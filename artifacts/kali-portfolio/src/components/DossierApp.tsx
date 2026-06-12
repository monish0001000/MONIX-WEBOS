import { useState, useEffect, useRef } from 'react';
import WindowChrome from './WindowChrome';

interface DossierAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

const DOSSIER_LINES = [
  '╔══════════════════════════════════════════════════════════════╗',
  '║         ██████╗  ██████╗ ███████╗███████╗██╗███████╗██████╗ ║',
  '║         ██╔══██╗██╔═══██╗██╔════╝██╔════╝██║██╔════╝██╔══██╗║',
  '║         ██║  ██║██║   ██║███████╗███████╗██║█████╗  ██████╔╝║',
  '║         ██║  ██║██║   ██║╚════██║╚════██║██║██╔══╝  ██╔══██╗║',
  '║         ██████╔╝╚██████╔╝███████║███████║██║███████╗██║  ██║║',
  '║         ╚═════╝  ╚═════╝ ╚══════╝╚══════╝╚═╝╚══════╝╚═╝  ╚═╝║',
  '╚══════════════════════════════════════════════════════════════╝',
  '',
  '  ┌─ CLASSIFICATION: TOP SECRET ──────────────────────────────┐',
  '  │  CLEARANCE LEVEL: ALPHA-7 / EYES ONLY                     │',
  '  │  FILE REF: MONIX-AGENT-0x1337                             │',
  '  └────────────────────────────────────────────────────────────┘',
  '',
  '  ▌SUBJECT PROFILE',
  '  ├─ NAME       : MONISH S.',
  '  ├─ DESIGNATION: B.E. CSE — CYBERSECURITY SPECIALIST',
  '  ├─ AFFILIATION: MONIX ADVANCED OPERATIONS DIVISION',
  '  ├─ STATUS     : ACTIVE',
  '  └─ THREAT LVL : ██████████ CRITICAL',
  '',
  '  ▌KNOWN OPERATIONS',
  '  ├─ [OP-001] SENTINEL NEXTGEN SOC',
  '  │           Real-time threat intelligence platform.',
  '  │           Multi-source SIEM. Threat hunting. Incident response.',
  '  │           Status: DEPLOYED ✓',
  '  │',
  '  ├─ [OP-002] CYKRYPT CTF ORGANIZER',
  '  │           Architect of nation-scale Capture The Flag events.',
  '  │           Custom challenge infra. 1000+ registered operators.',
  '  │           Status: ONGOING ✓',
  '  │',
  '  └─ [OP-003] MONIX OS',
  '              Full OS simulation. Browser-native. WebRTC Comm.',
  '              Status: CLASSIFIED — EYES ONLY',
  '',
  '  ▌TECHNICAL ASSETS',
  '  ├─ LANGUAGES  : TypeScript · Python · Bash · C++',
  '  ├─ DOMAINS    : Penetration Testing · Reverse Engineering',
  '  │               Network Forensics · Exploit Development',
  '  └─ CLEARANCES : OSCP · CEH · [REDACTED]',
  '',
  '  ┌────────────────────────────────────────────────────────────┐',
  '  │  ██ WARNING: Unauthorized access to this file is a        │',
  '  │  ██ federal offense. All access is logged and traced.     │',
  '  └────────────────────────────────────────────────────────────┘',
  '',
  '  [EOF] — MONIX INTELLIGENCE BUREAU — DOCUMENT #1337-ALPHA',
];

export default function DossierApp({
  onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex,
}: DossierAppProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [scanline, setScanline] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (revealedCount >= DOSSIER_LINES.length) return;
    const charsPerTick = 1;
    const timer = setInterval(() => {
      setRevealedCount((prev) => {
        if (prev >= DOSSIER_LINES.length) { clearInterval(timer); return prev; }
        return prev + charsPerTick;
      });
    }, 38);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [revealedCount]);

  useEffect(() => {
    const t = setInterval(() => setScanline((s) => !s), 1200);
    return () => clearInterval(t);
  }, []);

  const visibleLines = DOSSIER_LINES.slice(0, revealedCount);
  const isComplete = revealedCount >= DOSSIER_LINES.length;

  return (
    <WindowChrome
      title="MONIX INTELLIGENCE BUREAU — CLASSIFIED DOSSIER"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={760}
      height={560}
      zIndex={zIndex}
    >
      <div className="w-full h-full flex flex-col bg-[#000000] text-white overflow-hidden relative font-mono">
        {/* CRT scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
          }}
        />

        {/* Header bar */}
        <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-red-900/60 bg-[#0a0000]">
          <span className="text-red-500 text-xs font-bold tracking-widest uppercase">
            ▌ TOP SECRET // CLASSIFIED
          </span>
          <span className={`text-xs font-bold ${scanline ? 'text-red-500' : 'text-red-900'} transition-colors duration-300`}>
            ● REC
          </span>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 text-xs leading-relaxed">
          {visibleLines.map((line, i) => {
            const isHeader = line.includes('╔') || line.includes('╚') || line.includes('║') || line.includes('╗');
            const isWarning = line.includes('WARNING') || line.includes('CLASSIFICATION') || line.includes('CLEARANCE');
            const isOp = line.startsWith('  ├─ [OP') || line.startsWith('  └─ [OP');
            const isSectionHead = line.startsWith('  ▌');

            let colorClass = 'text-gray-200';
            if (isHeader) colorClass = 'text-red-600';
            else if (isWarning) colorClass = 'text-red-400 font-bold';
            else if (isOp) colorClass = 'text-yellow-400 font-bold';
            else if (isSectionHead) colorClass = 'text-red-400 font-bold';
            else if (line.startsWith('  ├─') || line.startsWith('  └─') || line.startsWith('  │')) colorClass = 'text-gray-300';
            else if (line.includes('DEPLOYED') || line.includes('ONGOING') || line.includes('ACTIVE')) colorClass = 'text-green-400';
            else if (line.includes('[REDACTED]')) colorClass = 'text-red-600';
            else if (line.includes('EOF')) colorClass = 'text-red-700 text-[10px]';

            return (
              <div key={i} className={`whitespace-pre ${colorClass}`}>
                {line}
                {i === visibleLines.length - 1 && !isComplete && (
                  <span className="animate-pulse text-red-400">█</span>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between px-4 py-1.5 border-t border-red-900/40 bg-[#050000]">
          <span className="text-red-900 text-[10px] tracking-widest">
            MONIX INTEL BUREAU — SECURE TERMINAL v1.0
          </span>
          <span className="text-red-800 text-[10px]">
            {isComplete ? '[DECRYPTION COMPLETE]' : `[DECRYPTING... ${Math.round((revealedCount / DOSSIER_LINES.length) * 100)}%]`}
          </span>
        </div>
      </div>
    </WindowChrome>
  );
}
