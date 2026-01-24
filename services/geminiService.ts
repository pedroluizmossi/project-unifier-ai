
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiConfig, Attachment, AnalysisTemplate, ChatMessage } from "../types";

export const performProjectAnalysis = async (
  projectContext: string,
  userPrompt: string,
  onStream?: (chunk: string) => void,
  diffContext?: string,
  userConfig?: GeminiConfig,
  projectSpec?: string,
  attachments: Attachment[] = [],
  history: ChatMessage[] = []
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const modelName = userConfig?.model || 'gemini-3-pro-preview';
  const useThinking = userConfig?.useThinking !== false;
  // Ajuste de budget: Modelos Pro suportam mais tokens de pensamento
  const budget = modelName.includes('pro') ? 32768 : 24576;

  // Construção do System Prompt Robusto
  const systemPrompt = `
    Você é um Arquiteto de Software Sênior e Revisor de Código Elite (Project Unifier AI).
    
    [[CONTEXTO DO PROJETO]]
    O usuário carregou os seguintes arquivos do projeto para análise:
    ---
    ${projectContext}
    ---

    ${projectSpec ? `[[SPECIFICATION / BLUEPRINT]]\nRegras de arquitetura definidas:\n${projectSpec}\n` : ''}
    ${diffContext ? `[[GIT DIFF / MUDANÇAS]]\nO usuário está analisando estas mudanças:\n${diffContext}\n` : ''}

    DIRETRIZES:
    1. Responda com precisão técnica, citando arquivos e trechos de código quando relevante.
    2. Se houver um Blueprint, siga-o estritamente.
    3. Use Markdown para formatar a resposta (blocos de código, negrito, listas).
    4. Seja direto e evite preâmbulos desnecessários.
  `;

  const config: any = {
    temperature: 0.7,
    systemInstruction: systemPrompt, // Correção: systemInstruction deve estar dentro de config
  };

  if (useThinking) {
    config.thinkingConfig = { thinkingBudget: budget };
  }

  // Mapeamento do histórico para o formato da API
  const historyContents = history.map(msg => {
    const parts: any[] = [{ text: msg.text }];
    if (msg.role === 'user' && msg.attachments) {
      msg.attachments.forEach(att => {
        parts.push({
          inlineData: {
            data: att.data,
            mimeType: att.mimeType
          }
        });
      });
    }
    return {
      role: msg.role,
      parts
    };
  });

  // Construção da mensagem atual
  const currentParts: any[] = [{ text: userPrompt }];
  attachments.forEach(att => {
    currentParts.push({
      inlineData: {
        data: att.data,
        mimeType: att.mimeType
      }
    });
  });

  const contents = [
    ...historyContents,
    { role: 'user', parts: currentParts }
  ];

  try {
    if (onStream) {
      const responseStream = await ai.models.generateContentStream({
        model: modelName,
        contents,
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
        contents,
        config
      });
      return response.text || "O modelo processou a solicitação mas não retornou texto.";
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(`Erro na IA: ${error.message}`);
  }
};

export const generateProjectBlueprint = async (
  projectContext: string,
  userConfig?: GeminiConfig
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Para blueprints, usamos sempre o modelo Pro com thinking alto
  const prompt = `
    Analise profundamente o código fonte fornecido e gere um "Technical Blueprint" (Especificação Técnica).
    
    Estrutura da Resposta (Markdown):
    # Blueprint do Sistema
    ## 1. Visão Geral & Domínio
    Resumo do propósito do software e principais entidades.
    
    ## 2. Arquitetura de Dados
    Como os dados fluem? Principais stores, bancos ou estados globais.
    
    ## 3. Stack & Padrões
    Linguagens, frameworks e patterns identificados (ex: MVVM, Repository, Hooks).
    
    ## 4. Pontos Críticos
    Áreas que requerem atenção especial (segurança, performance, dívida técnica).
    
    CONTEXTO DO CÓDIGO:
    ${projectContext.slice(0, 800000)} // Limite de segurança, embora Gemini 1.5 suporte muito mais
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: { 
        temperature: 0.2,
        thinkingConfig: { thinkingBudget: 16000 } // Budget menor para esta tarefa específica para ser mais rápido
      }
    });
    return response.text || "Não foi possível gerar o blueprint.";
  } catch (error: any) {
    throw new Error("Falha ao gerar Blueprint: " + error.message);
  }
};

export const generateAdaptiveTemplates = async (
  projectContext: string
): Promise<AnalysisTemplate[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const contextSnippet = projectContext.slice(0, 30000); 

  const prompt = `
    Com base neste código, crie 3 prompts de análise customizados úteis para um desenvolvedor.
    Retorne APENAS um JSON Array puro.
    Exemplo Schema: [{ "id": "...", "name": "...", "description": "...", "prompt": "...", "icon": "emoji" }]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `CÓDIGO:\n${contextSnippet}\n\n${prompt}` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              prompt: { type: Type.STRING },
              icon: { type: Type.STRING }
            },
            required: ["id", "name", "description", "prompt", "icon"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]") as AnalysisTemplate[];
  } catch (error) {
    console.warn("Erro templates adaptativos:", error);
    return [];
  }
};

export const generateSmartSuggestions = async (
  projectContext: string
): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Usamos um snippet para não gastar muitos tokens na sugestão rápida, mas suficiente para contexto
  const contextSnippet = projectContext.slice(0, 50000); 

  const prompt = `
    Você é um Tech Lead analisando este código.
    Gere 4 perguntas ou comandos curtos (max 10 palavras) que um desenvolvedor deveria fazer para auditar ou melhorar este projeto.
    Foque em: Arquitetura, Bugs Potenciais, Segurança ou Performance.
    Exemplos: "Analise o gerenciamento de estado", "Busque vazamento de memória nos hooks", "Audite a segurança das rotas de API".
    
    Retorne APENAS um JSON Array de strings. Ex: ["Pergunta 1", "Pergunta 2"]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `CONTEXTO (Snippet):\n${contextSnippet}\n\n${prompt}` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text || "[]") as string[];
  } catch (error) {
    console.warn("Erro ao gerar sugestões inteligentes:", error);
    return [
      "Explique a arquitetura principal",
      "Identifique pontos de falha",
      "Sugira melhorias de performance",
      "Crie diagramas do sistema"
    ]; // Fallback
  }
};
