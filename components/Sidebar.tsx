
import React, { useRef } from 'react';
import { AppMode, OutputFormat, ProcessorStatus, FileInfo, ProjectSession, ChatSession } from '../types';
import { useTransition, animated, config, useSpring } from 'react-spring';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  
  // App State Props
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  isProcessing: boolean;
  
  // File & Project Props
  directoryName: string | null;
  files: FileInfo[];
  stats: ProcessorStatus;
  outputFormat: OutputFormat;
  setOutputFormat: (format: OutputFormat) => void;
  onSelectDirectory: () => void;
  openFileExplorer: () => void;
  
  // Diff Props
  diffContent: string;
  setDiffContent: (content: string) => void;
  
  // Sessions & Chats Props
  sessions: ProjectSession[];
  activeSessionId: string | null;
  onSelectSession: (session: ProjectSession) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  savedChats: ChatSession[];
  activeChatId: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, onClose,
  appMode, setAppMode, isProcessing, onSelectDirectory, 
  files, openFileExplorer, stats, directoryName, diffContent, setDiffContent,
  sessions, onSelectSession, activeSessionId, onDeleteSession,
  savedChats, activeChatId, onNewChat, onSelectChat
}) => {

  const diffFileInputRef = useRef<HTMLInputElement>(null);

  // Animação de Layout encapsulada no componente
  const sidebarSpring = useSpring({
    width: isOpen ? 280 : 0,
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'translateX(0%)' : 'translateX(-100%)',
    config: { tension: 210, friction: 20 }
  });

  // Animação da lista de chats
  const chatTransitions = useTransition(savedChats, {
    from: { opacity: 0, transform: 'translateX(-10px)', height: 0 },
    enter: { opacity: 1, transform: 'translateX(0px)', height: 44 },
    leave: { opacity: 0, transform: 'translateX(-10px)', height: 0 },
    keys: item => item.id,
    config: config.stiff
  });

  const handleDiffFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setDiffContent(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <animated.div 
      style={sidebarSpring} 
      className="flex-shrink-0 h-full overflow-hidden border-r border-slate-800/50 bg-[#13141c]"
    >
      <div className="w-[280px] h-full flex flex-col p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold italic shadow-lg shadow-indigo-500/20">U</div>
            <span className="font-bold text-sm tracking-tight text-slate-200">Unifier AI</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white rounded-md hover:bg-white/5 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="bg-[#1e1e24] p-1 rounded-lg flex border border-white/5">
           <button onClick={() => setAppMode('project')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${appMode === 'project' ? 'bg-[#2d2e35] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>Workspace</button>
           <button onClick={() => setAppMode('mr_analysis')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${appMode === 'mr_analysis' ? 'bg-[#2d2e35] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>Analise Diff</button>
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
                    
                    <div className="grid grid-cols-1 gap-2">
                      <button 
                        onClick={openFileExplorer}
                        className="w-full py-2.5 bg-[#1e1e24] hover:bg-[#2d2e35] text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/5"
                      >
                        <span>🔍</span> Explorar Arquivos ({stats.text})
                      </button>
                      <button 
                        onClick={onSelectDirectory}
                        className="w-full py-2.5 bg-transparent hover:bg-white/5 text-slate-500 hover:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-dashed border-white/10"
                      >
                        <span>➕</span> Novo Projeto
                      </button>
                    </div>
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
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Git Diff / Patch</h3>
                <div className={`w-2 h-2 rounded-full ${diffContent.trim() ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
              </div>

              <input 
                type="file" 
                ref={diffFileInputRef} 
                className="hidden" 
                accept=".diff,.patch,.txt" 
                onChange={handleDiffFileUpload}
              />

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => diffFileInputRef.current?.click()}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <span>📎</span> Importar Arquivo .diff
                </button>
                
                <div className="relative">
                  <textarea 
                    value={diffContent}
                    onChange={(e) => setDiffContent(e.target.value)}
                    placeholder="Cole as mudanças (git diff) aqui para que a IA foque no que mudou..."
                    className="w-full h-80 bg-[#1e1e24] border border-white/5 rounded-2xl p-4 text-[10px] font-mono text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none scrollbar-hide resize-none leading-relaxed"
                  />
                  {diffContent && (
                    <button 
                      onClick={() => setDiffContent('')}
                      className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              </div>

              <p className="text-[9px] text-slate-600 px-2 leading-relaxed">
                * Ao ativar o modo DIFF, as análises da IA priorizarão as linhas alteradas, identificando bugs e inconsistências no código novo.
              </p>
            </div>
          )}
        </div>

        {/* Footer Branding */}
        <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
           <div className="flex items-center gap-2 px-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">IA Operacional</span>
           </div>
        </div>
      </div>
    </animated.div>
  );
};

export default Sidebar;
