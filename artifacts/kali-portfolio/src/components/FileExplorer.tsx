import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder, FileText, File, Image as ImageIcon, Archive,
  ChevronRight, Cloud, Upload, CheckCircle, XCircle,
  HardDrive, Loader2, Database, AlertTriangle,
  Download, RefreshCw, ExternalLink, Mouse,
  Pencil, Trash2, Play, Music2,
} from "lucide-react";
import WindowChrome from "./WindowChrome";
import { useOSStore } from "@/lib/store";
import type { VFSNode } from "@/lib/vfsUtils";
import {
  initGoogleDrive,
  authorizeGoogleDrive,
  isGoogleDriveAuthorized,
  fetchDriveFiles,
  uploadDriveFile,
  deleteDriveFile,
  renameDriveFile
} from "@/lib/googleDriveClient";

interface FileExplorerProps {
  onClose: () => void;
  onMinimize?: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
  onOpenMediaViewer?: (fileName: string, fileUrl: string, fileType: string) => void;
}

// ─── Media type detection from extension ──────────────────────────────────────
type MediaKind = "image" | "video" | "audio" | "unknown";

function detectMediaType(ext: string | undefined): MediaKind {
  const e = (ext ?? "").toLowerCase();
  if (["png","jpg","jpeg","gif","webp","avif","bmp","svg","ico"].includes(e)) return "image";
  if (["mp4","webm","ogv","mov","avi","mkv","m4v"].includes(e))              return "video";
  if (["mp3","wav","ogg","flac","aac","m4a","opus"].includes(e))             return "audio";
  return "unknown";
}

// ─── VFS Icon helpers ─────────────────────────────────────────────────────────
function getVFSIcon(node: VFSNode) {
  if (node.type === "folder") return Folder;
  const e = node.ext ?? "";
  if (["png","jpg","jpeg","svg","gif","webp","avif"].includes(e)) return ImageIcon;
  if (["zip","gz","tar","iso","rar","7z"].includes(e)) return Archive;
  if (["md","txt","log","json","csv"].includes(e)) return FileText;
  return File;
}

function getVFSIconColor(node: VFSNode): string {
  if (node.type === "folder") return "#00f0ff";
  const e = node.ext ?? "";
  if (["zip","gz","tar","iso","rar","7z"].includes(e)) return "#fbbf24";
  if (["png","jpg","jpeg","svg","gif","webp","avif"].includes(e)) return "#34d399";
  if (["sh","py","js","ts","rs","go"].includes(e)) return "#a78bfa";
  if (["enc","key","pem"].includes(e)) return "#f87171";
  if (["md","txt","log"].includes(e)) return "#94a3b8";
  return "#64748b";
}

// ─── Cloud file icon helper ────────────────────────────────────────────────────
function getCloudIcon(fileName: string): { Icon: React.ElementType; color: string } {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["png","jpg","jpeg","gif","webp","avif","bmp","svg","ico"].includes(ext))
    return { Icon: ImageIcon, color: "#34d399" };
  if (["mp4","webm","ogv","mov","avi","mkv","m4v"].includes(ext))
    return { Icon: Play, color: "#a78bfa" };
  if (["mp3","wav","ogg","flac","aac","m4a","opus"].includes(ext))
    return { Icon: Music2, color: "#fb923c" };
  if (["zip","gz","tar","iso","rar","7z"].includes(ext))
    return { Icon: Archive, color: "#fbbf24" };
  if (["md","txt","log","json","csv"].includes(ext))
    return { Icon: FileText, color: "#94a3b8" };
  return { Icon: File, color: "#64748b" };
}

