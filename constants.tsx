
import { AnalysisTemplate } from './types';

export const ANALYSIS_TEMPLATES: AnalysisTemplate[] = [
  {
    id: 'mr-review',
    name: 'Merge Request Review',
    description: 'Análise rigorosa das mudanças (diff) comparando com o código base.',
    prompt: 'Analise este Merge Request (Diff). Compare as mudanças com o código base fornecido. Identifique bugs introduzidos, inconsistências de estilo e sugira melhorias focadas apenas no código alterado.',
    icon: '🔍'
  },
  {
    id: 'security-audit',
    name: 'Security Guard (OWASP)',
    description: 'Busca por vulnerabilidades como SQL Injection, XSS ou vazamento de segredos.',
    prompt: 'Atue como um Especialista em Segurança. Analise o contexto fornecido em busca de falhas de segurança conhecidas (OWASP Top 10). Verifique sanitização de inputs, gestão de segredos e permissões. Se encontrar algo, forneça a correção imediata.',
    icon: '🛡️'
  },
  {
    id: 'performance-pro',
    name: 'Performance & Scalability',
    description: 'Identifique gargalos de processamento, queries lentas ou re-renders excessivos.',
    prompt: 'Analise o desempenho deste código. Procure por loops ineficientes, complexidade O(n^2) desnecessária, falta de memoização (se for React) e sugira otimizações que reduzam o consumo de CPU/Memória.',
    icon: '🚀'
  },
  {
    id: 'arch-viz',
    name: 'Visualize Architecture',
    description: 'Gera diagramas Mermaid para explicar o fluxo de dados e componentes.',
    prompt: 'Crie uma representação visual deste projeto usando diagramas Mermaid. Inclua um Diagrama de Sequência para o fluxo principal e um Diagrama de Classes ou Entidades. Use o formato ```mermaid para que eu possa renderizar.',
    icon: '🗺️'
  },
  {
    id: 'tech-spec',
    name: 'Technical Specification',
    description: 'Documentação completa e estruturada do sistema.',
    prompt: 'Gere uma Especificação Técnica detalhada. Inclua Visão Geral, Stack Tecnológica, Decisões de Arquitetura (ADRs) e Modelo de Dados.',
    icon: '📄'
  }
];

export const DEFAULT_IGNORE = [
    '.git*', 'node_modules', 'dist', 'build', '.vscode', '.idea', 'vendor', '__pycache__', '.DS_Store', 'package-lock.json', 'yarn.lock'
];
