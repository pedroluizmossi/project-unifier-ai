
import React, { useState, useRef, useEffect } from 'react';
import { ANALYSIS_TEMPLATES } from '../constants';
import { performProjectAnalysis } from '../services/geminiService';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface AIAnalysisPanelProps {
  context: string;
  diffContext?: string;
  onClose: () => void;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ context, diffContext, onClose }) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'chat'>('templates');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const resultEndRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    resultEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    if (analysisResult && (window as any).mermaid) {
      const timer = setTimeout(() => {
        (window as any).mermaid.contentLoaded();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [analysisResult]);

  const startAnalysis = async (prompt: string) => {
    if (!context) return;
    setIsAnalyzing(true);
    setAnalysisResult('');
    setActiveTab('chat');
    
    try {
      await performProjectAnalysis(context, prompt, (chunk) => {
        setAnalysisResult(prev => prev + chunk);
      }, diffContext);
    } catch (err: any) {
      setAnalysisResult(`### ⚠️ Erro na Análise\n${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = async () => {
    if (!analysisResult) return;
    try {
      await navigator.clipboard.writeText(analysisResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const renderedMarkdown = () => {
    const rawHtml = marked.parse(analysisResult || '_Pronto para analisar seu código._');
    return { __html: DOMPurify.sanitize(rawHtml as string) };
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 shadow-2xl animate-in fade-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-xl">✨</div>
          <div>
            <h2 className="font-black text-sm text-white uppercase tracking-tight">Cérebro Gemini</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{diffContext ? 'MR Mode Active' : 'Project Mode'}</p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
          <button onClick={() => setActiveTab('templates')} className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${activeTab === 'templates' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Templates</button>
          <button onClick={() => setActiveTab('chat')} className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Insights</button>
        </div>

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 gap-3">
            {ANALYSIS_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => startAnalysis(tmpl.prompt)}
                disabled={isAnalyzing}
                className="text-left p-4 bg-slate-800/40 border border-slate-700/30 rounded-2xl hover:border-indigo-500/50 hover:bg-slate-800 transition-all group disabled:opacity-50"
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl p-2 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform">{tmpl.icon}</div>
                  <div>
                    <h4 className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors text-xs">{tmpl.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{tmpl.description}</p>
                  </div>
                </div>
              </button>
            ))}

            <div className="pt-4 border-t border-slate-800 mt-2">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Pergunta Personalizada</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ex: Como posso refatorar o módulo X?"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 min-h-[100px] resize-none"
              />
              <button
                onClick={() => startAnalysis(customPrompt)}
                disabled={isAnalyzing || !customPrompt.trim()}
                className="mt-3 w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20"
              >
                {isAnalyzing ? 'Processando...' : '🚀 Analisar Agora'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="space-y-4 relative" ref={contentRef}>
            {analysisResult && !isAnalyzing && (
              <button onClick={handleCopy} className={`absolute top-0 right-0 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase transition-all z-20 ${copied ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-400'}`}>
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            )}

            {isAnalyzing && !analysisResult && (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                <div className="relative">
                   <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center text-xl">🧠</div>
                </div>
                <div>
                  <p className="text-white font-black text-sm uppercase tracking-tighter">Gerando Insights Profundos</p>
                  <p className="text-[10px] text-slate-500 mt-2 px-8 leading-relaxed italic">"Simulando caminhos de execução e verificando padrões de segurança..."</p>
                </div>
              </div>
            )}
            
            <div className="prose prose-invert prose-slate max-w-none text-xs leading-relaxed prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-2xl" 
                 dangerouslySetInnerHTML={renderedMarkdown()} />
            <div ref={resultEndRef} className="h-20" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisPanel;
