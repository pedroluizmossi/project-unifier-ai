
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatSession, Attachment } from '../types';
import { useAnalysis } from '../hooks/useAnalysis';
import { fileToBase64 } from '../lib/utils';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useTransition, animated, config } from 'react-spring';
import AnalysisTemplates from './AnalysisTemplates';

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [props.history, currentResponse, isAnalyzing]);

  const msgTransitions = useTransition(props.history, {
    from: { opacity: 0, transform: 'translateY(10px) scale(0.98)' },
    enter: { opacity: 1, transform: 'translateY(0px) scale(1)' },
    config: config.gentle
  });

  const handleSendMessage = () => {
    if (customPrompt.trim() || stagedAttachments.length > 0) {
      startAnalysis(customPrompt, stagedAttachments);
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-950 relative overflow-hidden">
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

      {/* History Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 bg-slate-900 border-r border-slate-800 transition-all duration-300 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Histórico</span>
          <button onClick={props.onNewChat} className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors" title="Novo Chat">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
          {props.savedChats.map(chat => (
            <button
              key={chat.id}
              onClick={() => props.onSelectChat(chat.id)}
              className={`w-full text-left p-3 rounded-lg text-xs transition-all border ${
                props.activeChatId === chat.id 
                  ? 'bg-slate-800 text-indigo-400 border-indigo-500/30 shadow-sm' 
                  : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <p className="font-bold truncate mb-1">{chat.title}</p>
              <p className="text-[10px] text-slate-600 font-mono">
                {new Date(chat.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            </button>
          ))}
          {props.savedChats.length === 0 && (
            <div className="text-center p-4 text-slate-600 text-[10px] italic">Sem conversas anteriores.</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/50 backdrop-blur-sm relative">
        
        {/* Top Bar */}
        <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-slate-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-black text-slate-200 uppercase tracking-wider">Gemini 3 Pro</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={props.toggleContext} className={`p-2 rounded-lg text-xs font-bold border transition-colors ${props.isContextOpen ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'text-slate-500 border-slate-700'}`}>
                CONTEXTO
             </button>
             <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-slate-500 hover:text-white transition-colors relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             </button>
          </div>
        </div>

        {/* Settings Dropdown */}
        {showSettings && (
          <div className="absolute top-14 right-4 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 z-50">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Modelo & Raciocínio</p>
            <div className="flex bg-slate-900 rounded-lg p-1 mb-3">
              <button onClick={() => setGeminiConfig({...geminiConfig, model: 'gemini-3-pro-preview'})} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${geminiConfig.model.includes('pro') ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>PRO</button>
              <button onClick={() => setGeminiConfig({...geminiConfig, model: 'gemini-3-flash-preview'})} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${geminiConfig.model.includes('flash') ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>FLASH</button>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-300 font-medium">Thinking Mode</span>
              <button 
                onClick={() => setGeminiConfig({...geminiConfig, useThinking: !geminiConfig.useThinking})}
                className={`w-10 h-5 rounded-full relative transition-colors ${geminiConfig.useThinking ? 'bg-indigo-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${geminiConfig.useThinking ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
          {props.history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
               <AnalysisTemplates onSelect={startAnalysis} />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6 pb-4">
              {msgTransitions((style, msg) => (
                <animated.div style={style} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-3xl p-5 shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm' 
                      : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm'
                  }`}>
                    {/* Attachments Display */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-white/10">
                        {msg.attachments.map((att, i) => (
                          <div key={i} className="flex items-center gap-2 bg-black/20 rounded-lg py-1 px-3 text-xs">
                             <span>📄</span>
                             <span className="truncate max-w-[150px]">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Message Content */}
                    <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                       <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(msg.text) as string) }} />
                    </div>
                    
                    <div className={`text-[10px] mt-2 opacity-50 font-mono text-right ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </animated.div>
              ))}
              
              {/* Streaming / Loading Indicator */}
              {(isAnalyzing || currentResponse) && (
                <div className="flex justify-start w-full">
                  <div className="max-w-[85%] bg-slate-800 border border-indigo-500/30 rounded-3xl rounded-tl-sm p-6 shadow-lg shadow-indigo-900/10">
                     <div className="flex items-center gap-2 mb-3">
                       <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                       <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                       <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                     </div>
                     <div className="prose prose-invert prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(currentResponse || '') as string) }} />
                     </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-slate-900 border-t border-slate-800">
          <div className="max-w-4xl mx-auto">
            {/* Staged Attachments */}
            {stagedAttachments.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                {stagedAttachments.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 bg-indigo-900/30 border border-indigo-500/30 text-indigo-300 text-xs py-1.5 px-3 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                    <span className="truncate max-w-[120px]">{file.name}</span>
                    <button onClick={() => setStagedAttachments(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-white transition-colors">✕</button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="relative group">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                placeholder="Pergunte sobre arquitetura, bugs ou solicite refatorações..."
                className="w-full bg-slate-800/80 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-2xl py-4 pl-12 pr-14 text-sm text-white shadow-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none overflow-hidden"
                rows={1}
                style={{ minHeight: '60px' }}
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                title="Anexar arquivos"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              </button>

              <button 
                onClick={handleSendMessage}
                disabled={isAnalyzing || (!customPrompt.trim() && stagedAttachments.length === 0)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
              >
                {isAnalyzing ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" /></svg>
                )}
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-600 mt-2">
              Gemini 3 Pro pode cometer erros. Revise códigos críticos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisPanel;
