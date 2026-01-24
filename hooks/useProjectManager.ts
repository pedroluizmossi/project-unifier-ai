
import React, { useState, useEffect, useRef } from 'react';
import { ProjectSession, FileInfo, OutputFormat, ChatSession, ChatMessage, SavedResponse } from '../types';
import { getSessions, saveSession, deleteSession, getFavorites, saveFavorite, deleteFavorite } from '../lib/storage';
import { collectFileHandles, processFile, processFileList, generateOutput } from '../lib/utils';
import { DEFAULT_IGNORE } from '../constants';
import { performProjectAnalysis, generateProjectBlueprint } from '../services/geminiService';

const ACTIVE_SESSION_KEY = 'unifier_active_session_id';

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

  // Fix: Added missing fileInputRef to handle file picker fallback logic
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
      
      // Se houver um ID salvo, tenta carregar
      if (activeSessionId) {
        const lastSession = list.find(s => s.id === activeSessionId);
        if (lastSession) {
          loadSession(lastSession);
        }
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

  // Salvar ID ativo no localStorage
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  }, [activeSessionId]);

  // Sincronizar Histórico com Chats Salvos
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

  // Persistência Automática da Sessão Inteira
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
    
    // Debounce manual simples para evitar escritas excessivas no DB
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
      
      // Limpar estados para novo projeto
      handleNewProject();

      const handles = await collectFileHandles(handle, DEFAULT_IGNORE);
      const results = await Promise.all(handles.map(h => processFile(h.handle, h.path, 500)));
      
      const processedFiles = results.filter((f): f is FileInfo => f !== null);
      setDirectoryName(handle.name);
      setFiles(processedFiles);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn("Directory Picker fail, falling back to input", err);
        fileInputRef.current?.click();
      }
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
        performProjectAnalysis(content, "Gere um resumo executivo de 3 parágrafos.", undefined, undefined, config),
        generateProjectBlueprint(content, config)
      ]);
      setProjectSummary(summary);
      setProjectSpec(spec);
    } catch (err: any) {
      setProjectSummary(`### ⚠️ Erro na Análise\n${err.message}`);
    } finally { setIsGeneratingSummary(false); }
  };

  const toggleFavorite = async (content: string, title?: string) => {
    const existing = favorites.find(f => f.content === content);
    if (existing) {
      await deleteFavorite(existing.id);
    } else {
      await saveFavorite({
        id: crypto.randomUUID(),
        title: title || 'Resposta Salva',
        content,
        timestamp: Date.now()
      });
    }
    await refreshFavorites();
  };

  const removeFavorite = async (id: string) => {
    await deleteFavorite(id);
    await refreshFavorites();
  };

  return {
    activeSessionId, sessions, directoryName, files, setFiles, outputFormat, setOutputFormat,
    projectSummary, projectSpec, isGeneratingSummary, isProcessing, savedChats, activeChatId, chatHistory, setChatHistory,
    favorites, toggleFavorite, removeFavorite,
    loadSession, handleNewProject, handleNewChat, handleSelectChat, handleDelete, handleSelectDirectory, handleFilesFallback, generateSummary, fileInputRef
  };
};
