
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
    id: 'tech-doc-expert',
    name: 'Documentação Técnica Expert',
    description: 'Gera docs profundas padrão Senior X: Arquitetura, Mermaid e Fluxos.',
    prompt: `Atue como um Technical Writer Sênior. Gere uma Documentação Técnica completa e profissional seguindo o padrão de excelência da Senior X. 

A estrutura deve conter:
1. **Visão Geral**: Propósito do serviço/extensão e lista de responsabilidades principais.
2. **Arquitetura e Design**: 
   - Visão Macro (como se integra ao ecossistema).
   - Componentes Chave (explicação dos módulos src/).
   - Decisões Arquiteturais (justificativas técnicas).
   - Stack Tecnológica detalhada.
3. **Diagramas Mermaid**: 
   - Um 'flowchart TB' representando o fluxo principal.
   - Um 'sequenceDiagram' para interações complexas (ex: Auth ou Debug).
4. **Modelo de Dados / Estado**: 
   - Se for microsserviço: ERD das tabelas.
   - Se for frontend/extensão: Esquema de persistência (LocalStorage/GlobalState).
5. **Documentação Mínima por Feature**: Escolha as 3 funcionalidades mais críticas e faça um deep-dive técnico (ex: Polítca de Retentativas, Estratégia de Debug Local, Cache de Tokens).
6. **Configurações e Limitações**: Variáveis de ambiente, timeouts e comportamentos em casos de erro.

Use Markdown avançado, badges de informação e diagramas Mermaid NEO/NEUTRAL.`,
    icon: '📚'
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
    prompt: 'Analise o desempenho deste código. Procure por loops ineficientes, complexidade O(n^2) desnecessária, falta de memoização (se for React) e sugira optimizações que reduzam o consumo de CPU/Memória.',
    icon: '🚀'
  },
  {
    id: 'arch-viz',
    name: 'Visualize Architecture',
    description: 'Gera diagramas Mermaid para explicar o fluxo de dados e componentes.',
    prompt: 'Crie uma representação visual deste projeto usando diagramas Mermaid. Inclua um Diagrama de Sequência para o fluxo principal e um Diagrama de Classes ou Entidades. Use o formato ```mermaid para que eu possa renderizar.',
    icon: 'MAP'
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
