
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatSession, Attachment, SavedResponse } from '../types';
import { useAnalysis } from '../hooks/useAnalysis';
import { fileToBase64 } from '../lib/utils';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useTransition, config, animated } from 'react-spring';
import ChatMessageItem from './ChatMessageItem';
import TemplateSelectorModal from './TemplateSelectorModal';
import SavedFavoritesModal from './SavedFavoritesModal';

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
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  favorites: SavedResponse[];
  onToggleFavorite: (content: string) => void;
  onRemoveFavorite: (id: string) => void;
}

// --- Logs de Pensamento Simulados (Contexto de Engenharia) ---
const THOUGHT_LOGS = [
  "Digitalizando entradas e identificando intenções...",
  "Mapeando conexões semânticas no prompt...",
  "Recuperando fragmentos de contexto relevante...",
  "Analisando camadas de significado implícito...",
  "Indexando conceitos-chave para processamento...",
  "Acessando base de conhecimento Gemini 3...",
  "Cruzando referências e dados multidimensionais...",
  "Avaliando padrões e analogias aplicáveis...",
  "Ponderando múltiplas perspectivas e abordagens...",
  "Executando simulações de cenários e resultados...",
  "Validando consistência interna e lógica...",
  "Filtrando ruídos e informações redundantes...",
  "Sintetizando insights em uma estrutura coerente...",
  "Ajustando o tom e a clareza da comunicação...",
  "Refinando a precisão terminológica...",
  "Otimizando a hierarquia das informações...",
  "Poda de ramos irrelevantes na árvore de decisão...",
  "Verificando integridade da resposta final...",
  "Formatando saída para máxima legibilidade...",
  "Finalizando síntese criativa..."
];

// --- 1. Loader Extravagante (Quantum Nexus + Neural Log) ---
const QuantumNexusLoader = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => {
        const nextLog = THOUGHT_LOGS[currentLogIndex % THOUGHT_LOGS.length];
        const newLogs = [...prev, nextLog];
        if (newLogs.length > 4) newLogs.shift();
        return newLogs;
      });
      setCurrentLogIndex(prev => prev + 1);
    }, 800);

    return () => clearInterval(interval);
  }, [currentLogIndex]);

  return (
    <div className="flex flex-col items-center justify-center py-8 px-6 w-full animate-in fade-in duration-700">
      
      {/* Container do Reator */}
      <div className="relative w-40 h-40 flex items-center justify-center mb-8">
        <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full animate-pulse"></div>
        <div className="absolute inset-0 border border-slate-700/50 rounded-full"></div>
        <div className="absolute inset-0 border-2 border-transparent border-t-cyan-500/50 border-r-cyan-500/20 rounded-full animate-[spin_4s_linear_infinite]"></div>
        <div className="absolute inset-4 border border-indigo-500/10 rounded-full"></div>
        <div className="absolute inset-4 border-2 border-transparent border-b-purple-500 border-l-purple-500/50 rounded-full animate-[spin_2s_linear_infinite_reverse] shadow-[0_0_15px_rgba(168,85,247,0.4)]"></div>
        <div className="absolute inset-10 border-2 border-dashed border-emerald-500/30 rounded-full animate-[spin_8s_linear_infinite]"></div>
        <div className="absolute inset-10 border-2 border-transparent border-t-emerald-400 rounded-full animate-[spin_1s_linear_infinite]"></div>
        <div className="relative z-10 w-14 h-14 bg-[#0f1117] rounded-full border border-indigo-500/50 flex items-center justify-center shadow-[inset_0_0_20px_rgba(99,102,241,0.5)]">
           <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping opacity-20"></div>
           <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_15px_white,0_0_30px_cyan] animate-pulse"></div>
        </div>
      </div>

      <div className="w-full max-w-sm">
         <h3 className="text-center text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 uppercase tracking-[0.2em] animate-pulse mb-4">
           Processamento Neural
         </h3>
         
         <div className="bg-[#0a0b10] border border-white/10 rounded-xl p-4 font-mono text-[10px] h-32 overflow-hidden relative shadow-inner shadow-black/50">
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#0a0b10] to-transparent z-10"></div>
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#0a0b10] to-transparent z-10"></div>
            
            <div className="flex flex-col justify-end h-full gap-2">
              {logs.map((log, i) => (
                <div key={i} className="flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300">
                   <span className="text-indigo-500">➜</span>
                   <span className={`truncate ${i === logs.length - 1 ? 'text-cyan-300 font-bold' : 'text-slate-500'}`}>
                     {log}
                   </span>
                   {i === logs.length - 1 && <span className="w-1.5 h-3 bg-cyan-400 animate-pulse inline-block ml-1"/>}
                </div>
              ))}
            </div>
         </div>
         
         <div className="flex justify-between items-center mt-2 px-1">
            <div className="flex gap-1">
               <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></div>
               <span className="text-[9px] text-emerald-500 font-bold uppercase">Online</span>
            </div>
            <span className="text-[9px] text-slate-600 font-mono">GEMINI-3-PRO::THREAD_ACTIVE</span>
         </div>
      </div>
    </div>
  );
};

