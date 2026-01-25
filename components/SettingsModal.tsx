
import React, { useState, useEffect } from 'react';
import { useSpring, animated, config } from 'react-spring';
import { SystemPrompts } from '../types';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_MERGE_PROMPT, DEFAULT_BLUEPRINT_PROMPT } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: SystemPrompts;
  onSave: (prompts: SystemPrompts) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, prompts, onSave }) => {
  const [activeTab, setActiveTab] = useState<'persona' | 'merge' | 'blueprint'>('persona');
  const [localPrompts, setLocalPrompts] = useState<SystemPrompts>(prompts);

  useEffect(() => {
    if (isOpen) setLocalPrompts(prompts);
  }, [isOpen, prompts]);

  const modalSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'scale(1)' : 'scale(0.95)',
    pointerEvents: (isOpen ? 'auto' : 'none') as any,
    config: config.stiff
  });

  const handleReset = () => {
    if (confirm('Tem certeza que deseja restaurar os prompts padrão?')) {
        const defaults = {
            systemPersona: DEFAULT_SYSTEM_PROMPT,
            mergeLogic: DEFAULT_MERGE_PROMPT,
            blueprintLogic: DEFAULT_BLUEPRINT_PROMPT
        };
        setLocalPrompts(defaults);
    }
  };

  const handleSave = () => {
    onSave(localPrompts);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-[110] flex items-center justify-center p-4 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <animated.div 
        style={{ opacity: modalSpring.opacity }}
        className="absolute inset-0 bg-black/90 backdrop-blur-md" 
        onClick={onClose} 
      />

      <animated.div 
        style={modalSpring} 
        className="relative bg-[#0d0e12] w-full max-w-5xl h-[85vh] rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#13141c]">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center text-2xl border border-slate-700">
               ⚙️
             </div>
             <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Configurações do Sistema</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Personalize o Cérebro da IA</p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-64 bg-[#0f1117] border-r border-white/5 p-4 flex flex-col gap-2">
             <TabButton 
                active={activeTab === 'persona'} 
                onClick={() => setActiveTab('persona')} 
                icon="🤖" 
                label="Persona do Sistema" 
                desc="Instruções gerais e regras"
             />
             <TabButton 
                active={activeTab === 'merge'} 
                onClick={() => setActiveTab('merge')} 
                icon="🔀" 
                label="Lógica de Merge" 
                desc="Como aplicar correções"
             />
             <TabButton 
                active={activeTab === 'blueprint'} 
                onClick={() => setActiveTab('blueprint')} 
                icon="📐" 
                label="Blueprint Logic" 
                desc="Geração de resumos e specs"
             />
          </div>

          {/* Editor Area */}
          <div className="flex-1 bg-[#13141c] p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
               <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  {activeTab === 'persona' && 'Prompt do Sistema (System Instruction)'}
                  {activeTab === 'merge' && 'Prompt de Reconstrução de Código (Merge)'}
                  {activeTab === 'blueprint' && 'Prompt de Geração de Blueprint'}
               </h4>
               <span className="text-[9px] text-slate-500 bg-white/5 px-2 py-1 rounded">Editando Configuração Local</span>
            </div>
            
            <textarea
              value={
                  activeTab === 'persona' ? localPrompts.systemPersona :
                  activeTab === 'merge' ? localPrompts.mergeLogic :
                  localPrompts.blueprintLogic
              }
              onChange={(e) => {
                  const val = e.target.value;
                  setLocalPrompts(prev => ({
                      ...prev,
                      systemPersona: activeTab === 'persona' ? val : prev.systemPersona,
                      mergeLogic: activeTab === 'merge' ? val : prev.mergeLogic,
                      blueprintLogic: activeTab === 'blueprint' ? val : prev.blueprintLogic
                  }));
              }}
              className="flex-1 bg-[#0a0b10] border border-white/10 rounded-xl p-4 font-mono text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 resize-none leading-relaxed"
              spellCheck={false}
            />
            
            <p className="mt-3 text-[10px] text-slate-500">
               * Dica: Mantenha as tags especiais como <code>[[CONTEXTO]]</code> ou instruções de formatação para garantir que o sistema funcione corretamente.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-[#13141c] flex justify-between items-center">
           <button 
             onClick={handleReset}
             className="px-6 py-3 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
           >
             Restaurar Padrões
           </button>
           
           <div className="flex gap-3">
              <button 
                onClick={onClose} 
                className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 transition-all active:scale-95"
              >
                Salvar Configuração
              </button>
           </div>
        </div>
      </animated.div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label, desc }: any) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-xl text-left transition-all border ${
        active 
        ? 'bg-indigo-600/10 border-indigo-500/40' 
        : 'bg-transparent border-transparent hover:bg-white/5'
    }`}
  >
     <div className="flex items-center gap-3 mb-1">
        <span className="text-lg">{icon}</span>
        <span className={`text-xs font-bold ${active ? 'text-indigo-400' : 'text-slate-300'}`}>{label}</span>
     </div>
     <p className="text-[9px] text-slate-500 pl-8">{desc}</p>
  </button>
);

export default SettingsModal;
