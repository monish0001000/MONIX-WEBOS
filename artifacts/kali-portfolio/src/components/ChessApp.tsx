import WindowChrome from "./WindowChrome";
import MonixChess from "./MonixChess";

interface ChessAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

export default function ChessApp({
  onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex,
}: ChessAppProps) {
  return (
    <WindowChrome
      title="Monix Grandmaster Chess"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={1100}
      height={700}
      zIndex={zIndex}
      defaultMaximized={true}
    >
      <div className="w-full h-full overflow-auto">
        <MonixChess />
      </div>
    </WindowChrome>
  );
}
