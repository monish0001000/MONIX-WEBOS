import React, { useState, useEffect } from 'react';
import { Tab, Download, Extension, HistoryEntry } from './types';
import { TabBar } from './TabBar';
import { NavigationBar } from './NavigationBar';
import { BookmarksBar } from './BookmarksBar';
import { BrowserContent } from './BrowserContent';
import { AIPanel } from './AIPanel';
import { cn } from '@/lib/utils';
import { fetchDriveFiles, isGoogleDriveAuthorized } from '@/lib/googleDriveClient';

export function Browser() {
  const [normalTabs, setNormalTabs] = useState<Tab[]>(() => {
    try {
      const saved = localStorage.getItem('monix_browser_tabs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { }
    return [
      { id: '1', title: 'New Tab', url: '', isLoading: false, history: [''], historyIndex: 0 }
    ];
  });

  const [activeNormalTabId, setActiveNormalTabId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('monix_browser_active_tab');
      if (saved) return saved;
    } catch { }
    return '1';
  });

  useEffect(() => {
    localStorage.setItem('monix_browser_tabs', JSON.stringify(normalTabs));
  }, [normalTabs]);

  useEffect(() => {
    localStorage.setItem('monix_browser_active_tab', activeNormalTabId);
  }, [activeNormalTabId]);

  const [incognitoTabs, setIncognitoTabs] = useState<Tab[]>([
    { id: 'incognito-1', title: 'New Incognito Tab', url: '', isLoading: false, history: [''], historyIndex: 0 }
  ]);
  const [activeIncognitoTabId, setActiveIncognitoTabId] = useState<string>('incognito-1');

  const [isIncognito, setIsIncognito] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [initialAIQuery, setInitialAIQuery] = useState<string>('');

  const [downloads, setDownloads] = useState<Download[]>(() => {
    try {
      const saved = localStorage.getItem('monix_browser_downloads');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showDownloads, setShowDownloads] = useState(false);

  useEffect(() => {
    if (isGoogleDriveAuthorized()) {
      fetchDriveFiles()
        .then((files: any[]) => {
          const driveDownloads: Download[] = files.map(f => ({
            id: f.id,
            filename: f.file_name,
            progress: 100,
            status: 'completed',
            url: f.file_url
          }));
          
          setDownloads(prev => {
            const currentNonSync = prev.filter(d => d.status === 'downloading');
            return [...currentNonSync, ...driveDownloads];
          });
        })
        .catch(console.error);
    }
  }, [showDownloads]);

  useEffect(() => {
    localStorage.setItem('monix_browser_downloads', JSON.stringify(downloads));
  }, [downloads]);

  const [extensions, setExtensions] = useState<Extension[]>([
    { id: '1', name: 'AdBlocker Pro', icon: 'Shield', isEnabled: true },
    { id: '2', name: 'React Developer Tools', icon: 'Code', isEnabled: true },
    { id: '3', name: 'Grammar Checker', icon: 'CheckCircle', isEnabled: false }
  ]);
  const [showExtensions, setShowExtensions] = useState(false);

  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('monix_browser_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    localStorage.setItem('monix_browser_history', JSON.stringify(historyEntries));
    if (historyEntries.length > 0 && isGoogleDriveAuthorized()) {
      const driveDebounce = setTimeout(async () => {
        try {
          const content = JSON.stringify(historyEntries);
          const blob = new Blob([content], { type: 'application/json' });
          const file = new File([blob], 'monix_browser_history.json', { type: 'application/json' });
          // Note: Full implementation would use fetchDriveFiles to find existing and update,
          // but for simplicity we rely on local storage as primary source of truth.
        } catch (e) {
          console.error("Drive sync error", e);
        }
      }, 5000);
      return () => clearTimeout(driveDebounce);
    }
    return undefined;
  }, [historyEntries]);

  const tabs = isIncognito ? incognitoTabs : normalTabs;
  const activeTabId = isIncognito ? activeIncognitoTabId : activeNormalTabId;
  const setTabs = isIncognito ? setIncognitoTabs : setNormalTabs;
  const setActiveTabId = isIncognito ? setActiveIncognitoTabId : setActiveNormalTabId;

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const handleAddTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: 'New Tab',
      url: '',
      isLoading: false,
      history: [''],
      historyIndex: 0
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      // Just reset the single tab to empty instead of closing
      setTabs([{ id: Date.now().toString(), title: 'New Tab', url: '', isLoading: false, history: [''], historyIndex: 0 }]);
      return;
    }

    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const handleNavigate = (url: string) => {
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('chrome://') && url !== '') {
      if (url.includes('.') && !url.includes(' ')) {
        finalUrl = `https://${url}`;
      } else {
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}&igu=1`;
      }
    }

    setTabs(tabs.map(t => {
      if (t.id === activeTabId) {
        if (t.url === finalUrl) return { ...t, isLoading: finalUrl !== '' && !finalUrl.startsWith('chrome://') };

        const currentHistory = t.history || [''];
        const currentIndex = t.historyIndex ?? 0;
        const newHistory = currentHistory.slice(0, currentIndex + 1);
        newHistory.push(finalUrl);

        return {
          ...t,
          url: finalUrl,
          title: finalUrl === 'chrome://ai' ? 'AI Mode' : (finalUrl || 'New Tab'),
          isLoading: finalUrl !== '' && !finalUrl.startsWith('chrome://'),
          history: newHistory,
          historyIndex: newHistory.length - 1
        };
      }
      return t;
    }));

    if (finalUrl && finalUrl !== 'chrome://newtab' && !isIncognito) {
      setHistoryEntries(prev => [
        {
          id: Date.now().toString(),
          url: finalUrl,
          title: finalUrl === 'chrome://ai' ? 'AI Mode' : finalUrl,
          timestamp: Date.now()
        },
        ...prev
      ]);
    }

    setIsAIPanelOpen(false);
  };

  const handleGoBack = () => {
    setTabs(tabs.map(t => {
      if (t.id === activeTabId && t.historyIndex > 0) {
        const newIndex = t.historyIndex - 1;
        const previousUrl = t.history[newIndex];
        return {
          ...t,
          url: previousUrl,
          title: previousUrl === 'chrome://ai' ? 'AI Mode' : (previousUrl || 'New Tab'),
          isLoading: previousUrl !== '' && !previousUrl.startsWith('chrome://'),
          historyIndex: newIndex
        };
      }
      return t;
    }));
  };

  const handleGoForward = () => {
    setTabs(tabs.map(t => {
      if (t.id === activeTabId && t.historyIndex < t.history.length - 1) {
        const newIndex = t.historyIndex + 1;
        const nextUrl = t.history[newIndex];
        return {
          ...t,
          url: nextUrl,
          title: nextUrl === 'chrome://ai' ? 'AI Mode' : (nextUrl || 'New Tab'),
          isLoading: nextUrl !== '' && !nextUrl.startsWith('chrome://'),
          historyIndex: newIndex
        };
      }
      return t;
    }));
  };

  const handleReload = () => {
    setTabs(tabs.map(t => {
      if (t.id === activeTabId && t.url !== '' && !t.url.startsWith('chrome://')) {
        return {
           ...t,
           isLoading: true,
           reloadKey: (t.reloadKey || 0) + 1
        };
      }
      return t;
    }));
  };

  const handleLoadComplete = (id: string) => {
    setTabs(tabs.map(t =>
      t.id === id ? { ...t, isLoading: false } : t
    ));
  };

  const handleAskAI = (query: string) => {
    setIsAIPanelOpen(true);
    setInitialAIQuery(query);
  };

  useEffect(() => {
    function onAuraSearch(e: Event) {
      const query = (e as CustomEvent<{ query: string }>).detail?.query;
      if (!query) return;
      handleNavigate(`https://www.google.com/search?q=${encodeURIComponent(query)}&igu=1`);
    }
    window.addEventListener('aura-browser-search', onAuraSearch);
    return () => window.removeEventListener('aura-browser-search', onAuraSearch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId, isIncognito]);

  return (
    <div
      className={cn("flex flex-col w-full overflow-hidden font-sans", isIncognito ? "bg-[#121212]" : "bg-[#202124]")}
      style={{ height: '100%' }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className={cn("flex flex-col", isIncognito ? "bg-[#1e1e1e]" : "bg-[#2e232f]")}>
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={setActiveTabId}
          onCloseTab={handleCloseTab}
          onAddTab={handleAddTab}
          isIncognito={isIncognito}
        />
        <NavigationBar
          activeTab={activeTab}
          onNavigate={handleNavigate}
          onGoBack={handleGoBack}
          onGoForward={handleGoForward}
          onReload={handleReload}
          onToggleAI={() => setIsAIPanelOpen(!isAIPanelOpen)}
          isAIPanelOpen={isAIPanelOpen}
          onAskAI={handleAskAI}
          isIncognito={isIncognito}
          onToggleIncognito={() => setIsIncognito(!isIncognito)}
          showDownloads={showDownloads}
          onToggleDownloads={() => {
            setShowDownloads(!showDownloads);
            setShowExtensions(false);
            setShowHistory(false);
          }}
          showExtensions={showExtensions}
          onToggleExtensions={() => {
            setShowExtensions(!showExtensions);
            setShowDownloads(false);
            setShowHistory(false);
          }}
          showHistory={showHistory}
          onToggleHistory={() => {
            setShowHistory(!showHistory);
            setShowDownloads(false);
            setShowExtensions(false);
          }}
          downloads={downloads}
          extensions={extensions}
          historyEntries={historyEntries}
          onToggleExtension={(id) => {
            setExtensions(extensions.map(ext => ext.id === id ? { ...ext, isEnabled: !ext.isEnabled } : ext));
          }}
          onClearHistory={() => setHistoryEntries([])}
          onClearDownloads={() => setDownloads([])}
        />
        <BookmarksBar onNavigate={handleNavigate} isIncognito={isIncognito} />
      </div>

      <div className={cn("flex flex-1 overflow-hidden relative", isIncognito ? "bg-[#121212]" : "bg-[#202124]")}>
        <div className="flex-1 h-full relative">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`absolute inset-0 ${tab.id === activeTabId ? 'block' : 'hidden'}`}
            >
              <BrowserContent
                tab={tab}
                onLoadComplete={() => handleLoadComplete(tab.id)}
                onNavigate={handleNavigate}
                onAskAI={handleAskAI}
                historyEntries={historyEntries}
                onClearHistoryEntry={(id) => setHistoryEntries(entries => entries.filter(e => e.id !== id))}
              />
            </div>
          ))}
        </div>

        <div className={cn("absolute sm:relative right-0 h-full w-full sm:w-[400px] border-l border-gray-200 bg-white flex-col shadow-xl z-20", isAIPanelOpen ? "flex" : "hidden")}>
          <AIPanel
            onClose={() => setIsAIPanelOpen(false)}
            currentUrl={activeTab.url}
            initialQuery={initialAIQuery}
            onClearInitialQuery={() => setInitialAIQuery('')}
          />
        </div>
      </div>
    </div>
  );
}
