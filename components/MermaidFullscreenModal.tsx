
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useSpring, animated, config } from 'react-spring';

interface MermaidFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
}

const MermaidFullscreenModal: React.FC<MermaidFullscreenModalProps> = ({ isOpen, onClose, code }) => {
  // Estado de Transformação (Pan & Zoom)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs para cálculos de arraste
  const modalRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const spring = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'scale(1)' : 'scale(0.95)',
    pointerEvents: isOpen ? 'auto' : 'none' as any,
    config: config.stiff
  });

  // Reset e Inicialização do Mermaid
  useEffect(() => {
    if (isOpen) {
      setTransform({ x: 0, y: 0, k: 1 }); // Reset position on open
      // Pequeno timeout para garantir que o DOM do portal foi montado
      setTimeout(() => {
        if (modalRef.current && (window as any).mermaid) {
          const target = modalRef.current.querySelector('.mermaid-modal-viewer');
          if (target) {
            target.removeAttribute('data-processed'); // Força reprocessamento
            (window as any).mermaid.run({
              nodes: [target]
            });
          }
        }
      }, 50);
    }
  }, [isOpen, code]);

  // --- Lógica de Zoom ---
  const handleZoom = (delta: number) => {
    setTransform(prev => {
      const newScale = Math.min(Math.max(0.2, prev.k + delta), 5); // Limites de 0.2x a 5x
      return { ...prev, k: newScale };
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Zoom com Scroll do Mouse
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.002;
      handleZoom(delta);
    } else {
      // Pan com Scroll do Mouse se não tiver arrastando
      const zoomFactor = -e.deltaY * 0.001;
      handleZoom(zoomFactor);
    }
  };

  // --- Lógica de Pan (Arrastar) ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Apenas botão esquerdo
    setIsDragging(true);
    dragStartRef.current = { 
      x: e.clientX - transform.x, 
      y: e.clientY - transform.y 
    };
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    setTransform(prev => ({ ...prev, x: newX, y: newY }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  };

  if (!isOpen) return null;

  // Renderiza via Portal no Body para escapar do 'transform' do ChatMessageItem
  return ReactDOM.createPortal(
    <animated.div 
      style={spring}
      className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col overflow-hidden"
    >
      {/* Top Control Bar */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between px-6 md:px-10 z-50 pointer-events-none">
        <div className="flex flex-col pointer-events-auto">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Visualizador Unifier</span>
          <span className="text-white text-sm font-bold opacity-80">Canvas Infinito</span>
        </div>
        
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
            <span className="text-[10px] text-slate-400 font-mono">Scroll p/ Zoom • Arraste p/ Mover</span>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all flex items-center gap-2 group backdrop-blur-sm hover:border-red-500/30 hover:bg-red-500/10"
          >
            <span className="hidden md:block text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity text-red-400">Fechar</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Canvas Area (Infinite Pan & Zoom) */}
      <div 
        ref={containerRef}
        className="w-full h-full overflow-hidden bg-[#0f1117] cursor-grab active:cursor-grabbing relative"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid Background Pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ 
               backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', 
               backgroundSize: `${20 * transform.k}px ${20 * transform.k}px`,
               backgroundPosition: `${transform.x}px ${transform.y}px`
             }} 
        />

        <div 
          ref={modalRef}
          className="absolute top-0 left-0 origin-center will-change-transform"
          style={{ 
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            // Centralizar inicialmente
            left: '50%',
            top: '50%',
            marginTop: '-25%', // Ajuste aproximado para centralizar
            marginLeft: '-25%'
          }}
        >
          <div className="mermaid-modal-viewer text-white select-none pointer-events-none min-w-[50vw] text-center">
            {code}
          </div>
        </div>
      </div>

      {/* Floating Controls (Bottom) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#1e1e24]/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
        <button onClick={() => handleZoom(-0.25)} className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all active:scale-95" title="Zoom Out">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
        </button>
        
        <div className="px-4 border-x border-white/5 flex flex-col items-center min-w-[80px] select-none cursor-default">
          <span className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Scale</span>
          <span className="text-xs font-mono font-bold text-white">{Math.round(transform.k * 100)}%</span>
        </div>
        
        <button onClick={() => handleZoom(0.25)} className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all active:scale-95" title="Zoom In">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
        </button>
        
        <button 
          onClick={() => setTransform({ x: 0, y: 0, k: 1 })} 
          className="p-3 text-indigo-400 hover:text-white hover:bg-indigo-500/20 rounded-xl transition-all active:scale-95 ml-1 border-l border-white/5" 
          title="Reset View"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>
    </animated.div>,
    document.body // PORTAL TARGET: Renderiza fora da árvore DOM do chat
  );
};

export default MermaidFullscreenModal;
