import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, Mic, Camera, Plus, Settings, Grid, Menu, Edit, History, Trash2, Clock, X } from 'lucide-react';
import { Tab, HistoryEntry } from './types';
import { cn } from '@/lib/utils';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface BrowserContentProps {
  tab: Tab;
  onLoadComplete: () => void;
  onNavigate: (url: string) => void;
  onAskAI: (query: string) => void;
  historyEntries?: HistoryEntry[];
  onClearHistoryEntry?: (id: string) => void;
}

export function BrowserContent({ tab, onLoadComplete, onNavigate, onAskAI, historyEntries = [], onClearHistoryEntry }: BrowserContentProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAIMode = tab.url === 'chrome://ai';
  const isSearchMode = !tab.url || tab.url === 'chrome://newtab';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleAskAIInternal = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setQuery('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: text,
      });

      if (response.text) {
        setMessages([...newMessages, { role: 'model', text: response.text }]);
      }
    } catch (error) {
      console.error("Error generating AI response:", error);
      setMessages([...newMessages, { role: 'model', text: "Sorry, I encountered an error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSearchMode || isAIMode) {
    if (isSearchMode) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full relative bg-black"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute top-4 right-4 flex items-center gap-4">
            <a href="#" className="text-white text-sm hover:underline">Gmail</a>
            <a href="#" className="text-white text-sm hover:underline">Images</a>
            <button className="p-2 hover:bg-white/10 rounded-full text-white">
              <Grid className="w-5 h-5" />
            </button>
            <button className="w-8 h-8 bg-purple-600 rounded-full text-white flex items-center justify-center text-sm">
              R
            </button>
          </div>

          <div className="mb-8">
            <span className="text-[60px] sm:text-[90px] font-medium text-white tracking-tighter">Google</span>
          </div>

          <div className="w-full max-w-[600px] px-4 sm:px-0 relative flex items-center">
            <div className="w-full relative flex items-center bg-white rounded-full p-1.5 pl-4 shadow-lg">
              <Search className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-base text-gray-800 min-w-0"
                placeholder="Search Google or type a URL"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onNavigate(query);
                  }
                }}
              />
              <div className="flex items-center gap-1 sm:gap-3 pr-2 shrink-0">
                <Mic className="hidden sm:block h-5 w-5 text-gray-600 cursor-pointer hover:text-blue-500" />
                <Camera className="hidden sm:block h-5 w-5 text-gray-600 cursor-pointer hover:text-blue-500" />
                <button
                  onClick={() => onNavigate('chrome://ai')}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors ml-1"
                >
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">AI Mode</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-2">
            <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors">
              <Plus className="w-5 h-5 text-white" />
            </button>
            <span className="text-white text-sm">Add shortcut</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full bg-[#202124] text-gray-200 font-sans">
        <div className="hidden sm:flex w-16 flex-col items-center py-4 border-r border-[#3c4043] gap-6">
          <button className="p-2 hover:bg-[#3c4043] rounded-full transition-colors">
            <Menu className="w-6 h-6 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-[#3c4043] rounded-full transition-colors">
            <Edit className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#3c4043] overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-4 sm:gap-8 shrink-0">
              <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => onNavigate('')} title="Back to Search">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <div className="flex items-center gap-4 sm:gap-6 text-sm shrink-0">
                <button className="text-white font-medium border-b-2 border-white pb-1 whitespace-nowrap">AI Mode</button>
                <button className="text-gray-400 hover:text-gray-200 pb-1">All</button>
                <button className="text-gray-400 hover:text-gray-200 pb-1">Images</button>
                <button className="hidden sm:block text-gray-400 hover:text-gray-200 pb-1">Videos</button>
                <button className="hidden sm:block text-gray-400 hover:text-gray-200 pb-1">News</button>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-4">
              <button className="hidden sm:block p-2 hover:bg-[#3c4043] rounded-full transition-colors">
                <Settings className="w-5 h-5 text-gray-400" />
              </button>
              <button className="hidden sm:block p-2 hover:bg-[#3c4043] rounded-full transition-colors">
                <Grid className="w-5 h-5 text-gray-400" />
              </button>
              <button className="px-4 sm:px-6 py-1.5 sm:py-2 bg-[#8ab4f8] hover:bg-[#9bbff9] text-gray-900 font-medium rounded-full text-sm transition-colors whitespace-nowrap">
                Sign in
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col relative overflow-hidden">
            <div className="flex-1 overflow-y-auto flex flex-col items-center pt-10 px-4 pb-40">
              {messages.length === 0 ? (
                <>
                  <h1 className="text-2xl sm:text-4xl font-medium text-white mb-6 sm:mb-10 text-center">
                    What's on your mind?
                  </h1>

                  <div className="w-full max-w-[700px] rounded-2xl p-[1px] bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] shadow-[0_0_15px_rgba(66,133,244,0.1)]">
                    <div className="bg-[#1e1f22] rounded-[15px] flex flex-col focus-within:bg-[#28292c] transition-colors">
                      <div className="p-4 pb-0 relative">
                        <textarea
                          value={query}
                          onChange={(e) => {
                            setQuery(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          placeholder="Ask anything"
                          className="w-full bg-transparent outline-none text-gray-200 resize-none placeholder-gray-400 text-lg overflow-hidden"
                          rows={1}
                          style={{ minHeight: '28px', maxHeight: '200px' }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAskAIInternal(query);
                              e.currentTarget.style.height = 'auto';
                            }
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 pt-0">
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                          <Plus className="w-5 h-5 text-gray-400" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                          <Mic className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full max-w-[700px] flex flex-col gap-6">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-[#3c4043] text-white' : 'bg-transparent text-gray-200'}`}>
                        {msg.role === 'model' ? (
                          <div className="markdown-body prose prose-invert max-w-none">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl p-4 bg-transparent text-gray-400 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 animate-pulse text-blue-400" />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {messages.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#202124] via-[#202124] to-transparent pt-10 pb-6 px-4 flex justify-center">
                <div className="w-full max-w-[700px] rounded-2xl p-[1px] bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] shadow-[0_0_15px_rgba(66,133,244,0.1)]">
                  <div className="bg-[#1e1f22] rounded-[15px] flex flex-col focus-within:bg-[#28292c] transition-colors">
                    <div className="p-3 pb-0 relative">
                      <textarea
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        placeholder="Ask a follow up"
                        className="w-full bg-transparent outline-none text-gray-200 resize-none placeholder-gray-400 text-base overflow-hidden"
                        rows={1}
                        style={{ minHeight: '24px', maxHeight: '200px' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAskAIInternal(query);
                            e.currentTarget.style.height = 'auto';
                          }
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 pt-0">
                      <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                        <Plus className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                        <Mic className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (tab.url === 'chrome://history') {
    return (
      <div className="w-full h-full bg-[#202124] overflow-y-auto pt-6 px-10 text-gray-200">
        <div className="max-w-4xl mx-auto flex gap-8">
          <div className="w-48 shrink-0 flex flex-col gap-2">
            <h2 className="text-2xl font-normal mb-4">History</h2>
            <button className="flex items-center gap-4 text-blue-400 bg-blue-400/10 px-4 py-2 rounded-full font-medium">
              <History className="w-5 h-5" /> History
            </button>
            <button className="flex items-center gap-4 text-gray-400 hover:bg-white/5 px-4 py-2 rounded-full font-medium transition-colors">
              <Trash2 className="w-5 h-5" /> Clear browsing data
            </button>
          </div>
          
          <div className="flex-1 bg-[#292a2d] rounded-lg shadow-sm border border-white/10 p-6">
            <div className="flex bg-[#202124] rounded-full px-4 py-2 items-center border border-transparent focus-within:bg-[#202124] focus-within:border-blue-400 focus-within:shadow-[0_0_0_1px_#8ab4f8] mb-6">
              <Search className="w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search history" className="bg-transparent border-none outline-none w-full px-3 text-gray-200 placeholder-gray-400" />
            </div>

            {historyEntries.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                Your browsing history appears here
              </div>
            ) : (
              <div className="flex flex-col">
                {historyEntries.slice().reverse().map(entry => (
                  <div key={entry.id} className="flex items-center group py-2 px-2 hover:bg-[#323639] rounded transition-colors">
                    <div className="w-20 text-xs text-gray-400 shrink-0">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="w-5 h-5 flex items-center justify-center shrink-0 mr-4">
                       <Clock className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex flex-col flex-1 truncate pr-4">
                      <span className="text-sm font-medium text-gray-200 truncate cursor-pointer hover:underline" onClick={() => onNavigate(entry.url)}>
                        {entry.title || entry.url}
                      </span>
                      <span className="text-xs text-blue-400 truncate cursor-pointer hover:underline" onClick={() => onNavigate(entry.url)}>
                        {entry.url}
                      </span>
                    </div>
                    <button 
                      onClick={() => onClearHistoryEntry?.(entry.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-full transition-all shrink-0"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <iframe
      key={tab.reloadKey || 0}
      src={tab.url}
      className="w-full h-full border-none bg-white"
      onLoad={onLoadComplete}
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      title={tab.title}
    />
  );
}
