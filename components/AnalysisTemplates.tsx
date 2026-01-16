
import React from 'react';
import { ANALYSIS_TEMPLATES } from '../constants';
import { useTrail, animated, config } from 'react-spring';

interface AnalysisTemplatesProps {
  onSelect: (prompt: string) => void;
}

const AnalysisTemplates: React.FC<AnalysisTemplatesProps> = ({ onSelect }) => {
  const trail = useTrail(ANALYSIS_TEMPLATES.length, {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: config.stiff,
    delay: 100
  });

  return (
    <div className="max-w-4xl mx-auto w-full p-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-indigo-500/30">
          ✨
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Como posso ajudar com este código?</h3>
        <p className="text-slate-400 text-sm">Escolha um template de análise ou inicie uma conversa livre.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trail.map((style, index) => {
          const t = ANALYSIS_TEMPLATES[index];
          return (
            <animated.button
              key={t.id}
              style={style}
              onClick={() => onSelect(t.prompt)}
              className="group relative p-5 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700 hover:border-indigo-500/50 rounded-2xl text-left transition-all duration-300 hover:shadow-lg hover:shadow-indigo-900/20"
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl p-3 bg-slate-900 rounded-xl border border-slate-700 group-hover:scale-110 transition-transform duration-300">
                  {t.icon}
                </span>
                <div>
                  <p className="font-bold text-sm text-slate-200 group-hover:text-white mb-1 transition-colors">
                    {t.name}
                  </p>
                  <p className="text-xs text-slate-500 group-hover:text-slate-400 leading-relaxed">
                    {t.description}
                  </p>
                </div>
              </div>
            </animated.button>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisTemplates;
