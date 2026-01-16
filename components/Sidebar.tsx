
import React from 'react';
import { AppMode, OutputFormat, ProcessorStatus, FileInfo } from '../types';

interface SidebarProps {
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  isProcessing: boolean;
  onSelectDirectory: () => void;
  outputFormat: OutputFormat;
  setOutputFormat: (format: OutputFormat) => void;
  files: FileInfo[];
  openFileExplorer: () => void;
  stats: ProcessorStatus;
  directoryName: string | null;
  diffContent: string;
  setDiffContent: (content: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  appMode, setAppMode, isProcessing, onSelectDirectory, 
  outputFormat, setOutputFormat, files, openFileExplorer, 
  stats, directoryName, diffContent, setDiffContent 
}) => {
  return (
    <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col p-5 space-y-6 overflow-hidden">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-lg italic shadow-lg shadow-indigo-600/30">U</div>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">Unifier Gemini 3</h1>
          <p className="text-slate-500 text-[8px] mt-1 uppercase tracking-widest font-black">Refined Reasoning Engine</p>
        </div>
      </div>

      <div className="flex bg-slate-800 p-1 rounded-xl">
         <button onClick={() => setAppMode('project')} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${appMode === 'project' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Workspace</button>
         <button onClick={() => setAppMode('mr_analysis')} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${appMode === 'mr_analysis' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Diff Engine</button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 space-y-5">
        {appMode === 'project' ? (
          <>
            <div className="space-y-3">
              <button onClick={onSelectDirectory} disabled={isProcessing} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                {isProcessing ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>📂 Carregar Código</>}
              </button>
              
              <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/50">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Export Config</label>
                <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value as OutputFormat)} className="w-full mt-2 bg-slate-800/50 border border-slate-700 rounded-lg text-[10px] py-2 px-3 text-slate-300 outline-none font-bold">
                  <option value="markdown">Markdown (.md)</option>
                  <option value="json">JSON (.json)</option>
                  <option value="xml">XML (.xml)</option>
                </select>
              </div>
            </div>

            {files.length > 0 && (
              <div className="flex-1 flex flex-col min-h-0 bg-indigo-600/5 border border-indigo-500/10 rounded-2xl p-4 overflow-hidden">
                <p className="text-[9px] font-black text-white uppercase tracking-widest mb-1">Contexto</p>
                <p className="text-[10px] text-indigo-400 font-mono font-bold mb-4">{stats.text} / {files.length} arquivos</p>
                <button onClick={openFileExplorer} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-700">🔍 Navegar & Filtrar</button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col space-y-2 min-h-0">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Git Patch / Pull Request</label>
            <textarea value={diffContent} onChange={(e) => setDiffContent(e.target.value)} placeholder="Cole o diff git..." className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-[10px] font-mono text-indigo-300 focus:ring-2 focus:ring-indigo-600 outline-none resize-none" />
          </div>
        )}
      </div>

      {directoryName && (
        <div className="pt-4 border-t border-slate-800">
          <div className="bg-indigo-950/20 rounded-xl p-3 border border-indigo-500/10 flex justify-between items-center">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tokens Contexto</span>
            <span className="text-xs text-indigo-400 font-black">{stats.tokens.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
