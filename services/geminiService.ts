
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiConfig, Attachment, AnalysisTemplate } from "../types";

export const performProjectAnalysis = async (
  projectContext: string,
  userPrompt: string,
  onStream?: (chunk: string) => void,
  diffContext?: string,
  userConfig?: GeminiConfig,
  projectSpec?: string,
  attachments: Attachment[] = []
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const modelName = userConfig?.model || 'gemini-3-pro-preview';
  const useThinking = userConfig?.useThinking !== false;
  const budget = modelName === 'gemini-3-pro-preview' ? 32768 : 24576;

  const systemPrompt = `
    Você é um Arquiteto de Software Sênior e Revisor de Código Elite operando em modo Spec-Driven Development.
    
    ${projectSpec ? `BLUEPRINT TÉCNICO DO PROJETO (REGRAS DE OURO):
    ---
    ${projectSpec}
    ---` : ''}

    CONTEXTO DO CÓDIGO FONTE DO PROJETO:
    ---
    ${projectContext}
    ---
    
    ${diffContext ? `MUDANÇAS PROPOSTAS (DIFF):\n---\n${diffContext}\n---` : ''}
    
    INSTRUÇÕES:
    1. Respeite estritamente o Blueprint Técnico acima.
    2. Se a tarefa violar a arquitetura definida, alerte o usuário antes de prosseguir.
    3. Analise também quaisquer arquivos de apoio (anexos) fornecidos nesta mensagem.
    4. Seja técnico, preciso e mantenha a consistência com o estilo de código detectado.
  `;

  const config: any = {
    temperature: 0.7,
  };

  if (useThinking) {
    config.thinkingConfig = { thinkingBudget: budget };
  }

  // Added explicit type to parts array to allow mixing text and inlineData parts correctly for the Gemini API
  const parts: any[] = [
    { text: systemPrompt },
    { text: `TAREFA DO USUÁRIO: ${userPrompt}` }
  ];

  // Adicionar anexos se existirem
  attachments.forEach(att => {
    parts.push({
      inlineData: {
        data: att.data,
        mimeType: att.mimeType
      }
    });
  });

  try {
    if (onStream) {
      const responseStream = await ai.models.generateContentStream({
        model: modelName,
        contents: [{ parts }],
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
        contents: [{ parts }],
        config
      });
      return response.text || "O modelo não retornou conteúdo.";
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Erro na comunicação com o Gemini.");
  }
};

export const generateProjectBlueprint = async (
  projectContext: string,
  userConfig?: GeminiConfig
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-pro-preview';
  
  const prompt = `
    Analise o código fonte fornecido e gere um BLUEPRINT TÉCNICO (Spec) estruturado.
    Este documento servirá de guia para futuras manutenções por IA.
    
    FORMATO DESEJADO:
    1. **Domain Logic**: Quais as entidades principais e regras de negócio?
    2. **Data Flow**: Como os dados transitam entre componentes?
    3. **Tech Stack & Invariants**: Tecnologias chaves e padrões que NUNCA devem ser quebrados (ex: SOLID, Clean Arch).
    4. **Critical Paths**: Áreas sensíveis (Segurança, Performance).

    CÓDIGO:
    ${projectContext}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ text: prompt }] }],
      config: { 
        temperature: 0.4,
        thinkingConfig: { thinkingBudget: 32768 } 
      }
    });
    return response.text || "Falha ao gerar blueprint.";
  } catch (error: any) {
    throw new Error("Erro ao gerar Blueprint: " + error.message);
  }
};

export const generateAdaptiveTemplates = async (
  projectContext: string
): Promise<AnalysisTemplate[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Truncate context heavily for this specific task to save tokens/time, header files usually enough
  const contextSnippet = projectContext.slice(0, 50000); 

  const prompt = `
    Analise este snippet de código de um projeto.
    Gere 3 templates de prompts de análise ALTAMENTE ESPECÍFICOS para este projeto.
    Por exemplo, se for React, sugira prompts sobre Hooks ou Re-renders. Se for Backend, sobre API ou DB.
    
    Retorne APENAS um JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Flash is fast enough for this
      contents: [{ parts: [{ text: `CONTEXTO:\n${contextSnippet}\n\n${prompt}` }] }],
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

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as AnalysisTemplate[];
  } catch (error) {
    console.error("Erro ao gerar templates adaptativos", error);
    return [];
  }
};
