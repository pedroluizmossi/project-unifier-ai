
import React from 'react';
import { FileInfo, OutputFormat } from '../types';
import { formatBytes } from '../lib/utils';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useTrail, animated, useSpring, config } from 'react-spring';

interface DashboardProps {
  files: FileInfo[];
  stats: { tokens: number; text: number };
  availableLanguages: string[];
  isGeneratingSummary: boolean;
  projectSummary: string;
  onGenerateSummary: () => void;
  outputContent: string;
  outputFormat: OutputFormat;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  files, stats, availableLanguages, isGeneratingSummary, 
  projectSummary, onGenerateSummary, outputContent, outputFormat 
}) => {
  
  // Animação dos cards de métricas (Trail)
  const metrics = [
    { title: "Arquivos", value: files.length, icon: "📁", isMono: false },
    { title: "Volume", value: formatBytes(files.reduce((acc, f) => acc + (f.size_kb * 1024), 0)), icon: "⚖️", isMono: true },
    { title: "Stacks", value: availableLanguages.length, icon: "⚡", isMono: false },
    { title: "Tokens", value: stats.tokens.toLocaleString(), icon: "🤖", isMono: true },
  ];

  const trail = useTrail(metrics.length, {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: config.gentle,
    delay: 200,
  });

  // Animação do conteúdo da IA
  const summarySpring = useSpring({
    opacity: projectSummary || isGeneratingSummary ? 1 : 0.7,
    transform: projectSummary || isGeneratingSummary ? 'scale(1)' : 'scale(0.98)',
    config: config.wobbly
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
             <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
             Arquitetura & Métricas
           </h3>
           {!projectSummary && !isGeneratingSummary && (
             <button onClick={onGenerateSummary} className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 px-4 py-1.5 rounded-full transition-all bg-indigo-500/5 hover:bg-indigo-500/20 active:scale-95">⚡ Gerar Raio-X Gemini 3</button>
           )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {trail.map((style, index) => (
             <animated.div key={index} style={style}>
               <MetricCard {...metrics[index]} />
             </animated.div>
           ))}
        </div>

        <animated.div style={summarySpring} className={`bg-indigo-950/10 border ${isGeneratingSummary ? 'border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'border-indigo-500/20'} rounded-[2.5rem] p-10 min-h-[160px] transition-colors duration-500`}>
          {!projectSummary && !isGeneratingSummary ? (
             <div className="flex flex-col items-center justify-center text-center space-y-4 py-10 opacity-50">
                <div className="text-4xl grayscale">🧠</div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Resumo Estratégico Pendente</p>
             </div>
          ) : isGeneratingSummary ? (
             <div className="flex flex-col items-center justify-center space-y-4 py-10">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">Gemini 3 Pensando...</p>
             </div>
          ) : (
             <div className="prose prose-invert prose-indigo max-w-none text-sm leading-relaxed">
                <div className="flex items-center justify-between mb-6">
                   <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Insights Raio-X</h4>
                   <button onClick={onGenerateSummary} className="text-[8px] font-black text-slate-600 hover:text-indigo-400 uppercase transition-colors">🔄 Atualizar</button>
                </div>
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(projectSummary) as string) }} />
             </div>
          )}
        </animated.div>
      </div>

      <div className="bg-slate-900/30 rounded-[2.5rem] border border-slate-800 overflow-hidden backdrop-blur-sm">
        <div className="bg-slate-800/30 px-8 py-4 flex items-center justify-between border-b border-slate-800">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black">preview_contexto.{outputFormat}</span>
        </div>
        <pre className="p-10 text-[11px] font-mono text-slate-400 whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto scrollbar-hide selection:bg-indigo-500/30 selection:text-white">
          {outputContent}
        </pre>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, isMono }: any) => (
  <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-[2rem] shadow-xl hover:border-indigo-500/30 transition-colors h-full flex flex-col justify-between group">
    <div className="text-indigo-500 text-xl mb-3 group-hover:scale-110 transition-transform origin-left">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</p>
      <p className={`text-2xl font-black text-white ${isMono ? 'font-mono text-indigo-400' : ''}`}>{value}</p>
    </div>
  </div>
);

export default Dashboard;
