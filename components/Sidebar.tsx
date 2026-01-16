
import React from 'react';
import { AppMode, OutputFormat, ProcessorStatus, FileInfo, ProjectSession, ChatSession } from '../types';
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
  closeSidebar: () => void;
  // Chat Props
  savedChats: ChatSession[];
  activeChatId: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  appMode, setAppMode, isProcessing, onSelectDirectory, 
  files, openFileExplorer, stats, directoryName, diffContent, setDiffContent,
  sessions, onSelectSession, activeSessionId, onDeleteSession, closeSidebar,
  savedChats, activeChatId, onNewChat, onSelectChat
}) => {

  const sessionTransitions = useTransition(sessions, {
    from: { opacity: 0, transform: 'translateX(-10px)', height: 0 },
    enter: { opacity: 1, transform: 'translateX(0px)', height: 50 },
    leave: { opacity: 0, transform: 'translateX(-10px)', height: 0 },
    keys: item => item.id,
    config: config.stiff
  });

  const chatTransitions = useTransition(savedChats, {
    from: { opacity: 0, transform: 'translateX(-10px)', height: 0 },
    enter: { opacity: 1, transform: 'translateX(0px)', height: 44 },
    leave: { opacity: 0, transform: 'translateX(-10px)', height: 0 },
    keys: item => item.id,
    config: config.stiff
  });

  return (
    <div className="flex flex-col h-full p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold italic shadow-lg shadow-indigo-500/20">U</div>
          <span className="font-bold text-sm tracking-tight text-slate-200">Unifier AI</span>
        </div>
        <button onClick={closeSidebar} className="p-1.5 text-slate-500 hover:text-white rounded-md hover:bg-white/5 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="bg-[#1e1e24] p-1 rounded-lg flex border border-white/5">
         <button onClick={() => setAppMode('project')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${appMode === 'project' ? 'bg-[#2d2e35] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>Workspace</button>
         <button onClick={() => setAppMode('mr_analysis')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${appMode === 'mr_analysis' ? 'bg-[#2d2e35] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>Diff</button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 space-y-6 overflow-y-auto scrollbar-hide pr-1">
        {appMode === 'project' ? (
          <>
            {/* Action Area */}
            <div className="space-y-3">
              {/* Botão de Nova Conversa (Só aparece se já tiver projeto) */}
              {files.length > 0 && (
                <button 
                  onClick={onNewChat}
                  className="w-full py-2.5 bg-white text-black hover:bg-slate-200 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>💬</span> Nova Conversa
                </button>
              )}

              {/* Botão de Abrir Pasta (Sempre aparece, mas com estilo diferente se for secundário) */}
              <button 
                onClick={onSelectDirectory} 
                disabled={isProcessing} 
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                  files.length === 0 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20 py-4' 
                  : 'bg-[#1e1e24] hover:bg-[#2d2e35] text-slate-300 border border-white/5'
                }`}
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>📂 {files.length === 0 ? 'Carregar Pasta' : 'Trocar Pasta'}</>
                )}
              </button>
            </div>

            {/* Current Chats List */}
            {files.length > 0 && (
              <div className="flex-1 min-h-0">
                <div className="flex items-center justify-between mb-2">
                   <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Conversas do Projeto</h4>
                </div>
                
                <div className="space-y-1">
                  {savedChats.length === 0 ? (
                    <p className="text-xs text-slate-600 italic pl-1">Inicie um chat...</p>
                  ) : (
                    chatTransitions((style, chat) => (
                      <animated.div style={style}>
                         <button
                          onClick={() => onSelectChat(chat.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all truncate flex items-center gap-2 ${
                            activeChatId === chat.id 
                              ? 'bg-[#2d2e35] text-white border-l-2 border-indigo-500' 
                              : 'text-slate-400 hover:bg-[#1e1e24] hover:text-slate-200'
                          }`}
                        >
                           <span className="opacity-50">💭</span>
                           <span className="truncate">{chat.title || 'Nova Conversa'}</span>
                        </button>
                      </animated.div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="w-full h-px bg-white/5 my-2"></div>

            {/* Project History List */}
            <div className="flex-1 min-h-0">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Projetos Recentes</h4>
              <div className="space-y-1">
                {sessions.length === 0 ? (
                    <p className="text-xs text-slate-600 italic">Histórico vazio.</p>
                  ) : (
                    sessionTransitions((style, s) => (
                      <animated.div style={style}>
                         <div 
                          onClick={() => onSelectSession(s)}
                          className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${activeSessionId === s.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-transparent border-transparent hover:bg-[#1e1e24] hover:border-white/5'}`}
                        >
                          <div className="flex justify-between items-start">
                             <p className={`text-xs font-medium truncate pr-4 ${activeSessionId === s.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{s.name}</p>
                          </div>
                          <p className="text-[9px] text-slate-600 mt-1 flex justify-between">
                            <span>{new Date(s.lastUpdated).toLocaleDateString()}</span>
                            <span>{s.files.length} arquivos</span>
                          </p>
                          <button 
                            onClick={(e) => onDeleteSession(s.id, e)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-md transition-all text-slate-500"
                            title="Apagar Projeto"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </animated.div>
                    ))
                  )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Git Diff Input</label>
            <textarea 
              value={diffContent} 
              onChange={(e) => setDiffContent(e.target.value)} 
              placeholder="Cole o resultado de 'git diff' aqui..." 
              className="flex-1 w-full bg-[#1e1e24] border border-white/5 rounded-xl p-4 text-[10px] font-mono text-indigo-300 focus:ring-1 focus:ring-indigo-500 outline-none resize-none placeholder:text-slate-700" 
            />
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-white/5 text-[9px] text-slate-600 flex justify-between uppercase font-bold tracking-widest">
        <span>v3.2</span>
        <span>Gemini Pro</span>
      </div>
    </div>
  );
};

export default Sidebar;
