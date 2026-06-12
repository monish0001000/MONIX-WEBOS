// ─── AuraService — Upgraded v2 ────────────────────────────────────────────────
// 5-feature upgrade:
//  1. Two-stage wake word detection (sleep → armed → active)
//  2. Multi-language continuous listening (en-IN / Tamil / Tanglish)
//  3. Gemini LLM brain with structured JSON OS commands
//  4. Dynamic expressive TTS (macha = deep male, machi = female)
//  5. Immersive glow feedback (handled in App.tsx / CSS)

export interface AuraMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export interface AuraServiceCallbacks {
  isArmed:            () => boolean;
  isWakeActive:       () => boolean;
  isMuted:            () => boolean;
  getVoicePreference: () => 'female' | 'male';
  setArmed:           (v: boolean) => void;
  setWakeActive:      (v: boolean) => void;
  setHearingSound:    (v: boolean) => void;
  setVoicePreference: (v: 'female' | 'male') => void;
  addMessage:         (msg: AuraMessage) => void;
  clearMessages:      () => void;
  openWindow:         (id: string) => void;
}

export interface AuraServiceHandle {
  start:      () => void;
  stop:       () => void;
  manualWake: () => void;
}

// ─── Wake word ────────────────────────────────────────────────────────────────
const WAKE_WORD_RE = /hey\s+buddy/i;

// ─── API base path ────────────────────────────────────────────────────────────
function getApiBase(): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return base.replace(/\/$/, '') + '/api';
}

// ─── App → Window ID map ─────────────────────────────────────────────────────
export const VOICE_APP_MAP: Record<string, string> = {
  browser: 'browser', chrome: 'browser', 'google chrome': 'browser',
  files: 'files', 'file manager': 'files', 'file explorer': 'files',
  github: 'github',
  portfolio: 'portfolio',
  settings: 'settings',
  sentinel: 'sentinel', soc: 'sentinel', 'sentinel soc': 'sentinel',
  cyberchef: 'cyberchef', 'cyber chef': 'cyberchef',
  'code studio': 'codestudio', codestudio: 'codestudio', 'code editor': 'codestudio',
  chess: 'chess',
  cykrypt: 'cykrypt',
  'task manager': 'taskmanager', taskmanager: 'taskmanager', tasks: 'taskmanager',
  terminal: 'terminal', console: 'terminal',
  dossier: 'dossier', classified: 'dossier',
  trash: 'trash',
  'secure comm': 'securecomm', securecomm: 'securecomm',
  aura: 'aura',
  threatmap: 'threatmap', 'threat map': 'threatmap',
  codepad: 'codepad',
  notepad: 'notepad', 'note pad': 'notepad', 'text editor': 'notepad', notes: 'notepad',
};

// ─── Voice pickers ────────────────────────────────────────────────────────────
function pickFemaleVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const priority = [
    'Google US English',
    'Google UK English Female',
    'Microsoft Jenny Online (Natural) - English (United States)',
    'Microsoft Ana Online (Natural) - English (United States)',
    'Microsoft Zira - English (United States)',
    'Samantha', 'Karen', 'Moira', 'Tessa', 'Fiona',
  ];
  for (const name of priority) {
    const v = voices.find(v => v.name === name);
    if (v) return v;
  }
  const en = voices.filter(v => v.lang.startsWith('en'));
  return (
    en.find(v => /female|woman|zira|jenny|ana|samantha|karen|moira|tessa|fiona/i.test(v.name)) ||
    en[0] || voices[0] || null
  );
}

function pickMaleVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const priority = [
    'Google UK English Male',
    'Microsoft James Online (Natural) - English (United Kingdom)',
    'Microsoft David - English (United States)',
    'Microsoft Mark - English (United States)',
    'Daniel', 'Alex', 'Fred',
  ];
  for (const name of priority) {
    const v = voices.find(v => v.name === name);
    if (v) return v;
  }
  const en = voices.filter(v => v.lang.startsWith('en'));
  return (
    en.find(v => /male|man|david|daniel|alex|fred|james|mark/i.test(v.name)) ||
    en[en.length - 1] || voices[0] || null
  );
}

// ─── Pre-cached "Yes, Sir." utterance — built once at startup ─────────────────
// Fix #5 + Fix #2: Pre-warms TTS engine so the wake response is instant.
// We keep a single SpeechSynthesisUtterance in memory and replay it.
let _cachedYesSirUtterance: SpeechSynthesisUtterance | null = null;

