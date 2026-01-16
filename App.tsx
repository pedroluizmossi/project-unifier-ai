
import React, { useState, useMemo, useRef } from 'react';
import { ProcessorStatus, FileInfo, OutputFormat, AppMode } from './types';
import { 
  collectFileHandles, 
  processFile, 
  processFileList,
  generateOutput, 
  calculateTokens,
  formatBytes 
} from './lib/utils';
import { DEFAULT_IGNORE } from './constants';
import AIAnalysisPanel from './components/AIAnalysisPanel';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('project');
  const [isProcessing, setIsProcessing] = useState(false);
  const [directoryName, setDirectoryName] = useState<string | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('markdown');
  const [showAI, setShowAI] = useState(false);
  const [maxFileSize, setMaxFileSize] = useState(500);
  const [diffContent, setDiffContent] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo<ProcessorStatus>(() => {
    const textFiles = files.filter(f => f.type === 'text_file');
    const content = generateOutput(directoryName || 'Project', files, outputFormat);
    return {
      text: textFiles.length,
      binary: files.filter(f => f.type === 'binary_file').length,
      large: files.filter(f => f.type === 'large_file').length,
      tokens: calculateTokens(content),
      files: files.map(f => ({ name: f.path, size: Math.round(f.size_kb * 1024) }))
    };
  }, [files, directoryName, outputFormat]);

  const outputContent = useMemo(() => {
    return generateOutput(directoryName || 'Project', files, outputFormat);
  }, [files, directoryName, outputFormat]);

  const handleSelectDirectory = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const handle = await (window as any).showDirectoryPicker();
        setIsProcessing(true);
        setDirectoryName(handle.name);
        const handles = await collectFileHandles(handle, DEFAULT_IGNORE);
        const results = await Promise.all(handles.map(h => processFile(h.handle, h.path, maxFileSize)));
        setFiles(results.filter((f): f is FileInfo => f !== null));
      } catch (err: any) {
        if (err.name !== 'AbortError') fileInputRef.current?.click();
      } finally {
        setIsProcessing(false);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleLegacyFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setIsProcessing(true);
    const firstPath = fileList[0].webkitRelativePath;
    setDirectoryName(firstPath ? firstPath.split('/')[0] : 'Project');
    try {
      const results = await processFileList(fileList, DEFAULT_IGNORE, maxFileSize);
      setFiles(results);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleDownload = () => {
    const blob = new Blob([outputContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${directoryName || 'project'}_unified.${outputFormat === 'markdown' ? 'md' : outputFormat === 'json' ? 'json' : 'xml'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <input type="file" ref={fileInputRef} onChange={handleLegacyFileChange} className="hidden" {...({ webkitdirectory: "", directory: "" } as any)} />

      {/* Sidebar */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col p-6 space-y-6 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-sm italic shadow-lg shadow-indigo-500/20">U</span>
            Unifier AI
          </h1>
          <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest font-bold">Code Change Intelligence</p>
        </div>

        <div className="flex bg-slate-800 p-1 rounded-xl">
           <button onClick={() => setAppMode('project')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${appMode === 'project' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Project Scan</button>
           <button onClick={() => setAppMode('mr_analysis')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${appMode === 'mr_analysis' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>MR Analysis</button>
        </div>

        <div className="space-y-4">
          {appMode === 'project' ? (
            <div className="space-y-4">
              <button onClick={handleSelectDirectory} disabled={isProcessing} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-500/20">
                {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>📁 Carregar Projeto</>}
              </button>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Formato</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-lg">
                  {['markdown', 'json', 'xml'].map(fmt => (
                    <button key={fmt} onClick={() => setOutputFormat(fmt as OutputFormat)} className={`py-1.5 text-[10px] font-bold rounded capitalize ${outputFormat === fmt ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>{fmt}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Limite: {maxFileSize}KB</label>
                <input type="range" min="10" max="5000" step="10" value={maxFileSize} onChange={(e) => setMaxFileSize(parseInt(e.target.value))} className="w-full accent-indigo-600" />
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-left duration-200">
               <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Cole seu Diff / Patch</label>
                  <textarea 
                    value={diffContent}
                    onChange={(e) => setDiffContent(e.target.value)}
                    placeholder="Paste output from 'git diff' or a .patch file here..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-indigo-300 h-64 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-[9px] text-slate-500">O diff será analisado contra o projeto carregado.</p>
               </div>
            </div>
          )}
        </div>

        {directoryName && (
          <div className="mt-auto pt-4 border-t border-slate-800 space-y-2">
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 text-[10px]">
              <div className="flex justify-between mb-1"><span className="text-slate-500">Tokens:</span><span className="text-indigo-400 font-bold">{stats.tokens.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Arquivos:</span><span className="text-slate-300">{stats.text}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${showAI ? 'mr-[500px]' : ''}`}>
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {appMode === 'project' ? 'Contexto do Projeto' : 'Análise de Diferencial'}
          </h2>
          
          <div className="flex items-center gap-3">
             <button
              onClick={() => setShowAI(!showAI)}
              disabled={!files.length}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border-2 disabled:opacity-30 ${showAI ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/10'}`}
            >
              <span>✨</span> {showAI ? 'Ocultar Análise' : 'Deep Analysis'}
            </button>
            <button onClick={handleDownload} disabled={!files.length} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-900 rounded-lg text-xs font-bold hover:bg-white transition-colors disabled:opacity-30">
              📁 Exportar Contexto
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-950 p-8">
          {files.length > 0 ? (
            <div className="max-w-4xl mx-auto space-y-8">
              {appMode === 'mr_analysis' && diffContent && (
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-indigo-300 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    Diff Ativo para Análise
                  </h3>
                  <pre className="text-[10px] font-mono text-indigo-200/70 overflow-x-auto bg-black/30 p-4 rounded-xl max-h-40">
                    {diffContent}
                  </pre>
                </div>
              )}
              
              <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
                <div className="bg-slate-800/50 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">project_context.{outputFormat}</span>
                </div>
                <pre className="p-6 text-[11px] font-mono text-slate-400 whitespace-pre-wrap leading-relaxed max-h-[1200px] overflow-y-auto">
                  {outputContent}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-center opacity-40">
              <div className="text-6xl">📂</div>
              <p className="text-sm text-slate-400 max-w-xs">Carregue um projeto local para habilitar as funções de IA e revisão de código.</p>
            </div>
          )}
        </div>
      </div>

      {showAI && (
        <div className="fixed top-0 right-0 w-[500px] h-full z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
          <AIAnalysisPanel 
            context={outputContent} 
            diffContext={appMode === 'mr_analysis' ? diffContent : undefined}
            onClose={() => setShowAI(false)} 
          />
        </div>
      )}
    </div>
  );
};

export default App;
