import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Send, Loader2, Sparkles, User, Bot,
  ArrowRight, Brain, Zap, Search, Image as ImageIcon,
  Home, History, Settings, X, Github, Twitter, Moon, Sun, Mic, MicOff,
} from 'lucide-react';
import { cn } from '../lib/utils';
import WindowChrome from './WindowChrome';
import entryImg from '@assets/entry_1775232118123.webp';
import { useOSStore } from '../lib/store';

// ── Types ──────────────────────────────────────────────────────────────────

type AppView = 'landing' | 'conversation';

interface AuraAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
  onOpenWindow?: (id: string) => void;
}

// ── About Modal ─────────────────────────────────────────────────────────────

function AboutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl aura-glow-border"
          >
            <div className="p-8 space-y-6 relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tighter">The Architect</h2>
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Engineering the Future</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50" />
                  <div className="relative w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-2xl font-black text-white overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-25" />
                    M
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Monish</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed mt-1">
                    Visionary full-stack developer & AI engineer building next-gen digital experiences.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a href="#" className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group">
                  <Github className="w-4 h-4 text-zinc-500 group-hover:text-white" />
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-500 group-hover:text-white">GitHub</span>
                </a>
                <a href="#" className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group">
                  <Twitter className="w-4 h-4 text-zinc-500 group-hover:text-white" />
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-500 group-hover:text-white">Twitter</span>
                </a>
              </div>
              <div className="pt-3 border-t border-white/5">
                <p className="text-[9px] text-zinc-600 text-center font-black uppercase tracking-widest italic">
                  "Intelligence is the ultimate frontier."
                </p>
              </div>
            </div>
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl" />
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Settings Modal ──────────────────────────────────────────────────────────