// ─── Supabase cloud registry row ──────────────────────────────────────────────
interface CloudFile {
  id: string;
  file_name: string;
  file_size: number;
  file_url: string;
  created_at: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastKind = "success" | "error" | "info";
interface Toast { id: number; kind: ToastKind; msg: string }

// ─── Context menu item ────────────────────────────────────────────────────────
interface CtxMenuItem { label: string; icon: React.ReactNode; action: () => void; danger?: boolean }

// ─── Main component ───────────────────────────────────────────────────────────
export default function FileExplorer({
  onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex,
  onOpenMediaViewer,
}: FileExplorerProps) {
  const [tab, setTab] = useState<"local" | "cloud" | "notepad">("local");
  // Notepad Files tab state
  const [notepadFiles, setNotepadFiles] = useState<Record<string, { id: string; name: string; content: string; modified: number }>>({});
  const [notepadSelected, setNotepadSelected] = useState<string | null>(null);
  const refreshNotepadFiles = () => {
    try {
      const raw = localStorage.getItem("webos_notepad_files");
      setNotepadFiles(raw ? JSON.parse(raw) : {});
    } catch { setNotepadFiles({}); }
  };
  useEffect(() => { if (tab === "notepad") refreshNotepadFiles(); }, [tab]);

  // ── VFS state (reads from store — populated by Desktop on mount) ──
  const localFileSystem = useOSStore((s) => s.localFileSystem);

  // Navigation: stack of folder IDs; last entry = current folder
  const [navStack, setNavStack] = useState<string[]>(["root"]);
  const currentFolderId = navStack[navStack.length - 1];

  // Context menu
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; items: CtxMenuItem[] } | null>(null);

  // Derive children and breadcrumb from navStack + tree
  const currentChildren = localFileSystem.filter((n) => n.parentId === currentFolderId);
  const breadcrumb: VFSNode[] = navStack.map((id) =>
    localFileSystem.find((n) => n.id === id) ?? { id, name: id === "root" ? "storage" : id, type: "folder", parentId: "" }
  );

  // Reset navigation when VFS reloads (e.g., first mount)
  useEffect(() => {
    setNavStack(["root"]);
  }, [localFileSystem.length]);

