import React, { useState } from 'react';
import { Tab, Download, Extension, HistoryEntry } from '../types';
import { TabBar } from './TabBar';
import { NavigationBar } from './NavigationBar';
import { BookmarksBar } from './BookmarksBar';
import { BrowserContent } from './BrowserContent';
import { AIPanel } from './AIPanel';
import { cn } from '../lib/utils';

export function Browser() {
  const [normalTabs, setNormalTabs] = useState<Tab[]>([
    { id: '1', title: 'New Tab', url: '', isLoading: false }
  ]);
  const [incognitoTabs, setIncognitoTabs] = useState<Tab[]>([
    { id: 'incognito-1', title: 'New Incognito Tab', url: '', isLoading: false }
  ]);
  const [activeNormalTabId, setActiveNormalTabId] = useState<string>('1');
  const [activeIncognitoTabId, setActiveIncognitoTabId] = useState<string>('incognito-1');
  
  const [isIncognito, setIsIncognito] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [initialAIQuery, setInitialAIQuery] = useState<string>('');

  const [downloads, setDownloads] = useState<Download[]>([
    { id: '1', filename: 'report_q3.pdf', progress: 100, status: 'completed' },
    { id: '2', filename: 'presentation.pptx', progress: 45, status: 'downloading' }
  ]);
  const [showDownloads, setShowDownloads] = useState(false);

  const [extensions, setExtensions] = useState<Extension[]>([
    { id: '1', name: 'AdBlocker Pro', icon: 'Shield', isEnabled: true },
    { id: '2', name: 'React Developer Tools', icon: 'Code', isEnabled: true },
    { id: '3', name: 'Grammar Checker', icon: 'CheckCircle', isEnabled: false }
  ]);
  const [showExtensions, setShowExtensions] = useState(false);

  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([
    { id: '1', url: 'https://google.com', title: 'Google', timestamp: Date.now() - 100000 },
    { id: '2', url: 'https://github.com', title: 'GitHub', timestamp: Date.now() - 500000 },
    { id: '3', url: 'https://react.dev', title: 'React', timestamp: Date.now() - 1000000 }
  ]);
  const [showHistory, setShowHistory] = useState(false);

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
      isLoading: false
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    
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

    setTabs(tabs.map(t => 
      t.id === activeTabId 
        ? { ...t, url: finalUrl, title: finalUrl === 'chrome://ai' ? 'AI Mode' : (finalUrl || 'New Tab'), isLoading: finalUrl !== '' && !finalUrl.startsWith('chrome://') } 
        : t
    ));

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

  const handleLoadComplete = (id: string) => {
    setTabs(tabs.map(t => 
      t.id === id ? { ...t, isLoading: false } : t
    ));
  };

  const handleAskAI = (query: string) => {
    setIsAIPanelOpen(true);
    setInitialAIQuery(query);
  };

  return (
    <div className={cn("flex flex-col h-screen w-full overflow-hidden font-sans", isIncognito ? "bg-[#121212]" : "bg-[#202124]")}>
      {/* Browser Chrome */}
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
        />
        <BookmarksBar onNavigate={handleNavigate} isIncognito={isIncognito} />
      </div>

      {/* Main Content Area */}
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
              />
            </div>
          ))}
        </div>
        
        {/* AI Side Panel */}
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
