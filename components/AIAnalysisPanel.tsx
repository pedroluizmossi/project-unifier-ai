
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatSession, Attachment } from '../types';
import { useAnalysis } from '../hooks/useAnalysis';
import { fileToBase64 } from '../lib/utils';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useTransition, config } from 'react-spring';
import ChatMessageItem from './ChatMessageItem';
import TemplateSelectorModal from './TemplateSelectorModal';

interface AIAnalysisPanelProps {
  context: string;
  projectSpec?: string;
  diffContext?: string;
  history: ChatMessage[];
  onUpdateHistory: (history: ChatMessage[]) => void;
  isContextOpen: boolean;
  toggleContext: () => void;
  savedChats: ChatSession[];
  activeChatId: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = (props) => {
  const { 
    isAnalyzing, currentResponse, customPrompt, setCustomPrompt, 
    stagedAttachments, setStagedAttachments, geminiConfig, setGeminiConfig, startAnalysis 
  } = useAnalysis(props.context, props.projectSpec, props.diffContext, props.history, props.onUpdateHistory);

  const [showSettings, setShowSettings] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [props.history, currentResponse, isAnalyzing]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [customPrompt]);

  const msgTransitions = useTransition(props.history, {
    from: { opacity: 0, transform: 'translateY(20px) scale(0.98)' },
    enter: { opacity: 1, transform: 'translateY(0px) scale(1)' },
    config: config.gentle
  });

