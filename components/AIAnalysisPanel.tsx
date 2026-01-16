
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

  const scrollToBottom = () => {
    resultEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [analysisResult]);

  const handleTemplateClick = async (prompt: string) => {
    startAnalysis(prompt);
  };

  const handleCustomAnalysis = async () => {
    if (!customPrompt.trim()) return;
    startAnalysis(customPrompt);
  };

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
      console.error('Failed to copy text: ', err);
    }
  };

  const renderedMarkdown = () => {
    const rawHtml = marked.parse(analysisResult || '_Selecione um template ou peça uma análise customizada para começar._');
    return { __html: DOMPurify.sanitize(rawHtml as string) };
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 shadow-2xl animate-in fade-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-xl">✨</span>
          </div>
          <div>
            <h2 className="font-bold text-lg text-white leading-none">Análise Inteligente</h2>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-1">
              {diffContext ? 'Merge Request Mode' : 'Full Project Mode'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
          <button onClick={() => setActiveTab('templates')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'templates' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Templates</button>
          <button onClick={() => setActiveTab('chat')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Insights</button>
        </div>

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 gap-4">
            {diffContext && (
               <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex gap-3 items-center">
                  <span className="text-2xl">⚡</span>
                  <p className="text-xs text-green-200 leading-tight">
                    <span className="font-bold block text-white uppercase mb-1">Diferencial Carregado</span>
                    A análise focará na comparação entre as mudanças e o código base.
                  </p>
               </div>
            )}
            
            <div className="grid grid-cols-1 gap-4">
              {ANALYSIS_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleTemplateClick(tmpl.prompt)}
                  disabled={isAnalyzing}
                  className="text-left p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl hover:border-indigo-500/50 hover:bg-slate-800 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl group-hover:scale-110 transition-transform">{tmpl.icon}</div>
                    <div>
                      <h4 className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors text-sm">{tmpl.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{tmpl.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Prompt Customizado</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ex: Como este diff altera a segurança das rotas?"
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
              />
              <button
                onClick={handleCustomAnalysis}
                disabled={isAnalyzing || !customPrompt.trim()}
                className="mt-4 w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                {isAnalyzing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : '🚀 Analisar'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="space-y-4 relative">
            {analysisResult && !isAnalyzing && (
              <button onClick={handleCopy} className={`absolute top-0 right-0 p-2 rounded-lg border transition-all flex items-center gap-2 text-[10px] font-bold z-10 ${copied ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'}`}>
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            )}

            {isAnalyzing && !analysisResult && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                <p className="text-white font-bold animate-pulse">Processando Raciocínio Profundo...</p>
                <p className="text-xs text-slate-500 mt-2 px-10">O Gemini está correlacionando o Diff com o projeto base para encontrar impactos ocultos.</p>
              </div>
            )}
            
            <div className="prose prose-invert prose-slate max-w-none text-sm text-slate-200 prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800" dangerouslySetInnerHTML={renderedMarkdown()} />
            <div ref={resultEndRef} className="h-10" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisPanel;
