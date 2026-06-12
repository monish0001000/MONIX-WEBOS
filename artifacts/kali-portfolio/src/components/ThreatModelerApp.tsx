import WindowChrome from "./WindowChrome";

interface ThreatModelerAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

export default function ThreatModelerApp({
  onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex,
}: ThreatModelerAppProps) {
  return (
    <WindowChrome
      title="Threat Modeler — Attack Surface Diagramming"
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
        src="https://excalidraw.com/"
        className="w-full h-full border-none bg-white"
        title="Threat Modeler"
        allow="clipboard-read; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
      />
    </WindowChrome>
  );
}
