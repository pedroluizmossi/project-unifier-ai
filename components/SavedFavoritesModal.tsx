
import React from 'react';
import { SavedResponse } from '../types';
import { useTransition, animated, config } from 'react-spring';
import MarkdownRenderer from './MarkdownRenderer';

interface SavedFavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: SavedResponse[];
  onRemove: (id: string) => void;
}

const SavedFavoritesModal: React.FC<SavedFavoritesModalProps> = ({ isOpen, onClose, favorites, onRemove }) => {
  const transitions = useTransition(isOpen, {
    from: { opacity: 0, transform: 'scale(0.95)' },
    enter: { opacity: 1, transform: 'scale(1)' },
    leave: { opacity: 0, transform: 'scale(0.95)' },
    config: config.stiff
  });

  return transitions((style, item) => item && (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <animated.div 
        style={{ opacity: style.opacity }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      <animated.div 
        style={style} 
        className="relative bg-slate-900 w-full max-w-5xl h-[85vh] rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center text-xl border border-amber-500/30">
              ⭐
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Biblioteca de Insights</h2>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Suas respostas salvas e referências</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all">
             ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          {favorites.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
               <div className="text-6xl">🔖</div>
               <p className="text-sm font-black uppercase tracking-widest text-slate-400">Nenhum insight favoritado ainda</p>
               <p className="text-xs text-slate-500 max-w-xs">Clique na estrela nas respostas do Gemini para salvá-las aqui.</p>
            </div>
          ) : (
            favorites.map(fav => (
              <div key={fav.id} className="group relative bg-[#13141c] border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all">
                <div className="p-4 bg-black/20 border-b border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded">Salvo</span>
                      <span className="text-[10px] text-slate-500 font-mono">{new Date(fav.timestamp).toLocaleDateString()}</span>
                   </div>
                   <button 
                     onClick={() => onRemove(fav.id)}
                     className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                     title="Remover"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </button>
                </div>
                <div className="p-6">
                   <MarkdownRenderer content={fav.content} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-center">
           <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
             {favorites.length} Insight{favorites.length !== 1 ? 's' : ''} Armazenado{favorites.length !== 1 ? 's' : ''}
           </p>
        </div>
      </animated.div>
    </div>
  ));
};

export default SavedFavoritesModal;
