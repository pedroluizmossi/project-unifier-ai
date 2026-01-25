
import React, { useMemo, useState } from 'react';
import { useSpring, animated, config } from 'react-spring';
import { PendingChange } from '../types';
import * as diff from 'diff';

interface DiffConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pendingChange: PendingChange | null;
  isLoading?: boolean;
  canWriteDirectly?: boolean;
}

const DiffConfirmationModal: React.FC<DiffConfirmationModalProps> = ({ 
  isOpen, onClose, onConfirm, pendingChange, isLoading, canWriteDirectly 
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const modalSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'scale(1)' : 'scale(0.95)',
    pointerEvents: (isOpen ? 'auto' : 'none') as any,
    config: config.stiff
  });

  // Processa as mudanças em um formato renderizável
  const diffLines = useMemo(() => {
    if (!pendingChange || isLoading) return [];
    return diff.diffLines(pendingChange.originalContent, pendingChange.newContent);
  }, [pendingChange, isLoading]);

  const handleCopy = async () => {
    if (!pendingChange?.newContent) return;
    try {
      await navigator.clipboard.writeText(pendingChange.newContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    if (!pendingChange?.newContent) return;
    const fileName = pendingChange.path.split('/').pop() || 'fixed_file.txt';
    const blob = new Blob([pendingChange.newContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!pendingChange) return null;

  let leftLineNum = 1;
  let rightLineNum = 1;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <animated.div 
        style={{ opacity: modalSpring.opacity }}
        className="absolute inset-0 bg-black/90 backdrop-blur-md" 
        onClick={onClose} 
      />

      <animated.div 
        style={modalSpring} 
        className="relative bg-[#0d0e12] w-full max-w-[95vw] h-[90vh] rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col overflow-hidden"
      >
        {/* Header Profissional */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#13141c]">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center text-xl border border-indigo-500/30">
               {isLoading ? '🤖' : '📋'}
             </div>
             <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">
                  {isLoading ? 'Processando Mudanças...' : 'Revisão de Código'}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-1 opacity-70">{pendingChange.path}</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-4 px-4 py-2 bg-black/40 rounded-full border border-white/5 mr-4">
                <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-red-500"></div>
                   <span className="text-[9px] font-bold text-slate-400 uppercase">Removido</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                   <span className="text-[9px] font-bold text-slate-400 uppercase">Adicionado</span>
                </div>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all">✕</button>
          </div>
        </div>

        {/* Área do Diff */}
        <div className="flex-1 overflow-hidden relative flex flex-col bg-[#0d0e12]">
          {isLoading && (
            <div className="absolute inset-0 z-50 bg-[#0d0e12]/80 backdrop-blur-xl flex flex-col items-center justify-center space-y-4">
               <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_40px_rgba(99,102,241,0.3)]"></div>
               <div className="text-center">
                 <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] animate-pulse">Mesclagem Neural</p>
                 <p className="text-[10px] text-slate-500 mt-2">Reconstruindo arquivo completo com Gemini Flash...</p>
               </div>
            </div>
          )}

          {/* Diff Renderer Table-style */}
          <div className="flex-1 overflow-auto scrollbar-hide font-mono text-[12px] leading-relaxed">
            <div className="min-w-full inline-block">
              {diffLines.map((part, partIdx) => {
                const lines = part.value.split('\n');
                // Remove última linha vazia do split se houver
                if (lines[lines.length - 1] === '') lines.pop();

                return lines.map((line, lineIdx) => {
                  const currentLeft = part.removed ? leftLineNum++ : (part.added ? null : leftLineNum++);
                  const currentRight = part.added ? rightLineNum++ : (part.removed ? null : rightLineNum++);
                  
                  const bgClass = part.added ? 'bg-emerald-500/10' : (part.removed ? 'bg-red-500/10' : '');
                  const textClass = part.added ? 'text-emerald-400' : (part.removed ? 'text-red-400' : 'text-slate-400');
                  const indicator = part.added ? '+' : (part.removed ? '-' : ' ');

                  return (
                    <div key={`${partIdx}-${lineIdx}`} className={`flex w-full group ${bgClass} hover:bg-white/5 transition-colors`}>
                      {/* Lado Esquerdo - Linha Original */}
                      <div className="w-12 flex-shrink-0 text-right pr-4 select-none opacity-30 text-[10px] py-0.5 border-r border-white/5 bg-black/20">
                        {currentLeft}
                      </div>
                      
                      {/* Lado Direito - Linha Nova */}
                      <div className="w-12 flex-shrink-0 text-right pr-4 select-none opacity-30 text-[10px] py-0.5 border-r border-white/5 bg-black/20">
                        {currentRight}
                      </div>

                      {/* Indicador +/- */}
                      <div className={`w-8 flex-shrink-0 flex items-center justify-center font-bold opacity-50 ${textClass}`}>
                        {indicator}
                      </div>

                      {/* Conteúdo da Linha */}
                      <div className={`flex-1 px-4 whitespace-pre py-0.5 ${textClass}`}>
                        {line}
                      </div>
                    </div>
                  );
                });
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-[#13141c] flex justify-between items-center">
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Atenção</span>
              <span className="text-[10px] text-slate-400">
                {canWriteDirectly 
                  ? 'Esta ação irá sobrescrever o arquivo original no seu disco local.' 
                  : 'Acesso direto bloqueado. Copie o código ou faça o download.'}
              </span>
           </div>
           
           <div className="flex gap-3">
              <button 
                onClick={onClose} 
                className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              
              {canWriteDirectly ? (
                <button 
                  onClick={onConfirm}
                  disabled={isLoading || !pendingChange.newContent}
                  className="px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-3"
                >
                  <span>Confirmar e Gravar</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                </button>
              ) : (
                <div className="flex gap-2">
                   <button 
                      onClick={handleDownload}
                      className="px-6 py-3 border border-white/10 hover:bg-white/5 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                      title="Baixar arquivo .txt"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      <span>Baixar</span>
                   </button>
                   <button 
                      onClick={handleCopy}
                      className={`px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-600/30 transition-all active:scale-95 flex items-center gap-2 min-w-[160px] justify-center`}
                    >
                      {isCopied ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                          <span>Copiar Código</span>
                        </>
                      )}
                   </button>
                </div>
              )}
           </div>
        </div>
      </animated.div>
    </div>
  );
};

export default DiffConfirmationModal;
