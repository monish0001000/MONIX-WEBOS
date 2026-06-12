import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Lock, Star, MoreVertical, Sparkles, User, Download, Puzzle, EyeOff, X, CheckCircle, Shield, Code, History, Search } from 'lucide-react';
import { Tab, Download as DownloadType, Extension, HistoryEntry } from './types';
import { cn } from '@/lib/utils';

interface NavigationBarProps {
  activeTab: Tab;
  onNavigate: (url: string) => void;
  onGoBack?: () => void;
  onGoForward?: () => void;
  onReload?: () => void;
  onToggleAI: () => void;
  isAIPanelOpen: boolean;
  onAskAI: (query: string) => void;
  isIncognito?: boolean;
  onToggleIncognito?: () => void;
  showDownloads?: boolean;
  onToggleDownloads?: () => void;
  showExtensions?: boolean;
  onToggleExtensions?: () => void;
  showHistory?: boolean;
  onToggleHistory?: () => void;
  downloads?: DownloadType[];
  extensions?: Extension[];
  historyEntries?: HistoryEntry[];
  onToggleExtension?: (id: string) => void;
  onClearHistory?: () => void;
  onClearDownloads?: () => void;
}

export function NavigationBar({
  activeTab,
  onNavigate,
  onGoBack,
  onGoForward,
  onReload,
  onToggleAI,
  isAIPanelOpen,
  onAskAI,
  isIncognito,
  onToggleIncognito,
  showDownloads,
  onToggleDownloads,
  showExtensions,
  onToggleExtensions,
  showHistory,
  onToggleHistory,
  downloads = [],
  extensions = [],
  historyEntries = [],
  onToggleExtension,
  onClearHistory,
  onClearDownloads
}: NavigationBarProps) {
  const [inputUrl, setInputUrl] = useState(activeTab.url);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  useEffect(() => {
    if (isAIPanelOpen) {
      setInputUrl('chrome://ai');
    } else {
      setInputUrl(activeTab.url);
    }
  }, [activeTab.url, isAIPanelOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate(inputUrl);
  };

  return (
    <div className={cn("flex items-center gap-1 sm:gap-2 px-2 py-1.5 border-b relative", isIncognito ? "bg-[#1e1e1e] border-[#333]" : "bg-[#3b2f3c] border-[#4a3d4b]")}>
      <div className="flex items-center gap-0.5 sm:gap-1">
        <button 
          onClick={onGoBack} 
          disabled={activeTab.historyIndex <= 0}
          className={cn("p-1.5 rounded-full transition-colors", activeTab.historyIndex > 0 ? "hover:bg-white/10 text-gray-200" : "text-gray-600")}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button 
          onClick={onGoForward}
          disabled={activeTab.historyIndex >= (activeTab.history?.length || 1) - 1}
          className={cn("p-1.5 rounded-full transition-colors", activeTab.historyIndex < (activeTab.history?.length || 1) - 1 ? "hover:bg-white/10 text-gray-200" : "text-gray-600")}
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <button onClick={onReload} className="hidden sm:flex p-1.5 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
          <RotateCw className="w-4 h-4" />
        </button>
        <button onClick={() => onNavigate('')} className="hidden sm:flex p-1.5 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
          <Home className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex items-center min-w-0">
        <div className={cn("flex-1 flex items-center rounded-full px-3 py-1 focus-within:ring-1 focus-within:ring-blue-500 transition-all h-8", isIncognito ? "bg-[#2d2d2d] hover:bg-[#3d3d3d] focus-within:bg-[#2d2d2d]" : "bg-[#2e232f] hover:bg-[#4a3d4b] focus-within:bg-[#2e232f]")}>
          <Lock className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-400 min-w-0"
            placeholder="Search Google or type a URL"
          />
          <button type="button" className="hidden sm:block p-1 rounded-full hover:bg-white/10 text-gray-400 shrink-0">
            <Star className="w-4 h-4" />
          </button>
        </div>
      </form>

      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        <button
          onClick={onToggleHistory}
          className={cn("hidden sm:flex p-1.5 rounded-full transition-colors", showHistory ? "bg-white/20 text-white" : "hover:bg-white/10 text-gray-400")}
          title="History"
        >
          <History className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleDownloads}
          className={cn("hidden sm:flex p-1.5 rounded-full transition-colors", showDownloads ? "bg-white/20 text-white" : "hover:bg-white/10 text-gray-400")}
          title="Downloads"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleExtensions}
          className={cn("hidden sm:flex p-1.5 rounded-full transition-colors", showExtensions ? "bg-white/20 text-white" : "hover:bg-white/10 text-gray-400")}
          title="Extensions"
        >
          <Puzzle className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleIncognito}
          className={cn("p-1.5 rounded-full transition-colors", isIncognito ? "text-white bg-white/10" : "hover:bg-white/10 text-gray-400")}
          title="Toggle Incognito"
        >
          <EyeOff className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleAI}
          className={cn(
            "flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full transition-colors border border-transparent",
            isAIPanelOpen
              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
              : "hover:bg-white/10 text-gray-400"
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline text-sm font-medium">AI Mode</span>
        </button>
        <button className="hidden sm:flex p-1.5 rounded-full hover:bg-white/10 text-gray-400 transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
        <button className="p-1 rounded-full hover:bg-white/10 transition-colors ml-0.5 sm:ml-1">
          <div className={cn("w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white", isIncognito ? "bg-gray-600" : "bg-blue-500")}>
            <User className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        </button>
      </div>

      {/* Downloads Popover */}
      {showDownloads && (
        <div className="absolute top-full right-16 mt-1 w-80 bg-[#292a2d] border border-[#3c4043] rounded-lg shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#3c4043]">
            <h3 className="text-white font-medium">Downloads</h3>
            <button onClick={onToggleDownloads} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {downloads.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">No recent downloads</div>
            ) : (
              downloads.map(dl => (
                <div 
                  key={dl.id} 
                  className={cn("group flex items-center gap-3 p-3 hover:bg-[#3c4043] transition-colors border-b border-[#3c4043] last:border-0", dl.url && "cursor-pointer")}
                  onClick={() => {
                    if (dl.url) {
                      const w = window.open(dl.url, "_blank");
                      w?.focus();
                    }
                  }}
                >
                  <div className="w-8 h-8 bg-[#3c4043] rounded flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{dl.filename}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {dl.status === 'completed' ? 'Done' : dl.status === 'failed' ? 'Failed' : `${dl.progress}%`}
                    </div>
                    {dl.status === 'downloading' && (
                      <div className="w-full h-1 bg-gray-700 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${dl.progress}%` }} />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      import('@/lib/googleDriveClient').then(m => m.deleteDriveFile(dl.id).catch(() => {}));
                      // The list will eventually resync or we can just ignore till reload since this is just UI
                    }}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-full transition-all"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ))
            )}
          </div>
          {downloads.length > 0 && (
            <div className="p-2 border-t border-[#3c4043] bg-[#323639]">
              <button 
                onClick={onClearDownloads}
                className="w-full py-1.5 text-sm text-blue-400 hover:bg-white/5 rounded transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Extensions Popover */}
      {showExtensions && (
        <div className="absolute top-full right-24 mt-1 w-72 bg-[#292a2d] border border-[#3c4043] rounded-lg shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#3c4043]">
            <h3 className="text-white font-medium">Extensions</h3>
            <button onClick={onToggleExtensions} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {extensions.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">No extensions installed</div>
            ) : (
              extensions.map(ext => {
                const Icon = ext.icon === 'Shield' ? Shield : ext.icon === 'Code' ? Code : CheckCircle;
                return (
                  <div key={ext.id} className="flex items-center justify-between p-3 hover:bg-[#3c4043] transition-colors border-b border-[#3c4043] last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-[#3c4043] rounded flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-gray-300" />
                      </div>
                      <div className="text-sm text-white truncate">{ext.name}</div>
                    </div>
                    <button
                      onClick={() => onToggleExtension?.(ext.id)}
                      className={cn("w-8 h-4 rounded-full relative transition-colors", ext.isEnabled ? "bg-blue-500" : "bg-gray-600")}
                    >
                      <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform", ext.isEnabled ? "right-0.5 translate-x-0" : "left-0.5")} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-2 border-t border-[#3c4043] bg-[#323639]">
            <button className="w-full py-1.5 text-sm text-blue-400 hover:bg-white/5 rounded transition-colors">
              Manage Extensions
            </button>
          </div>
        </div>
      )}

      {/* History Popover */}
      {showHistory && (
        <div className="absolute top-full right-32 mt-1 w-80 bg-[#292a2d] border border-[#3c4043] rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col max-h-[500px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#3c4043] shrink-0">
            <h3 className="text-white font-medium">History</h3>
            <button onClick={onToggleHistory} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 border-b border-[#3c4043] shrink-0">
            <div className="flex items-center bg-[#1e1e1e] rounded-md px-3 py-1.5 border border-[#3c4043] focus-within:border-blue-500 transition-colors">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Search history"
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {historyEntries.filter(entry =>
              entry.title.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
              entry.url.toLowerCase().includes(historySearchQuery.toLowerCase())
            ).length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">No history found</div>
            ) : (
              historyEntries
                .filter(entry =>
                  entry.title.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
                  entry.url.toLowerCase().includes(historySearchQuery.toLowerCase())
                )
                .map(entry => {
                  const date = new Date(entry.timestamp);
                  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <button
                      key={entry.id}
                      onClick={() => {
                        onNavigate(entry.url);
                        onToggleHistory?.();
                      }}
                      className="w-full flex items-start gap-3 p-3 hover:bg-[#3c4043] transition-colors border-b border-[#3c4043] last:border-0 text-left"
                    >
                      <div className="w-8 h-8 bg-[#3c4043] rounded flex items-center justify-center shrink-0 mt-0.5">
                        <History className="w-4 h-4 text-gray-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{entry.title}</div>
                        <div className="text-xs text-gray-400 truncate mt-0.5">{entry.url}</div>
                      </div>
                      <div className="text-[10px] text-gray-500 shrink-0 pt-1">
                        {timeString}
                      </div>
                    </button>
                  );
                })
            )}
          </div>
          <div className="p-2 border-t border-[#3c4043] bg-[#323639] shrink-0 flex gap-2">
            <button className="flex-1 py-1.5 text-sm text-blue-400 hover:bg-white/5 rounded transition-colors" onClick={() => { onNavigate('chrome://history'); onToggleHistory?.(); }}>
               Show Full History
            </button>
            <button className="flex-1 py-1.5 text-sm text-red-400 hover:bg-white/5 rounded transition-colors" onClick={onClearHistory}>
               Clear History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
