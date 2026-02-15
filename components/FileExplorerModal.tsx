
import React, { useState, useMemo, useCallback } from 'react';
import { FileInfo } from '../types';
import { useSpring, animated, config } from 'react-spring';
import { buildFileTree, FileNode, formatBytes } from '../lib/utils';

interface FileExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredFiles: FileInfo[];
  allFiles: FileInfo[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  langFilter: string;
  setLangFilter: (lang: string) => void;
  availableLanguages: string[];
  toggleFileSelection: (path: string) => void;
  onBatchSelection: (paths: string[], selected: boolean) => void;
  handleBulkAction: (action: 'select_filtered' | 'deselect_filtered' | 'all' | 'none') => void;
  totalSelected: number;
  totalTokens: number;
  onSelectNewDirectory?: () => void;
}

// Helper para calcular o estado de seleção de um nó e seus filhos
const getNodeStatus = (node: FileNode): 'checked' | 'unchecked' | 'partial' => {
  if (node.kind === 'file') {
    return node.fileInfo?.selected ? 'checked' : 'unchecked';
  }
  
  if (!node.children || node.children.length === 0) return 'unchecked';

  let hasChecked = false;
  let hasUnchecked = false;
  let hasPartial = false;

  for (const child of node.children) {
    const status = getNodeStatus(child);
    if (status === 'checked') hasChecked = true;
    else if (status === 'unchecked') hasUnchecked = true;
    else if (status === 'partial') hasPartial = true;
  }

  if (hasPartial) return 'partial';
  if (hasChecked && hasUnchecked) return 'partial';
  if (hasChecked) return 'checked';
  return 'unchecked';
};

// Helper para coletar todos os caminhos de arquivos de um nó
const collectFilePaths = (node: FileNode): string[] => {
  if (node.kind === 'file') return [node.path];
  if (!node.children) return [];
  return node.children.flatMap(collectFilePaths);
};

// Helper para calcular tokens recursivamente
const calculateNodeTokens = (node: FileNode): number => {
  if (node.kind === 'file') {
    return Math.ceil((node.fileInfo?.content?.length || 0) / 4);
  }
  if (!node.children) return 0;
  return node.children.reduce((acc, child) => acc + calculateNodeTokens(child), 0);
};

