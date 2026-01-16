
import React from 'react';

interface HeaderProps {
  directoryName: string | null;
  hasFiles: boolean;
  onDownload: () => void;
}

const Header: React.FC<HeaderProps> = ({ directoryName, hasFiles, onDownload }) => {
  return (
    <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950 sticky top-0 z-10">
      <div className="flex items-center gap-3">
         <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,1)]"></div>
         <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-widest truncate max-w-[200px]">
          {directoryName || 'Workspace Vazia'}
        </h2>
      </div>
      
      <button 
        onClick={onDownload} 
        disabled={!hasFiles} 
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all active:scale-95 disabled:opacity-30 border border-slate-700"
      >
        Exportar 📁
      </button>
    </div>
  );
};

export default Header;
