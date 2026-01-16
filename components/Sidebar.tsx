
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
              {files.length === 0 ? (
                <button 
                  onClick={onSelectDirectory}
                  disabled={isProcessing}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all shadow-xl shadow-indigo-600/20 flex flex-col items-center gap-2"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="text-xl">📁</span>
                      Abrir Projeto Local
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button 
                    onClick={onNewChat}
                    className="w-full py-3 bg-white text-black hover:bg-slate-200 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>💬</span> Nova Conversa
                  </button>
                  
                  <button 
                    onClick={openFileExplorer}
                    className="w-full py-2.5 bg-[#1e1e24] hover:bg-[#2d2e35] text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/5"
                  >
                    <span>🔍</span> Gerenciar Workspace ({stats.text})
                  </button>
                </>
              )}
            </div>

            {/* Chats Recentes */}
            {savedChats.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Conversas</h3>
                <div className="space-y-1">
                  {chatTransitions((style, chat) => (
                    <animated.button
                      key={chat.id}
                      style={style}
                      onClick={() => onSelectChat(chat.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center gap-3 border ${
                        activeChatId === chat.id 
                        ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' 
                        : 'text-slate-400 hover:bg-white/5 border-transparent'
                      }`}
                    >
                      <span className="opacity-50">#</span>
                      <span className="truncate flex-1 font-medium">{chat.title}</span>
                    </animated.button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Projetos Salvos */}
            {sessions.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-white/5">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Projetos Salvos</h3>
                <div className="space-y-1">
                  {sessions.slice(0, 5).map(session => (
                    <button
                      key={session.id}
                      onClick={() => onSelectSession(session)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between group ${
                        activeSessionId === session.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <span className="truncate">{session.name}</span>
                      <span onClick={(e) => onDeleteSession(session.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400">✕</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Git Diff Analysis</h3>
            <textarea 
              value={diffContent}
              onChange={(e) => setDiffContent(e.target.value)}
              placeholder="Cole seu git diff aqui para análise focada..."
              className="w-full h-64 bg-[#1e1e24] border border-white/5 rounded-2xl p-4 text-[10px] font-mono text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none scrollbar-hide resize-none"
            />
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
         <div className="flex items-center gap-2 px-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Operational</span>
         </div>
      </div>
    </div>
  );
};

export default Sidebar;
