import { motion } from "framer-motion";
import { toast } from "sonner";

interface RightClickMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onOpenWindow: (id: string) => void;
  onOpenWallpaperPicker: () => void;
  onRefresh: () => void;
}

export default function RightClickMenu({ x, y, onClose, onOpenWindow, onOpenWallpaperPicker, onRefresh }: RightClickMenuProps) {
  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const item = "px-3 py-1.5 text-sm text-gray-200 hover:bg-blue-600/30 hover:text-white cursor-pointer transition-colors";

  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className="absolute font-sans"
      style={{
        left: x,
        top: y,
        background: "#18181f",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 6,
        boxShadow: "0 12px 40px rgba(0,0,0,0.85)",
        padding: "4px 0",
        minWidth: 200,
        zIndex: 200,
      }}
    >
      {/* 1. Refresh Desktop */}
      <div
        className={item}
        onClick={() => handleAction(onRefresh)}
      >
        Refresh Desktop
      </div>

      <div className="border-t border-white/10 my-1" />

      {/* 4. Open Terminal */}
      <div
        className={item}
        onClick={() => handleAction(() => onOpenWindow("terminal"))}
      >
        Open Terminal
      </div>

      {/* 4. New Folder */}
      <div
        className={item}
        onClick={() => handleAction(() => toast("New folder created on desktop."))}
      >
        New Folder
      </div>

      <div className="border-t border-white/10 my-1" />

      {/* 5. About */}
      <div
        className={item}
        onClick={() => handleAction(() => toast("MONIX OS Simulation v1.0 by Monish."))}
      >
        About This System
      </div>

      <div className="border-t border-white/10 my-1" />

      {/* 6. Task Manager */}
      <div
        className={item + " flex items-center gap-2"}
        onClick={() => handleAction(() => onOpenWindow("taskmanager"))}
      >
        <span>📊</span>
        <span>Task Manager</span>
      </div>

      <div className="border-t border-white/10 my-1" />

      {/* Threat Map */}
      <div
        className={item + " flex items-center gap-2"}
        onClick={() => handleAction(() => onOpenWindow("threatmap"))}
      >
        <span>🗺️</span>
        <span>Live Threat Map</span>
      </div>

      {/* CodePad */}
      <div
        className={item + " flex items-center gap-2"}
        onClick={() => handleAction(() => onOpenWindow("codepad"))}
      >
        <span>📝</span>
        <span>CodePad</span>
      </div>

      {/* MONIX-COMM */}
      <div
        className={item + " flex items-center gap-2"}
        onClick={() => handleAction(() => onOpenWindow("securecomm"))}
      >
        <span>📞</span>
        <span>MONIX-COMM</span>
      </div>

      {/* Classified Dossier */}
      <div
        className={item + " flex items-center gap-2"}
        onClick={() => handleAction(() => onOpenWindow("dossier"))}
      >
        <span>🗃️</span>
        <span>Classified Dossier</span>
      </div>

      <div className="border-t border-white/10 my-1" />

      {/* 7. Settings */}
      <div
        className={item + " flex items-center gap-2"}
        onClick={() => handleAction(() => onOpenWindow("settings"))}
      >
        <span>⚙️</span>
        <span>Settings</span>
      </div>
    </motion.div>
  );
}
