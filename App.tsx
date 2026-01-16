
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ProcessorStatus, FileInfo, OutputFormat, AppMode, ProjectSession, ChatMessage } from './types';
import { collectFileHandles, processFile, processFileList, generateOutput, calculateTokens } from './lib/utils';
import { DEFAULT_IGNORE } from './constants';
import { performProjectAnalysis } from './services/geminiService';
import { saveSession, getSessions, deleteSession } from './lib/storage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import FileExplorerModal from './components/FileExplorerModal';
import AIAnalysisPanel from './components/AIAnalysisPanel';
import { useTransition, animated, useSpring } from 'react-spring';

const App: React.FC = () => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ProjectSession[]>([]);
  
  const [appMode, setAppMode] = useState<AppMode>('project');
  const [isProcessing, setIsProcessing] = useState(false);
  const [directoryName, setDirectoryName] = useState<string | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('markdown');
  const [showAI, setShowAI] = useState(false);
  const [diffContent, setDiffContent] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [langFilter, setLangFilter] = useState('all');

  const [projectSummary, setProjectSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Sessions on mount
  useEffect(() => {
    refreshSessions();
  }, []);

  // Auto-save current session when important state changes
  useEffect(() => {
    if (directoryName && files.length > 0) {
      const session: ProjectSession = {
        id: activeSessionId || crypto.randomUUID(),
        name: directoryName,
        files,
        summary: projectSummary,
        chatHistory,
        lastUpdated: Date.now(),
        outputFormat
      };
      if (!activeSessionId) setActiveSessionId(session.id);
      saveSession(session).then(refreshSessions);
    }
  }, [files, projectSummary, chatHistory, outputFormat, directoryName]);

  const refreshSessions = async () => {
    const list = await getSessions();
    setSessions(list);
  };

  const loadSession = (session: ProjectSession) => {
    setActiveSessionId(session.id);
    setDirectoryName(session.name);
    setFiles(session.files);
    setProjectSummary(session.summary);
    setChatHistory(session.chatHistory || []);
    setOutputFormat(session.outputFormat || 'markdown');
    setShowAI(false);
  };

  const handleNewProject = () => {
    setActiveSessionId(null);
    setDirectoryName(null);
    setFiles([]);
    setProjectSummary('');
    setChatHistory([]);
    setShowAI(false);
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteSession(id);
    if (activeSessionId === id) handleNewProject();
    refreshSessions();
  };

  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    files.forEach(f => { if (f.language) langs.add(f.language); });
    return Array.from(langs).sort();
  }, [files]);

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchesSearch = f.path.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLang = langFilter === 'all' || f.language === langFilter;
      return matchesSearch && matchesLang;
    });
  }, [files, searchTerm, langFilter]);

  const stats = useMemo<ProcessorStatus>(() => {
    const selectedFiles = files.filter(f => f.selected && f.type === 'text_file');
    const content = generateOutput(directoryName || 'Project', files, outputFormat);
    return {
      text: selectedFiles.length,
      binary: files.filter(f => f.type === 'binary_file').length,
      large: files.filter(f => f.type === 'large_file').length,
      tokens: calculateTokens(content),
      files: files.map(f => ({ name: f.path, size: Math.round(f.size_kb * 1024) }))
    };
  }, [files, directoryName, outputFormat]);

  const outputContent = useMemo(() => 
    generateOutput(directoryName || 'Project', files, outputFormat), 
    [files, directoryName, outputFormat]
  );

  const handleSelectDirectory = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const handle = await (window as any).showDirectoryPicker();
        setIsProcessing(true);
        const name = handle.name;
        const handles = await collectFileHandles(handle, DEFAULT_IGNORE);
        const results = await Promise.all(handles.map(h => processFile(h.handle, h.path, 500)));
        
        setDirectoryName(name);
        setFiles(results.filter((f): f is FileInfo => f !== null));
        setProjectSummary('');
        setChatHistory([]);
        setActiveSessionId(null); // Will be created by auto-save effect
      } catch (err: any) {
        if (err.name !== 'AbortError') fileInputRef.current?.click();
      } finally { setIsProcessing(false); }
    } else { fileInputRef.current?.click(); }
  };

  const handleLegacyFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setIsProcessing(true);
    setDirectoryName(fileList[0].webkitRelativePath?.split('/')[0] || 'Project');
    const results = await processFileList(fileList, DEFAULT_IGNORE, 500);
    setFiles(results);
    setProjectSummary('');
    setChatHistory([]);
    setIsProcessing(false);
    e.target.value = '';
  };

  const generateProjectSummary = async () => {
    if (!outputContent) return;
    setIsGeneratingSummary(true);
    try {
      const saved = localStorage.getItem('gemini_config_v2');
      const config = saved ? JSON.parse(saved) : undefined;
      const prompt = "Faça um Raio-X profundo: 1. Stack, 2. Arquitetura, 3. Fluxos. Use Gemini 3.";
      const result = await performProjectAnalysis(outputContent, prompt, undefined, undefined, config);
      setProjectSummary(result);
    } catch (err: any) {
      setProjectSummary(`⚠️ Erro: ${err.message}`);
    } finally { setIsGeneratingSummary(false); }
  };

  // Animação para o layout principal (margem direita)
  const mainLayoutSpring = useSpring({
    marginRight: showAI ? 500 : 0,
    config: { tension: 280, friction: 60 }
  });

  // Transição para o painel de IA
  const panelTransition = useTransition(showAI, {
    from: { transform: 'translateX(100%)', opacity: 0 },
    enter: { transform: 'translateX(0%)', opacity: 1 },
    leave: { transform: 'translateX(100%)', opacity: 0 },
    config: { tension: 280, friction: 60 }
  });

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <input type="file" ref={fileInputRef} onChange={handleLegacyFileChange} className="hidden" {...({ webkitdirectory: "", directory: "" } as any)} />
      
      <Sidebar 
        appMode={appMode} setAppMode={setAppMode} isProcessing={isProcessing}
        onSelectDirectory={handleSelectDirectory} outputFormat={outputFormat}
        setOutputFormat={setOutputFormat} files={files} openFileExplorer={() => setIsModalOpen(true)}
        stats={stats} directoryName={directoryName} diffContent={diffContent} setDiffContent={setDiffContent}
        sessions={sessions} onSelectSession={loadSession} activeSessionId={activeSessionId}
        onDeleteSession={handleDeleteSession} onNewProject={handleNewProject}
      />

      <animated.div style={mainLayoutSpring} className="flex-1 flex flex-col min-w-0 relative">
        <Header 
          directoryName={directoryName}
          showAI={showAI}
          setShowAI={setShowAI}
          hasFiles={files.some(f => f.selected)}
          onDownload={() => {
            const blob = new Blob([outputContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${directoryName || 'project'}_unified.${outputFormat === 'markdown' ? 'md' : outputFormat === 'json' ? 'json' : 'xml'}`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        />

        <div className="flex-1 overflow-auto bg-slate-950 p-8 scrollbar-hide">
          {files.length > 0 ? (
            <Dashboard 
              files={files} stats={stats} availableLanguages={availableLanguages}
              isGeneratingSummary={isGeneratingSummary} projectSummary={projectSummary}
              onGenerateSummary={generateProjectSummary} outputContent={outputContent} outputFormat={outputFormat}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-8 text-center animate-in fade-in">
              <div className="w-32 h-32 rounded-[3rem] bg-slate-900 flex items-center justify-center text-6xl shadow-3xl border border-slate-800">🏢</div>
              <div className="space-y-2">
                <h3 className="text-2xl text-white font-black uppercase tracking-tight">Unifier Gemini 3</h3>
                <p className="text-xs text-slate-500 max-w-[300px] leading-relaxed mx-auto uppercase tracking-widest">
                  Seu cérebro persistente para análise de código local
                </p>
              </div>
              <div className="flex gap-4">
                <button onClick={handleSelectDirectory} className="px-10 py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-2xl active:scale-95">
                  Abrir Workspace 📁
                </button>
              </div>
            </div>
          )}
        </div>
      </animated.div>

      {panelTransition((style, item) => item && (
        <animated.div style={style} className="fixed top-0 right-0 w-[500px] h-full z-20 shadow-2xl">
          <AIAnalysisPanel 
            context={outputContent} 
            diffContext={appMode === 'mr_analysis' ? diffContent : undefined} 
            onClose={() => setShowAI(false)}
            history={chatHistory}
            onUpdateHistory={setChatHistory}
          />
        </animated.div>
      ))}

      <FileExplorerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        filteredFiles={filteredFiles}
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        langFilter={langFilter} 
        setLangFilter={setLangFilter}
        availableLanguages={availableLanguages} 
        totalSelected={stats.text} 
        totalTokens={stats.tokens}
        toggleFileSelection={(path) => setFiles(prev => prev.map(f => f.path === path ? { ...f, selected: !f.selected } : f))}
        handleBulkAction={(action) => setFiles(prev => prev.map(f => {
          const isVisible = filteredFiles.some(ff => ff.path === f.path);
          if (action === 'select_filtered' && isVisible) return { ...f, selected: f.type === 'text_file' };
          if (action === 'deselect_filtered' && isVisible) return { ...f, selected: false };
          if (action === 'all') return { ...f, selected: f.type === 'text_file' };
          if (action === 'none') return { ...f, selected: false };
          return f;
        }))}
      />
    </div>
  );
};

export default App;
