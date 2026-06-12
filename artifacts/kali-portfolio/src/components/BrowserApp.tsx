import WindowChrome from "./WindowChrome";
import { Browser } from "./chrome-browser/Browser";

interface BrowserAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

const BROWSER_W = typeof window !== "undefined" ? Math.round(window.innerWidth * 0.82) : 1200;
const BROWSER_H = typeof window !== "undefined" ? Math.round(window.innerHeight * 0.82) : 720;

export default function BrowserApp({
  onClose,
  onMinimize,
  isActive,
  onFocus,
  initialX,
  initialY,
  zIndex,
}: BrowserAppProps) {
  return (
    <WindowChrome
      title="Web Browser"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={BROWSER_W}
      height={BROWSER_H}
      zIndex={zIndex}
    >
      <Browser />
    </WindowChrome>
  );
}
