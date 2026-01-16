
import { useState, useEffect } from 'react';
import { GeminiConfig, ChatMessage, Attachment } from '../types';
import { performProjectAnalysis } from '../services/geminiService';

const DEFAULT_CONFIG: GeminiConfig = {
  model: 'gemini-3-pro-preview',
  useThinking: true
};

export const useAnalysis = (
  context: string,
  projectSpec: string | undefined,
  diffContext: string | undefined,
  history: ChatMessage[],
  onUpdateHistory: (h: ChatMessage[]) => void
) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [stagedAttachments, setStagedAttachments] = useState<Attachment[]>([]);
  const [geminiConfig, setGeminiConfig] = useState<GeminiConfig>(() => {
    const saved = localStorage.getItem('gemini_config_v2');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem('gemini_config_v2', JSON.stringify(geminiConfig));
  }, [geminiConfig]);

  const startAnalysis = async (prompt: string, attachments: Attachment[] = []) => {
    if (!context || (!prompt.trim() && attachments.length === 0)) return;
    
    const userMsg: ChatMessage = { 
      role: 'user', 
      text: prompt, 
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined
    };
    const updatedHistory = [...history, userMsg];
    onUpdateHistory(updatedHistory);
    
    setIsAnalyzing(true);
    setCurrentResponse('');
    setCustomPrompt('');
    setStagedAttachments([]);
    
    try {
      const fullResponse = await performProjectAnalysis(
        context, prompt, 
        (chunk) => setCurrentResponse(prev => prev + chunk), 
        diffContext, geminiConfig, projectSpec, attachments,
        history
      );
      onUpdateHistory([...updatedHistory, { role: 'model', text: fullResponse, timestamp: Date.now() }]);
      setCurrentResponse('');
    } catch (err: any) {
      onUpdateHistory([...updatedHistory, { role: 'model', text: `### ⚠️ Erro\n${err.message}`, timestamp: Date.now() }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing, currentResponse, customPrompt, setCustomPrompt, stagedAttachments, setStagedAttachments,
    geminiConfig, setGeminiConfig, startAnalysis
  };
};
