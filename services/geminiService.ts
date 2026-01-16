
import { GoogleGenAI } from "@google/genai";
import { GeminiConfig } from "../types";

export const performProjectAnalysis = async (
  projectContext: string,
  userPrompt: string,
  onStream?: (chunk: string) => void,
  diffContext?: string,
  userConfig?: GeminiConfig
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const modelName = userConfig?.model || 'gemini-3-pro-preview';
  const useThinking = userConfig?.useThinking !== false;

  // Orçamento de tokens para pensamento (Thinking Budget)
  // Gemini 3 Pro suporta até 32768, Flash até 24576.
  const budget = modelName === 'gemini-3-pro-preview' ? 32768 : 24576;

  const fullPrompt = `
    Você é um Arquiteto de Software Sênior e Revisor de Código Elite.
    
    CONTEXTO DO PROJETO:
    ---
    ${projectContext}
    ---
    
    ${diffContext ? `MUDANÇAS PROPOSTAS (DIFF):\n---\n${diffContext}\n---` : ''}
    
    TAREFA:
    ${userPrompt}
    
    DIRETRIZES:
    - Analise o contexto profundamente.
    - Seja técnico, preciso e identifique riscos arquiteturais ou de segurança.
  `;

  const config: any = {
    temperature: 1.0,
  };

  if (useThinking) {
    config.thinkingConfig = { thinkingBudget: budget };
  }

  try {
    if (onStream) {
      const responseStream = await ai.models.generateContentStream({
        model: modelName,
        contents: [{ parts: [{ text: fullPrompt }] }],
        config
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          onStream(text);
        }
      }
      return fullText;
    } else {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ parts: [{ text: fullPrompt }] }],
        config
      });
      return response.text || "O modelo não retornou conteúdo.";
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Erro desconhecido na comunicação com o Gemini.");
  }
};