const FileExplorerModal: React.FC<FileExplorerModalProps> = ({ 
  isOpen, onClose, filteredFiles, searchTerm, setSearchTerm, 
  langFilter, setLangFilter, availableLanguages, toggleFileSelection, 
  onBatchSelection, handleBulkAction, totalSelected, totalTokens, onSelectNewDirectory
}) => {
  
  const fileTree = useMemo(() => buildFileTree(filteredFiles), [filteredFiles]);

  const modalSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'scale(1) translateY(0px)' : 'scale(0.95) translateY(20px)',
    pointerEvents: isOpen ? 'auto' : 'none' as any,
    config: config.stiff
  });

  return (
    <animated.div style={{ opacity: modalSpring.opacity, pointerEvents: modalSpring.pointerEvents }} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
      
      <animated.div style={modalSpring} className="relative bg-[#0d0e12] w-full max-w-7xl h-[90vh] rounded-[2rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
        
        {/* Header Cyberpunk */}
        <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#13141c] relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
           <div className="flex items-center gap-5 relative z-10">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-xl shadow-[0_0_15px_rgba(79,70,229,0.5)] border border-indigo-400">
                📂
              </div>
              <div>
                 <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans">
                    Explorador de Arquivos
                 </h2>
                 <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">
                    Project Context Manager v3.1
                 </p>
              </div>
           </div>

           <div className="flex items-center gap-4 relative z-10">
              {onSelectNewDirectory && (
                 <button 
                   onClick={() => { onSelectNewDirectory(); onClose(); }}
                   className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-300 transition-all hover:text-white"
                 >
                   Carregar Outra Pasta
                 </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
           
           {/* Sidebar de Filtros */}
           <div className="w-80 bg-[#0f1117] border-r border-white/5 p-6 flex flex-col gap-6 overflow-y-auto">
              {/* Search Box */}
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Busca Neural</label>
                 <div className="relative group">
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Filtrar arquivos..."
                      className="w-full bg-[#1e1e24] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    />
                    <svg className="w-4 h-4 text-slate-500 absolute left-3 top-3 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
              </div>

              {/* Language Filter */}
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Stack Tecnológica</label>
                 <div className="grid grid-cols-2 gap-2">
                    <button 
                       onClick={() => setLangFilter('all')}
                       className={`py-2 px-3 rounded-lg text-[10px] font-bold uppercase transition-all border ${langFilter === 'all' ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' : 'bg-[#1e1e24] border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                       Tudo
                    </button>
                    {availableLanguages.map(lang => (
                       <button 
                         key={lang}
                         onClick={() => setLangFilter(lang)}
                         className={`py-2 px-3 rounded-lg text-[10px] font-bold uppercase transition-all border truncate ${langFilter === lang ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' : 'bg-[#1e1e24] border-transparent text-slate-500 hover:text-slate-300'}`}
                       >
                         {lang}
                       </button>
                    ))}
                 </div>
              </div>

              {/* Stats Cards */}
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Payload de Contexto</label>
                 <div className="p-4 bg-gradient-to-br from-[#1e1e24] to-[#13141c] rounded-xl border border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] text-slate-400">Selecionados</span>
                       <span className="text-xs font-mono font-bold text-white">{totalSelected}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] text-slate-400">Tokens Estimados</span>
                       <span className="text-xs font-mono font-bold text-indigo-400">{totalTokens.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500" style={{ width: `${Math.min((totalTokens / 100000) * 100, 100)}%` }}></div>
                    </div>
                    <p className="text-[8px] text-slate-600 text-center pt-1">Limite recomendado: ~32k tokens (Flash) / ~1M (Pro)</p>
                 </div>
              </div>

              {/* Bulk Actions */}
              <div className="mt-auto space-y-2">
                 <button onClick={() => handleBulkAction('select_filtered')} className="w-full py-3 bg-white/5 hover:bg-white/10 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">
                    Selecionar Visíveis
                 </button>
                 <button onClick={() => handleBulkAction('deselect_filtered')} className="w-full py-3 bg-white/5 hover:bg-white/10 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">
                    Desmarcar Visíveis
                 </button>
              </div>
           </div>

           {/* Main Tree View */}
           <div className="flex-1 bg-[#0a0b10] p-6 overflow-y-auto scrollbar-hide relative">
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#0a0b10] to-[#0a0b10]"></div>
              
              <div className="relative z-10 space-y-1 pb-20">
                 {fileTree.length > 0 ? (
                    fileTree.map(node => (
                       <FileTreeNode 
                          key={node.path} 
                          node={node} 
                          onToggleFile={toggleFileSelection}
                          onBatchSelection={onBatchSelection}
                       />
                    ))
                 ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-600">
                       <span className="text-4xl mb-4 opacity-50">🕸️</span>
                       <p className="text-xs font-black uppercase tracking-widest">Nenhum arquivo encontrado</p>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="h-16 bg-[#13141c] border-t border-white/5 flex items-center justify-end px-8 gap-4">
           <span className="text-[10px] text-slate-500 font-mono">
              {filteredFiles.length} arquivos totais na view
           </span>
           <button 
              onClick={onClose}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-2"
           >
              <span>Confirmar Seleção</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
           </button>
        </div>
      </animated.div>
    </animated.div>
  );
};

// Componente Recursivo da Árvore
const FileTreeNode: React.FC<{ 
  node: FileNode; 
  depth?: number; 
  onToggleFile: (path: string) => void;
  onBatchSelection: (paths: string[], selected: boolean) => void;
}> = ({ node, depth = 0, onToggleFile, onBatchSelection }) => {
  // Alterado: Default false para vir recolhido
  const [isExpanded, setIsExpanded] = useState(false); 
  
  const status = getNodeStatus(node);
  const isDirectory = node.kind === 'directory';

  // Calculando tokens do nó atual (recursivo para pastas)
  const tokenCount = useMemo(() => calculateNodeTokens(node), [node]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDirectory) {
      const targetState = status !== 'checked';
      const allPaths = collectFilePaths(node);
      onBatchSelection(allPaths, targetState);
    } else {
      onToggleFile(node.path);
    }
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDirectory) setIsExpanded(!isExpanded);
  };

  const getIcon = () => {
    if (isDirectory) return isExpanded ? '📂' : '📁';
    const ext = node.name.split('.').pop()?.toLowerCase();
    switch(ext) {
      case 'ts': case 'tsx': return 'TS';
      case 'js': case 'jsx': return 'JS';
      case 'json': return '{}';
      case 'css': case 'scss': return '#';
      case 'html': return '<>';
      case 'md': return 'MD';
      case 'py': return 'PY';
      case 'go': return 'GO';
      case 'java': return 'JV';
      default: return '📄';
    }
  };

  return (
    <div>
      <div 
        onClick={isDirectory ? toggleExpand : handleToggle}
        className={`
          group flex items-center gap-3 py-1.5 px-3 rounded-lg cursor-pointer transition-all border border-transparent select-none
          ${status === 'checked' ? 'bg-indigo-500/10 border-indigo-500/20' : 'hover:bg-white/5 hover:border-white/5'}
        `}
        style={{ marginLeft: `${depth * 16}px` }}
      >
        {/* Indent Guide Line (para niveis profundos) */}
        {depth > 0 && <div className="absolute left-0 w-px h-full bg-white/5" style={{ left: `${(depth * 16)}px` }}></div>}

        {/* Expander Arrow - MELHORADO: Maior e com background */}
        <div 
          onClick={isDirectory ? toggleExpand : undefined}
          className={`
            w-6 h-6 flex items-center justify-center text-[10px] rounded transition-all mr-1
            ${isDirectory ? 'hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer' : 'opacity-0 pointer-events-none'}
          `}
        >
           <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
             ▶
           </span>
        </div>

        {/* Checkbox Customizado */}
        <div 
           onClick={handleToggle}
           className={`
             w-4 h-4 rounded flex items-center justify-center border transition-all shadow-sm flex-shrink-0
             ${status === 'checked' ? 'bg-indigo-500 border-indigo-500 text-white' : 
               status === 'partial' ? 'bg-indigo-900 border-indigo-700 text-indigo-300' : 
               'bg-slate-900 border-slate-700 group-hover:border-slate-500'}
           `}
        >
           {status === 'checked' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
           {status === 'partial' && <div className="w-2 h-0.5 bg-current rounded-full"></div>}
        </div>

        {/* Icon */}
        <div className={`
           w-6 h-6 rounded flex items-center justify-center text-[9px] font-black font-mono flex-shrink-0
           ${isDirectory ? 'text-amber-400' : 'text-slate-400 bg-white/5'}
        `}>
           {getIcon()}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0 mr-4">
           <p className={`text-xs truncate ${status === 'checked' ? 'text-indigo-200 font-medium' : 'text-slate-300'}`}>
             {node.name}
           </p>
        </div>

        {/* Metadata (Tokens & Size) - Agora visível também para diretórios e sempre ativo */}
        <div className="flex items-center gap-2">
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isDirectory ? 'text-slate-500' : 'text-slate-400 bg-black/20'}`}>
              {tokenCount > 0 ? `${tokenCount.toLocaleString()} tkn` : '-'}
            </span>
            {!isDirectory && (
              <span className="text-[9px] font-mono text-slate-600 w-16 text-right hidden sm:block">
                {formatBytes((node.fileInfo?.size_kb || 0) * 1024)}
              </span>
            )}
        </div>
      </div>

      {/* Children */}
      {isDirectory && isExpanded && node.children && (
        <div className="relative">
           {/* Vertical Guide Line for Children */}
           <div className="absolute top-0 bottom-0 w-px bg-white/5" style={{ left: `${(depth * 16) + 31}px` }}></div>
           {node.children.map(child => (
              <FileTreeNode 
                 key={child.path} 
                 node={child} 
                 depth={depth + 1} 
                 onToggleFile={onToggleFile}
                 onBatchSelection={onBatchSelection}
              />
           ))}
        </div>
      )}
    </div>
  );
};

export default FileExplorerModal;
