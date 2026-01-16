# Project Unifier AI

O **Project Unifier AI** é uma ferramenta de engenharia de software projetada para transformar bases de código locais em contextos estruturados para análise por Grandes Modelos de Linguagem (LLMs), especificamente integrado com o Google Gemini 3 Pro.

A aplicação atua como uma ponte entre o ambiente de desenvolvimento local e a IA, permitindo revisões de código, auditorias de segurança e visualização de arquitetura sem a necessidade de copiar e colar arquivos manualmente.

## Funcionalidades Principais

### 1. Gestão de Contexto e Arquivos
- **Leitura de Diretório Local:** Utiliza a *File System Access API* para ler diretórios inteiros diretamente do navegador.
- **Filtragem Inteligente:** Ignora automaticamente arquivos binários, grandes volumes de dados e padrões comuns (`node_modules`, `.git`, etc.) definidos em `constants.tsx`.
- **Cálculo de Tokens:** Estimativa em tempo real do custo computacional do contexto selecionado.
- **Suporte a Diff/Patch:** Modo dedicado para análise de Merge Requests (MRs) através da inserção de diffs do Git.

### 2. Integração com Gemini 3 Pro
- Utiliza o SDK `@google/genai` para comunicação direta com o modelo `gemini-3-pro-preview`.
- **Streaming de Resposta:** Feedback visual em tempo real enquanto a análise é gerada.
- **Budget de Pensamento (Thinking Config):** Configurado com budget de 32k tokens para raciocínio complexo em tarefas de arquitetura e segurança.

### 3. Templates de Análise Automatizada
O sistema possui prompts especializados pré-configurados:
- **Merge Request Review:** Foca em mudanças incrementais, bugs e estilo.
- **Security Guard (OWASP):** Varredura por vulnerabilidades conhecidas (SQLi, XSS, Secrets).
- **Performance & Scalability:** Identificação de complexidade ciclomática e gargalos (Big O).
- **Visualize Architecture:** Geração de diagramas Mermaid.js (Sequência, Classes) baseados no código.
- **Technical Specification:** Geração de documentação técnica automática.

### 4. Interface e Visualização
- **Dashboard de Métricas:** Visualização de contagem de arquivos, tamanho total e linguagens detectadas.
- **Renderização Markdown:** O output da IA é renderizado com suporte a sintaxe de código e diagramas.
- **Exportação:** Capacidade de baixar o contexto unificado em formatos Markdown, JSON ou XML.

## Stack Tecnológica

- **Frontend:** React 19, TypeScript
- **Estilização:** Tailwind CSS (com plugin Typography)
- **IA/LLM:** Google GenAI SDK (`@google/genai`)
- **Utilitários:** 
  - `marked` & `dompurify` (Renderização segura de Markdown)
  - `mermaid` (Diagramas via CDN)

## Configuração e Instalação

### Pré-requisitos
O projeto depende de uma chave de API do Google Gemini configurada no ambiente.

1. Obtenha uma chave em [Google AI Studio](https://aistudio.google.com/).
2. A chave deve ser disponibilizada via variável de ambiente `process.env.API_KEY`.

### Executando o Projeto
Como o projeto utiliza Módulos ES diretamente no navegador (via `importmap` no `index.html`), ele deve ser servido por um servidor estático ou ambiente de desenvolvimento compatível (como Vite ou StackBlitz).

Não é necessário um processo de build complexo (Webpack/Rollup) devido à estrutura moderna de imports via CDN (`esm.sh`).

## Estrutura do Projeto

- **App.tsx:** Componente principal, gerencia o estado global, seleção de arquivos e modos de aplicação.
- **services/geminiService.ts:** Camada de abstração para a API do Google GenAI. Define modelos, temperatura e configurações de *thinking*.
- **components/AIAnalysisPanel.tsx:** Interface do usuário para interação com a IA (chat e templates).
- **lib/utils.ts:** Lógica auxiliar para manipulação de sistema de arquivos e formatação de dados.
- **constants.tsx:** Definição dos templates de prompt e listas de ignorar arquivos.

## Considerações de Segurança

O processamento de arquivos ocorre localmente no navegador do usuário. O conteúdo dos arquivos é enviado para a API do Google Gemini apenas quando o usuário solicita explicitamente uma análise ("Deep Insight" ou "Gerar Raio-X").