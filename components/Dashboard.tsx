
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
    from: { opacity: 0, transform: 'translateY(10px)' },
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
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
             <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
             Métricas
           </h3>
           {!projectSummary && !isGeneratingSummary && (
             <button onClick={onGenerateSummary} className="text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full transition-all bg-indigo-500/5 hover:bg-indigo-500/20 active:scale-95">⚡ Raio-X</button>
           )}
        </div>

        {/* Grid ajustado para 2 colunas para caber no painel lateral */}
        <div className="grid grid-cols-2 gap-3">
           {trail.map((style, index) => (
             <animated.div key={index} style={style}>
               <MetricCard {...metrics[index]} />
             </animated.div>
           ))}
        </div>

        <animated.div style={summarySpring} className={`bg-indigo-950/10 border ${isGeneratingSummary ? 'border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'border-indigo-500/20'} rounded-2xl p-6 min-h-[120px] transition-colors duration-500`}>
          {!projectSummary && !isGeneratingSummary ? (
             <div className="flex flex-col items-center justify-center text-center space-y-3 py-4 opacity-50">
                <div className="text-2xl grayscale">🧠</div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Resumo Pendente</p>
             </div>
          ) : isGeneratingSummary ? (
             <div className="flex flex-col items-center justify-center space-y-3 py-4">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">Pensando...</p>
             </div>
          ) : (
             <div className="prose prose-invert prose-indigo max-w-none text-xs leading-relaxed">
                <div className="flex items-center justify-between mb-4">
                   <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">Insights Raio-X</h4>
                   <button onClick={onGenerateSummary} className="text-[8px] font-black text-slate-600 hover:text-indigo-400 uppercase transition-colors">🔄</button>
                </div>
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(projectSummary) as string) }} />
             </div>
          )}
        </animated.div>
      </div>

      <div className="bg-slate-900/30 rounded-2xl border border-slate-800 overflow-hidden backdrop-blur-sm">
        <div className="bg-slate-800/30 px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black">preview.{outputFormat}</span>
        </div>
        <pre className="p-4 text-[10px] font-mono text-slate-400 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto scrollbar-hide selection:bg-indigo-500/30 selection:text-white">
          {outputContent}
        </pre>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, isMono }: any) => (
  <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl hover:border-indigo-500/30 transition-colors flex flex-col justify-between group">
    <div className="text-indigo-500 text-base mb-2 group-hover:scale-110 transition-transform origin-left">{icon}</div>
    <div>
      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</p>
      <p className={`text-lg font-black text-white ${isMono ? 'font-mono text-indigo-400' : ''}`}>{value}</p>
    </div>
  </div>
);

export default Dashboard;