  // Close ctx menu on outside click
  useEffect(() => {
    if (!ctxMenu) return;
    const handler = () => setCtxMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [ctxMenu]);

  // ── Smart file opener: media → in-OS viewer, else → download ──────────────
  const openFile = useCallback((node: VFSNode) => {
    if (!node.url) return;
    const kind = detectMediaType(node.ext);
    if (kind !== "unknown") {
      onOpenMediaViewer?.(node.name, node.url, kind);
    } else {
      // Fallback: trigger native download — never leaves the OS tab
      const a = document.createElement("a");
      a.href = node.url;
      a.download = node.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }, [onOpenMediaViewer]);

  // ── VFS navigation ──
  const navigateInto = useCallback((node: VFSNode) => {
    if (node.type === "folder") {
      setNavStack((s) => [...s, node.id]);
    } else {
      openFile(node);
    }
  }, [openFile]);

  const navigateToBreadcrumb = useCallback((idx: number) => {
    setNavStack((s) => s.slice(0, idx + 1));
  }, []);

  const downloadFile = async (node: VFSNode) => {
    if (!node.url) return;
    try {
      const res = await fetch(node.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = node.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch { /* silent — context menu usage */ }
  };

  const openCtxMenu = (e: React.MouseEvent, node: VFSNode) => {
    e.preventDefault();
    e.stopPropagation();
    const items: CtxMenuItem[] = node.type === "folder"
      ? [{ label: "Open", icon: <Folder size={11} />, action: () => navigateInto(node) }]
      : [
          { label: "Open",     icon: <ExternalLink size={11} />, action: () => openFile(node) },
          { label: "Download", icon: <Download size={11} />,     action: () => downloadFile(node) },
        ];
    setCtxMenu({ x: e.clientX, y: e.clientY, items });
  };

  // ── Cloud state ──
  const [isDriveReady, setIsDriveReady]     = useState(false);
  const [cloudFiles, setCloudFiles]         = useState<CloudFile[]>([]);
  const [loadingFiles, setLoadingFiles]     = useState(false);
  const [isUploading, setIsUploading]       = useState(false);
  const [gridRefreshing, setGridRefreshing] = useState(false);
  const [downloadingId, setDownloadingId]   = useState<string | null>(null);
  const [toasts, setToasts]                 = useState<Toast[]>([]);
  const [cloudWindowMenu, setCloudWindowMenu] = useState<{ x: number; y: number } | null>(null);
  const [cloudItemMenu, setCloudItemMenu]   = useState<{ x: number; y: number; file: CloudFile } | null>(null);
  const [renamingId, setRenamingId]         = useState<string | null>(null);
  const [renameValue, setRenameValue]       = useState("");
  const cloudFileInputRef                   = useRef<HTMLInputElement>(null);
  const toastCounter                        = useRef(0);

  const pushToast = useCallback((kind: ToastKind, msg: string) => {
    const id = ++toastCounter.current;
    setToasts((t) => [...t, { id, kind, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  useEffect(() => {
    initGoogleDrive(() => {
      setIsDriveReady(true);
      fetchCloudFiles();
    });
  }, []);

  const fetchCloudFiles = useCallback(async () => {
    if (!isGoogleDriveAuthorized()) return;
    setLoadingFiles(true);
    try {
      const data = await fetchDriveFiles();
      setCloudFiles(data);
    } catch (err: any) {
      console.error("[MONIX OS] Drive fetch error:", err);
      const msg = err?.message ?? err?.error_description ?? JSON.stringify(err);
      pushToast("error", `DRIVE ERROR: ${msg}`);
    } finally {
      setLoadingFiles(false);
    }
  }, [pushToast]);

  useEffect(() => {
    if (tab === "cloud") fetchCloudFiles();
  }, [tab, fetchCloudFiles]);

  const doUpload = useCallback(async (file: File) => {
    if (!isGoogleDriveAuthorized()) { pushToast("error", "Drive not connected"); return; }
    setIsUploading(true);
    pushToast("info", `Uploading ${file.name}...`);
    try {
      await uploadDriveFile(file);
      pushToast("success", `${file.name} saved to Google Drive`);
      await fetchCloudFiles();
    } catch (err: any) {
      console.error("[MONIX OS] Cloud upload error:", err);
      pushToast("error", `Upload failed — ${err?.message ?? JSON.stringify(err)}`);
    } finally {
      setIsUploading(false);
    }
  }, [pushToast, fetchCloudFiles]);

  const doCloudDownload = useCallback(async (file: CloudFile) => {
    setDownloadingId(file.id);
    pushToast("info", `Fetching ${file.file_name}...`);
    try {
      const res = await fetch(file.file_url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = file.file_name;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(blobUrl);
      pushToast("success", `${file.file_name} downloaded`);
    } catch (err: any) {
      console.error("[MONIX OS] Cloud download error:", err);
      pushToast("error", `Download failed — ${err?.message ?? JSON.stringify(err)}`);
    } finally {
      setDownloadingId(null);
    }
  }, [pushToast]);

  const doCloudOpen = useCallback((file: CloudFile) => {
    const ext = file.file_name.split(".").pop()?.toLowerCase() ?? "";
    const kind = detectMediaType(ext);
    if (kind !== "unknown") {
      onOpenMediaViewer?.(file.file_name, file.file_url, kind);
    } else {
      doCloudDownload(file);
    }
  }, [onOpenMediaViewer, doCloudDownload]);

  const doCloudDelete = useCallback(async (file: CloudFile) => {
    try {
      await deleteDriveFile(file.id);
      pushToast("success", `${file.file_name} deleted`);
      await fetchCloudFiles();
    } catch (err: any) {
      console.error("[MONIX OS] Cloud delete error:", err);
      pushToast("error", `Delete failed — ${err?.message ?? JSON.stringify(err)}`);
    }
  }, [pushToast, fetchCloudFiles]);

  const doCloudRename = useCallback(async (file: CloudFile, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === file.file_name) { setRenamingId(null); return; }
    try {
      await renameDriveFile(file.id, trimmed);
      pushToast("success", `Renamed to ${trimmed}`);
      await fetchCloudFiles();
    } catch (err: any) {
      console.error("[MONIX OS] Cloud rename error:", err);
      pushToast("error", `Rename failed — ${err?.message ?? JSON.stringify(err)}`);
    } finally {
      setRenamingId(null);
    }
  }, [pushToast, fetchCloudFiles]);

  const handleCloudFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    e.target.value = "";
  };

  // Close cloud menus on outside click
  useEffect(() => {
    if (!cloudWindowMenu && !cloudItemMenu) return;
    const handler = () => { setCloudWindowMenu(null); setCloudItemMenu(null); };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [cloudWindowMenu, cloudItemMenu]);

  const toastColors: Record<ToastKind, { bg: string; border: string; color: string; shadow: string }> = {
    success: { bg:"rgba(0,255,136,0.1)",   border:"rgba(0,255,136,0.35)",   color:"#00ff88", shadow:"0 0 20px rgba(0,255,136,0.2)"   },
    error:   { bg:"rgba(248,113,113,0.1)", border:"rgba(248,113,113,0.35)", color:"#f87171", shadow:"0 0 20px rgba(248,113,113,0.2)" },
    info:    { bg:"rgba(0,240,255,0.08)",  border:"rgba(0,240,255,0.3)",    color:"#00f0ff", shadow:"0 0 20px rgba(0,240,255,0.15)"  },
  };

  return (
    <WindowChrome
      title="MONIX Files — Secure File Manager"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={760}
      height={520}
      zIndex={zIndex}
    >
      <div className="flex flex-col h-full bg-[#050505] font-mono overflow-hidden">

        {/* ── Tab Bar ── */}
        <div className="flex items-center border-b border-white/[0.06] bg-[#080808] px-3 pt-2 gap-1 shrink-0">
          {[
            { id: "local" as const,   label: "LOCAL SYSTEM",   icon: <HardDrive size={12} /> },
            { id: "cloud" as const,   label: "CLOUD DRIVE",    icon: <Cloud size={12} /> },
            { id: "notepad" as const, label: "NOTEPAD FILES",  icon: <FileText size={12} /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] tracking-widest transition-all duration-200 rounded-t"
              style={{
                color:        tab === t.id ? "#00f0ff" : "rgba(255,255,255,0.3)",
                borderBottom: tab === t.id ? "2px solid #00f0ff" : "2px solid transparent",
                background:   tab === t.id ? "rgba(0,240,255,0.05)" : "transparent",
                textShadow:   tab === t.id ? "0 0 10px rgba(0,240,255,0.7)" : "none",
                fontWeight:   tab === t.id ? 700 : 400,
              }}
            >
              {t.icon}<span className="ml-1">{t.label}</span>
            </button>
          ))}
          <div className="ml-auto text-[9px] text-white/20 tracking-widest pb-1.5 flex items-center gap-2">
            {tab === "local" && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" style={{ boxShadow:"0 0 6px #22d3ee" }} />
                VFS READY · {localFileSystem.filter(n=>n.type==="file").length} FILES
              </span>
            )}
            {tab === "cloud" && (
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${isDriveReady ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-red-400 shadow-[0_0_6px_#f87171]'}`} />
                {isDriveReady ? "DRIVE CONNECTED" : "DRIVE DISCONNECTED"}
              </span>
            )}
            {tab === "notepad" && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300 inline-block" style={{ boxShadow:"0 0 6px #93c5fd" }} />
                {Object.keys(notepadFiles).length} FILES IN STORAGE
              </span>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* ══ TAB 1: LOCAL VFS (real glob-backed) ══ */}
            {tab === "local" && (
              <motion.div
                key="local"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col h-full"
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                {/* Breadcrumb bar */}
                <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.04] bg-[#060606] shrink-0">
                  <Database size={10} className="text-white/20 mr-1 shrink-0" />
                  {breadcrumb.map((node, i) => (
                    <span key={node.id} className="flex items-center gap-1">
                      {i > 0 && <ChevronRight size={10} className="text-white/15" />}
                      <button
                        onClick={() => navigateToBreadcrumb(i)}
                        className="text-[10px] tracking-wider transition-all hover:underline shrink-0"
                        style={{
                          color:      i === breadcrumb.length - 1 ? "#00f0ff" : "rgba(255,255,255,0.35)",
                          textShadow: i === breadcrumb.length - 1 ? "0 0 8px rgba(0,240,255,0.6)" : "none",
                        }}
                      >
                        {node.name}
                      </button>
                    </span>
                  ))}
                  <span className="ml-auto text-[9px] text-white/15 tracking-widest shrink-0">
                    {currentChildren.length} ITEMS
                  </span>
                </div>

                {/* Files grid */}
                <div className="flex-1 overflow-y-auto p-4">
                  {localFileSystem.length === 0 ? (
                    // VFS not yet loaded (shouldn't happen after Desktop mounts)
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-white/15">
                      <Loader2 size={28} className="animate-spin" style={{ color:"#00f0ff" }} />
                      <span className="text-[10px] tracking-widest">INITIALIZING VFS...</span>
                    </div>
                  ) : currentChildren.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-white/15">
                      <AlertTriangle size={28} />
                      <span className="text-[11px] tracking-widest">EMPTY DIRECTORY</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-3">
                      {currentChildren.map((node) => {
                        const Icon  = getVFSIcon(node);
                        const color = getVFSIconColor(node);
                        return (
                          <motion.div
                            key={node.id}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onDoubleClick={() => navigateInto(node)}
                            onContextMenu={(e) => openCtxMenu(e, node)}
                            className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg cursor-pointer text-center select-none"
                            style={{
                              background:  "rgba(255,255,255,0.02)",
                              border:      "1px solid rgba(255,255,255,0.04)",
                              transition:  "background 0.15s, border-color 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              const el = e.currentTarget as HTMLDivElement;
                              el.style.background   = "rgba(0,240,255,0.05)";
                              el.style.borderColor  = "rgba(0,240,255,0.15)";
                            }}
                            onMouseLeave={(e) => {
                              const el = e.currentTarget as HTMLDivElement;
                              el.style.background   = "rgba(255,255,255,0.02)";
                              el.style.borderColor  = "rgba(255,255,255,0.04)";
                            }}
                          >
                            <Icon size={30} style={{ color, filter:`drop-shadow(0 0 6px ${color}88)` }} />
                            <span className="text-[10px] text-white/70 truncate w-full leading-tight" title={node.name}>
                              {node.name}
                            </span>
                            {node.type === "file" && node.ext && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded uppercase tracking-widest"
                                style={{ background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.25)" }}>
                                .{node.ext}
                              </span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Help hint */}
                <div className="shrink-0 px-4 py-1.5 border-t border-white/[0.04] flex items-center gap-3"
                  style={{ background:"rgba(0,0,0,0.3)" }}>
                  <Mouse size={9} className="text-white/15" />
                  <span className="text-[9px] text-white/15 tracking-wider">
                    DOUBLE-CLICK to open · RIGHT-CLICK for options
                  </span>
                </div>
              </motion.div>
            )}

            {/* ══ TAB 2: CLOUD DRIVE (Supabase) — Grid View ══ */}
            {tab === "cloud" && (
              <motion.div
                key="cloud"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col h-full overflow-hidden relative"
              >
                {/* Hidden file input for uploads */}
                <input ref={cloudFileInputRef} type="file" className="hidden" onChange={handleCloudFileChange} />

                {/* Toolbar */}
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.04] bg-[#060606] shrink-0">
                  <Database size={10} className="text-white/20 mr-1 shrink-0" />
                  <span className="text-[10px] tracking-widest font-bold" style={{ color:"rgba(0,240,255,0.6)" }}>
                    google_drive
                  </span>
                  <span className="text-[9px] text-white/15 tracking-widest">/ monix-drive</span>

                  {isUploading && (
                    <span className="flex items-center gap-1 text-[9px] tracking-widest" style={{ color:"#00f0ff" }}>
                      <Loader2 size={9} className="animate-spin" /> UPLOADING...
                    </span>
                  )}

                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => { setGridRefreshing(true); fetchCloudFiles().finally(() => setTimeout(() => setGridRefreshing(false), 300)); }}
                      disabled={loadingFiles}
                      className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] tracking-widest transition-all"
                      style={{ color:"rgba(255,255,255,0.3)", border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.02)" }}
                    >
                      <RefreshCw size={9} className={loadingFiles ? "animate-spin" : ""} /> REFRESH
                    </button>
                    <span className="text-[9px] text-white/15 tracking-widest">{cloudFiles.length} FILES</span>
                  </div>
                </div>

                {/* ── Not configured / Grid area ── */}
                {!isDriveReady ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-white/20 p-6" style={{ minHeight: 200 }}>
                    <Cloud size={36} style={{ color: "#3b82f6", filter: "drop-shadow(0 0 8px rgba(59,130,246,0.4))" }} />
                    <span className="text-[12px] tracking-widest font-bold text-blue-400">GOOGLE DRIVE INTEGRATION</span>
                    <div className="text-center space-y-3 max-w-sm">
                      <p className="text-[10px] tracking-wider text-white/30">
                        Connect to Google Drive to upload, view, and manage files securely from Monix OS.
                      </p>
                      <button 
                        onClick={authorizeGoogleDrive}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] tracking-widest font-bold rounded shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
                      >
                        CONNECT GOOGLE DRIVE
                      </button>
                    </div>
                  </div>
                ) : (<>
                  {/* Grid area — right-click opens cloud window menu */}
                <div
                  className="flex-1 min-h-0 overflow-y-auto p-4 relative"
                  style={{ minHeight: 0 }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCloudWindowMenu({ x: e.clientX, y: e.clientY });
                    setCloudItemMenu(null);
                  }}
                >
                  {/* Inner full-height wrapper ensures right-click captures entire empty area */}
                  <div
                    className="flex flex-col min-h-full transition-opacity duration-300"
                    style={{ opacity: gridRefreshing ? 0.35 : 1 }}
                  >
                  {loadingFiles ? (
                    <div className="flex flex-col items-center justify-center flex-1 gap-3 text-white/15" style={{ minHeight: 200 }}>
                      <Loader2 size={28} className="animate-spin" style={{ color:"#00f0ff" }} />
                      <span className="text-[10px] tracking-widest">QUERYING REGISTRY...</span>
                    </div>
                  ) : cloudFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 gap-3 text-white/15" style={{ minHeight: 200 }}>
                      <Cloud size={32} />
                      <span className="text-[11px] tracking-widest">CLOUD DRIVE EMPTY</span>
                      <span className="text-[9px] text-white/10 tracking-widest">Right-click to upload a file</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-3">
                      {cloudFiles.map((f, i) => {
                        const { Icon, color } = getCloudIcon(f.file_name);
                        const isRenaming = renamingId === f.id;
                        return (
                          <motion.div
                            key={f.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onDoubleClick={() => doCloudOpen(f)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCloudItemMenu({ x: e.clientX, y: e.clientY, file: f });
                              setCloudWindowMenu(null);
                            }}
                            className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg cursor-pointer text-center select-none relative"
                            style={{
                              background: "rgba(255,255,255,0.02)",
                              border: "1px solid rgba(255,255,255,0.04)",
                              transition: "background 0.15s, border-color 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              const el = e.currentTarget as HTMLDivElement;
                              el.style.background  = "rgba(0,240,255,0.05)";
                              el.style.borderColor = "rgba(0,240,255,0.15)";
                            }}
                            onMouseLeave={(e) => {
                              const el = e.currentTarget as HTMLDivElement;
                              el.style.background  = "rgba(255,255,255,0.02)";
                              el.style.borderColor = "rgba(255,255,255,0.04)";
                            }}
                          >
                            {downloadingId === f.id
                              ? <Loader2 size={30} className="animate-spin" style={{ color:"#00f0ff" }} />
                              : <Icon size={30} style={{ color, filter:`drop-shadow(0 0 6px ${color}88)` }} />
                            }

                            {isRenaming ? (
                              <input
                                autoFocus
                                className="w-full text-[10px] text-center bg-transparent border-b border-cyan-500/50 outline-none text-white/80 leading-tight"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") doCloudRename(f, renameValue);
                                  if (e.key === "Escape") setRenamingId(null);
                                  e.stopPropagation();
                                }}
                                onBlur={() => doCloudRename(f, renameValue)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span className="text-[10px] text-white/70 truncate w-full leading-tight" title={f.file_name}>
                                {f.file_name}
                              </span>
                            )}

                            <span className="text-[8px] px-1.5 py-0.5 rounded uppercase tracking-widest"
                              style={{ background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.2)" }}>
                              {formatBytes(f.file_size)}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                  </div>{/* /inner min-h-full wrapper */}
                </div>

                {/* Help hint */}
                <div className="shrink-0 px-4 py-1.5 border-t border-white/[0.04] flex items-center gap-3"
                  style={{ background:"rgba(0,0,0,0.3)" }}>
                  <Mouse size={9} className="text-white/15" />
                  <span className="text-[9px] text-white/15 tracking-wider">
                    DOUBLE-CLICK to open · RIGHT-CLICK file for options · RIGHT-CLICK background to upload
                  </span>
                </div>

                {/* ── Cloud Window Context Menu (empty space) ── */}
                <AnimatePresence>
                  {cloudWindowMenu && (
                    <motion.div
                      initial={{ opacity:0, scale:0.93 }}
                      animate={{ opacity:1, scale:1 }}
                      exit={{ opacity:0, scale:0.93 }}
                      transition={{ duration:0.12 }}
                      className="fixed flex flex-col py-1 rounded-lg overflow-hidden"
                      style={{
                        left: cloudWindowMenu.x, top: cloudWindowMenu.y,
                        zIndex: (zIndex ?? 100) + 70,
                        background: "rgba(8,8,8,0.97)",
                        border: "1px solid rgba(0,240,255,0.2)",
                        backdropFilter: "blur(16px)",
                        boxShadow: "0 8px 40px rgba(0,0,0,0.75), 0 0 20px rgba(0,240,255,0.08)",
                        minWidth: 160,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {[
                        { label: "📤  Upload File", action: () => { cloudFileInputRef.current?.click(); setCloudWindowMenu(null); } },
                        { label: "🔄  Refresh",      action: () => { setCloudWindowMenu(null); setGridRefreshing(true); fetchCloudFiles().finally(() => { setTimeout(() => setGridRefreshing(false), 300); }); } },
                      ].map(({ label, action }) => (
                        <button key={label} onClick={action}
                          className="flex items-center px-3 py-2 text-[11px] tracking-wider text-left transition-all"
                          style={{ color:"rgba(255,255,255,0.75)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background="rgba(0,240,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.color="#00f0ff"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background="transparent"; (e.currentTarget as HTMLButtonElement).style.color="rgba(255,255,255,0.75)"; }}
                        >{label}</button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Cloud Item Context Menu (file) ── */}
                <AnimatePresence>
                  {cloudItemMenu && (
                    <motion.div
                      initial={{ opacity:0, scale:0.93 }}
                      animate={{ opacity:1, scale:1 }}
                      exit={{ opacity:0, scale:0.93 }}
                      transition={{ duration:0.12 }}
                      className="fixed flex flex-col py-1 rounded-lg overflow-hidden"
                      style={{
                        left: cloudItemMenu.x, top: cloudItemMenu.y,
                        zIndex: (zIndex ?? 100) + 70,
                        background: "rgba(8,8,8,0.97)",
                        border: "1px solid rgba(0,240,255,0.2)",
                        backdropFilter: "blur(16px)",
                        boxShadow: "0 8px 40px rgba(0,0,0,0.75), 0 0 20px rgba(0,240,255,0.08)",
                        minWidth: 160,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {[
                        {
                          label: "📂  Open",
                          icon: null,
                          danger: false,
                          action: () => { doCloudOpen(cloudItemMenu.file); setCloudItemMenu(null); },
                        },
                        {
                          label: "📥  Download",
                          icon: <Download size={11} />,
                          danger: false,
                          action: () => { doCloudDownload(cloudItemMenu.file); setCloudItemMenu(null); },
                        },
                        {
                          label: "✏️  Rename",
                          icon: <Pencil size={11} />,
                          danger: false,
                          action: () => {
                            setRenamingId(cloudItemMenu.file.id);
                            setRenameValue(cloudItemMenu.file.file_name);
                            setCloudItemMenu(null);
                          },
                        },
                        {
                          label: "🗑️  Delete",
                          icon: <Trash2 size={11} />,
                          danger: true,
                          action: () => { doCloudDelete(cloudItemMenu.file); setCloudItemMenu(null); },
                        },
                      ].map(({ label, danger, action }) => (
                        <button key={label} onClick={action}
                          className="flex items-center px-3 py-2 text-[11px] tracking-wider text-left transition-all"
                          style={{ color: danger ? "#f87171" : "rgba(255,255,255,0.75)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background="rgba(0,240,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.color= danger ? "#f87171" : "#00f0ff"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background="transparent"; (e.currentTarget as HTMLButtonElement).style.color= danger ? "#f87171" : "rgba(255,255,255,0.75)"; }}
                        >{label}</button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                </>)}
                </motion.div>
            )}
            {/* ══ TAB 3: NOTEPAD FILES ══ */}
            {tab === "notepad" && (
              <motion.div
                key="notepad"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col h-full"
              >
                <div className="flex-1 overflow-y-auto p-3">
                  {Object.keys(notepadFiles).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
                      <FileText size={36} style={{ color: "#7ecfff" }} />
                      <span className="text-[11px] text-white/50 tracking-wider">No notepad files yet</span>
                      <span className="text-[10px] text-white/30">Open Notepad to create files</span>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {Object.values(notepadFiles)
                        .sort((a, b) => b.modified - a.modified)
                        .map((f) => (
                          <div
                            key={f.id}
                            onClick={() => setNotepadSelected(notepadSelected === f.id ? null : f.id)}
                            className="flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all"
                            style={{
                              background: notepadSelected === f.id ? "rgba(126,207,255,0.08)" : "rgba(255,255,255,0.02)",
                              border: `1px solid ${notepadSelected === f.id ? "rgba(126,207,255,0.25)" : "rgba(255,255,255,0.05)"}`,
                            }}
                          >
                            <span className="text-lg shrink-0 mt-0.5">
                              {f.name.endsWith(".md") ? "📝" : "📄"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-semibold truncate" style={{ color: notepadSelected === f.id ? "#7ecfff" : "rgba(255,255,255,0.75)" }}>
                                {f.name}
                              </div>
                              <div className="text-[9px] text-white/30 mt-0.5 truncate">
                                {f.content.slice(0, 60)}{f.content.length > 60 ? "…" : ""}
                              </div>
                              <div className="text-[9px] text-white/20 mt-1">
                                {new Date(f.modified).toLocaleString()}
                                {" · "}
                                {f.content.length} chars
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Download as blob
                                const blob = new Blob([f.content], { type: "text/plain" });
                                const url  = URL.createObjectURL(blob);
                                const a    = document.createElement("a");
                                a.href     = url;
                                a.download = f.name;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                              title="Download"
                              className="shrink-0 p-1.5 rounded transition-all hover:bg-white/10"
                              style={{ color: "rgba(255,255,255,0.3)" }}
                            >
                              <Download size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = { ...notepadFiles };
                                delete updated[f.id];
                                localStorage.setItem("webos_notepad_files", JSON.stringify(updated));
                                refreshNotepadFiles();
                              }}
                              title="Delete"
                              className="shrink-0 p-1.5 rounded transition-all hover:bg-red-500/10"
                              style={{ color: "rgba(248,113,113,0.5)" }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 px-4 py-1.5 border-t border-white/[0.04] flex items-center gap-3" style={{ background: "rgba(0,0,0,0.3)" }}>
                  <FileText size={9} className="text-white/15" />
                  <span className="text-[9px] text-white/15 tracking-wider">
                    CLICK to select · DOWNLOAD to save locally · DELETE to remove from OS
                  </span>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── In-explorer context menu ── */}
        <AnimatePresence>
          {ctxMenu && (
            <motion.div
              initial={{ opacity:0, scale:0.93 }}
              animate={{ opacity:1, scale:1 }}
              exit={{ opacity:0, scale:0.93 }}
              transition={{ duration:0.12 }}
              className="fixed flex flex-col py-1 rounded-lg overflow-hidden"
              style={{
                left:    ctxMenu.x,
                top:     ctxMenu.y,
                zIndex:  (zIndex ?? 100) + 60,
                background:    "rgba(8,8,8,0.96)",
                border:        "1px solid rgba(0,240,255,0.18)",
                backdropFilter:"blur(16px)",
                boxShadow:     "0 8px 40px rgba(0,0,0,0.7), 0 0 20px rgba(0,240,255,0.08)",
                minWidth:      150,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {ctxMenu.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { item.action(); setCtxMenu(null); }}
                  className="flex items-center gap-2.5 px-3 py-2 text-[11px] tracking-wider text-left transition-all"
                  style={{ color: item.danger ? "#f87171" : "rgba(255,255,255,0.75)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,240,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.color = item.danger ? "#f87171" : "#00f0ff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = item.danger ? "#f87171" : "rgba(255,255,255,0.75)"; }}
                >
                  <span style={{ color: item.danger ? "#f87171" : "rgba(0,240,255,0.7)" }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Toast Layer ── */}
        <div className="fixed bottom-14 right-4 flex flex-col gap-2 pointer-events-none"
          style={{ zIndex:(zIndex ?? 100) + 50 }}>
          <AnimatePresence>
            {toasts.map((t) => {
              const c = toastColors[t.kind];
              return (
                <motion.div key={t.id}
                  initial={{ opacity:0, x:40, scale:0.9 }}
                  animate={{ opacity:1, x:0,  scale:1   }}
                  exit={{ opacity:0, x:40, scale:0.9 }}
                  transition={{ duration:0.22 }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-[11px] tracking-wider font-bold shadow-2xl"
                  style={{ background:c.bg, border:`1px solid ${c.border}`, color:c.color, boxShadow:`${c.shadow},0 8px 32px rgba(0,0,0,0.6)`, backdropFilter:"blur(12px)", minWidth:220, pointerEvents:"auto" }}>
                  {t.kind==="success" && <CheckCircle size={14}/>}
                  {t.kind==="error"   && <XCircle size={14}/>}
                  {t.kind==="info"    && <Cloud size={14}/>}
                  {t.msg}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </WindowChrome>
  );
}
