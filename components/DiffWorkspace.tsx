
import React, { useState, useEffect, useMemo } from 'react';
import { DiffFile, DiffHunk } from '../types';
import DiffViewer from './DiffViewer';
import * as Diff from 'diff'; // Usando a biblioteca do importmap (diff@5.2.0)

interface DiffWorkspaceProps {
  diffContent: string;
  onAnalyze: (prompt: string) => void;
}

const DiffWorkspace: React.FC<DiffWorkspaceProps> = ({ diffContent, onAnalyze }) => {
  const [parsedFiles, setParsedFiles] = useState<DiffFile[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [isParsing, setIsParsing] = useState(false);

  // Parsing Effect
  useEffect(() => {
    if (!diffContent.trim()) {
        setParsedFiles([]);
        return;
    }

    setIsParsing(true);
    setTimeout(() => {
        try {
            // @ts-ignore - diff type definition might be incomplete in environment
            const patches = Diff.parsePatch(diffContent);
            
            const processed: DiffFile[] = patches.map((patch: any) => {
                let additions = 0;
                let deletions = 0;
                const hunks: DiffHunk[] = patch.hunks.map((h: any) => {
                    // Contagem simples
                    h.lines.forEach((l: string) => {
                        if (l.startsWith('+')) additions++;
                        if (l.startsWith('-')) deletions++;
                    });
                    
                    return {
                        oldStart: h.oldStart,
                        oldLines: h.oldLines,
                        newStart: h.newStart,
                        newLines: h.newLines,
                        lines: h.lines
                    };
                });

                return {
                    oldFileName: patch.oldFileName?.replace(/^a\//, '') || '',
                    newFileName: patch.newFileName?.replace(/^b\//, '') || '',
                    hunks,
                    type: patch.oldFileName === '/dev/null' ? 'add' : patch.newFileName === '/dev/null' ? 'delete' : 'modify',
                    additions,
                    deletions
                };
            });

            setParsedFiles(processed);
            if (processed.length > 0) setSelectedFileIndex(0);
        } catch (e) {
            console.error("Diff Parse Error", e);
        } finally {
            setIsParsing(false);
        }
    }, 100);
  }, [diffContent]);

  const selectedFile = parsedFiles[selectedFileIndex];

  const handleGlobalAnalysis = () => {
     onAnalyze(`Analise este Diff completo (Merge Request). Identifique os principais riscos, mudanças de arquitetura e sugira melhorias no código alterado.\n\nTotal de arquivos: ${parsedFiles.length}.`);
  };

  const handleGenerateDescription = () => {
    onAnalyze(`Gere uma descrição de Pull Request (Title, Summary, Changes, Testing Guide) em Markdown profissional baseada neste diff.`);
  };

  if (!diffContent.trim()) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-slate-400">Nenhum Diff Carregado</h3>
              <p className="text-sm">Cole o conteúdo de um 'git diff' na barra lateral.</p>
          </div>
      );
  }

  if (isParsing) {
      return (
        <div className="h-full flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-400">Processando Diff...</p>
        </div>
      );
  }

  return (
    <div className="h-full flex flex-col bg-[#0f1117]">
      {/* Toolbar Superior */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#13141c]">
         <div className="flex items-center gap-4">
             <h2 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Review Workspace
             </h2>
             <span className="text-[10px] text-slate-500 font-mono bg-white/5 px-2 py-0.5 rounded-full">
                {parsedFiles.length} Arquivo(s)
             </span>
         </div>

         <div className="flex items-center gap-3">
             <div className="bg-[#0f1117] p-0.5 rounded-lg border border-white/5 flex">
                <button onClick={() => setViewMode('split')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'split' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>Side-by-Side</button>
                <button onClick={() => setViewMode('unified')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'unified' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>Unified</button>
             </div>
             <div className="h-6 w-px bg-white/10 mx-2"></div>
             <button onClick={handleGenerateDescription} className="text-[10px] font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 transition-all">
                📝 Gerar PR Desc
             </button>
             <button onClick={handleGlobalAnalysis} className="text-[10px] font-bold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-all">
                🚀 Análise Global
             </button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
         {/* File Tree Lateral */}
         <div className="w-64 bg-[#13141c] border-r border-white/5 flex flex-col overflow-y-auto">
            {parsedFiles.map((file, idx) => (
                <button 
                  key={idx}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`text-left p-3 border-b border-white/5 flex items-center gap-3 transition-all hover:bg-white/5 ${selectedFileIndex === idx ? 'bg-[#1e1e24] border-l-2 border-l-indigo-500' : 'border-l-2 border-l-transparent'}`}
                >
                   <span className={`text-lg ${file.type === 'add' ? 'text-emerald-500' : file.type === 'delete' ? 'text-red-500' : 'text-blue-500'}`}>
                      {file.type === 'add' ? 'A' : file.type === 'delete' ? 'D' : 'M'}
                   </span>
                   <div className="min-w-0">
                      <p className={`text-[11px] font-mono truncate ${selectedFileIndex === idx ? 'text-white font-bold' : 'text-slate-400'}`}>
                         {file.newFileName === '/dev/null' ? file.oldFileName : file.newFileName}
                      </p>
                      <p className="text-[9px] text-slate-600 font-mono mt-0.5">
                         +{file.additions} / -{file.deletions}
                      </p>
                   </div>
                </button>
            ))}
         </div>

         {/* Área Principal de Diff */}
         <div className="flex-1 bg-[#0f1117] flex flex-col overflow-hidden relative">
            {selectedFile ? (
                <DiffViewer 
                  diffFile={selectedFile} 
                  viewMode={viewMode}
                  onAnalyze={onAnalyze}
                />
            ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs uppercase tracking-widest">
                   Selecione um arquivo
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default DiffWorkspace;
