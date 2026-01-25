
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

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64 string
}

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
  useSearch: boolean;
}

export interface SystemPrompts {
  systemPersona: string;
  mergeLogic: string;
  blueprintLogic: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  attachments?: Attachment[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface SavedResponse {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

export interface ProjectSession {
  id: string;
  name: string;
  files: FileInfo[];
  summary: string;
  specification?: string;
  chats: ChatSession[];
  favorites?: SavedResponse[];
  lastUpdated: number;
  outputFormat: OutputFormat;
}

export interface PendingChange {
  path: string;
  originalContent: string;
  newContent: string;
}
