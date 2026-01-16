
import React, { useState, useEffect, useRef } from 'react';
import { ANALYSIS_TEMPLATES } from '../constants';
import { performProjectAnalysis } from '../services/geminiService';
import { GeminiConfig, ChatMessage } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useTransition, animated, config } from 'react-spring';

interface AIAnalysisPanelProps {
  context: string;
  diffContext?: string;
  onClose: () => void;
  history: ChatMessage[];
  onUpdateHistory: (history: ChatMessage[]) => void;
}

const DEFAULT_CONFIG: GeminiConfig = {
  model: 'gemini-3-pro-preview',
  useThinking: true
};

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ context, diffContext, onClose, history, onUpdateHistory }) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'chat'>('templates');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
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
  }, [history, currentResponse, activeTab]);

  const startAnalysis = async (prompt: string) => {
    if (!context || !prompt.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', text: prompt, timestamp: Date.now() };
    const updatedHistory = [...history, userMsg];
    onUpdateHistory(updatedHistory);
    
    setIsAnalyzing(true);
    setCurrentResponse('');
    setActiveTab('chat');
    setShowSettings(false);
    setCustomPrompt('');
    
    try {
      const fullResponse = await performProjectAnalysis(
        context, 
        prompt, 
        (chunk) => setCurrentResponse(prev => prev + chunk), 
        diffContext, 
        geminiConfig
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

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 shadow-2xl">
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-xl">✨</div>
          <div>
            <h2 className="font-black text-sm text-white uppercase tracking-tight">Gemini 3 Studio</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              {geminiConfig.model === 'gemini-3-pro-preview' ? 'Pro Mode' : 'Flash Mode'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => { onUpdateHistory([]); setActiveTab('templates'); }} className="p-2 text-slate-500 hover:text-red-400 transition-colors" title="Limpar Chat">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {showSettings && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-4 animate-in slide-in-from-top-2">
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

        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
          <button onClick={() => setActiveTab('templates')} className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${activeTab === 'templates' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Templates</button>
          <button onClick={() => setActiveTab('chat')} className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Chat ({history.length})</button>
        </div>

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 gap-3">
            {ANALYSIS_TEMPLATES.map((tmpl) => (
              <button key={tmpl.id} onClick={() => startAnalysis(tmpl.prompt)} disabled={isAnalyzing} className="text-left p-4 bg-slate-800/40 border border-slate-700/30 rounded-2xl hover:border-indigo-500/50 hover:bg-slate-800 transition-all group disabled:opacity-50">
                <div className="flex items-start gap-4">
                  <div className="text-2xl p-2 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform">{tmpl.icon}</div>
                  <div>
                    <h4 className="font-bold text-slate-100 group-hover:text-indigo-400 text-xs">{tmpl.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{tmpl.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="space-y-6">
            {messageTransitions((style, msg) => (
              <animated.div style={style} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] p-4 rounded-2xl text-[11px] leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'}`}>
                  <div className="prose prose-invert prose-slate max-w-none text-xs" 
                       dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(msg.text) as string) }} />
                </div>
                <span className="text-[8px] text-slate-500 mt-2 uppercase font-black px-1">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </animated.div>
            ))}
            
            {currentResponse && (
              <div className="flex flex-col items-start">
                <div className="max-w-[90%] p-4 bg-slate-800 border border-indigo-500/30 text-slate-200 rounded-2xl rounded-tl-none text-[11px] leading-relaxed">
                  <div className="prose prose-invert prose-slate max-w-none text-xs" 
                       dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(currentResponse) as string) }} />
                  {isAnalyzing && <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse ml-1"></span>}
                </div>
              </div>
            )}
            {history.length === 0 && !currentResponse && (
              <div className="py-20 text-center text-slate-500">
                <p className="text-[10px] uppercase font-black tracking-widest">Nenhuma conversa ativa</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/80">
        <div className="relative">
          <textarea 
            value={customPrompt} 
            onChange={(e) => setCustomPrompt(e.target.value)} 
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startAnalysis(customPrompt); }}}
            placeholder="Pergunte ao Gemini sobre o código..." 
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pl-4 pr-14 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 min-h-[60px] max-h-[200px] resize-none scrollbar-hide"
          />
          <button 
            onClick={() => startAnalysis(customPrompt)} 
            disabled={isAnalyzing || !customPrompt.trim()} 
            className="absolute right-3 bottom-3 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9-2-9-18-9 18 9 2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisPanel;
