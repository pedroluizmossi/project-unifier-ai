
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
