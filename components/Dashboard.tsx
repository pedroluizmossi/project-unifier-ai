
import React from 'react';
import { FileInfo, OutputFormat } from '../types';
import { formatBytes } from '../lib/utils';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

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
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
             <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
             Arquitetura & Métricas
           </h3>
           {!projectSummary && !isGeneratingSummary && (
             <button onClick={onGenerateSummary} className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 px-4 py-1.5 rounded-full transition-all bg-indigo-500/5">⚡ Gerar Raio-X Gemini 3</button>
           )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <MetricCard title="Arquivos" value={files.length} icon="📁" />
           <MetricCard title="Volume" value={formatBytes(files.reduce((acc, f) => acc + (f.size_kb * 1024), 0))} icon="⚖️" isMono />
           <MetricCard title="Stacks" value={availableLanguages.length} icon="⚡" />
           <MetricCard title="Tokens" value={stats.tokens.toLocaleString()} icon="🤖" isMono />
        </div>

        <div className={`bg-indigo-950/10 border ${isGeneratingSummary ? 'border-indigo-500 animate-pulse' : 'border-indigo-500/20'} rounded-[2.5rem] p-10 min-h-[160px]`}>
          {!projectSummary && !isGeneratingSummary ? (
             <div className="flex flex-col items-center justify-center text-center space-y-4 py-10 opacity-50">
                <div className="text-4xl">🧠</div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Resumo Estratégico Pendente</p>
             </div>
          ) : isGeneratingSummary ? (
             <div className="flex flex-col items-center justify-center space-y-4 py-10">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Gemini 3 Pensando...</p>
             </div>
          ) : (
             <div className="prose prose-invert prose-indigo max-w-none text-sm leading-relaxed animate-in fade-in duration-700">
                <div className="flex items-center justify-between mb-6">
                   <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Insights Raio-X</h4>
                   <button onClick={onGenerateSummary} className="text-[8px] font-black text-slate-600 hover:text-indigo-400 uppercase">🔄 Atualizar</button>
                </div>
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(projectSummary) as string) }} />
             </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900/30 rounded-[2.5rem] border border-slate-800 overflow-hidden">
        <div className="bg-slate-800/30 px-8 py-4 flex items-center justify-between border-b border-slate-800">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black">preview_contexto.{outputFormat}</span>
        </div>
        <pre className="p-10 text-[11px] font-mono text-slate-400 whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto scrollbar-hide">
          {outputContent}
        </pre>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, isMono }: any) => (
  <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-[2rem] shadow-xl hover:border-indigo-500/30 transition-all">
    <div className="text-indigo-500 text-xl mb-3">{icon}</div>
    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</p>
    <p className={`text-2xl font-black text-white ${isMono ? 'font-mono text-indigo-400' : ''}`}>{value}</p>
  </div>
);

export default Dashboard;