  const handleSendMessage = () => {
    if (customPrompt.trim() || stagedAttachments.length > 0) {
      startAnalysis(customPrompt, stagedAttachments);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="flex h-full w-full bg-[#131314] relative overflow-hidden">
      <input type="file" multiple ref={fileInputRef} className="hidden" 
             onChange={async (e) => {
               const files = e.target.files; if (!files) return;
               const atts: Attachment[] = [];
               for (let i = 0; i < files.length; i++) {
                 atts.push({ name: files[i].name, mimeType: files[i].type || 'app/octet', data: await fileToBase64(files[i]) });
               }
               setStagedAttachments(prev => [...prev, ...atts]);
               e.target.value = '';
             }} />

      {/* Template Modal */}
      <TemplateSelectorModal 
        isOpen={isTemplateModalOpen} 
        onClose={() => setTemplateModalOpen(false)}
        onSelect={startAnalysis}
        projectContext={props.context}
      />

      {/* History Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 bg-[#1e1e20] border-r border-[#2d2d30] transition-all duration-300 overflow-hidden flex flex-col z-20`}>
        <div className="p-4 border-b border-[#2d2d30] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">Conversas</span>
          <button onClick={props.onNewChat} className="p-2 bg-[#2d2e35] hover:bg-[#3d3e45] text-white rounded-full transition-colors" title="Novo Chat">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
          {props.savedChats.map(chat => (
            <button
              key={chat.id}
              onClick={() => props.onSelectChat(chat.id)}
              className={`w-full text-left p-3 rounded-xl text-xs transition-all ${
                props.activeChatId === chat.id 
                  ? 'bg-[#2d2e35] text-white font-medium' 
                  : 'text-slate-400 hover:bg-[#2d2e35]/50 hover:text-slate-200'
              }`}
            >
              <p className="truncate">{chat.title}</p>
            </button>
          ))}
          {props.savedChats.length === 0 && (
            <div className="text-center p-4 text-slate-600 text-[11px]">Nenhuma conversa recente.</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Bar - Clean & Floating look */}
        <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-10 bg-gradient-to-b from-[#131314] to-transparent pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-2 px-3 py-1 bg-[#1e1e20] rounded-full border border-[#2d2d30]">
              <span className="text-xs font-medium text-slate-200">Gemini 3 Pro</span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            </div>
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
             <button onClick={props.toggleContext} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${props.isContextOpen ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-[#1e1e20] text-slate-400 border-[#2d2d30] hover:text-white'}`}>
                Contexto
             </button>
             <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             </button>
          </div>
        </div>

        {/* Settings Dropdown */}
        {showSettings && (
          <div className="absolute top-16 right-6 w-64 bg-[#1e1e20] border border-[#2d2d30] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Configurações</p>
            <div className="flex bg-[#2d2e35] rounded-xl p-1 mb-3">
              <button onClick={() => setGeminiConfig({...geminiConfig, model: 'gemini-3-pro-preview'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${geminiConfig.model.includes('pro') ? 'bg-[#3d3e45] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>PRO</button>
              <button onClick={() => setGeminiConfig({...geminiConfig, model: 'gemini-3-flash-preview'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${geminiConfig.model.includes('flash') ? 'bg-[#3d3e45] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>FLASH</button>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#2d2e35] rounded-xl">
              <span className="text-xs text-slate-300 font-medium">Thinking Mode</span>
              <button 
                onClick={() => setGeminiConfig({...geminiConfig, useThinking: !geminiConfig.useThinking})}
                className={`w-10 h-5 rounded-full relative transition-colors ${geminiConfig.useThinking ? 'bg-indigo-600' : 'bg-[#4a4b52]'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${geminiConfig.useThinking ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-20 lg:px-48 pt-20 pb-40 scrollbar-hide">
          {props.history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur-[40px] opacity-40 absolute top-0 left-0 animate-pulse"></div>
                  <div className="relative w-20 h-20 bg-[#1e1e20] text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 rounded-3xl flex items-center justify-center text-6xl border border-white/5 shadow-2xl">
                    ✦
                  </div>
               </div>
               <div className="text-center max-w-md">
                 <h3 className="text-2xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-purple-200 mb-2">Olá, Engenheiro</h3>
                 <p className="text-slate-500 text-sm leading-relaxed">
                   O contexto do seu projeto está carregado. Posso ajudar com refatoração, análise de segurança ou criar diagramas de arquitetura.
                 </p>
               </div>
               
               <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                 <button onClick={() => setTemplateModalOpen(true)} className="p-4 bg-[#1e1e20] hover:bg-[#2d2e35] border border-[#2d2d30] hover:border-indigo-500/30 rounded-2xl text-left transition-all group">
                    <span className="block text-xl mb-2 group-hover:scale-110 transition-transform origin-left">🔍</span>
                    <span className="text-xs font-bold text-slate-300 block">Revisão de Código</span>
                 </button>
                 <button onClick={() => setTemplateModalOpen(true)} className="p-4 bg-[#1e1e20] hover:bg-[#2d2e35] border border-[#2d2d30] hover:border-purple-500/30 rounded-2xl text-left transition-all group">
                    <span className="block text-xl mb-2 group-hover:scale-110 transition-transform origin-left">🛡️</span>
                    <span className="text-xs font-bold text-slate-300 block">Auditoria Segurança</span>
                 </button>
               </div>
            </div>
          ) : (
            <div className="space-y-2">
              {msgTransitions((style, msg) => (
                <ChatMessageItem key={msg.timestamp} message={msg} style={style} />
              ))}
              
              {/* Streaming / Loading Indicator - Integrated look */}
              {(isAnalyzing || currentResponse) && (
                <div className="flex justify-start w-full animate-in fade-in">
                  <div className="flex-shrink-0 mr-4 mt-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                    </div>
                  </div>
                  <div className="max-w-[85%]">
                     {!currentResponse && (
                       <div className="flex items-center gap-1 h-8">
                         <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                         <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75"></div>
                         <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150"></div>
                       </div>
                     )}
                     {currentResponse && (
                       <div className="prose prose-invert prose-p:leading-7 max-w-none text-slate-200">
                          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(currentResponse) as string) }} />
                       </div>
                     )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area - Floating Capsule */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent z-20">
          <div className="max-w-4xl mx-auto relative">
            
            {/* Staged Attachments Pill */}
            {stagedAttachments.length > 0 && (
              <div className="absolute -top-12 left-0 right-0 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {stagedAttachments.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 bg-[#2d2e35] border border-[#3d3e45] text-slate-200 text-xs py-2 px-4 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-2">
                    <span className="truncate max-w-[120px]">{file.name}</span>
                    <button onClick={() => setStagedAttachments(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-400 transition-colors ml-1">✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative flex items-end gap-2 bg-[#1e1e20] rounded-[2rem] p-2 pr-2 shadow-2xl border border-[#2d2d30] focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
              
              <button 
                 onClick={() => setTemplateModalOpen(true)}
                 className="p-3 text-indigo-400 hover:text-indigo-300 hover:bg-white/5 rounded-full transition-colors flex-shrink-0"
                 title="Templates & Ações"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M16 16c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z"/></svg>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors flex-shrink-0"
                title="Anexar arquivos"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </button>

              <textarea
                ref={textareaRef}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                placeholder="Pergunte sobre seu código..."
                className="w-full bg-transparent border-none text-slate-200 placeholder-slate-500 focus:ring-0 py-3.5 max-h-[150px] overflow-y-auto resize-none scrollbar-hide leading-relaxed"
                rows={1}
              />
              
              <button 
                onClick={handleSendMessage}
                disabled={isAnalyzing || (!customPrompt.trim() && stagedAttachments.length === 0)}
                className={`p-3 rounded-full flex-shrink-0 transition-all duration-300 ${
                  customPrompt.trim() || stagedAttachments.length > 0 
                  ? 'bg-white text-black hover:bg-slate-200' 
                  : 'bg-transparent text-slate-600 cursor-not-allowed'
                }`}
              >
                {isAnalyzing ? (
                   <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                )}
              </button>
            </div>
            
            <p className="text-center text-[10px] text-slate-600 mt-3 font-medium">
              O Gemini pode apresentar informações imprecisas, inclusive sobre pessoas, por isso, verifique as respostas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisPanel;
