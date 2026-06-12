import WindowChrome from "./WindowChrome";

interface CyberChefAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

export default function CyberChefApp({
  onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex,
}: CyberChefAppProps) {
  return (
    <WindowChrome
      title="CyberChef — The Cyber Swiss Army Knife"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={1100}
      height={680}
      zIndex={zIndex}
    >
      <iframe
        src="https://gchq.github.io/CyberChef/"
        className="w-full h-full border-none bg-white"
        title="CyberChef"
        allow="clipboard-read; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
      />
    </WindowChrome>
  );
}
