
export type AnalysisTemplate = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: string;
};

export type FileInfo = {
  path: string;
  size_kb: number;
  type: 'text_file' | 'binary_file' | 'large_file';
  content?: string;
  line_count?: number;
  language?: string;
  sha256?: string;
  selected?: boolean;
};

export interface ProcessorStatus {
  text: number;
  binary: number;
  large: number;
  tokens: number;
  files: { name: string; size: number }[];
}

export type OutputFormat = 'markdown' | 'json' | 'xml';
export type AppMode = 'project' | 'mr_analysis';

export interface GeminiConfig {
  model: 'gemini-3-pro-preview' | 'gemini-3-flash-preview';
  useThinking: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ProjectSession {
  id: string;
  name: string;
  files: FileInfo[];
  summary: string;
  
  // Legacy support (para migração)
  chatHistory?: ChatMessage[];
  
  // New support
  chats: ChatSession[];
  
  lastUpdated: number;
  outputFormat: OutputFormat;
}
