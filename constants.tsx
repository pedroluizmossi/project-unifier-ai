
import React from 'react';
import { AnalysisTemplate } from './types';

export const ANALYSIS_TEMPLATES: AnalysisTemplate[] = [
  {
    id: 'mr-review',
    name: 'Merge Request Review',
    description: 'Análise rigorosa das mudanças (diff) comparando com o contexto base do projeto.',
    prompt: 'Analise este Merge Request (Diff). Compare as mudanças com o código base fornecido. Identifique bugs introduzidos, inconsistências de estilo e sugira melhorias focadas apenas no código alterado.',
    icon: '🔍'
  },
  {
    id: 'impact-analysis',
    name: 'Impact & Side Effects',
    description: 'Descubra efeitos colaterais: onde este diff pode quebrar o sistema?',
    prompt: 'Com base no Diff fornecido e no código base do projeto, identifique possíveis efeitos colaterais. Quais componentes ou funções que não foram alterados podem ser afetados por essas mudanças? Existe risco de regressão?',
    icon: '🌊'
  },
  {
    id: 'tech-spec',
    name: 'Technical Specification',
    description: 'Documentação completa do projeto no estilo Events-Hub.',
    prompt: 'Analyze this project and generate a comprehensive Technical Specification. Include an Overview, Macro Architecture (with Mermaid diagram), Component View, Architectural Decisions (ADRs), full Tech Stack list, and a detailed Data Model description.',
    icon: '📄'
  },
  {
    id: 'breaking-changes',
    name: 'Breaking Changes Audit',
    description: 'Verifique se o patch altera contratos, APIs ou esquemas de banco de dados.',
    prompt: 'Foque nas mudanças do Diff. Existem alterações em assinaturas de métodos públicos, APIs ou contratos de dados? Liste todas as possíveis Breaking Changes e quem deve ser avisado.',
    icon: '💥'
  }
];

export const DEFAULT_IGNORE = [
    '.git*', 'node_modules', 'dist', 'build', '.vscode', '.idea', 'vendor', '__pycache__', '.DS_Store', 'package-lock.json', 'yarn.lock'
];