// --- 2. Loader Sutil (Com texto dinâmico) ---
const StandardChatLoader = () => {
  const [currentThought, setCurrentThought] = useState("Sincronizando contexto...");

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      setCurrentThought(THOUGHT_LOGS[idx % THOUGHT_LOGS.length]);
      idx++;
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 py-3 px-2 max-w-[240px] animate-in fade-in slide-in-from-left-2">
       <div className="flex items-end gap-1 h-5">
          <div className="w-1 bg-indigo-500/60 rounded-full animate-[pulse_1s_ease-in-out_infinite] h-[40%]"></div>
          <div className="w-1 bg-indigo-500/80 rounded-full animate-[pulse_1.1s_ease-in-out_infinite] h-[100%]"></div>
          <div className="w-1 bg-indigo-500/60 rounded-full animate-[pulse_1.2s_ease-in-out_infinite] h-[60%]"></div>
       </div>
       
       <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest animate-pulse">
             Gemini Thinking
          </span>
          <span className="text-[9px] text-slate-500 font-mono truncate animate-in fade-in duration-300 key={currentThought}">
             {currentThought}
          </span>
       </div>
    </div>
  );
};

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = (props) => {
  const { 
    isAnalyzing, currentResponse, customPrompt, setCustomPrompt, 
    stagedAttachments, setStagedAttachments, geminiConfig, setGeminiConfig, startAnalysis,
    suggestions, isGeneratingSuggestions, generateSuggestions
  } = useAnalysis(props.context, props.projectSpec, props.diffContext, props.history, props.onUpdateHistory);

  const [showSettings, setShowSettings] = useState(false);
  const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
  const [isFavoritesModalOpen, setFavoritesModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [props.history, currentResponse, isAnalyzing]);

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
  
  const suggestionsTransition = useTransition(suggestions, {
    from: { opacity: 0, transform: 'translateY(20px)', scale: 0.9 },
    enter: { opacity: 1, transform: 'translateY(0px)', scale: 1 },
    trail: 100,
    config: config.wobbly
  });

  const handleSendMessage = () => {
    if (customPrompt.trim() || stagedAttachments.length > 0) {
      startAnalysis(customPrompt, stagedAttachments);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="flex h-full w-full relative overflow-hidden bg-[#0f1117]">
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

      <TemplateSelectorModal 
        isOpen={isTemplateModalOpen} 
        onClose={() => setTemplateModalOpen(false)}
        onSelect={startAnalysis}
        projectContext={props.context}
      />

      <SavedFavoritesModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setFavoritesModalOpen(false)}
        favorites={props.favorites}
        onRemove={props.onRemoveFavorite}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Floating Header */}
        <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-10 bg-gradient-to-b from-[#0f1117] via-[#0f1117]/80 to-transparent pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            {!props.isSidebarOpen && (
              <button onClick={props.toggleSidebar} className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-[#1e1e24] rounded-full border border-white/5 shadow-sm">
                <span className="text-xs font-medium text-slate-300">
                  {geminiConfig.model.includes('flash') ? 'Gemini 3 Flash' : 'Gemini 3 Pro'}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${geminiConfig.useThinking ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
              </div>
              
              {/* Google Search Indicator */}
              {geminiConfig.useSearch && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#4285F4]/10 rounded-full border border-[#4285F4]/30">
                  <span className="text-[10px] font-bold text-[#4285F4]">G</span>
                  <span className="text-[9px] font-medium text-slate-300">Search</span>
                </div>
              )}

              {/* DIFF Context Indicator */}
              {props.diffContext && props.diffContext.trim().length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/30 shadow-sm animate-in fade-in slide-in-from-left-2">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Contexto Diff Ativo</span>
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 pointer-events-auto">
             <button 
               onClick={() => setFavoritesModalOpen(true)} 
               className="p-2 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-full transition-colors relative"
               title="Biblioteca de Favoritos"
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {props.favorites.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                )}
             </button>
             <button onClick={props.toggleContext} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border transition-all ${props.isContextOpen ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-[#1e1e24] text-slate-500 border-white/5 hover:text-slate-200'}`}>
                {props.isContextOpen ? 'Fechar Painel' : 'Dashboard'}
             </button>
             <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             </button>
          </div>
        </div>

        {/* Settings Popover */}
        {showSettings && (
          <div className="absolute top-16 right-6 w-64 bg-[#1e1e24] border border-white/5 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Model Selection</p>
            <div className="flex bg-[#0f1117] rounded-xl p-1 mb-3">
              <button onClick={() => setGeminiConfig({...geminiConfig, model: 'gemini-3-pro-preview'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${geminiConfig.model.includes('pro') ? 'bg-[#2d2e35] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>PRO</button>
              <button onClick={() => setGeminiConfig({...geminiConfig, model: 'gemini-3-flash-preview'})} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${geminiConfig.model.includes('flash') ? 'bg-[#2d2e35] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>FLASH</button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-[#0f1117] rounded-xl mb-2">
              <div className="flex flex-col">
                <span className="text-xs text-slate-300 font-medium">Deep Thinking</span>
                <span className="text-[9px] text-slate-600">Max reasoning budget</span>
              </div>
              <button 
                onClick={() => setGeminiConfig({...geminiConfig, useThinking: !geminiConfig.useThinking})}
                className={`w-10 h-5 rounded-full relative transition-colors ${geminiConfig.useThinking ? 'bg-indigo-600' : 'bg-[#2d2e35]'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${geminiConfig.useThinking ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#0f1117] rounded-xl">
              <div className="flex flex-col">
                <span className="text-xs text-slate-300 font-medium">Google Search</span>
                <span className="text-[9px] text-slate-600">Web grounding</span>
              </div>
              <button 
                onClick={() => setGeminiConfig({...geminiConfig, useSearch: !geminiConfig.useSearch})}
                className={`w-10 h-5 rounded-full relative transition-colors ${geminiConfig.useSearch ? 'bg-[#4285F4]' : 'bg-[#2d2e35]'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${geminiConfig.useSearch ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-20 lg:px-48 pt-24 pb-48 scrollbar-hide">
          {props.history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-[500px]">
               
               {/* Hero Section */}
               {!isGeneratingSuggestions && (
                 <>
                   <div className="relative group cursor-pointer text-center" onClick={() => setTemplateModalOpen(true)}>
                      <div className="w-32 h-32 bg-indigo-500/20 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                      <div className="relative w-24 h-24 mx-auto bg-[#1e1e24] text-transparent bg-clip-text bg-gradient-to-tr from-indigo-400 to-purple-400 rounded-[2rem] flex items-center justify-center text-7xl border border-white/5 shadow-2xl transition-transform group-hover:scale-105 duration-300">
                        ✦
                      </div>
                   </div>

                   {/* Welcome Text */}
                   <div className="text-center max-w-md">
                     <h3 className="text-2xl font-semibold text-white mb-2 tracking-tight">Project Unifier AI</h3>
                     <p className="text-slate-500 text-sm leading-relaxed">
                       Seu copiloto de engenharia está pronto.
                     </p>
                   </div>
                 </>
               )}
               
               {/* Dynamic Suggestion Area */}
               <div className="w-full max-w-2xl min-h-[180px] flex items-center justify-center">
                 
                 {/* 1. Botão Inicial */}
                 {!isGeneratingSuggestions && suggestions.length === 0 && (
                   <div className="text-center space-y-3">
                     <button 
                       onClick={generateSuggestions}
                       className="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-2xl shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 overflow-hidden"
                     >
                       <span className="relative z-10 flex items-center gap-2">
                         <span>✨</span> Gerar Insights
                       </span>
                       <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       {/* Background Shimmer Effect */}
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
                     </button>
                     <p className="text-[10px] text-slate-600 font-medium">Gera 4 sugestões rápidas baseadas no seu código</p>
                   </div>
                 )}

                 {/* 2. Estado de Carregamento EXTRAVAGANTE (Apenas aqui) */}
                 {isGeneratingSuggestions && (
                   <QuantumNexusLoader />
                 )}

                 {/* 3. Grid de Sugestões (Resultados) */}
                 {!isGeneratingSuggestions && suggestions.length > 0 && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                     {suggestionsTransition((style, suggestion) => (
                       <animated.button
                         style={style}
                         onClick={() => startAnalysis(suggestion)}
                         className="p-5 bg-[#1e1e24] hover:bg-indigo-900/10 border border-white/5 hover:border-indigo-500/40 rounded-2xl text-left transition-all group relative overflow-hidden"
                       >
                         <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <div className="relative z-10">
                           <span className="block text-xl mb-2 grayscale group-hover:grayscale-0 transition-all">✨</span>
                           <span className="text-sm font-medium text-slate-300 group-hover:text-indigo-200 leading-snug block">
                             {suggestion}
                           </span>
                         </div>
                       </animated.button>
                     ))}
                   </div>
                 )}
               </div>

               {/* Botões Estáticos de Apoio */}
               {suggestions.length === 0 && !isGeneratingSuggestions && (
                 <div className="grid grid-cols-2 gap-3 w-full max-w-md opacity-60 hover:opacity-100 transition-opacity">
                   <button onClick={() => setTemplateModalOpen(true)} className="px-4 py-3 bg-[#13141c] hover:bg-[#1e1e24] border border-white/5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-300 transition-all">
                      Ver Templates
                   </button>
                   <button onClick={() => startAnalysis("Faça um resumo executivo deste projeto.")} className="px-4 py-3 bg-[#13141c] hover:bg-[#1e1e24] border border-white/5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-300 transition-all">
                      Resumo Simples
                   </button>
                 </div>
               )}
            </div>
          ) : (
            <div className="space-y-4">
              {msgTransitions((style, msg) => (
                <ChatMessageItem 
                  key={msg.timestamp} 
                  message={msg} 
                  style={style} 
                  onFavorite={props.onToggleFavorite}
                  isFavorite={props.favorites.some(f => f.content === msg.text)}
                />
              ))}
              
              {/* ÁREA DE ANIMAÇÃO DE RESPOSTA (Chat Normal) */}
              {(isAnalyzing || currentResponse) && (
                <div className="flex justify-start w-full animate-in fade-in pl-4">
                  <div className="max-w-[85%] w-full">
                     {!currentResponse && (
                       // Uso do Loader Sutil para conversas contínuas
                       <StandardChatLoader />
                     )}
                     
                     {currentResponse && (
                       <div className="prose prose-invert prose-p:leading-7 max-w-none text-slate-300">
                          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(currentResponse) as string) }} />
                       </div>
                     )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Input Capsule */}
        <div className="absolute bottom-6 left-0 right-0 px-4 z-20 flex justify-center">
          <div className="w-full max-w-3xl relative">
            
            {/* Attachments Pill */}
            {stagedAttachments.length > 0 && (
              <div className="absolute -top-14 left-0 flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full">
                {stagedAttachments.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 bg-[#1e1e24] border border-white/10 text-slate-200 text-xs py-2 px-4 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-2">
                    <span className="truncate max-w-[120px]">{file.name}</span>
                    <button onClick={() => setStagedAttachments(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-400 transition-colors ml-1">✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative flex items-end gap-2 bg-[#1e1e24] rounded-[2rem] p-2 shadow-2xl shadow-black/50 border border-white/5 focus-within:border-indigo-500/50 transition-all">
              
              <button 
                 onClick={() => setTemplateModalOpen(true)}
                 className="p-3 text-indigo-400 hover:text-white hover:bg-white/5 rounded-full transition-colors flex-shrink-0"
                 title="Templates & Ações"
              >
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-colors flex-shrink-0"
                title="Anexar arquivos"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              </button>

              <textarea
                ref={textareaRef}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                placeholder="Pergunte sobre seu código..."
                className="w-full bg-transparent border-none text-slate-200 placeholder-slate-500 focus:ring-0 py-3.5 max-h-[150px] overflow-y-auto resize-none scrollbar-hide leading-relaxed text-sm"
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
                   <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                )}
              </button>
            </div>
            
            <p className="text-center text-[10px] text-slate-600 mt-2 font-medium opacity-60">
              O Gemini pode cometer erros. Verifique informações importantes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisPanel;
