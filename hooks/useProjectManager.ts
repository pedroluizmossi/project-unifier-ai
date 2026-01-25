
import React, { useState, useEffect, useRef } from 'react';
import { ProjectSession, FileInfo, OutputFormat, ChatSession, ChatMessage, SavedResponse, SystemPrompts } from '../types';
import { getSessions, saveSession, deleteSession, getFavorites, saveFavorite, deleteFavorite } from '../lib/storage';
import { collectFileHandles, processFile, processFileList, generateOutput } from '../lib/utils';
import { DEFAULT_IGNORE, DEFAULT_SYSTEM_PROMPT, DEFAULT_MERGE_PROMPT, DEFAULT_BLUEPRINT_PROMPT } from '../constants';
import { performProjectAnalysis, generateProjectBlueprint } from '../services/geminiService';

const ACTIVE_SESSION_KEY = 'unifier_active_session_id';
const PROMPTS_CONFIG_KEY = 'unifier_system_prompts';

export const useProjectManager = () => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => localStorage.getItem(ACTIVE_SESSION_KEY));
  const [sessions, setSessions] = useState<ProjectSession[]>([]);
  const [directoryName, setDirectoryName] = useState<string | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('markdown');
  const [projectSummary, setProjectSummary] = useState('');
  const [projectSpec, setProjectSpec] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isInitialMount = useRef(true);

  // System Prompts State with LocalStorage persistence
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompts>(() => {
    const saved = localStorage.getItem(PROMPTS_CONFIG_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch(e) { console.error("Error parsing saved prompts", e); }
    }
    return {
        systemPersona: DEFAULT_SYSTEM_PROMPT,
        mergeLogic: DEFAULT_MERGE_PROMPT,
        blueprintLogic: DEFAULT_BLUEPRINT_PROMPT
    };
  });

  // Save prompts when changed
  useEffect(() => {
    localStorage.setItem(PROMPTS_CONFIG_KEY, JSON.stringify(systemPrompts));
  }, [systemPrompts]);

  // Indica se podemos gravar diretamente no disco (File System Access API ativa)
  const [canWriteDirectly, setCanWriteDirectly] = useState(false);

  // Armazena handles reais (não serializáveis) para escrita
  const fileHandlesRef = useRef<Map<string, FileSystemFileHandle>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Favorites state
  const [favorites, setFavorites] = useState<SavedResponse[]>([]);

  // Chat State
  const [savedChats, setSavedChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>(crypto.randomUUID());
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Carregamento Inicial
  useEffect(() => { 
    const init = async () => {
      await refreshFavorites();
      const list = await refreshSessions();
      if (activeSessionId) {
        const lastSession = list.find(s => s.id === activeSessionId);
        if (lastSession) loadSession(lastSession);
      }
      isInitialMount.current = false;
    };
    init();
  }, []);

  const refreshSessions = async () => {
    const list = await getSessions();
    setSessions(list);
    return list;
  };

  const refreshFavorites = async () => {
    const list = await getFavorites();
    setFavorites(list);
  };

  useEffect(() => {
    if (activeSessionId) localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
    else localStorage.removeItem(ACTIVE_SESSION_KEY);
  }, [activeSessionId]);

  useEffect(() => {
    if (isInitialMount.current) return;
    if (chatHistory.length > 0) {
      setSavedChats(prev => {
        const idx = prev.findIndex(c => c.id === activeChatId);
        const title = chatHistory.find(m => m.role === 'user')?.text.slice(0, 30) || 'Nova Conversa';
        const updated = {
          id: activeChatId,
          title: idx >= 0 ? prev[idx].title : title,
          messages: chatHistory,
          createdAt: idx >= 0 ? prev[idx].createdAt : Date.now(),
          updatedAt: Date.now()
        };
        const next = idx >= 0 ? [...prev] : [updated, ...prev];
        if (idx >= 0) next[idx] = updated;
        return next;
      });
    }
  }, [chatHistory, activeChatId]);

  useEffect(() => {
    if (isInitialMount.current || !directoryName || files.length === 0) return;
    const session: ProjectSession = {
      id: activeSessionId || crypto.randomUUID(),
      name: directoryName,
      files,
      summary: projectSummary,
      specification: projectSpec,
      chats: savedChats,
      lastUpdated: Date.now(),
      outputFormat
    };
    if (!activeSessionId) setActiveSessionId(session.id);
    const timeout = setTimeout(() => {
      saveSession(session).then(refreshSessions);
    }, 500);
    return () => clearTimeout(timeout);
  }, [files, projectSummary, projectSpec, savedChats, outputFormat, directoryName]);

  const loadSession = (session: ProjectSession) => {
    setActiveSessionId(session.id);
    setDirectoryName(session.name);
    setFiles(session.files);
    setProjectSummary(session.summary);
    setProjectSpec(session.specification || '');
    setOutputFormat(session.outputFormat || 'markdown');
    fileHandlesRef.current.clear();
    setCanWriteDirectly(false); // Reset ao carregar do DB (precisa re-abrir pasta para escrever)
    
    if (session.chats?.length) {
      setSavedChats(session.chats);
      const lastChat = session.chats[0];
      setActiveChatId(lastChat.id);
      setChatHistory(lastChat.messages);
    } else {
      handleNewChat();
    }
  };

  const handleNewProject = () => {
    setActiveSessionId(null);
    setDirectoryName(null);
    setFiles([]);
    setProjectSummary('');
    setProjectSpec('');
    setCanWriteDirectly(false);
    fileHandlesRef.current.clear();
    handleNewChat();
  };

  const handleNewChat = () => {
    setActiveChatId(crypto.randomUUID());
    setChatHistory([]);
  };

  const handleSelectChat = (id: string) => {
    const chat = savedChats.find(c => c.id === id);
    if (chat) {
      setActiveChatId(chat.id);
      setChatHistory(chat.messages);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteSession(id);
    if (activeSessionId === id) handleNewProject();
    refreshSessions();
  };

  const handleSelectDirectory = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      setIsProcessing(true);
      handleNewProject();
      const handles = await collectFileHandles(handle, DEFAULT_IGNORE);
      fileHandlesRef.current.clear();
      handles.forEach(h => fileHandlesRef.current.set(h.path, h.handle));
      const results = await Promise.all(handles.map(h => processFile(h.handle, h.path, 500)));
      const processedFiles = results.filter((f): f is FileInfo => f !== null);
      setDirectoryName(handle.name);
      setFiles(processedFiles);
      setCanWriteDirectly(true); // Se abriu via Directory Picker, podemos escrever
    } catch (err: any) {
      console.warn("Direct access failed, using fallback upload", err);
      fileInputRef.current?.click();
    } finally { setIsProcessing(false); }
  };

  const handleFilesFallback = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setIsProcessing(true);
    try {
      const results = await processFileList(fileList, DEFAULT_IGNORE, 500);
      if (results.length > 0) {
        handleNewProject();
        setDirectoryName(fileList[0].webkitRelativePath.split('/')[0] || "Upload");
        setFiles(results);
        setCanWriteDirectly(false); // Upload padrão não permite escrita direta
      }
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const generateSummary = async (content: string) => {
    if (!content) return;
    setIsGeneratingSummary(true);
    try {
      const config = JSON.parse(localStorage.getItem('gemini_config_v2') || '{}');
      const [summary, spec] = await Promise.all([
        performProjectAnalysis(content, "Gere um resumo executivo de 3 parágrafos.", undefined, undefined, config, undefined, [], [], systemPrompts.systemPersona),
        generateProjectBlueprint(content, config, systemPrompts.blueprintLogic)
      ]);
      setProjectSummary(summary);
      setProjectSpec(spec);
    } catch (err: any) {
      setProjectSummary(`### ⚠️ Erro na Análise\n${err.message}`);
    } finally { setIsGeneratingSummary(false); }
  };

  const toggleFavorite = async (content: string, title?: string) => {
    const existing = favorites.find(f => f.content === content);
    if (existing) await deleteFavorite(existing.id);
    else await saveFavorite({ id: crypto.randomUUID(), title: title || 'Resposta Salva', content, timestamp: Date.now() });
    await refreshFavorites();
  };

  const removeFavorite = async (id: string) => {
    await deleteFavorite(id);
    await refreshFavorites();
  };

  const applyFileChange = async (path: string, newContent: string) => {
    const handle = fileHandlesRef.current.get(path);
    
    // Se não tiver handle, oferecemos o download
    if (!handle || !canWriteDirectly) {
      const fileName = path.split('/').pop() || 'fix.txt';
      const blob = new Blob([newContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      
      // Atualiza o estado local mesmo assim para a UI refletir a mudança
      updateLocalFileState(path, newContent);
      return;
    }

    try {
      const writable = await (handle as any).createWritable();
      await writable.write(newContent);
      await writable.close();
      updateLocalFileState(path, newContent);
    } catch (e: any) {
      throw new Error("Falha ao escrever no disco: " + e.message + ". Tente baixar o arquivo.");
    }
  };

  const updateLocalFileState = (path: string, content: string) => {
    setFiles(prev => prev.map(f => f.path === path ? { ...f, content, line_count: content.split('\n').length, size_kb: content.length / 1024 } : f));
  };

  return {
    activeSessionId, sessions, directoryName, files, setFiles, outputFormat, setOutputFormat,
    projectSummary, projectSpec, isGeneratingSummary, isProcessing, savedChats, activeChatId, chatHistory, setChatHistory,
    favorites, toggleFavorite, removeFavorite, applyFileChange, canWriteDirectly,
    loadSession, handleNewProject, handleNewChat, handleSelectChat, handleDelete, handleSelectDirectory, handleFilesFallback, generateSummary, fileInputRef,
    systemPrompts, setSystemPrompts
  };
};
