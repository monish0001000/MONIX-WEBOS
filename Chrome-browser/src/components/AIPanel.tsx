import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Image as ImageIcon, MapPin, Search, Globe, Loader2, MessageSquare, Plus, History, Mic } from 'lucide-react';
import Markdown from 'react-markdown';
import { Message } from '../types';
import { generateChatResponse, ChatOptions } from '../services/geminiService';
import { cn } from '../lib/utils';

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

interface AIPanelProps {
  onClose: () => void;
  currentUrl: string;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

export function AIPanel({ onClose, currentUrl, initialQuery, onClearInitialQuery }: AIPanelProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'default',
      title: 'New Conversation',
      messages: [
        { id: '1', role: 'model', text: 'Hi! I am your Gemini AI assistant. How can I help you today?' }
      ],
      updatedAt: Date.now()
    }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('default');
  const [showHistory, setShowHistory] = useState(false);
  
  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];
  const messages = currentSession.messages;

  const updateCurrentSession = (newMessages: Message[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        // Auto-generate title from first user message if it's still "New Conversation"
        let newTitle = s.title;
        if (s.title === 'New Conversation' && newMessages.length > 1) {
          const firstUserMsg = newMessages.find(m => m.role === 'user');
          if (firstUserMsg) {
            newTitle = firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
          }
        }
        return { ...s, title: newTitle, messages: newMessages, updatedAt: Date.now() };
      }
      return s;
    }));
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [
        { id: '1', role: 'model', text: 'Hi! I am your Gemini AI assistant. How can I help you today?' }
      ],
      updatedAt: Date.now()
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
    setShowHistory(false);
  };

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [useUrlContext, setUseUrlContext] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{data: string, mimeType: string} | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        setInput(transcript);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setInput('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage({
        data: reader.result as string,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const submitQuery = async (text: string, img?: {data: string, mimeType: string}) => {
    if ((!text.trim() && !img) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      image: img?.data
    };

    const newMessages = [...messages, userMessage];
    updateCurrentSession(newMessages);
    setIsLoading(true);

    try {
      const history = newMessages.map(m => ({ role: m.role, text: m.text }));
      
      const options: ChatOptions = {
        useSearch,
        useMaps,
        useUrlContext,
        currentUrl,
        image: img || undefined
      };

      const response = await generateChatResponse(text, history, options);

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        groundingChunks: response.groundingChunks
      };

      updateCurrentSession([...newMessages, modelMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'Sorry, I encountered an error while processing your request.'
      };
      updateCurrentSession([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      submitQuery(initialQuery);
      onClearInitialQuery?.();
    }
  }, [initialQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentInput = input;
    const currentImg = selectedImage;
    setInput('');
    setSelectedImage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    await submitQuery(currentInput, currentImg || undefined);
  };

  const filteredSessions = sessions.filter(session => {
    if (!historySearchQuery.trim()) return true;
    const query = historySearchQuery.toLowerCase();
    if (session.title.toLowerCase().includes(query)) return true;
    return session.messages.some(msg => msg.text.toLowerCase().includes(query));
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => b.updatedAt - a.updatedAt);
  
  const groupedSessions = sortedSessions.reduce((acc, session) => {
    const date = new Date(session.updatedAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let group = 'Older';
    if (date.toDateString() === today.toDateString()) {
      group = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = 'Yesterday';
    } else if (today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      group = 'Previous 7 Days';
    }
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(session);
    return acc;
  }, {} as Record<string, ChatSession[]>);

  const groupOrder = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-blue-50/50">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-1.5 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
            title="Chat History"
          >
            <History className="w-4 h-4" />
          </button>
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <SparklesIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="font-medium text-gray-800">Gemini Assistant</h2>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={createNewSession}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
            title="New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showHistory ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
          <div className="p-3 border-b border-gray-200 shrink-0">
            <div className="flex items-center bg-white rounded-md px-3 py-1.5 border border-gray-200 focus-within:border-blue-500 transition-colors">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Search history..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-6">
              {groupOrder.map(group => {
                const groupSessions = groupedSessions[group];
                if (!groupSessions || groupSessions.length === 0) return null;
                
                return (
                  <div key={group} className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">{group}</h3>
                    <div className="space-y-1">
                      {groupSessions.map(session => (
                        <button
                          key={session.id}
                          onClick={() => {
                            setCurrentSessionId(session.id);
                            setShowHistory(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200",
                            session.id === currentSessionId 
                              ? "bg-blue-100 text-blue-800 shadow-sm ring-1 ring-blue-200" 
                              : "hover:bg-white hover:shadow-sm text-gray-700 border border-transparent hover:border-gray-200"
                          )}
                        >
                          <MessageSquare className={cn("w-4 h-4 shrink-0", session.id === currentSessionId ? "text-blue-600" : "text-gray-400")} />
                          <span className="text-sm truncate font-medium flex-1">{session.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {filteredSessions.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-4">
                  No conversations found.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
            <div 
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5",
                msg.role === 'user' 
                  ? "bg-blue-600 text-white rounded-tr-sm" 
                  : "bg-gray-100 text-gray-800 rounded-tl-sm"
              )}
            >
              {msg.image && (
                <img src={msg.image} alt="Uploaded" className="max-w-full rounded-lg mb-2 max-h-48 object-contain" />
              )}
              {msg.role === 'model' ? (
                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-gray-100">
                  <Markdown>{msg.text}</Markdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
              )}
            </div>
            
            {/* Grounding Sources */}
            {msg.groundingChunks && msg.groundingChunks.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 max-w-[85%]">
                {msg.groundingChunks.map((chunk, idx) => {
                  if (chunk.web?.uri) {
                    return (
                      <a 
                        key={idx} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        <Globe className="w-3 h-3 text-blue-500" />
                        <span className="truncate max-w-[150px]">{chunk.web.title || new URL(chunk.web.uri).hostname}</span>
                      </a>
                    );
                  }
                  if (chunk.maps?.uri) {
                    return (
                      <a 
                        key={idx} 
                        href={chunk.maps.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        <MapPin className="w-3 h-3 text-green-500" />
                        <span className="truncate max-w-[150px]">{chunk.maps.title || 'View on Maps'}</span>
                      </a>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start">
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm text-gray-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-gray-200 bg-white">
        {/* Toggles */}
        <div className="flex items-center gap-2 mb-3 px-1 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => { setUseSearch(!useSearch); setUseMaps(false); }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap border",
              useSearch ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            )}
          >
            <Search className="w-3 h-3" />
            Search
          </button>
          <button
            onClick={() => { setUseMaps(!useMaps); setUseSearch(false); }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap border",
              useMaps ? "bg-green-50 text-green-700 border-green-200" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            )}
          >
            <MapPin className="w-3 h-3" />
            Maps
          </button>
          <button
            onClick={() => setUseUrlContext(!useUrlContext)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap border",
              useUrlContext ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            )}
          >
            <Globe className="w-3 h-3" />
            Page Context
          </button>
        </div>

        {selectedImage && (
          <div className="relative inline-block mb-2 ml-1">
            <img src={selectedImage.data} alt="Preview" className="h-16 rounded-md border border-gray-200 object-cover" />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm border border-gray-200 hover:bg-gray-100"
            >
              <X className="w-3 h-3 text-gray-600" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 p-1 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors shrink-0"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={isListening ? "Listening..." : "Ask Gemini..."}
            className="flex-1 max-h-32 min-h-[20px] py-2.5 bg-transparent outline-none resize-none text-sm text-gray-800 placeholder-gray-500 overflow-y-auto scrollbar-thin transition-all duration-200"
            rows={1}
          />
          
          <button
            type="button"
            onClick={toggleListening}
            className={cn(
              "p-2.5 rounded-full transition-colors shrink-0 mb-0.5",
              isListening ? "bg-red-100 text-red-600 animate-pulse" : "hover:bg-gray-200 text-gray-500"
            )}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            type="submit"
            disabled={(!input.trim() && !selectedImage) || isLoading}
            className="p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white transition-colors shrink-0 mb-0.5 mr-0.5"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="text-center mt-2">
          <span className="text-[10px] text-gray-400">Gemini may display inaccurate info, so double-check its responses.</span>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