export function preCacheWakeAudio() {
  if (typeof window === 'undefined') return;
  if (!window.speechSynthesis || _cachedYesSirUtterance) return;
  // Warm the engine: a zero-volume silent utterance forces browser to load voices
  const silence = new SpeechSynthesisUtterance(' ');
  silence.volume = 0;
  silence.rate   = 2.0;
  window.speechSynthesis.speak(silence);

  // Build the real utterance once voices are loaded
  function build() {
    const u = new SpeechSynthesisUtterance('Yes, Sir.');
    const v = pickMaleVoice();
    if (v) u.voice = v;
    u.rate   = 0.95;
    u.pitch  = 0.70;
    u.volume = 1.0;
    u.lang   = 'en-IN';
    _cachedYesSirUtterance = u;
  }
  if (window.speechSynthesis.getVoices().length > 0) {
    build();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      build();
    };
  }
}

// ─── sayInstant() — zero-latency wake response using pre-cached utterance ─────
// Fix #2: always cancels first (no overlap). Fix #5: uses male voice cache.
export function sayInstant(text: string) {
  if (typeof window === 'undefined') return;
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  // Use pre-cached utterance if available and text matches, else build fresh
  if (_cachedYesSirUtterance && text === 'Yes, Sir.') {
    // Re-create from same config (utterances can't be re-played after onend)
    const u = new SpeechSynthesisUtterance('Yes, Sir.');
    if (_cachedYesSirUtterance.voice) u.voice = _cachedYesSirUtterance.voice;
    u.rate   = _cachedYesSirUtterance.rate;
    u.pitch  = _cachedYesSirUtterance.pitch;
    u.volume = 1.0;
    u.lang   = 'en-IN';
    window.speechSynthesis.speak(u);
    return;
  }
  // Fallback: pick male voice immediately from whatever is loaded
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickMaleVoice();
  if (voice) u.voice = voice;
  u.rate   = 0.95;
  u.pitch  = 0.70;
  u.volume = 1.0;
  u.lang   = 'en-IN';
  window.speechSynthesis.speak(u);
}

// ─── Tamil Unicode detector ───────────────────────────────────────────────────
// Returns true when the text contains native Tamil script characters.
function isTamilScript(text: string): boolean {
  return /[\u0B80-\u0BFF]/.test(text);
}

// ─── Tamil/Indian voice picker ────────────────────────────────────────────────
// Bug #3 fix: never use en-GB/en-US to read Tamil or Indian-English text.
function pickTamilVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  // 1. Native Tamil voice (ta-IN)
  const tamil = voices.find(v => v.lang === 'ta-IN');
  if (tamil) return tamil;
  // 2. Any Indian voice as fallback
  const indian = voices.find(v => v.lang.endsWith('-IN'));
  if (indian) return indian;
  return null;
}

// ─── speak() — full quality TTS with preferred voice ─────────────────────────
// Bug #3 fix: detects Tamil text and uses ta-IN lang + Tamil voice.
export function speak(text: string, preference: 'female' | 'male' = 'male') {
  if (typeof window === 'undefined') return;
  if (!window.speechSynthesis) return;
  // Fix #2 (overlap): always cancel before speaking
  window.speechSynthesis.cancel();

  const hasTamil   = isTamilScript(text);

  function doSpeak() {
    const u = new SpeechSynthesisUtterance(text);

    if (hasTamil) {
      // Native Tamil script — use ta-IN voice; browser handles pronunciation
      u.lang = 'ta-IN';
      const tamilVoice = pickTamilVoice();
      if (tamilVoice) u.voice = tamilVoice;
      u.rate  = 0.90;
      u.pitch = 1.0;
    } else {
      // English or Tanglish — use preferred gender, always Indian English
      const voice = preference === 'male' ? pickMaleVoice() : pickFemaleVoice();
      if (voice) u.voice = voice;
      u.lang = 'en-IN';
      if (preference === 'male') {
        u.rate  = 1.05;
        u.pitch = 1.1;
      } else {
        u.rate  = 1.05;
        u.pitch = 1.1;
      }
    }
    u.volume = 1.0;
    window.speechSynthesis.speak(u);
  }

  if (window.speechSynthesis.getVoices().length > 0) {
    doSpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      doSpeak();
    };
  }
}

