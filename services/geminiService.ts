
import { GoogleGenAI } from "@google/genai";

export const performProjectAnalysis = async (
  projectContext: string,
  userPrompt: string,
  onStream?: (chunk: string) => void,
  diffContext?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-pro-preview';

  const fullPrompt = `
    Você é um Arquiteto de Software Sênior e Revisor de Código Elite.
    
    CONTEXTO DO PROJETO BASE:
    ---
    ${projectContext}
    ---
    
    ${diffContext ? `MUDANÇAS PROPOSTAS (DIFF/PATCH):\n---\n${diffContext}\n---` : ''}
    
    TAREFA:
    ${userPrompt}
    
    DIRETRIZES:
    1. Use o Contexto do Projeto Base para entender as dependências e padrões.
    2. Se houver um Diff, foque sua análise no impacto dessas mudanças sobre o código base.
    3. Identifique riscos de regressão, violações de padrões e oportunidades de refatoração.
    4. Forneça respostas estruturadas e técnicas.
  `;

  try {
    const config = {
      temperature: 0.4, // Menor temperatura para análises técnicas mais precisas
      thinkingConfig: { thinkingBudget: 32768 }
    };

    if (onStream) {
      const result = await ai.models.generateContentStream({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        config
      });

      let fullText = '';
      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          onStream(text);
        }
      }
      return fullText;
    } else {
      const result = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        config
      });
      return result.text || "Sem resposta.";
    }
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Falha na análise. Verifique se o volume de dados não excedeu os limites.");
  }
};
