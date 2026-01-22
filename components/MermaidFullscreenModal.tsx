
import React, { useEffect, useRef, useState } from 'react';
import { useSpring, animated, config } from 'react-spring';

interface MermaidFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
}

const MermaidFullscreenModal: React.FC<MermaidFullscreenModalProps> = ({ isOpen, onClose, code }) => {
  const [zoom, setZoom] = useState(1);
  const modalRef = useRef<HTMLDivElement>(null);

  const spring = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'scale(1)' : 'scale(0.95)',
    pointerEvents: isOpen ? 'auto' : 'none' as any,
    config: config.stiff
  });

  useEffect(() => {
    if (isOpen && modalRef.current && (window as any).mermaid) {
      const target = modalRef.current.querySelector('.mermaid-modal-viewer');
      if (target) {
        setZoom(1); // Reset zoom on open
        // Pequeno delay para garantir que o container está visível
        setTimeout(() => {
          (window as any).mermaid.run({
            nodes: [target]
          });
        }, 100);
      }
    }
  }, [isOpen, code]);

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(0.5, prev + delta), 4));
  };

  if (!isOpen) return null;

  return (
    <animated.div 
      style={spring}
      className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Top Control Bar */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-10 z-50">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Visualizador Unifier</span>
          <span className="text-white text-sm font-bold opacity-80">Diagrama em Escala Real</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all flex items-center gap-2 group"
          >
            <span className="text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Fechar</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Zoom Controls (Bottom Floating) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#1e1e24]/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl z-50">
        <button onClick={() => handleZoom(-0.2)} className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all" title="Zoom Out">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg>
        </button>
        <div className="px-4 border-x border-white/5 flex flex-col items-center min-w-[80px]">
          <span className="text-[10px] font-black text-slate-500 uppercase mb-0.5">Zoom</span>
          <span className="text-xs font-mono font-bold text-white">{Math.round(zoom * 100)}%</span>
        </div>
        <button onClick={() => handleZoom(0.2)} className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all" title="Zoom In">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        </button>
        <button onClick={() => setZoom(1)} className="p-3 text-indigo-400 hover:text-white hover:bg-indigo-500/20 rounded-xl transition-all" title="Reset Zoom">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      {/* Canvas Area */}
      <div 
        className="w-full h-full overflow-auto flex items-center justify-center p-20 cursor-grab active:cursor-grabbing scrollbar-hide" 
        ref={modalRef}
      >
        <div 
          className="mermaid-modal-viewer transition-transform duration-200 ease-out origin-center bg-transparent"
          style={{ transform: `scale(${zoom})` }}
        >
          {code}
        </div>
      </div>
      
      <div className="absolute bottom-6 left-10 text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] pointer-events-none">
        Unifier AI Engine v1.0 • Diagram Rendering Mode
      </div>
    </animated.div>
  );
};

export default MermaidFullscreenModal;
