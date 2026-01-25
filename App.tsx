
import React, { useMemo, useState } from 'react';
import { useProjectManager } from './hooks/useProjectManager';
import { generateOutput, calculateTokens } from './lib/utils';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DiffWorkspace from './components/DiffWorkspace'; // Novo Componente
import FileExplorerModal from './components/FileExplorerModal';
import AIAnalysisPanel from './components/AIAnalysisPanel';
import DiffConfirmationModal from './components/DiffConfirmationModal';
import SettingsModal from './components/SettingsModal';
import { useSpring, animated } from 'react-spring';
import { OutputFormat, PendingChange } from './types';
import { mergeCodeChanges } from './services/geminiService';

const App: React.FC = () => {
  const pm = useProjectManager();
  const [appMode, setAppMode] = useState<'project' | 'mr_analysis'>('project');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isContextOpen, setIsContextOpen] = useState(false);
  
  const [diffContent, setDiffContent] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [langFilter, setLangFilter] = useState('all');

  // Estado para reconstrução e confirmação
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [isReconstructing, setIsReconstructing] = useState(false);

  // Estado para acionar a IA vindo de componentes externos (DiffWorkspace)
  const [externalTriggerPrompt, setExternalTriggerPrompt] = useState<string | null>(null);

  // Helper para injetar prompt na IA vindo do DiffWorkspace
  const handleDiffAnalysis = (prompt: string) => {
    // Apenas define o trigger. O AIAnalysisPanel observará este estado.
    setExternalTriggerPrompt(prompt);
    // Garante que o painel da IA (Esquerda) esteja visível e o contexto (Direita) seja fechado para focar no chat
    setIsContextOpen(false); 
  };

  const outputContent = useMemo(() => 
    generateOutput(pm.directoryName || 'Project', pm.files, pm.outputFormat), 
    [pm.files, pm.directoryName, pm.outputFormat]
  );

  const stats = useMemo(() => ({
    text: pm.files.filter(f => f.selected && f.type === 'text_file').length,
    tokens: calculateTokens(outputContent),
    binary: pm.files.filter(f => f.type === 'binary_file').length,
    large: pm.files.filter(f => f.type === 'large_file').length,
    files: pm.files.map(f => ({ name: f.path, size: Math.round(f.size_kb * 1024) }))
  }), [pm.files, outputContent]);

  const availableLanguages = useMemo(() => 
    Array.from(new Set(pm.files.map(f => f.language).filter(Boolean) as string[])).sort(), 
    [pm.files]
  );

  const filteredFiles = useMemo(() => pm.files.filter(f => 
    f.path.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (langFilter === 'all' || f.language === langFilter)
  ), [pm.files, searchTerm, langFilter]);

  const rightPanelSpring = useSpring({ 
    width: isContextOpen ? 450 : 0, 
    opacity: isContextOpen ? 1 : 0,
    config: { tension: 210, friction: 20 }
  });

  const handleExport = (format: OutputFormat) => {
    const contentToExport = generateOutput(pm.directoryName || 'Project', pm.files, format);
    const blob = new Blob([contentToExport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const extension = format === 'markdown' ? 'md' : format;
    a.download = `${pm.directoryName || 'project'}_context.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRequestApplyChange = async (path: string, partialFix: string) => {
    const file = pm.files.find(f => f.path === path);
    if (!file) {
      alert("Arquivo não encontrado no projeto atual.");
      return;
    }

    setIsReconstructing(true);
    setPendingChange({
      path,
      originalContent: file.content || '',
      newContent: '' 
    });

    try {
      const fullUpdatedContent = await mergeCodeChanges(file.content || '', partialFix, path, pm.systemPrompts.mergeLogic);
      setPendingChange(prev => prev ? { ...prev, newContent: fullUpdatedContent } : null);
    } catch (e: any) {
      alert(e.message);
      setPendingChange(null);
    } finally {
      setIsReconstructing(false);
    }
  };

  const confirmApplyChange = async () => {
    if (!pendingChange) return;
    try {
      await pm.applyFileChange(pendingChange.path, pendingChange.newContent);
      setPendingChange(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="flex h-screen bg-[#0f1117] text-slate-200 overflow-hidden font-sans">
      <input 
        type="file" 
        ref={pm.fileInputRef} 
        className="hidden" 
        onChange={pm.handleFilesFallback} 
        {...({ webkitdirectory: "", directory: "" } as any)} 
      />
      
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        appMode={appMode} setAppMode={setAppMode} isProcessing={pm.isProcessing}
        onSelectDirectory={pm.handleSelectDirectory} outputFormat={pm.outputFormat}
        setOutputFormat={pm.setOutputFormat} files={pm.files} openFileExplorer={() => setIsModalOpen(true)}
        stats={{...stats, text: stats.text}} directoryName={pm.directoryName} diffContent={diffContent} setDiffContent={setDiffContent}
        sessions={pm.sessions} onSelectSession={pm.loadSession} activeSessionId={pm.activeSessionId}
        onDeleteSession={(id, e) => { e.stopPropagation(); pm.handleDelete(id); }} 
        savedChats={pm.savedChats}
        activeChatId={pm.activeChatId}
        onNewChat={pm.handleNewChat}
        onSelectChat={pm.handleSelectChat}
      />

      {/* PAINEL CENTRAL (ESQUERDA - IA) */}
      <div className="flex-1 flex flex-col relative min-w-0 bg-[#0f1117]">
        <AIAnalysisPanel 
          context={outputContent} projectSpec={pm.projectSpec} 
          diffContext={appMode === 'mr_analysis' ? diffContent : undefined} 
          history={pm.chatHistory} onUpdateHistory={pm.setChatHistory}
          isContextOpen={isContextOpen} 
          toggleContext={() => {
            if (appMode === 'mr_analysis') {
              // Se estiver no modo Diff, ao clicar em "Dashboard" (ou Fechar Painel),
              // forçamos a volta para o modo Projeto e abrimos o Dashboard.
              setAppMode('project');
              setIsContextOpen(true);
            } else {
              setIsContextOpen(!isContextOpen);
            }
          }}
          savedChats={pm.savedChats} activeChatId={pm.activeChatId}
          onNewChat={pm.handleNewChat} onSelectChat={pm.handleSelectChat}
          isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          favorites={pm.favorites} onToggleFavorite={pm.toggleFavorite} onRemoveFavorite={pm.removeFavorite}
          files={pm.files}
          onApplyChange={handleRequestApplyChange}
          customSystemPrompt={pm.systemPrompts.systemPersona}
          onOpenSettings={() => setIsSettingsOpen(true)}
          externalTriggerPrompt={externalTriggerPrompt}
          onExternalTriggerHandled={() => setExternalTriggerPrompt(null)}
        />
      </div>

      {/* PAINEL DIREITO (CONTEXTO / DASHBOARD / DIFF) */}
      <animated.div style={appMode === 'mr_analysis' ? { width: '60%', opacity: 1 } : rightPanelSpring} className="h-full bg-[#13141c] border-l border-slate-800/50 flex flex-col overflow-hidden shadow-2xl z-20 transition-all duration-300">
        <div className="w-full h-full flex flex-col">
          {appMode === 'project' ? (
            <>
              <Header directoryName={pm.directoryName} hasFiles={pm.files.some(f => f.selected)} onExport={handleExport} />
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                {pm.files.length > 0 ? (
                  <Dashboard 
                    files={pm.files} stats={stats} availableLanguages={availableLanguages}
                    isGeneratingSummary={pm.isGeneratingSummary} projectSummary={pm.projectSummary}
                    projectSpec={pm.projectSpec} onGenerateSummary={() => pm.generateSummary(outputContent)} 
                    outputContent={outputContent} outputFormat={pm.outputFormat}
                    openFileExplorer={() => setIsModalOpen(true)}
                  />
                ) : <div className="h-full flex items-center justify-center opacity-30 text-[10px] uppercase tracking-widest">Nenhum Projeto Carregado</div>}
              </div>
            </>
          ) : (
            <DiffWorkspace 
              diffContent={diffContent} 
              onAnalyze={handleDiffAnalysis}
            />
          )}
        </div>
      </animated.div>

      <FileExplorerModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
        filteredFiles={filteredFiles}
        allFiles={pm.files}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
        langFilter={langFilter} setLangFilter={setLangFilter}
        availableLanguages={availableLanguages} totalSelected={stats.text} totalTokens={stats.tokens}
        onSelectNewDirectory={pm.handleSelectDirectory}
        toggleFileSelection={path => pm.setFiles(prev => prev.map(f => f.path === path ? { ...f, selected: !f.selected } : f))}
        handleBulkAction={action => pm.setFiles(prev => prev.map(f => {
          const visible = filteredFiles.some(ff => ff.path === f.path);
          if (action === 'all') return { ...f, selected: f.type === 'text_file' };
          if (action === 'none') return { ...f, selected: false };
          if (visible && action === 'select_filtered') return { ...f, selected: f.type === 'text_file' };
          if (visible && action === 'deselect_filtered') return { ...f, selected: false };
          return f;
        }))}
      />

      <DiffConfirmationModal 
        isOpen={!!pendingChange}
        onClose={() => setPendingChange(null)}
        onConfirm={confirmApplyChange}
        pendingChange={pendingChange}
        isLoading={isReconstructing}
        canWriteDirectly={pm.canWriteDirectly}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        prompts={pm.systemPrompts}
        onSave={pm.setSystemPrompts}
      />
    </div>
  );
};

export default App;
