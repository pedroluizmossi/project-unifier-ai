
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ProcessorStatus, FileInfo, OutputFormat, AppMode, ProjectSession, ChatMessage, ChatSession } from './types';
import { collectFileHandles, processFile, processFileList, generateOutput, calculateTokens } from './lib/utils';
import { DEFAULT_IGNORE } from './constants';
import { performProjectAnalysis } from './services/geminiService';
import { saveSession, getSessions, deleteSession } from './lib/storage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import FileExplorerModal from './components/FileExplorerModal';
import AIAnalysisPanel from './components/AIAnalysisPanel';
import { useSpring, animated } from 'react-spring';

const App: React.FC = () => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ProjectSession[]>([]);
  
  const [appMode, setAppMode] = useState<AppMode>('project');
  const [isProcessing, setIsProcessing] = useState(false);
  const [directoryName, setDirectoryName] = useState<string | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('markdown');
  
  // UI State
  const [isContextOpen, setIsContextOpen] = useState(true);
  const [diffContent, setDiffContent] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [langFilter, setLangFilter] = useState('all');

  const [projectSummary, setProjectSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  // Chat Multi-Session State
  const [savedChats, setSavedChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>(crypto.randomUUID());
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Sessions on mount
  useEffect(() => {
    refreshSessions();
  }, []);

  // Sync active chat history to savedChats list whenever history updates
  useEffect(() => {
    if (chatHistory.length > 0) {
      setSavedChats(prev => {
        const existingIndex = prev.findIndex(c => c.id === activeChatId);
        
        // Generate a title from the first user message if possible
        const firstUserMsg = chatHistory.find(m => m.role === 'user');
        const title = firstUserMsg 
          ? (firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '')) 
          : 'Nova Conversa';

        const updatedSession: ChatSession = {
          id: activeChatId,
          title: existingIndex >= 0 ? prev[existingIndex].title : title,
          messages: chatHistory,
          createdAt: existingIndex >= 0 ? prev[existingIndex].createdAt : Date.now(),
          updatedAt: Date.now()
        };

        if (existingIndex >= 0) {
          const newChats = [...prev];
          newChats[existingIndex] = updatedSession;
          return newChats;
        } else {
          return [updatedSession, ...prev];
        }
      });
    }
  }, [chatHistory, activeChatId]);

  // Auto-save Project Session
  useEffect(() => {
    if (directoryName && files.length > 0) {
      const session: ProjectSession = {
        id: activeSessionId || crypto.randomUUID(),
        name: directoryName,
        files,
        summary: projectSummary,
        chats: savedChats, // Save all chats
        lastUpdated: Date.now(),
        outputFormat
      };
      if (!activeSessionId) setActiveSessionId(session.id);
      saveSession(session).then(refreshSessions);
    }
  }, [files, projectSummary, savedChats, outputFormat, directoryName]);

  const refreshSessions = async () => {
    const list = await getSessions();
    setSessions(list);
  };

  const loadSession = (session: ProjectSession) => {
    setActiveSessionId(session.id);
    setDirectoryName(session.name);
    setFiles(session.files);
    setProjectSummary(session.summary);
    setOutputFormat(session.outputFormat || 'markdown');
    
    // Logic to handle Chat Migration or Loading
    if (session.chats && session.chats.length > 0) {
      setSavedChats(session.chats);
      // Load the most recent chat
      const mostRecent = session.chats[0];
      setActiveChatId(mostRecent.id);
      setChatHistory(mostRecent.messages);
    } else if (session.chatHistory && session.chatHistory.length > 0) {
      // Migrate legacy single history to new format
      const legacyId = crypto.randomUUID();
      const legacyChat: ChatSession = {
        id: legacyId,
        title: 'Histórico Recuperado',
        messages: session.chatHistory,
        createdAt: session.lastUpdated,
        updatedAt: session.lastUpdated
      };
      setSavedChats([legacyChat]);
      setActiveChatId(legacyId);
      setChatHistory(session.chatHistory);
    } else {
      // New clean state
      handleNewChatInternal();
    }

    setIsContextOpen(true);
  };

  const handleNewProject = () => {
    setActiveSessionId(null);
    setDirectoryName(null);
    setFiles([]);
    setProjectSummary('');
    handleNewChatInternal();
    setIsContextOpen(true);
  };

  const handleNewChatInternal = () => {
    const newId = crypto.randomUUID();
    setActiveChatId(newId);
    setChatHistory([]);
    // We don't add to savedChats yet; it adds automatically when user types (useEffect)
  };

  const handleSelectChat = (chatId: string) => {
    const chat = savedChats.find(c => c.id === chatId);
    if (chat) {
      setActiveChatId(chat.id);
      setChatHistory(chat.messages);
    }
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
        handleNewChatInternal();
        setActiveSessionId(null); 
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
    handleNewChatInternal();
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

  // Animação do Painel Direito (Contexto)
  const contextPanelSpring = useSpring({
    width: isContextOpen ? 500 : 0,
    opacity: isContextOpen ? 1 : 0,
    config: { tension: 280, friction: 60 }
  });

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <input type="file" ref={fileInputRef} onChange={handleLegacyFileChange} className="hidden" {...({ webkitdirectory: "", directory: "" } as any)} />
      
      {/* 1. Sidebar (Esquerda) */}
      <Sidebar 
        appMode={appMode} setAppMode={setAppMode} isProcessing={isProcessing}
        onSelectDirectory={handleSelectDirectory} outputFormat={outputFormat}
        setOutputFormat={setOutputFormat} files={files} openFileExplorer={() => setIsModalOpen(true)}
        stats={stats} directoryName={directoryName} diffContent={diffContent} setDiffContent={setDiffContent}
        sessions={sessions} onSelectSession={loadSession} activeSessionId={activeSessionId}
        onDeleteSession={handleDeleteSession} onNewProject={handleNewProject}
      />

      {/* 2. Área Central (Chat) - Agora é o foco principal */}
      <div className="flex-1 min-w-0 bg-slate-900 flex flex-col relative z-0">
        <AIAnalysisPanel 
          context={outputContent} 
          diffContext={appMode === 'mr_analysis' ? diffContent : undefined} 
          history={chatHistory}
          onUpdateHistory={setChatHistory}
          isContextOpen={isContextOpen}
          toggleContext={() => setIsContextOpen(!isContextOpen)}
          
          // Novos props para gestão de chats
          savedChats={savedChats}
          activeChatId={activeChatId}
          onNewChat={handleNewChatInternal}
          onSelectChat={handleSelectChat}
        />
      </div>

      {/* 3. Painel Direito (Contexto/Dashboard) - Colapsável */}
      <animated.div style={contextPanelSpring} className="h-full bg-slate-950 border-l border-slate-800 flex flex-col overflow-hidden shadow-2xl relative z-10">
        <div className="w-[500px] h-full flex flex-col">
          <Header 
            directoryName={directoryName}
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

          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
             {files.length > 0 ? (
                <Dashboard 
                  files={files} stats={stats} availableLanguages={availableLanguages}
                  isGeneratingSummary={isGeneratingSummary} projectSummary={projectSummary}
                  onGenerateSummary={generateProjectSummary} outputContent={outputContent} outputFormat={outputFormat}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                  <div className="text-4xl">📁</div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">Nenhum contexto carregado</p>
                </div>
              )}
          </div>
        </div>
      </animated.div>

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