function SettingsModal({
  isOpen, onClose, isThinking, onToggleThinking
}: {
  isOpen: boolean; onClose: () => void;
  isThinking: boolean; onToggleThinking: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            className="relative w-full max-w-xs bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-7 space-y-5 relative z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black text-white tracking-tighter">Settings</h2>
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] mt-0.5">Configure AURA</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">AI Mode</label>
                <button
                  onClick={onToggleThinking}
                  className={cn(
                    "flex items-center justify-between w-full p-4 rounded-xl border transition-all",
                    isThinking
                      ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                      : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Brain className="w-4 h-4" />
                    <div className="text-left">
                      <div className="text-sm font-bold text-white">Deep Thinking Mode</div>
                      <div className="text-[9px] text-zinc-500 mt-0.5">Enhanced reasoning & analysis</div>
                    </div>
                  </div>
                  <div className={cn(
                    "w-8 h-4 rounded-full border transition-all relative",
                    isThinking ? "bg-purple-500 border-purple-400" : "bg-zinc-800 border-zinc-700"
                  )}>
                    <div className={cn(
                      "w-3 h-3 rounded-full absolute top-0.5 transition-all",
                      isThinking ? "right-0.5 bg-white" : "left-0.5 bg-zinc-500"
                    )} />
                  </div>
                </button>
              </div>

              <div className="pt-3 border-t border-white/5">
                <p className="text-[9px] text-zinc-600 text-center font-black uppercase tracking-widest">
                  AURA v2.0 • MONIX OS
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Main App ────────────────────────────────────────────────────────────────

export default function AuraApp({
  onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex,
}: AuraAppProps) {
  const [isIntro, setIsIntro]           = useState(true);
  const [introFading, setIntroFading]   = useState(false);
  const [view, setView]                 = useState<AppView>('landing');
  const [input, setInput]               = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const [isThinking, setIsThinking]     = useState(false);
  const [isDark, setIsDark]             = useState(true);
  const [showAbout, setShowAbout]       = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const messages        = useOSStore((s) => s.auraMessages);
  const addAuraMessage  = useOSStore((s) => s.addAuraMessage);
  const clearAuraMessages = useOSStore((s) => s.clearAuraMessages);
  const auraWakeActive  = useOSStore((s) => s.auraWakeActive);

  const bottomRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const micRecRef = useRef<any>(null);
  const [isMicListening, setIsMicListening] = useState(false);

  function startMicInput() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const API = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!API) return;
    if (micRecRef.current) {
      try { micRecRef.current.abort(); } catch (_) {}
      micRecRef.current = null;
      setIsMicListening(false);
      return;
    }
    const rec = new API();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onstart = () => setIsMicListening(true);
    rec.onresult = (event: any) => {
      const text = Array.from(event.results)
        .filter((r: any) => r.isFinal)
        .map((r: any) => r[0].transcript)
        .join('').trim();
      if (text) setInput(prev => prev ? prev + ' ' + text : text);
    };
    rec.onend = () => { micRecRef.current = null; setIsMicListening(false); };
    rec.onerror = () => { micRecRef.current = null; setIsMicListening(false); };
    micRecRef.current = rec;
    try { rec.start(); } catch (_) { micRecRef.current = null; setIsMicListening(false); }
  }

  // Splash: show for 2500ms, then fade out and reveal
  useEffect(() => {
    const fadeTimer = setTimeout(() => setIntroFading(true), 2500);
    const hideTimer = setTimeout(() => setIsIntro(false), 3100);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-switch to conversation view when AURA service posts messages
  useEffect(() => {
    if (messages.length > 0 && view === 'landing' && !isIntro) {
      setView('conversation');
    }
  }, [messages, view, isIntro]);

  const sendMessage = async (text: string) => {
    if (!text || isLoading) return;

    addAuraMessage({ id: Date.now().toString(), role: 'user', text });
    setView('conversation');
    setIsLoading(true);

    const systemPromptText = isThinking
      ? 'You are AURA, the native AI of MONIX Web OS — a cyberpunk hacker intelligence operating at the bleeding edge of the digital frontier. In deep-think mode, you analyze methodically and ruthlessly: step-by-step, no fluff. You are a ghost in the machine. Speak with technical authority, precision, and a dark aesthetic. Use terminal-style formatting where relevant.'
      : 'You are AURA, an elite native AI assistant of MONIX Web OS. Speak with a dark cyberpunk hacker aesthetic. Be concise, technical, and direct.';

    try {
      const fullPrompt = systemPromptText + '\nQuery: ' + text;
      const encodedPrompt = encodeURIComponent(fullPrompt);
      const response = await fetch('https://text.pollinations.ai/' + encodedPrompt);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const auraText = await response.text();
      addAuraMessage({ id: (Date.now() + 1).toString(), role: 'assistant', text: auraText });
    } catch (_) {
      addAuraMessage({
        id: (Date.now() + 1).toString(), role: 'assistant',
        text: '`SYSTEM ERROR` — Connection to mainframe failed.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    await sendMessage(text);
  };

  return (
    <WindowChrome
      title="AURA AI — Intelligence System"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={900}
      height={640}
      zIndex={zIndex}
    >
      <div
        className="relative w-full h-full overflow-hidden font-sans"
        style={{ background: '#000', color: '#f4f4f5' }}
      >
        {/* Animated background waves */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" style={{ background: '#000' }}>
          <div className="aura-bg-wave" />
          <div className="aura-bg-wave" />
          <div className="aura-bg-wave" />
        </div>

        {/* ── SPLASH SCREEN ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {isIntro && (
            <motion.div
              className="absolute inset-0 z-[200] bg-black flex items-center justify-center"
              animate={{ opacity: introFading ? 0 : 1 }}
              transition={{ duration: 0.6 }}
              style={{ pointerEvents: introFading ? 'none' : 'auto' }}
            >
              <img
                src={entryImg}
                alt="AURA splash"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  userSelect: 'none',
                }}
                draggable={false}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <AboutModal    isOpen={showAbout}    onClose={() => setShowAbout(false)} />
        <SettingsModal
          isOpen={showSettings} onClose={() => setShowSettings(false)}
          isThinking={isThinking} onToggleThinking={() => setIsThinking(t => !t)}
        />

        {/* ── LANDING VIEW ──────────────────────────────────────────────── */}
        {!isIntro && view === 'landing' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-lg w-full space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span className="text-[9px] font-black tracking-[0.3em] uppercase text-zinc-400">Intelligence Redefined</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-6xl font-black tracking-tighter text-white leading-none"
              >
                AURA{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-400 to-zinc-600">
                  AI
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed"
              >
                The next evolution of human-AI interaction — fast, beautiful, and profoundly capable.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
              >
                <button
                  onClick={() => setView('conversation')}
                  className="group relative px-8 py-4 bg-white text-black font-black rounded-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10">Start Conversation</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                </button>
                <button
                  onClick={() => setShowAbout(true)}
                  className="px-8 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all backdrop-blur-xl"
                >
                  About Developer
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="grid grid-cols-4 gap-4 pt-4 max-w-sm mx-auto"
              >
                {[
                  { label: 'Ultra Fast', icon: Zap,       color: 'text-blue-400'    },
                  { label: 'Deep Logic', icon: Brain,     color: 'text-purple-400'  },
                  { label: 'Visual Art', icon: ImageIcon, color: 'text-pink-400'    },
                  { label: 'Real-time',  icon: Search,    color: 'text-emerald-400' },
                ].map(({ label, icon: Icon, color }) => (
                  <div key={label} className="flex flex-col items-center gap-2 group cursor-default">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                      <Icon className={cn('w-4 h-4', color)} />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors">
                      {label}
                    </span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* ── CONVERSATION VIEW ─────────────────────────────────────────── */}
        {!isIntro && view === 'conversation' && (
          <div className="absolute inset-0 z-10 flex flex-col">

            {/* Header */}
            <header className="px-4 py-2.5 flex items-center justify-between border-b border-white/5 backdrop-blur-xl flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => { clearAuraMessages(); setView('landing'); }}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all"
                  title="Home"
                >
                  <Home className="w-4 h-4 text-zinc-500 hover:text-zinc-300" />
                </button>
                <button
                  onClick={() => setIsDark(d => !d)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all"
                  title="Toggle theme"
                >
                  {isDark
                    ? <Sun className="w-4 h-4 text-zinc-500"  />
                    : <Moon className="w-4 h-4 text-zinc-500" />}
                </button>

                <div className="w-px h-5 bg-white/10 mx-1" />

                <div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-sm font-black tracking-tighter text-white aura-text-glow">AURA</span>
                    {isThinking && (
                      <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest bg-purple-500/15 text-purple-400 border border-purple-500/20 rounded-md">
                        Deep Think
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse shadow-[0_0_4px_rgba(59,130,246,0.6)]" />
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Neural Link Active</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsThinking(t => !t)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 border',
                    isThinking
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/5'
                  )}
                >
                  <Brain className="w-3 h-3" />
                  Think
                </button>
                <button
                  onClick={() => clearAuraMessages()}
                  className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 border border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  title="Clear chat"
                >
                  <History className="w-3 h-3" />
                  Clear
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-zinc-500 hover:text-white transition-all hover:bg-white/5 rounded-xl"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Messages */}
            <main className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-hide">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.35)]">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-3 max-w-xs">
                    <h3 className="text-xl font-black tracking-tight text-white">How can I assist?</h3>
                    <p className="text-xs text-zinc-500">Ask me anything — code, analysis, creative writing, or just a chat.</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                    {[
                      'Explain quantum computing',
                      'Write a Python web scraper',
                      'What is the latest in AI?',
                      'Create a landing page',
                    ].map(s => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-zinc-400 hover:bg-white/10 hover:text-white transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 max-w-2xl mx-auto">
                  {messages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border',
                        msg.role === 'user'
                          ? 'bg-cyan-950/60 border-cyan-500/30 text-cyan-400'
                          : 'bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-700 text-white border-emerald-500/30 shadow-[0_0_14px_rgba(16,185,129,0.35)]'
                      )}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      </div>

                      <div className={cn(
                        'max-w-[80%] px-4 py-3 rounded-2xl text-sm border shadow-lg',
                        msg.role === 'user'
                          ? 'bg-cyan-950/60 border-cyan-500/25 text-cyan-50 rounded-tr-sm shadow-[0_0_12px_rgba(6,182,212,0.12)]'
                          : 'bg-[#020f06]/80 border-emerald-500/15 backdrop-blur-xl rounded-tl-sm text-emerald-50/90'
                      )}>
                        {msg.role === 'user' ? (
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        ) : (
                          <div className="aura-markdown">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 flex-row"
                    >
                      {/* Pulsing Aura icon */}
                      <motion.div
                        animate={{
                          boxShadow: [
                            "0 0 8px rgba(16,185,129,0.3)",
                            "0 0 22px rgba(16,185,129,0.75)",
                            "0 0 8px rgba(16,185,129,0.3)",
                          ],
                        }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-700 flex items-center justify-center border border-emerald-500/30 shrink-0"
                      >
                        <motion.div
                          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Sparkles className="w-4 h-4 text-white" />
                        </motion.div>
                      </motion.div>

                      <div className="px-4 py-3 bg-[#020f06]/80 border border-emerald-500/15 rounded-2xl rounded-tl-sm backdrop-blur-xl flex items-center gap-2">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 0.65, delay: i * 0.15, repeat: Infinity }}
                            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                          />
                        ))}
                        <span className="text-[10px] text-emerald-600 font-mono tracking-widest ml-1 uppercase">AURA processing…</span>
                      </div>
                    </motion.div>
                  )}

                  <div ref={bottomRef} />
                </div>
              )}
            </main>

            {/* Input */}
            <footer className="px-4 pb-4 pt-3 flex-shrink-0">
              <div className="max-w-2xl mx-auto">
                <div className="relative group">
                  {/* AURA wake-active pulse ring */}
                  {auraWakeActive && (
                    <motion.div
                      className="absolute -inset-1 rounded-3xl pointer-events-none"
                      animate={{
                        boxShadow: [
                          '0 0 0 0px rgba(0,240,255,0.55)',
                          '0 0 0 7px rgba(0,240,255,0.12)',
                          '0 0 0 0px rgba(0,240,255,0)',
                        ],
                      }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ border: '1.5px solid rgba(0,240,255,0.55)', borderRadius: '1.75rem' }}
                    />
                  )}
                  <div className={cn(
                    'absolute -inset-0.5 bg-gradient-to-r rounded-3xl blur transition duration-500',
                    auraWakeActive
                      ? 'from-cyan-400 via-cyan-500 to-cyan-400 opacity-50'
                      : 'from-blue-500 via-purple-500 to-pink-500 opacity-20 group-focus-within:opacity-60'
                  )} />
                  <div className="relative flex items-end gap-2 p-2 bg-zinc-950/90 backdrop-blur-3xl rounded-[1.75rem] shadow-2xl">
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={auraWakeActive ? '🎙 AURA is listening…' : 'Ask AURA anything…'}
                      rows={1}
                      disabled={isLoading}
                      className="flex-1 bg-transparent border-0 outline-none ring-0 text-white py-3 px-3 resize-none max-h-36 text-sm placeholder:text-zinc-600 disabled:opacity-50"
                      style={{ height: 'auto' }}
                      onInput={e => {
                        const t = e.target as HTMLTextAreaElement;
                        t.style.height = 'auto';
                        t.style.height = `${t.scrollHeight}px`;
                      }}
                    />
                    <button
                      onClick={startMicInput}
                      title={isMicListening ? 'Stop mic' : 'Speak to AURA'}
                      className={cn(
                        'p-3 rounded-2xl transition-all flex items-center justify-center shrink-0',
                        isMicListening
                          ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_14px_rgba(0,240,255,0.5)] animate-pulse'
                          : 'bg-zinc-800/70 text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                      )}
                    >
                      {isMicListening
                        ? <MicOff className="w-4 h-4" />
                        : <Mic className="w-4 h-4" />
                      }
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={isLoading || !input.trim()}
                      className={cn(
                        'p-3 rounded-2xl transition-all flex items-center justify-center shadow-xl shrink-0',
                        isLoading || !input.trim()
                          ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed'
                          : 'bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                      )}
                    >
                      {isLoading
                        ? <Loader2 className="w-5 h-5 animate-spin" />
                        : <Send className="w-5 h-5" />
                      }
                    </button>
                  </div>
                </div>
                <p className="text-[8px] text-center text-zinc-700 font-black uppercase tracking-widest mt-2">
                  {auraWakeActive
                    ? '🎙 AURA Wake Active — say a command or ask anything'
                    : 'AURA Intelligence • Powered by Pollinations • MONIX OS'}
                </p>
              </div>
            </footer>
          </div>
        )}
      </div>
    </WindowChrome>
  );
}
