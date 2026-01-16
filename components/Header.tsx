
import React from 'react';

interface HeaderProps {
  directoryName: string | null;
  showAI: boolean;
  setShowAI: (show: boolean) => void;
  hasFiles: boolean;
  onDownload: () => void;
}

const Header: React.FC<HeaderProps> = ({ directoryName, showAI, setShowAI, hasFiles, onDownload }) => {
  return (
    <div className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-3">
         <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,1)]"></div>
         <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-widest truncate max-w-xs">
          {directoryName || 'Workspace Vazia'}
        </h2>
      </div>
      
      <div className="flex items-center gap-3">
         <button
          onClick={() => setShowAI(!showAI)}
          disabled={!hasFiles}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 disabled:opacity-30 ${showAI ? 'bg-indigo-600 border-indigo-500 text-white shadow-2xl scale-105' : 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/10'}`}
        >
          <span>🧠</span> Gemini 3 Thinking
        </button>
        <button 
          onClick={onDownload} 
          disabled={!hasFiles} 
          className="flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl active:scale-95 disabled:opacity-30"
        >
          📁 Exportar
        </button>
      </div>
    </div>
  );
};

export default Header;
