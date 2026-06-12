import React from 'react';
import { Plus, X, Sparkles } from 'lucide-react';
import { Tab } from '../types';
import { cn } from '../lib/utils';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onCloseTab: (id: string, e: React.MouseEvent) => void;
  onAddTab: () => void;
  isIncognito?: boolean;
}

export function TabBar({ tabs, activeTabId, onTabClick, onCloseTab, onAddTab, isIncognito }: TabBarProps) {
  return (
    <div className={cn("flex items-end h-10 px-2 pt-2 gap-1 relative overflow-x-auto scrollbar-hide", isIncognito ? "bg-[#1e1e1e]" : "bg-[#2e232f]")}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => onTabClick(tab.id)}
            className={cn(
              "group relative flex items-center h-[34px] min-w-[120px] sm:min-w-[160px] max-w-[240px] px-3 rounded-t-lg cursor-default select-none transition-colors shrink-0",
              isActive ? (isIncognito ? "bg-[#121212] z-10" : "bg-[#3b2f3c] z-10") : "bg-transparent hover:bg-white/10"
            )}
          >
            {/* Left border separator for inactive tabs */}
            {!isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[1px] h-4 bg-white/20 group-hover:bg-transparent" />
            )}
            
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
              {tab.isLoading ? (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
              ) : tab.favicon ? (
                <img src={tab.favicon} alt="" className="w-4 h-4 shrink-0" />
              ) : (
                <div className="w-4 h-4 bg-white/20 rounded-full shrink-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white/40 rounded-full" />
                </div>
              )}
              <span className={cn("text-xs truncate flex-1", isActive ? "text-white" : "text-gray-300")}>
                {tab.title || 'New Tab'}
              </span>
            </div>
            
            <button
              onClick={(e) => onCloseTab(tab.id, e)}
              className={cn(
                "p-1 rounded-full hover:bg-white/20 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                isActive && "opacity-100"
              )}
            >
              <X className="w-3 h-3 text-gray-300" />
            </button>
            
            {/* Bottom corner curves for active tab */}
            {isActive && (
              <>
                <div className="absolute -left-2 bottom-0 w-2 h-2">
                  <div className={cn("absolute inset-0", isIncognito ? "bg-[#1e1e1e]" : "bg-[#2e232f]")} />
                  <div className={cn("absolute inset-0 rounded-br-lg", isIncognito ? "bg-[#121212]" : "bg-[#3b2f3c]")} />
                </div>
                <div className="absolute -right-2 bottom-0 w-2 h-2">
                  <div className={cn("absolute inset-0", isIncognito ? "bg-[#1e1e1e]" : "bg-[#2e232f]")} />
                  <div className={cn("absolute inset-0 rounded-bl-lg", isIncognito ? "bg-[#121212]" : "bg-[#3b2f3c]")} />
                </div>
              </>
            )}
          </div>
        );
      })}
      
      <button
        onClick={onAddTab}
        className="p-1.5 ml-1 rounded-full hover:bg-white/10 transition-colors shrink-0"
      >
        <Plus className="w-4 h-4 text-gray-300" />
      </button>

      <div className="absolute right-2 top-1.5 hidden sm:flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/10">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-medium text-white">Ask Gemini</span>
        </button>
      </div>
    </div>
  );
}
