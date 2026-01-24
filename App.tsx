
import React, { useMemo, useState } from 'react';
import { useProjectManager } from './hooks/useProjectManager';
import { generateOutput, calculateTokens } from './lib/utils';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import FileExplorerModal from './components/FileExplorerModal';
import AIAnalysisPanel from './components/AIAnalysisPanel';
import { useSpring, animated } from 'react-spring';
import { OutputFormat } from './types';

const App: React.FC = () => {
  const pm = useProjectManager();
  const [appMode, setAppMode] = useState<'project' | 'mr_analysis'>('project');
  
  // Estado Visual
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isContextOpen, setIsContextOpen] = useState(false);
  
  const [diffContent, setDiffContent] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [langFilter, setLangFilter] = useState('all');

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

  // Animações de Layout
  const rightPanelSpring = useSpring({ 
    width: isContextOpen ? 450 : 0, 
    opacity: isContextOpen ? 1 : 0,
    config: { tension: 210, friction: 20 }
  });

  const handleExport = (format: OutputFormat) => {
    // Gera o conteúdo sob demanda baseada no formato solicitado, ignorando o estado visual atual
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

  return (
    <div className="flex h-screen bg-[#0f1117] text-slate-200 overflow-hidden font-sans">
      <input 
        type="file" 
        ref={pm.fileInputRef} 
        className="hidden" 
        onChange={pm.handleFilesFallback} 
        {...({ webkitdirectory: "", directory: "" } as any)} 
      />
      
      {/* Sidebar Esquerda (Autocontida) */}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-w-0 bg-[#0f1117]">
        <AIAnalysisPanel 
          context={outputContent} projectSpec={pm.projectSpec} 
          diffContext={appMode === 'mr_analysis' ? diffContent : undefined} 
          history={pm.chatHistory} onUpdateHistory={pm.setChatHistory}
          isContextOpen={isContextOpen} toggleContext={() => setIsContextOpen(!isContextOpen)}
          savedChats={pm.savedChats} activeChatId={pm.activeChatId}
          onNewChat={pm.handleNewChat} onSelectChat={pm.handleSelectChat}
          isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          favorites={pm.favorites} onToggleFavorite={pm.toggleFavorite} onRemoveFavorite={pm.removeFavorite}
        />
      </div>

      {/* Right Panel (Dashboard) */}
      <animated.div style={rightPanelSpring} className="h-full bg-[#13141c] border-l border-slate-800/50 flex flex-col overflow-hidden shadow-2xl z-20">
        <div className="w-[450px] h-full flex flex-col">
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
    </div>
  );
};

export default App;
