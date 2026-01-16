
import React, { useState, useEffect, useRef } from 'react';
import { ANALYSIS_TEMPLATES } from '../constants';
import { performProjectAnalysis } from '../services/geminiService';
import { GeminiConfig, ChatMessage, ChatSession, Attachment } from '../types';
import { fileToBase64 } from '../lib/utils';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useTransition, animated, config, useSpring } from 'react-spring';

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

const DEFAULT_CONFIG: GeminiConfig = {
  model: 'gemini-3-pro-preview',
  useThinking: true
};

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ 
  context, projectSpec, diffContext, history, onUpdateHistory, isContextOpen, toggleContext,
  savedChats, activeChatId, onNewChat, onSelectChat
}) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'chat'>('chat');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Staged files for next message
  const [stagedAttachments, setStagedAttachments] = useState<Attachment[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [geminiConfig, setGeminiConfig] = useState<GeminiConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    const savedConfig = localStorage.getItem('gemini_config_v2');
    if (savedConfig) {
      try {
        setGeminiConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Failed to parse config", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('gemini_config_v2', JSON.stringify(geminiConfig));
  }, [geminiConfig]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, currentResponse, activeTab, isAnalyzing]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64Data = await fileToBase64(file);
        newAttachments.push({
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          data: base64Data
        });
      } catch (err) {
        console.error("Error processing attachment:", err);
      }
    }
    setStagedAttachments(prev => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const removeStagedAttachment = (index: number) => {
    setStagedAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const startAnalysis = async (prompt: string, attachments: Attachment[] = []) => {
    if (!context || (!prompt.trim() && attachments.length === 0)) return;
    
    const userMsg: ChatMessage = { 
      role: 'user', 
      text: prompt, 
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined
    };
    const updatedHistory = [...history, userMsg];
    onUpdateHistory(updatedHistory);
    
    setIsAnalyzing(true);
    setCurrentResponse('');
    setActiveTab('chat');
    setShowSettings(false);
    setCustomPrompt('');
    setStagedAttachments([]);
    
    try {
      const fullResponse = await performProjectAnalysis(
        context, 
        prompt, 
        (chunk) => setCurrentResponse(prev => prev + chunk), 
        diffContext, 
        geminiConfig,
        projectSpec,
        attachments
      );
      
      const modelMsg: ChatMessage = { role: 'model', text: fullResponse, timestamp: Date.now() };
      onUpdateHistory([...updatedHistory, modelMsg]);
      setCurrentResponse('');
    } catch (err: any) {
      const errorMsg: ChatMessage = { role: 'model', text: `### ⚠️ Erro na Análise\n${err.message}`, timestamp: Date.now() };
      onUpdateHistory([...updatedHistory, errorMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const messageTransitions = useTransition(history, {
    from: { opacity: 0, transform: 'translateY(20px)' },
    enter: { opacity: 1, transform: 'translateY(0px)' },
    config: config.gentle
  });

  const historyDrawerSpring = useSpring({
    transform: showHistory ? 'translateX(0%)' : 'translateX(-100%)',
    opacity: showHistory ? 1 : 0,
    config: { tension: 280, friction: 30 }
  });

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 relative overflow-hidden">
      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      
      <animated.div style={historyDrawerSpring} className="absolute inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 z-30 shadow-2xl flex flex-col backdrop-blur-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <h3 className="text-xs font-black text-white uppercase tracking-widest">Conversas</h3>
          <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {savedChats.length === 0 && <p className="text-[10px] text-slate-500 text-center py-4">Nenhuma conversa salva.</p>}
          {savedChats.sort((a,b) => b.updatedAt - a.updatedAt).map(chat => (
            <button
              key={chat.id}
              onClick={() => { onSelectChat(chat.id); setShowHistory(false); }}
              className={`w-full text-left p-3 rounded-xl border transition-all group ${chat.id === activeChatId ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-slate-800/20 border-slate-800/50 hover:bg-slate-800'}`}
            >
              <p className={`text-[11px] font-bold truncate ${chat.id === activeChatId ? 'text-indigo-300' : 'text-slate-300 group-hover:text-white'}`}>{chat.title || 'Nova Conversa'}</p>
              <p className="text-[8px] text-slate-500 mt-1">{new Date(chat.updatedAt).toLocaleDateString()} {new Date(chat.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </button>
          ))}
        </div>
      </animated.div>

      {showHistory && <div className="absolute inset-0 bg-black/50 z-20 backdrop-blur-sm" onClick={() => setShowHistory(false)}></div>}

      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
           <button onClick={toggleContext} className={`p-2 rounded-lg border transition-all ${isContextOpen ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30' : 'text-slate-500 border-slate-700 hover:text-white'}`} title={isContextOpen ? "Fechar Contexto" : "Ver Contexto"}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
           </button>

           <button onClick={() => setShowHistory(true)} className="p-2 rounded-lg border border-slate-700 text-slate-500 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-2" title="Histórico de Chats">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           </button>

           {projectSpec && (
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]"></div>
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Blueprint Active</span>
             </div>
           )}

           <div className="h-6 w-px bg-slate-800 mx-1"></div>

           <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-xl">✨</div>
            <div>
              <h2 className="font-black text-sm text-white uppercase tracking-tight">Gemini 3 Studio</h2>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                {geminiConfig.model === 'gemini-3-pro-preview' ? 'Pro Mode' : 'Flash Mode'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 mr-2">
            <button onClick={() => setActiveTab('chat')} className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Chat</button>
            <button onClick={() => setActiveTab('templates')} className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'templates' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Templates</button>
          </div>

          <button onClick={onNewChat} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 border border-indigo-500/50 mr-2">
             <span className="text-lg leading-none font-light">+</span> Novo Chat
          </button>

          <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide">
        {showSettings && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-4 animate-in slide-in-from-top-2 max-w-lg mx-auto">
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-3 bg-indigo-500 rounded-full"></span>
              Modelo e Raciocínio
            </h3>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setGeminiConfig({ ...geminiConfig, model: 'gemini-3-pro-preview' })}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all ${geminiConfig.model === 'gemini-3-pro-preview' ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
              >
                <span className="text-xs font-bold text-white">Gemini 3 Pro</span>
                <span className="text-[9px] text-slate-400 leading-tight">Melhor para lógica complexa e arquitetura.</span>
              </button>
              
              <button 
                onClick={() => setGeminiConfig({ ...geminiConfig, model: 'gemini-3-flash-preview' })}
                className={`flex flex-col p-3 rounded-xl border text-left transition-all ${geminiConfig.model === 'gemini-3-flash-preview' ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
              >
                <span className="text-xs font-bold text-white">Gemini 3 Flash</span>
                <span className="text-[9px] text-slate-400 leading-tight">Ultra rápido para revisões e sumários.</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-700">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white">Deep Reasoning (Thinking)</span>
                <span className="text-[8px] text-slate-500">Habilita o raciocínio estendido.</span>
              </div>
              <button 
                onClick={() => setGeminiConfig({ ...geminiConfig, useThinking: !geminiConfig.useThinking })}
                className={`w-10 h-5 rounded-full relative transition-colors ${geminiConfig.useThinking ? 'bg-indigo-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${geminiConfig.useThinking ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto w-full space-y-8">
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2">
              {ANALYSIS_TEMPLATES.map((tmpl) => (
                <button key={tmpl.id} onClick={() => startAnalysis(tmpl.prompt)} disabled={isAnalyzing} className="text-left p-6 bg-slate-800/40 border border-slate-700/30 rounded-3xl hover:border-indigo-500/50 hover:bg-slate-800 transition-all group disabled:opacity-50">
                  <div className="flex items-start gap-5">
                    <div className="text-3xl p-3 bg-slate-900 rounded-2xl group-hover:scale-110 transition-transform shadow-lg">{tmpl.icon}</div>
                    <div>
                      <h4 className="font-bold text-slate-100 group-hover:text-indigo-400 text-sm">{tmpl.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{tmpl.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-8">
              {messageTransitions((style, msg) => (
                <animated.div style={style} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`w-full ${msg.role === 'user' ? 'max-w-[90%]' : 'max-w-[95%]'} p-6 rounded-3xl text-[14px] leading-relaxed shadow-xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-md' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-md'}`}>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {msg.attachments.map((att, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-900/40 rounded-lg border border-indigo-500/30">
                            {att.mimeType.startsWith('image/') ? (
                              <img src={`data:${att.mimeType};base64,${att.data}`} className="w-8 h-8 rounded object-cover" alt="" />
                            ) : (
                              <span className="text-lg">📄</span>
                            )}
                            <span className="text-[10px] font-bold text-indigo-200 truncate max-w-[120px]">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="prose prose-invert prose-slate max-w-none text-sm" 
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(msg.text) as string) }} />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-2 uppercase font-black px-1 tracking-widest">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </animated.div>
              ))}
              
              {isAnalyzing && !currentResponse && (
                <div className="flex flex-col items-start w-full animate-in fade-in duration-500">
                  <div className="p-4 bg-slate-900/50 border border-indigo-500/20 rounded-2xl flex items-center gap-4 shadow-lg backdrop-blur-sm">
                    <div className="relative w-6 h-6">
                      <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-full animate-ping"></div>
                      <div className="absolute inset-0 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-indigo-400 animate-pulse">Gemini 3 está pensando...</span>
                       <span className="text-[9px] text-slate-500 uppercase tracking-widest">
                         {projectSpec ? 'Raciocinando com Blueprint' : 'Analisando contexto'}
                       </span>
                    </div>
                  </div>
                </div>
              )}

              {currentResponse && (
                <div className="flex flex-col items-start w-full">
                  <div className="w-full max-w-[95%] p-6 bg-slate-800 border border-indigo-500/30 text-slate-200 rounded-3xl rounded-tl-md text-[14px] leading-relaxed shadow-2xl">
                    <div className="prose prose-invert prose-slate max-w-none text-sm" 
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(currentResponse) as string) }} />
                    {isAnalyzing && <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse ml-1 align-middle"></span>}
                  </div>
                </div>
              )}

              {history.length === 0 && !currentResponse && activeTab === 'chat' && (
                 <div className="flex flex-col items-center justify-center py-32 space-y-6 opacity-40">
                    <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-5xl grayscale">💬</div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Comece uma conversa ou anexe arquivos de apoio</p>
                 </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto space-y-4">
          {stagedAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 animate-in slide-in-from-bottom-2">
               {stagedAttachments.map((att, idx) => (
                 <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-indigo-500/30 rounded-xl relative group">
                    {att.mimeType.startsWith('image/') ? (
                       <img src={`data:${att.mimeType};base64,${att.data}`} className="w-6 h-6 rounded object-cover" alt="" />
                    ) : (
                       <span className="text-base">📄</span>
                    )}
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest truncate max-w-[100px]">{att.name}</span>
                    <button 
                      onClick={() => removeStagedAttachment(idx)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >✕</button>
                 </div>
               ))}
            </div>
          )}

          <div className="relative">
            <textarea 
              value={customPrompt} 
              onChange={(e) => setCustomPrompt(e.target.value)} 
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startAnalysis(customPrompt, stagedAttachments); }}}
              placeholder="Pergunte ao Gemini ou anexe arquivos de apoio..." 
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pl-14 pr-14 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 min-h-[60px] max-h-[200px] resize-none scrollbar-hide shadow-inner"
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-3 bottom-3 p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-700 rounded-xl transition-all"
              title="Anexar arquivos de apoio"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            </button>

            <button 
              onClick={() => startAnalysis(customPrompt, stagedAttachments)} 
              disabled={isAnalyzing || (!customPrompt.trim() && stagedAttachments.length === 0)} 
              className="absolute right-3 bottom-3 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9-2-9-18-9 18 9 2zm0 0v-8" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisPanel;
