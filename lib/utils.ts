
import { FileInfo, OutputFormat } from '../types';

export const calculateTokens = (text: string) => Math.ceil(text.length / 4);

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
};

export const collectFileHandles = async (
  dirHandle: FileSystemDirectoryHandle, 
  patterns: string[]
): Promise<{handle: FileSystemFileHandle, path: string}[]> => {
    const fileHandles: {handle: FileSystemFileHandle, path: string}[] = [];
    const recurse = async (currentHandle: FileSystemDirectoryHandle, currentPath: string) => {
        for await (const entry of currentHandle.values()) {
            const relativePath = `${currentPath}${entry.name}`;
            const isIgnored = patterns.some(p => relativePath.includes(p));
            if (isIgnored) continue;
            
            if (entry.kind === 'file') {
                fileHandles.push({ handle: entry as FileSystemFileHandle, path: relativePath });
            } else if (entry.kind === 'directory') {
                await recurse(entry as FileSystemDirectoryHandle, `${relativePath}/`);
            }
        }
    };
    await recurse(dirHandle, '');
    return fileHandles;
};

export const processFile = async (
  fileHandle: FileSystemFileHandle | File, 
  path: string, 
  maxSize: number
): Promise<FileInfo | null> => {
  try {
    const file = fileHandle instanceof File ? fileHandle : await (fileHandle as FileSystemFileHandle).getFile();
    
    if (file.size > maxSize * 1024) {
      return { path, size_kb: file.size / 1024, type: 'large_file', selected: false };
    }
    
    try {
      const content = await file.text();
      return {
        path,
        size_kb: file.size / 1024,
        type: 'text_file',
        content,
        line_count: content.split('\n').length,
        language: path.split('.').pop() || 'text',
        selected: true 
      };
    } catch {
      return { path, size_kb: file.size / 1024, type: 'binary_file', selected: false };
    }
  } catch (e) {
    return null;
  }
};

export const processFileList = async (
  fileList: FileList,
  patterns: string[],
  maxSize: number
): Promise<FileInfo[]> => {
  const results: FileInfo[] = [];
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const path = file.webkitRelativePath || file.name;
    
    const isIgnored = patterns.some(p => path.includes(p));
    if (isIgnored) continue;

    const processed = await processFile(file, path, maxSize);
    if (processed) results.push(processed);
  }
  return results;
};

export const generateOutput = (
  projectName: string, 
  files: FileInfo[], 
  format: OutputFormat
): string => {
  const selectedFiles = files.filter(f => f.selected && f.type === 'text_file');

  if (format === 'markdown') {
    let md = `# Project: ${projectName}\n\n`;
    selectedFiles.forEach(f => {
      md += `## File: ${f.path}\n\`\`\`${f.language}\n${f.content}\n\`\`\`\n\n`;
    });
    return md;
  }
  
  if (format === 'json') {
    return JSON.stringify({ projectName, files: selectedFiles, timestamp: new Date().toISOString() }, null, 2);
  }

  if (format === 'xml') {
     let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<project name="${projectName}">\n`;
     selectedFiles.forEach(f => {
        xml += `  <file path="${f.path}">\n    <![CDATA[${f.content}]]>\n  </file>\n`;
     });
     xml += `</project>`;
     return xml;
  }

  return "";
};

// --- Árvore de Arquivos ---
export interface FileNode {
  name: string;
  path: string;
  kind: 'file' | 'directory';
  children?: FileNode[];
  fileInfo?: FileInfo;
}

export const buildFileTree = (files: FileInfo[]): FileNode[] => {
  const root: FileNode[] = [];
  
  files.forEach(file => {
    const parts = file.path.split('/');
    let currentLevel = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath += (index > 0 ? '/' : '') + part;
      const isLast = index === parts.length - 1;
      
      let node = currentLevel.find(n => n.name === part);
      
      if (!node) {
        node = {
          name: part,
          path: currentPath,
          kind: isLast ? 'file' : 'directory',
          children: isLast ? undefined : [],
          fileInfo: isLast ? file : undefined
        };
        currentLevel.push(node);
      }
      
      if (node.children) {
        currentLevel = node.children;
      }
    });
  });

  // Ordenar: Diretórios primeiro, depois arquivos
  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(n => n.children && sortNodes(n.children));
  };
  
  sortNodes(root);
  return root;
};
