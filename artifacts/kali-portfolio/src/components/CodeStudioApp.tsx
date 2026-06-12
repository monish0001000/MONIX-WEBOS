import WindowChrome from "./WindowChrome";

interface CodeStudioAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

export default function CodeStudioApp({
  onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex,
}: CodeStudioAppProps) {
  return (
    <WindowChrome
      title="Code Studio — Live Web IDE"
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
        src="https://stackblitz.com/edit/web-platform?embed=1&file=index.html&hideExplorer=1&theme=dark"
        className="w-full h-full border-none"
        title="Code Studio"
        allow="clipboard-read; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
      />
    </WindowChrome>
  );
}
