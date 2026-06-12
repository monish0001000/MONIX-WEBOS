import WindowChrome from "./WindowChrome";
import githubImg from "@assets/github_1775180551387.png";

interface GitHubAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

export default function GitHubApp({
  onClose,
  onMinimize,
  isActive,
  onFocus,
  initialX,
  initialY,
  zIndex,
}: GitHubAppProps) {
  return (
    <WindowChrome
      title="monish0001000 — GitHub"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={680}
      height={560}
      zIndex={zIndex}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0d1117",
          overflow: "auto",
          cursor: "pointer",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
        onClick={() => window.open("https://github.com/monish0001000", "_blank")}
        title="Open GitHub Profile"
      >
        <img
          src={githubImg}
          alt="GitHub Profile — monish0001000"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            pointerEvents: "none",
          }}
          draggable={false}
        />
      </div>
    </WindowChrome>
  );
}
