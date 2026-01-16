
import React, { useState, useMemo } from 'react';
import { FileInfo } from '../types';
import { useSpring, animated, config, useTransition } from 'react-spring';
import { buildFileTree, FileNode, calculateTokens, formatBytes } from '../lib/utils';

interface FileExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredFiles: FileInfo[]; // Usado para a árvore
  allFiles: FileInfo[];      // Usado para seleções globais
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  langFilter: string;
  setLangFilter: (lang: string) => void;
  availableLanguages: string[];
  toggleFileSelection: (path: string) => void;
  handleBulkAction: (action: 'select_filtered' | 'deselect_filtered' | 'all' | 'none') => void;
  totalSelected: number;
  totalTokens: number;
  onSelectNewDirectory?: () => void; // Nova prop para trocar de diretório
}

const FileExplorerModal: React.FC<FileExplorerModalProps> = ({ 
  isOpen, onClose, filteredFiles, searchTerm, setSearchTerm, 
  langFilter, setLangFilter, availableLanguages, toggleFileSelection, 
  handleBulkAction, totalSelected, totalTokens, onSelectNewDirectory
}) => {
  
  const fileTree = useMemo(() => buildFileTree(filteredFiles), [filteredFiles]);

  const modalSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'scale(1) translateY(0px)' : 'scale(0.95) translateY(20px)',
    pointerEvents: isOpen ? 'auto' : 'none' as any,
    config: config.stiff
  });

  const handleToggleDirectory = (node: FileNode, selected: boolean) => {
    const pathsToToggle: string[] = [];
    const collectPaths = (n: FileNode) => {
      if (n.kind === 'file') {
        if (n.fileInfo?.selected !== selected) pathsToToggle.push(n.path);
      } else {
        n.children?.forEach(collectPaths);
      }
    };
    collectPaths(node);
    pathsToToggle.forEach(p => toggleFileSelection(p));
  };

  return (
    <animated.div style={{ opacity: modalSpring.opacity, pointerEvents: modalSpring.pointerEvents }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <animated.div style={modalSpring} className="bg-[#0f1117] w-full max-w-7xl h-[90vh] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Superior: Busca e Título */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-[#13141c]">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-2xl border border-indigo-500/30">📂</div>
             <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Workspace Architect</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Curadoria de Contexto para Gemini</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
            {onSelectNewDirectory && (
               <button 
                 onClick={() => { onSelectNewDirectory(); onClose(); }} 
                 className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-700"
               >
                 <span>📁</span> Trocar Pasta
               </button>
            )}
            <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          
          {/* Coluna Esquerda: Filtros e Stats */}
          <div className="w-80 border-r border-white/5 bg-[#13141c]/50 p-8 flex flex-col space-y-8 overflow-y-auto scrollbar-hide">
            
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Filtros Ativos</label>
               <input 
                 type="text" 
                 value={searchTerm} 
                 onChange={(e) => setSearchTerm(e.target.value)} 
                 placeholder="Buscar por nome ou caminho..." 
                 className="w-full bg-[#1e1e24] border border-white/5 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none" 
               />
               <select 
                 value={langFilter} 
                 onChange={(e) => setLangFilter(e.target.value)} 
                 className="w-full bg-[#1e1e24] border border-white/5 rounded-xl py-3 px-4 text-xs text-white font-bold outline-none"
               >
                 <option value="all">Todas as Stacks</option>
                 {availableLanguages.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
               </select>
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Métricas de Contexto</label>
               <div className="grid grid-cols-1 gap-2">
                  <StatItem label="Arquivos" value={totalSelected} />
                  <StatItem label="Volume" value={formatBytes(filteredFiles.reduce((acc, f) => acc + (f.size_kb * 1024), 0))} />
                  <StatItem label="Tokens" value={totalTokens.toLocaleString()} isIndigo />
               </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Ações Rápidas</label>
              <button onClick={() => handleBulkAction('select_filtered')} className="w-full py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/30 transition-all active:scale-95">Selecionar Todos</button>
              <button onClick={() => handleBulkAction('deselect_filtered')} className="w-full py-3 bg-slate-800/40 hover:bg-slate-800/60 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all active:scale-95">Desmarcar Tudo</button>
            </div>
          </div>

          {/* Coluna Direita: Árvore Hierárquica */}
          <div className="flex-1 bg-[#0f1117] p-8 overflow-y-auto scrollbar-hide">
            <div className="space-y-1">
               {fileTree.length > 0 ? (
                 fileTree.map(node => (
                   <TreeNode 
                    key={node.path} 
                    node={node} 
                    onToggleFile={toggleFileSelection} 
                    onToggleDir={handleToggleDirectory} 
                   />
                 ))
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-40 py-20">
                    <span className="text-4xl">🔍</span>
                    <p className="text-xs font-black uppercase tracking-widest">Nenhum arquivo corresponde aos filtros</p>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Rodapé: Confirmação */}
        <div className="p-8 border-t border-white/5 bg-[#13141c] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
               {availableLanguages.slice(0, 5).map(lang => (
                 <div key={lang} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-[#13141c] flex items-center justify-center text-[8px] font-black text-slate-400 uppercase">{lang.slice(0, 2)}</div>
               ))}
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Arquitetura detectada: {availableLanguages.join(', ')}</span>
          </div>
          <button 
            onClick={onClose} 
            className="px-12 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-200 active:scale-95 transition-all flex items-center gap-3"
          >
            <span>Confirmar Contexto</span>
            <span>➔</span>
          </button>
        </div>
      </animated.div>
    </animated.div>
  );
};

const StatItem = ({ label, value, isIndigo }: any) => (
  <div className={`p-3 rounded-xl border ${isIndigo ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-white/5 border-white/5'}`}>
    <p className="text-[8px] font-black text-slate-500 uppercase mb-1">{label}</p>
    <p className={`text-sm font-black ${isIndigo ? 'text-indigo-400' : 'text-white'}`}>{value}</p>
  </div>
);

const TreeNode: React.FC<{ 
  node: FileNode; 
  depth?: number; 
  onToggleFile: (path: string) => void;
  onToggleDir: (node: FileNode, selected: boolean) => void;
}> = ({ node, depth = 0, onToggleFile, onToggleDir }) => {
  const [isOpen, setIsOpen] = useState(depth === 0);
  const isDirectory = node.kind === 'directory';
  const isSelected = node.kind === 'file' ? node.fileInfo?.selected : node.children?.every(c => c.kind === 'file' ? c.fileInfo?.selected : false);
  const isPartial = !isSelected && isDirectory && node.children?.some(c => c.kind === 'file' ? c.fileInfo?.selected : false);

  const toggleOpen = () => isDirectory && setIsOpen(!isOpen);

  const getIcon = () => {
    if (isDirectory) return isOpen ? '📂' : '📁';
    const ext = node.name.split('.').pop()?.toLowerCase();
    switch(ext) {
      case 'ts': case 'tsx': return '🔷';
      case 'js': case 'jsx': return '🟨';
      case 'json': return '📋';
      case 'md': return '📝';
      case 'css': return '🎨';
      case 'html': return '🌐';
      default: return '📄';
    }
  };

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-3 py-1.5 px-3 rounded-lg cursor-pointer transition-colors group ${
          node.kind === 'file' && node.fileInfo?.selected ? 'bg-indigo-500/10' : 'hover:bg-white/5'
        }`}
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
        onClick={toggleOpen}
      >
        {/* Toggle Arrow */}
        <div className="w-4 flex items-center justify-center">
          {isDirectory && (
            <span className={`text-[8px] transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
          )}
        </div>

        {/* Checkbox Custom */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (isDirectory) onToggleDir(node, !isSelected);
            else onToggleFile(node.path);
          }}
          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
            isSelected ? 'bg-indigo-600 border-indigo-600' : isPartial ? 'bg-indigo-900 border-indigo-700' : 'bg-slate-900 border-slate-700 group-hover:border-slate-500'
          }`}
        >
          {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
          {isPartial && <div className="w-1.5 h-0.5 bg-white rounded-full"></div>}
        </div>

        <span className="text-base flex-shrink-0">{getIcon()}</span>
        
        <span className={`text-[11px] font-medium flex-1 truncate ${
          node.kind === 'file' ? (node.fileInfo?.selected ? 'text-indigo-300' : 'text-slate-400') : 'text-slate-200'
        }`}>
          {node.name}
        </span>

        {node.kind === 'file' && (
          <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[9px] font-mono text-slate-600 uppercase">
              {Math.ceil((node.fileInfo?.content?.length || 0) / 4).toLocaleString()} tkn
            </span>
            <span className="text-[9px] font-mono text-slate-700">
              {formatBytes((node.fileInfo?.size_kb || 0) * 1024)}
            </span>
          </div>
        )}
      </div>

      {isDirectory && isOpen && node.children && (
        <div className="mt-0.5">
          {node.children.map(child => (
            <TreeNode 
              key={child.path} 
              node={child} 
              depth={depth + 1} 
              onToggleFile={onToggleFile} 
              onToggleDir={onToggleDir} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileExplorerModal;
