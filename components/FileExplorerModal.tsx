
import React from 'react';
import { FileInfo } from '../types';
import { useSpring, animated, config } from 'react-spring';

interface FileExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredFiles: FileInfo[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  langFilter: string;
  setLangFilter: (lang: string) => void;
  availableLanguages: string[];
  toggleFileSelection: (path: string) => void;
  handleBulkAction: (action: 'select_filtered' | 'deselect_filtered' | 'all' | 'none') => void;
  totalSelected: number;
  totalTokens: number;
}

const FileExplorerModal: React.FC<FileExplorerModalProps> = ({ 
  isOpen, onClose, filteredFiles, searchTerm, setSearchTerm, 
  langFilter, setLangFilter, availableLanguages, toggleFileSelection, 
  handleBulkAction, totalSelected, totalTokens 
}) => {
  
  const fade = useSpring({
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? 'auto' : 'none' as any,
    config: { duration: 200 }
  });

  const scale = useSpring({
    transform: isOpen ? 'scale(1)' : 'scale(0.95)',
    opacity: isOpen ? 1 : 0,
    config: config.wobbly
  });

  if (!isOpen && fade.opacity.get() === 0) return null;

  return (
    <animated.div style={fade} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <animated.div style={scale} className="bg-slate-900 w-full max-w-6xl max-h-[92vh] rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Workspace Explorer</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 bg-slate-900/50 border-b border-slate-800 flex flex-wrap gap-6 items-end">
          <div className="flex-1 min-w-[300px]">
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Filtrar arquivos..." className="w-full bg-slate-800 border-none rounded-2xl py-4 px-6 text-sm text-white focus:ring-2 focus:ring-indigo-600 outline-none" />
          </div>
          <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)} className="w-48 bg-slate-800 border-none rounded-2xl py-4 px-6 text-sm text-white font-bold outline-none">
            <option value="all">Todas</option>
            {availableLanguages.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={() => handleBulkAction('select_filtered')} className="px-6 py-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-600/30 active:scale-95 transition-transform">Ativar</button>
            <button onClick={() => handleBulkAction('deselect_filtered')} className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-700 active:scale-95 transition-transform">Limpar</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 scrollbar-hide">
          {filteredFiles.map(file => (
            <div key={file.path} onClick={() => file.type === 'text_file' && toggleFileSelection(file.path)} className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${file.selected ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-800/20 border-slate-800 hover:border-slate-700'}`}>
              <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${file.selected ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-950 border-slate-700'}`}>
                {file.selected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="truncate flex-1">
                <p className="text-[11px] font-black text-slate-100 truncate">{file.path.split('/').pop()}</p>
                <p className="text-[8px] text-slate-500 truncate uppercase font-mono">{file.path}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex gap-8">
            <p className="text-[10px] font-black text-slate-500 uppercase">Contexto: <span className="text-white text-base ml-2">{totalSelected} arquivos</span></p>
            <p className="text-[10px] font-black text-slate-500 uppercase">Tokens: <span className="text-indigo-400 text-base ml-2">{totalTokens.toLocaleString()}</span></p>
          </div>
          <button onClick={onClose} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-indigo-500 active:scale-95 transition-all">Confirmar Workspace</button>
        </div>
      </animated.div>
    </animated.div>
  );
};

export default FileExplorerModal;
