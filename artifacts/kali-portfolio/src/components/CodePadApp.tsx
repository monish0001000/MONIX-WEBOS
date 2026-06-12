import { useState, useRef } from "react";
import WindowChrome from "./WindowChrome";

interface CodePadAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

const STARTER = `#!/usr/bin/env python3
# MONIX Code Editor — Root Access
# ─────────────────────────────────

def main():
    print("Hello, MONIX OS!")

if __name__ == "__main__":
    main()
`;

const LANGS = ["python", "bash", "javascript", "c", "rust", "go", "sql"];

export default function CodePadApp({
  onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex,
}: CodePadAppProps) {
  const [code, setCode] = useState(STARTER);
  const [lang, setLang] = useState("python");
  const [lineCount, setLineCount] = useState(STARTER.split("\n").length);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (v: string) => {
    setCode(v);
    setLineCount(v.split("\n").length);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleClear = () => {
    setCode("");
    setLineCount(1);
    textareaRef.current?.focus();
  };

  return (
    <WindowChrome
      title="CodePad — Root Access"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={820}
      height={540}
      zIndex={zIndex}
    >
      <div className="w-full h-full flex flex-col bg-[#0a0a0a] overflow-hidden font-mono">
        {/* Header bar */}
        <div
          style={{
            height: 36,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 12px",
            background: "rgba(0,0,0,0.7)",
            borderBottom: "1px solid rgba(0,196,255,0.12)",
          }}
        >
          <span style={{ fontSize: 10, color: "#00c4ff", fontFamily: "monospace", letterSpacing: "0.08em", fontWeight: 600 }}>
            MONIX CODE EDITOR
          </span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>·</span>
          <span style={{ fontSize: 9, color: "rgba(255,68,68,0.9)", fontFamily: "monospace", letterSpacing: "0.06em" }}>
            ROOT ACCESS
          </span>

          <div style={{ flex: 1 }} />

          {/* Language selector */}
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{
              background: "rgba(0,196,255,0.08)",
              border: "1px solid rgba(0,196,255,0.2)",
              color: "rgba(0,196,255,0.8)",
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 4,
              fontFamily: "monospace",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {LANGS.map((l) => (
              <option key={l} value={l} style={{ background: "#0a0a0a" }}>{l}</option>
            ))}
          </select>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            style={{
              background: copied ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${copied ? "rgba(0,255,136,0.3)" : "rgba(255,255,255,0.1)"}`,
              color: copied ? "#00ff88" : "rgba(255,255,255,0.5)",
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 4,
              cursor: "pointer",
              fontFamily: "monospace",
              transition: "all 0.15s",
            }}
          >
            {copied ? "COPIED" : "COPY"}
          </button>

          {/* Clear button */}
          <button
            onClick={handleClear}
            style={{
              background: "rgba(255,68,68,0.08)",
              border: "1px solid rgba(255,68,68,0.2)",
              color: "rgba(255,68,68,0.6)",
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 4,
              cursor: "pointer",
              fontFamily: "monospace",
            }}
          >
            CLEAR
          </button>
        </div>

        {/* Editor area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Line numbers */}
          <div
            style={{
              width: 42,
              flexShrink: 0,
              background: "rgba(0,0,0,0.4)",
              borderRight: "1px solid rgba(255,255,255,0.06)",
              overflowY: "hidden",
              padding: "12px 0",
              userSelect: "none",
            }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div
                key={i}
                style={{
                  textAlign: "right",
                  paddingRight: 10,
                  fontSize: 11,
                  lineHeight: "21px",
                  color: "rgba(255,255,255,0.18)",
                  fontFamily: "monospace",
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => handleChange(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-[#0a0a0a] text-green-400 font-mono outline-none resize-none"
            style={{
              fontSize: 13,
              lineHeight: "21px",
              padding: "12px 14px",
              caretColor: "#00ff88",
              border: "none",
              tabSize: 2,
            }}
          />
        </div>

        {/* Status bar */}
        <div
          style={{
            height: 22,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "0 12px",
            background: "rgba(0,196,255,0.07)",
            borderTop: "1px solid rgba(0,196,255,0.1)",
          }}
        >
          <span style={{ fontSize: 9, color: "rgba(0,196,255,0.5)", fontFamily: "monospace" }}>
            {lang.toUpperCase()}
          </span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
            {lineCount} lines · {code.length} chars
          </span>
          <span style={{ fontSize: 9, color: "rgba(0,255,136,0.4)", fontFamily: "monospace" }}>
            UTF-8 · LF
          </span>
        </div>
      </div>
    </WindowChrome>
  );
}
