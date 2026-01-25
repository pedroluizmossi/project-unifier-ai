
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiConfig, Attachment, AnalysisTemplate, ChatMessage } from "../types";
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_MERGE_PROMPT, DEFAULT_BLUEPRINT_PROMPT } from "../constants";

export const performProjectAnalysis = async (
  projectContext: string,
  userPrompt: string,
  onStream?: (chunk: string) => void,
  diffContext?: string,
  userConfig?: GeminiConfig,
  projectSpec?: string,
  attachments: Attachment[] = [],
  history: ChatMessage[] = [],
  customSystemPrompt?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const modelName = userConfig?.model || 'gemini-3-pro-preview';
  const useThinking = userConfig?.useThinking !== false;
  const useSearch = userConfig?.useSearch === true;

  const budget = modelName.includes('pro') ? 32768 : 24576;

  // Usa o prompt customizado se fornecido, senão usa o padrão, injetando o contexto
  const baseSystemPrompt = customSystemPrompt || DEFAULT_SYSTEM_PROMPT;
  
  const systemPrompt = `
    ${baseSystemPrompt}
    
    [[CONTEXTO DO PROJETO]]
    O usuário carregou os seguintes arquivos do projeto para análise:
    ---
    ${projectContext}
    ---

    ${projectSpec ? `[[SPECIFICATION / BLUEPRINT]]\nRegras de arquitetura definidas:\n${projectSpec}\n` : ''}
    ${diffContext ? `[[GIT DIFF / MUDANÇAS]]\nO usuário está analisando estas mudanças:\n${diffContext}\n` : ''}
  `;

  const config: any = {
    temperature: 0.7,
    systemInstruction: systemPrompt,
  };

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }
  
  if (useThinking) {
    config.thinkingConfig = { thinkingBudget: budget };
  }

  const historyContents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }, ...(msg.attachments?.map(att => ({ inlineData: { data: att.data, mimeType: att.mimeType } })) || [])]
  }));

  const contents = [...historyContents, { role: 'user', parts: [{ text: userPrompt }, ...attachments.map(att => ({ inlineData: { data: att.data, mimeType: att.mimeType } }))] }];

  try {
    if (onStream) {
      const responseStream = await ai.models.generateContentStream({ model: modelName, contents, config });
      let fullText = '';
      let groundingMetadata: any = null;
      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) { fullText += text; onStream(text); }
        if (chunk.candidates?.[0]?.groundingMetadata) groundingMetadata = chunk.candidates[0].groundingMetadata;
      }
      if (groundingMetadata?.groundingChunks) {
        const sources = groundingMetadata.groundingChunks.map((c: any) => c.web ? `- [${c.web.title}](${c.web.uri})` : null).filter(Boolean);
        if (sources.length > 0) {
          const sourcesMd = `\n\n---\n### 🌐 Fontes da Pesquisa\n${sources.join('\n')}`;
          fullText += sourcesMd;
          onStream(sourcesMd);
        }
      }
      return fullText;
    } else {
      const response = await ai.models.generateContent({ model: modelName, contents, config });
      let text = response.text || "";
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        const sources = groundingMetadata.groundingChunks.map((c: any) => c.web ? `- [${c.web.title}](${c.web.uri})` : null).filter(Boolean);
        if (sources.length > 0) text += `\n\n---\n### 🌐 Fontes da Pesquisa\n${sources.join('\n')}`;
      }
      return text;
    }
  } catch (error: any) {
    throw new Error(`Erro na IA: ${error.message}`);
  }
};

export const mergeCodeChanges = async (
  originalContent: string,
  partialFix: string,
  filePath: string,
  customMergePrompt?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const basePrompt = customMergePrompt || DEFAULT_MERGE_PROMPT;

  const prompt = `
    ${basePrompt}

    [[ARQUIVO ORIGINAL]]
    Caminho: ${filePath}
    Conteúdo:
    ${originalContent}

    [[ALTERAÇÃO SUGERIDA]]
    Esta alteração pode ser apenas um trecho ou o arquivo todo:
    ${partialFix}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.0,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    let cleanText = response.text || "";
    cleanText = cleanText.replace(/^```[a-z]*\n/i, '').replace(/\n```$/g, '').trim();
    
    return cleanText;
  } catch (error: any) {
    console.error("Merge error:", error);
    throw new Error("Falha ao reconstruir arquivo: " + error.message);
  }
};

export const generateProjectBlueprint = async (
  projectContext: string,
  userConfig?: GeminiConfig,
  customBlueprintPrompt?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const basePrompt = customBlueprintPrompt || DEFAULT_BLUEPRINT_PROMPT;
  const prompt = `${basePrompt}\nCONTEXTO:\n${projectContext.slice(0, 800000)}`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: { temperature: 0.2, thinkingConfig: { thinkingBudget: 16000 } }
    });
    return response.text || "";
  } catch (error: any) {
    throw new Error("Falha ao gerar Blueprint: " + error.message);
  }
};

export const generateAdaptiveTemplates = async (projectContext: string): Promise<AnalysisTemplate[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Crie 3 prompts de análise customizados úteis para este código em formato JSON Array.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `CÓDIGO:\n${projectContext.slice(0, 30000)}\n\n${prompt}` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, description: { type: Type.STRING }, prompt: { type: Type.STRING }, icon: { type: Type.STRING } },
            required: ["id", "name", "description", "prompt", "icon"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) { return []; }
};

export const generateSmartSuggestions = async (projectContext: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Gere 4 perguntas curtas de auditoria sobre este código em JSON Array.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `CONTEXTO:\n${projectContext.slice(0, 50000)}\n\n${prompt}` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) { return ["Analise a arquitetura", "Busque bugs", "Melhore performance", "Crie diagramas"]; }
};
