import React from 'react';
import { cn } from '../lib/utils';

interface BookmarksBarProps {
  onNavigate: (url: string) => void;
  isIncognito?: boolean;
}

const BOOKMARKS = [
  { title: 'Google', url: 'https://www.google.com', icon: 'https://www.google.com/favicon.ico' },
  { title: 'YouTube', url: 'https://www.youtube.com', icon: 'https://www.youtube.com/favicon.ico' },
  { title: 'GitHub', url: 'https://github.com', icon: 'https://github.com/favicon.ico' },
  { title: 'Wikipedia', url: 'https://www.wikipedia.org', icon: 'https://www.wikipedia.org/favicon.ico' },
];

export function BookmarksBar({ onNavigate, isIncognito }: BookmarksBarProps) {
  return (
    <div className={cn("hidden sm:flex items-center gap-1 px-2 py-1 border-b h-8 overflow-x-auto scrollbar-hide", isIncognito ? "bg-[#1e1e1e] border-[#333]" : "bg-[#3b2f3c] border-[#4a3d4b]")}>
      {BOOKMARKS.map((bookmark) => (
        <button
          key={bookmark.title}
          onClick={() => onNavigate(bookmark.url)}
          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 transition-colors"
        >
          <img src={bookmark.icon} alt="" className="w-3.5 h-3.5" onError={(e) => e.currentTarget.style.display = 'none'} />
          <span className="text-xs text-gray-300">{bookmark.title}</span>
        </button>
      ))}
    </div>
  );
}
