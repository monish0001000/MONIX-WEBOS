export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isLoading: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  groundingChunks?: any[];
}

export interface Download {
  id: string;
  filename: string;
  progress: number;
  status: 'downloading' | 'completed' | 'failed';
}

export interface Extension {
  id: string;
  name: string;
  icon: string;
  isEnabled: boolean;
}

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  timestamp: number;
}
