
import React, { useState, useEffect, useRef } from 'react';
import { ProjectSession, FileInfo, OutputFormat, ChatSession, ChatMessage, SavedResponse } from '../types';
import { getSessions, saveSession, deleteSession, getFavorites, saveFavorite, deleteFavorite } from '../lib/storage';
import { collectFileHandles, processFile, processFileList, generateOutput } from '../lib/utils';
import { DEFAULT_IGNORE } from '../constants';
import { performProjectAnalysis, generateProjectBlueprint } from '../services/geminiService';

export const useProjectManager = () => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ProjectSession[]>([]);
  const [directoryName, setDirectoryName] = useState<string | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('markdown');
  const [projectSummary, setProjectSummary] = useState('');
  const [projectSpec, setProjectSpec] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Favorites state
  const [favorites, setFavorites] = useState<SavedResponse[]>([]);

  // Chat State
  const [savedChats, setSavedChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>(crypto.randomUUID());
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    refreshSessions(); 
    refreshFavorites();
  }, []);

  const refreshSessions = async () => {
    const list = await getSessions();
    setSessions(list);
  };

  const refreshFavorites = async () => {
    const list = await getFavorites();
    setFavorites(list);
  };

  useEffect(() => {
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
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
    }
  }, [chatHistory, activeChatId]);

  useEffect(() => {
    if (directoryName && files.length > 0) {
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
      saveSession(session).then(refreshSessions);
    }
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
      setActiveChatId(session.chats[0].id);
      setChatHistory(session.chats[0].messages);
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
      
      setActiveSessionId(null);
      setProjectSummary('');
      setProjectSpec('');
      setSavedChats([]);
      handleNewChat();

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
    refreshFavorites();
  };

  const removeFavorite = async (id: string) => {
    await deleteFavorite(id);
    refreshFavorites();
  };

  return {
    activeSessionId, sessions, directoryName, files, setFiles, outputFormat, setOutputFormat,
    projectSummary, projectSpec, isGeneratingSummary, isProcessing, savedChats, activeChatId, chatHistory, setChatHistory,
    favorites, toggleFavorite, removeFavorite,
    loadSession, handleNewProject, handleNewChat, handleSelectChat, handleDelete, handleSelectDirectory, handleFilesFallback, generateSummary, fileInputRef
  };
};
