
import React from 'react';
import { AppMode, OutputFormat, ProcessorStatus, FileInfo, ProjectSession } from '../types';
import { useTransition, animated, config } from 'react-spring';

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
  sessions: ProjectSession[];
  onSelectSession: (session: ProjectSession) => void;
  activeSessionId: string | null;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onNewProject: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  appMode, setAppMode, isProcessing, onSelectDirectory, 
  outputFormat, setOutputFormat, files, openFileExplorer, 
  stats, directoryName, diffContent, setDiffContent,
  sessions, onSelectSession, activeSessionId, onDeleteSession, onNewProject
}) => {

  const sessionTransitions = useTransition(sessions, {
    from: { opacity: 0, transform: 'translateX(-20px)', height: 0 },
    enter: { opacity: 1, transform: 'translateX(0px)', height: 60 },
    leave: { opacity: 0, transform: 'translateX(-20px)', height: 0 },
    keys: item => item.id,
    config: config.stiff
  });

  return (
    <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col p-5 space-y-6 overflow-hidden backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-lg italic shadow-lg shadow-indigo-600/30">U</div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight leading-none">Unifier Gemini 3</h1>
            <p className="text-slate-500 text-[8px] mt-1 uppercase tracking-widest font-black">Memory Enabled</p>
          </div>
        </div>
        <button onClick={onNewProject} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors" title="Novo Projeto">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      <div className="flex bg-slate-800 p-1 rounded-xl">
         <button onClick={() => setAppMode('project')} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${appMode === 'project' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Workspace</button>
         <button onClick={() => setAppMode('mr_analysis')} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${appMode === 'mr_analysis' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Diff Engine</button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 space-y-5">
        {appMode === 'project' ? (
          <>
            <div className="space-y-3">
              <button onClick={onSelectDirectory} disabled={isProcessing} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95">
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

            <div className="flex-1 flex flex-col min-h-0 space-y-4">
              {files.length > 0 && (
                <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-2xl p-4 flex flex-col gap-2">
                  <p className="text-[9px] font-black text-white uppercase tracking-widest">Ativo: {directoryName}</p>
                  <button onClick={openFileExplorer} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-700 transition-all active:scale-95">🔍 Gerenciar Contexto</button>
                </div>
              )}

              <div className="flex-1 flex flex-col min-h-0">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">Projetos Recentes</p>
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
                  {sessions.length === 0 ? (
                    <p className="text-[10px] text-slate-600 italic px-1">Nenhuma sessão salva.</p>
                  ) : (
                    sessionTransitions((style, s) => (
                      <animated.div style={style} className="mb-2 overflow-hidden">
                         <div 
                          onClick={() => onSelectSession(s)}
                          className={`h-[52px] group relative p-3 rounded-xl border transition-all cursor-pointer ${activeSessionId === s.id ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'}`}
                        >
                          <p className="text-[11px] font-bold text-slate-200 truncate pr-6">{s.name}</p>
                          <p className="text-[8px] text-slate-500 mt-1 uppercase font-black tracking-widest">
                            {new Date(s.lastUpdated).toLocaleDateString()}
                          </p>
                          <button 
                            onClick={(e) => onDeleteSession(s.id, e)}
                            className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all text-slate-500"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </animated.div>
                    ))
                  )}
                </div>
              </div>
            </div>
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