// ─── Wake chime (dual-tone) ───────────────────────────────────────────────────
export function playWakeSound() {
  if (typeof window === 'undefined') return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [[880, 0, 0.18], [1100, 0.14, 0.18], [1320, 0.28, 0.14]].forEach(([freq, delay, vol]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.35);
    });
  } catch (_) {}
}

// ─── Sliding-window wake-word check ──────────────────────────────────────────
function slidingWindowCheck(transcript: string): string | null {
  const lower   = transcript.toLowerCase().trim();
  const words   = lower.split(/\s+/);
  const window5 = words.slice(-5).join(' ');

  if (WAKE_WORD_RE.test(window5) || WAKE_WORD_RE.test(lower)) {
    const match = lower.match(/hey\s+buddy\s*(.*)/i);
    return match ? match[1].trim() : '';
  }
  return null;
}

// ─── Gemini Brain: structured JSON command via API server ─────────────────────
interface GeminiCommand {
  action: string;
  target: string;
  reply:  string;
  query:  string;
}

async function queryGeminiBrain(text: string, history: AuraMessage[]): Promise<GeminiCommand> {
  const fallback: GeminiCommand = {
    action: 'answer', target: '', query: '',
    reply: 'Neural link degraded. Command received but mainframe unreachable.',
  };

  try {
    const res = await fetch(`${getApiBase()}/aura/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: history.slice(-6).map(m => ({ role: m.role, text: m.text })),
      }),
    });

    if (!res.ok) {
      // Fallback to Pollinations if API server down
      return pollinationsFallback(text);
    }

    const data = await res.json() as GeminiCommand;
    return data;
  } catch {
    return pollinationsFallback(text);
  }
}

async function pollinationsFallback(text: string): Promise<GeminiCommand> {
  try {
    const systemPrompt =
      'You are AURA, an elite AI of MONIX-OS. Address the user as "Sir". For general queries, respond in natural, colloquial Tamil or Tanglish (Tamil written in English script mixed with English words)—sound like a real human assistant chatting on the phone, not a robot. If the user speaks pure English, reply in English. Keep every response to 1-2 short sentences. No markdown, no emojis, no lists, no formality.';
    const prompt = systemPrompt + ' User says: ' + text;
    const res = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt));
    if (!res.ok) throw new Error('Pollinations fail');
    const reply = (await res.text()).slice(0, 300);
    return { action: 'answer', target: '', query: '', reply };
  } catch {
    return {
      action: 'answer', target: '', query: '',
      reply: 'Mainframe connection failed. Standing by, Sir.',
    };
  }
}

// ─── Tanglish app-keyword extractor ──────────────────────────────────────────
// Tries to pull an app name from Tamil-inflected phrases like
// "browser ah open pannu" / "terminal open pannuda" / "settings paarunga"
function extractTanglishApp(lower: string): string | null {
  // Remove common Tamil filler words and verbs, leaving the app keyword
  const cleaned = lower
    .replace(/\b(?:ah|da|pa|la|nga|di|bro|machi|macha|yov)\b/gi, '')
    .replace(/\b(?:open\s+)?(?:pannu|pannuda|panndra|panna|pannunga|panrom|pannalam|pannuvom|venum|vendum|yedu|yeduka|paarunga|paaru|paakanum|paako|kaatu|kaattu|tirappu|tirap|cheyyi|cheyyunga|open|start|launch|run|boot)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;

  // Check each cleaned word against the app map
  const words = cleaned.split(/\s+/);
  for (const word of words) {
    if (VOICE_APP_MAP[word]) return VOICE_APP_MAP[word];
  }
  // Multi-word match
  for (const key of Object.keys(VOICE_APP_MAP)) {
    if (cleaned.includes(key)) return VOICE_APP_MAP[key];
  }
  return null;
}

// ─── Local fast-path command parsing (runs before hitting the LLM) ───────────
// Fix #5: Expanded with Tamil & Tanglish regex matchers — zero LLM cost.
function fastParseCommand(lower: string): GeminiCommand | null {
  // ── Voice switching ────────────────────────────────────────────────────────
  if (/(?:change|switch|set)\s+voice\s+(?:into|to|as)?\s*macha/i.test(lower) ||
      /macha\s+(?:voice|mode)/i.test(lower))
    return { action: 'voice_male', target: '', reply: 'Done macha, deep mode activated.', query: '' };
  if (/(?:change|switch|set)\s+voice\s+(?:into|to|as)?\s*machi/i.test(lower) ||
      /machi\s+(?:voice|mode)/i.test(lower))
    return { action: 'voice_female', target: '', reply: 'Sure machi, I am here for you.', query: '' };

  // ── Clear chat ─────────────────────────────────────────────────────────────
  if (/^(?:clear|reset|clean)\s*(?:chat|aura|history|screen)?$/.test(lower) ||
      /(?:chat|history)\s+(?:clear|delete|remove)\s*(?:pannu|pannuda|panna|panndra)?/.test(lower))
    return { action: 'clear_chat', target: '', reply: 'Chat cleared.', query: '' };

  // ── Close all ──────────────────────────────────────────────────────────────
  if (/close\s*all|all\s*(?:window|app)s?\s*(?:close|band|off)|ella\s*(?:window|app)s?\s*(?:close|pannu|band)/i.test(lower))
    return { action: 'close_all', target: '', reply: 'All windows closed.', query: '' };

  // ── English "open X" ───────────────────────────────────────────────────────
  const openMatch = lower.match(/^(?:please\s+)?(?:open|launch|start|run|show)\s+(.+)/);
  if (openMatch) {
    const key = openMatch[1].replace(/\s*(please|now|fast|quickly)\s*/gi, '').trim();
    const id  = VOICE_APP_MAP[key] ?? VOICE_APP_MAP[key.split(' ')[0]];
    if (id) return { action: 'open', target: id, reply: 'Launching.', query: '' };
  }

  // ── Tanglish "X open pannu" / "X ah open pannu" / "X pannu" ───────────────
  const isTanglishOpen =
    /(?:pannu|pannuda|panndra|panna|pannunga|yedu|yeduka|tirappu|tirap|paaru|paarunga|kaatu|open\s+pannu|open\s+panna|open\s+pannuda)/i.test(lower);
  if (isTanglishOpen) {
    const appId = extractTanglishApp(lower);
    if (appId) return { action: 'open', target: appId, reply: 'Launching.', query: '' };
  }

  // ── Tanglish direct: "X-ah open" / "X open" without verb suffix ───────────
  const tanglishNoVerb = lower.match(/^(browser|terminal|files|github|settings|chess|aura|sentinel|cyberchef|codestudio|cykrypt|taskmanager|securecomm|dossier|trash|threatmap|codepad|portfolio)\s*(?:ah|la|da)?\s*(?:open|tirappu|kaatu)?$/i);
  if (tanglishNoVerb) {
    const key = tanglishNoVerb[1].toLowerCase();
    const id  = VOICE_APP_MAP[key];
    if (id) return { action: 'open', target: id, reply: 'Launching.', query: '' };
  }

  // ── Search ─────────────────────────────────────────────────────────────────
  const searchMatch =
    lower.match(/^(?:search|find|look\s+up|google)\s+(.+?)\s+(?:on\s+)?(?:google|internet|web)?$/) ||
    lower.match(/^(?:google|search)\s+(.+)/) ||
    lower.match(/(.+)\s+(?:google|search)\s+(?:pannu|pannuda|panna|panndra)/i);
  if (searchMatch) {
    const q = (searchMatch[1] || searchMatch[0]).trim();
    if (q.length > 1)
      return { action: 'search', target: 'browser', reply: 'Searching now.', query: q };
  }

  // ── Type ───────────────────────────────────────────────────────────────────
  const typeMatch = lower.match(/^(?:type|write|input|enter)\s+(.+)/);
  if (typeMatch)
    return { action: 'type', target: typeMatch[1].trim(), reply: 'Typing now.', query: '' };

  return null;
}

// ─── Execute a structured command from Gemini or fast-path ───────────────────
// Bug #2 fix: ONLY execute the exact commanded action — no side-effect windows.
// 'answer' adds to chat but does NOT auto-open AURA unless explicitly asked.
function executeCommand(
  cmd: GeminiCommand,
  cb: AuraServiceCallbacks,
  say: (t: string) => void,
  setWakeActive: (v: boolean) => void,
  sendToAI: (text: string) => void,
) {
  switch (cmd.action) {
    case 'open': {
      const windowId = VOICE_APP_MAP[cmd.target] ?? cmd.target;
      if (VOICE_APP_MAP[cmd.target] || Object.values(VOICE_APP_MAP).includes(cmd.target)) {
        say(cmd.reply);
        cb.openWindow(windowId); // opens ONLY the requested app — nothing else
      } else {
        say('App not found.');
      }
      break;
    }

    case 'search':
      say(cmd.reply);
      cb.openWindow('browser');
      // Dispatch search after browser has mounted (~600ms is sufficient)
      setTimeout(() => window.dispatchEvent(
        new CustomEvent('aura-browser-search', { detail: { query: cmd.query } })
      ), 600);
      break;

    case 'type':
      say(cmd.reply);
      window.dispatchEvent(new CustomEvent('aura-type-text', { detail: { text: cmd.target } }));
      break;

    case 'close_all':
      say(cmd.reply);
      window.dispatchEvent(new CustomEvent('aura-close-all'));
      break;

    case 'voice_male':
      cb.setVoicePreference('male');
      speak(cmd.reply, 'male'); // no setTimeout needed — cancel() guards overlap
      break;

    case 'voice_female':
      cb.setVoicePreference('female');
      speak(cmd.reply, 'female');
      break;

    case 'clear_chat':
      cb.clearMessages();
      say(cmd.reply);
      break;

    case 'answer':
      // Conversational reply — add to chat and speak, but do NOT force AURA open
      cb.addMessage({ id: (Date.now() + 1).toString(), role: 'assistant', text: cmd.reply });
      say(cmd.reply);
      break;

    default:
      // Unknown action from LLM — just speak, no window side-effects
      say(cmd.reply || 'Done.');
      break;
  }
  setWakeActive(false);
}

// ─── Porcupine offline wake-word module ───────────────────────────────────────
// Uses @picovoice/porcupine-web when VITE_PICOVOICE_ACCESS_KEY is set.
// Falls back gracefully to the Web Speech API wake-word regex if not configured.
async function tryInitPorcupine(onWake: () => void): Promise<{ stop: () => void } | null> {
  const accessKey = (import.meta.env.VITE_PICOVOICE_ACCESS_KEY as string | undefined)?.trim();
  if (!accessKey) return null;
  try {
    const { PorcupineWorker, BuiltInKeyword } = await import('@picovoice/porcupine-web');
    const { WebVoiceProcessor } = await import('@picovoice/web-voice-processor');

    // PorcupineDetection shape: { label: string; index: number }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const porcupine = await (PorcupineWorker as any).create(
      accessKey,
      // Use built-in "Porcupine" keyword — closest offline proxy for "Hey Buddy"
      [{ builtin: BuiltInKeyword.Porcupine, sensitivity: 0.5 }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (_detection: any) => { onWake(); },
    );

    await WebVoiceProcessor.subscribe(porcupine);
    console.log('[AURA] Porcupine offline wake-word engine active');

    return {
      stop: async () => {
        try {
          await WebVoiceProcessor.unsubscribe(porcupine);
          porcupine.terminate();
        } catch (_) {}
      },
    };
  } catch (err) {
    console.warn('[AURA] Porcupine init failed — using Web Speech API wake-word:', err);
    return null;
  }
}

// ─── Service Factory ──────────────────────────────────────────────────────────
export function createAuraService(cb: AuraServiceCallbacks): AuraServiceHandle {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recognition: any = null;
  let running          = false;
  let wakeTimer:    ReturnType<typeof setTimeout> | null = null;
  let aiDebounce:   ReturnType<typeof setTimeout> | null = null;
  let commandBuffer = '';
  let pauseTimer:   ReturnType<typeof setTimeout> | null = null;
  let restartTimer: ReturnType<typeof setTimeout> | null = null;

  // Porcupine engine handle — populated asynchronously at start()
  let porcupineHandle: { stop: () => void } | null = null;
  // When Porcupine is active, Web Speech runs only in command-capture mode (not wake-word scan)
  let porcupineActive = false;

  let wakeFiredAt        = 0;
  const WAKE_COOLDOWN_MS = 3000;

  // Local conversation history for context
  const localHistory: AuraMessage[] = [];

  function say(text: string) {
    speak(text, cb.getVoicePreference());
  }

  // ── Wake-active management ─────────────────────────────────────────────────
  // Fix #1: always reset hearingSound when deactivating so glow never sticks.
  function setWakeActiveLocal(active: boolean) {
    cb.setWakeActive(active);
    if (!active) {
      cb.setHearingSound(false); // guaranteed cleanup — glow off immediately
      commandBuffer = '';
    }
    if (wakeTimer) { clearTimeout(wakeTimer); wakeTimer = null; }
    if (active) {
      wakeTimer = setTimeout(() => {
        cb.setWakeActive(false);
        cb.setHearingSound(false);
        commandBuffer = '';
        say('Standing by.');
      }, 20000);
    }
  }

  // ── Process a complete utterance (called after pause or final result) ───────
  async function processUtterance(transcript: string) {
    if (pauseTimer) { clearTimeout(pauseTimer); pauseTimer = null; }
    const clean = transcript.replace(WAKE_WORD_RE, '').trim();
    const lower = clean.toLowerCase();

    if (!lower || lower.length < 2) return;

    cb.addMessage({ id: Date.now().toString(), role: 'user', text: clean });
    localHistory.push({ id: Date.now().toString(), role: 'user', text: clean });

    // Fast-path local commands (no LLM needed)
    const fastCmd = fastParseCommand(lower);
    if (fastCmd) {
      executeCommand(fastCmd, cb, say, setWakeActiveLocal, () => {});
      return;
    }

    // LLM brain: call Gemini via API server
    say('On it.');
    if (aiDebounce) clearTimeout(aiDebounce);
    aiDebounce = setTimeout(async () => {
      const cmd = await queryGeminiBrain(clean, localHistory);
      localHistory.push({ id: (Date.now() + 1).toString(), role: 'assistant', text: cmd.reply });
      executeCommand(cmd, cb, say, setWakeActiveLocal, () => {});
    }, 350);
  }

  // ── Premium wake greeting ─────────────────────────────────────────────────
  function sayWakeGreeting() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    function doSpeak() {
      const u = new SpeechSynthesisUtterance('System online. Awaiting your command, Sir.');
      const voices = window.speechSynthesis.getVoices();
      const voice =
        voices.find(v => v.name === 'Google UK English Male') ||
        voices.find(v => v.name === 'Google US English') ||
        voices.find(v => v.lang === 'en-IN') ||
        voices.find(v => v.lang.startsWith('en')) ||
        null;
      if (voice) u.voice = voice;
      u.lang   = 'en-US';
      u.rate   = 1.0;
      u.pitch  = 0.88;
      u.volume = 1.0;
      window.speechSynthesis.speak(u);
    }
    if (window.speechSynthesis.getVoices().length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        doSpeak();
      };
    }
  }

  // ── Wake trigger ───────────────────────────────────────────────────────────
  function triggerWake(afterText: string) {
    const now = Date.now();
    if (now - wakeFiredAt < WAKE_COOLDOWN_MS) return;
    wakeFiredAt = now;

    playWakeSound();
    setWakeActiveLocal(true);

    // Premium greeting — fires immediately on wake
    sayWakeGreeting();

    if (afterText.length > 2) {
      // Command was already spoken after the wake word — process it fast
      setTimeout(() => processUtterance(afterText), 900);
    }
    // Otherwise just wait for user's next utterance (already armed)
  }

  // ── Recognition lifecycle ──────────────────────────────────────────────────
  function startRecognition() {
    if (restartTimer) { clearTimeout(restartTimer); restartTimer = null; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const API = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!API || recognition || !running) return;

    const rec = new API();
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.lang            = 'en-IN';
    rec.maxAlternatives = 3;

    rec.onstart = () => { cb.setArmed(true); };

    rec.onsoundstart = () => {
      if (cb.isWakeActive()) cb.setHearingSound(true);
    };
    rec.onsoundend = () => { cb.setHearingSound(false); };
    rec.onspeechend = () => {
      cb.setHearingSound(false);
      // If we were collecting a command, flush it after speech ends
      if (cb.isWakeActive() && commandBuffer.length > 2) {
        if (pauseTimer) clearTimeout(pauseTimer);
        pauseTimer = setTimeout(() => {
          processUtterance(commandBuffer);
          commandBuffer = '';
        }, 600);
      }
    };

    rec.onresult = (event: any) => {
      if (cb.isMuted()) return;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result     = event.results[i];
        const transcript = result[0].transcript;
        const lower      = transcript.toLowerCase().trim();
        const isFinal    = result.isFinal;

        // ── Sleep mode: check INTERIM results for wake word ──────────────────
        // Skip wake-word scan if Porcupine is handling it (resource-saving mode)
        if (!cb.isWakeActive() && !porcupineActive) {
          const afterText = slidingWindowCheck(lower);
          if (afterText !== null) {
            triggerWake(afterText);
            return;
          }
        }

        // ── Command mode: accumulate speech until pause ───────────────────────
        if (cb.isWakeActive()) {
          const cleaned = transcript.replace(WAKE_WORD_RE, '').trim();
          if (!cleaned) continue;

          if (isFinal) {
            // Final result — flush immediately
            const full = (commandBuffer + ' ' + cleaned).trim();
            commandBuffer = '';
            if (pauseTimer) { clearTimeout(pauseTimer); pauseTimer = null; }
            if (full.length > 1) processUtterance(full);
          } else {
            // Interim — accumulate and reset pause timer
            commandBuffer = cleaned;
            cb.setHearingSound(true);
            if (pauseTimer) clearTimeout(pauseTimer);
            // Fix #4: auto-flush after 1.0 s silence — light-speed response
            pauseTimer = setTimeout(() => {
              if (commandBuffer.length > 2) {
                processUtterance(commandBuffer);
                commandBuffer = '';
              }
            }, 1000);
          }
        }
      }
    };

    rec.onend = () => {
      // Fix #1 — Unbreakable loop: ALWAYS restart unless explicitly stopped or mic denied
      recognition = null;
      cb.setHearingSound(false);
      if (running && !cb.isMuted()) {
        // Brief pause before restart so browser doesn't rate-limit us
        restartTimer = setTimeout(startRecognition, 250);
      } else {
        cb.setArmed(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (event: any) => {
      const fatal = event.error === 'not-allowed' || event.error === 'service-not-allowed';
      if (fatal) {
        console.warn('[AURA] Mic access denied — cannot listen.');
        running = false;
        recognition = null;
        cb.setArmed(false);
        cb.setHearingSound(false);
        return;
      }
      // Fix #1 — All non-fatal errors (no-speech, network, aborted, audio-capture):
      // do NOT just null-out; schedule an immediate restart so we never go deaf.
      recognition = null;
      cb.setHearingSound(false);
      if (running && !cb.isMuted()) {
        // no-speech = short retry; everything else = slightly longer
        const delay = event.error === 'no-speech' ? 100 : 400;
        restartTimer = setTimeout(startRecognition, delay);
      }
    };

    recognition = rec;
    try {
      rec.start();
    } catch (_) {
      recognition = null;
      if (running) restartTimer = setTimeout(startRecognition, 800);
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
      // Try to load Porcupine offline wake-word engine first (async, non-blocking)
      tryInitPorcupine(() => {
        // Porcupine detected wake word — trigger AURA wake
        if (running && !cb.isMuted()) triggerWake('');
      }).then((handle) => {
        if (!running) { handle?.stop(); return; } // stopped before init finished
        if (handle) {
          porcupineHandle = handle;
          porcupineActive = true;
          // With Porcupine active, start Web Speech in command-only mode
          // (continuous recognition is still needed for command capture after wake)
          startRecognition();
        } else {
          // No Porcupine — use full Web Speech API with wake-word regex
          porcupineActive = false;
          startRecognition();
        }
      }).catch(() => {
        porcupineActive = false;
        startRecognition();
      });
    },
    stop() {
      running = false;
      if (restartTimer) { clearTimeout(restartTimer); restartTimer = null; }
      if (wakeTimer) { clearTimeout(wakeTimer); wakeTimer = null; }
      if (aiDebounce) { clearTimeout(aiDebounce); aiDebounce = null; }
      if (pauseTimer) { clearTimeout(pauseTimer); pauseTimer = null; }
      // Tear down Porcupine if active
      porcupineHandle?.stop();
      porcupineHandle = null;
      porcupineActive = false;
      try { recognition?.abort(); } catch (_) {}
      recognition = null;
      commandBuffer = '';
      cb.setArmed(false);
      cb.setWakeActive(false);
      cb.setHearingSound(false);
      if (wakeTimer)  { clearTimeout(wakeTimer);  wakeTimer  = null; }
      if (aiDebounce) { clearTimeout(aiDebounce); aiDebounce = null; }
      if (pauseTimer) { clearTimeout(pauseTimer); pauseTimer = null; }
    },
    manualWake() {
      triggerWake('');
    },
  };
}
