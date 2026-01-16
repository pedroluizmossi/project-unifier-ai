import React, { useState } from 'react';
import { ANALYSIS_TEMPLATES } from '../constants';
import { AnalysisTemplate } from '../types';
import { generateAdaptiveTemplates } from '../services/geminiService';
import { useTransition, animated, config } from 'react-spring';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (prompt: string) => void;
  projectContext: string;
}

const TemplateSelectorModal: React.FC<TemplateSelectorModalProps> = ({ isOpen, onClose, onSelect, projectContext }) => {
  const [mode, setMode] = useState<'standard' | 'adaptive'>('standard');
  const [adaptiveTemplates, setAdaptiveTemplates] = useState<AnalysisTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Usando useTransition para desmontagem correta do componente e animação do backdrop
  const transitions = useTransition(isOpen, {
    from: { opacity: 0, transform: 'scale(0.95)' },
    enter: { opacity: 1, transform: 'scale(1)' },
    leave: { opacity: 0, transform: 'scale(0.95)' },
    config: config.stiff
  });

  const handleGenerateAdaptive = async () => {
    setIsLoading(true);
    try {
      const templates = await generateAdaptiveTemplates(projectContext);
      setAdaptiveTemplates(templates);
      setHasGenerated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (prompt: string) => {
    onClose();
    // Pequeno delay para permitir que a UI comece a fechar antes de travar a thread com processamento, se houver
    setTimeout(() => onSelect(prompt), 0);
  };

  return transitions((style, item) => item && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop animado com opacidade */}
      <animated.div 
        style={{ opacity: style.opacity }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      {/* Modal content animado com transform e opacidade */}
      <animated.div 
        style={style} 
        className="relative bg-slate-900 w-full max-w-4xl h-[80vh] rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
      >
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Hub de Templates</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Selecione ou gere estratégias de análise</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all">
             ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 bg-slate-900 border-b border-slate-800">
          <button 
            onClick={() => setMode('standard')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'standard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Padrão
          </button>
          <button 
            onClick={() => setMode('adaptive')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'adaptive' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            IA Adaptativa ✨
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
          {mode === 'standard' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ANALYSIS_TEMPLATES.map(t => (
                <TemplateCard key={t.id} template={t} onClick={() => handleSelect(t.prompt)} />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {!hasGenerated && !isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                  <div className="w-20 h-20 bg-indigo-600/20 text-indigo-400 rounded-3xl flex items-center justify-center text-4xl border border-indigo-500/30">
                    🧬
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Análise Contextual Profunda</h3>
                    <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">
                      A IA irá ler o contexto do seu projeto e criar 3 templates de prompt otimizados especificamente para a sua stack e estrutura.
                    </p>
                  </div>
                  <button 
                    onClick={handleGenerateAdaptive}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-3"
                  >
                    <span>Gerar Templates</span>
                    <span>✨</span>
                  </button>
                </div>
              )}

              {isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-widest animate-pulse">Analisando DNA do código...</p>
                </div>
              )}

              {hasGenerated && (
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Sugestões Geradas</p>
                       <button onClick={handleGenerateAdaptive} className="text-[10px] text-slate-500 hover:text-white underline">Regerar</button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {adaptiveTemplates.map(t => (
                        <TemplateCard key={t.id} template={t} onClick={() => handleSelect(t.prompt)} highlight />
                      ))}
                    </div>
                 </div>
              )}
            </div>
          )}
        </div>
      </animated.div>
    </div>
  ));
};

interface TemplateCardProps {
  template: AnalysisTemplate;
  onClick: () => void;
  highlight?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onClick, highlight }) => (
  <button
    onClick={onClick}
    className={`group relative p-5 rounded-2xl text-left transition-all duration-300 hover:shadow-lg flex items-start gap-4 border ${
      highlight 
        ? 'bg-emerald-900/10 border-emerald-500/30 hover:bg-emerald-900/20 hover:border-emerald-500/50' 
        : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700 hover:border-indigo-500/50 hover:shadow-indigo-900/20'
    }`}
  >
    <span className={`text-2xl p-3 rounded-xl border group-hover:scale-110 transition-transform duration-300 ${
       highlight ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-slate-900 border-slate-700'
    }`}>
      {template.icon}
    </span>
    <div>
      <p className={`font-bold text-sm mb-1 transition-colors ${highlight ? 'text-emerald-100 group-hover:text-emerald-50' : 'text-slate-200 group-hover:text-white'}`}>
        {template.name}
      </p>
      <p className="text-xs text-slate-500 group-hover:text-slate-400 leading-relaxed">
        {template.description}
      </p>
    </div>
  </button>
);

export default TemplateSelectorModal;