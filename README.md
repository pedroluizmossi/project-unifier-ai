# Project Unifier AI

![Status](https://img.shields.io/badge/Status-Development-blue)
![Stack](https://img.shields.io/badge/Stack-React_19_|_Vite_|_TypeScript-3178C6)
![AI Model](https://img.shields.io/badge/AI-Gemini_3_Pro-8E44AD)

**Project Unifier AI** é uma ferramenta avançada de engenharia de software projetada para fazer a ponte entre seu ambiente de desenvolvimento local e o poder do **Google Gemini 3 Pro**. 

Diferente de chats de IA convencionais, esta aplicação permite carregar diretórios inteiros, calcular tokens, filtrar arquivos irrelevantes e realizar análises arquiteturais profundas sem copiar e colar código manualmente.

<img width="2496" height="1319" alt="image" src="https://github.com/user-attachments/assets/7164c8d9-35e8-4ac1-b871-000d4163ae43" />

## Funcionalidades Principais

### Integração com Gemini 3 Pro & Flash
- **Thinking Mode:** Utiliza o budget de pensamento estendido (até 32k tokens) do Gemini 3 Pro para raciocínio complexo em arquitetura e segurança.
- **Streaming em Tempo Real:** Feedback visual imediato enquanto a IA processa a resposta.
- **Templates Adaptativos:** A IA analisa seu código e gera prompts customizados (Adaptive Templates) específicos para sua stack.

### Gestão de Contexto Inteligente
- **File System Access API:** Leitura direta de pastas locais (sem upload para servidor intermediário).
- **Filtragem Automática:** Ignora `node_modules`, `.git`, binários e arquivos grandes automaticamente.
- **Controle de Tokens:** Visualização em tempo real do consumo de tokens para otimizar o contexto enviado à LLM.
- **Exportação:** Gere arquivos unificados em Markdown, JSON ou XML para documentação ou uso externo.

### 🛠 Ferramentas de Engenharia
- **Análise de Merge Request (Diff):** Modo dedicado para colar `git diff` e focar a análise apenas nas mudanças, detectando bugs regressivos.
- **Visualização Arquitetural:** Renderização nativa de diagramas **Mermaid.js** (Flowcharts, Sequence, Class Diagrams) gerados pela IA.
- **Templates Especializados:**
  - **Security Guard:** Auditoria OWASP Top 10.
  - **Performance Pro:** Detecção de complexidade Big O e gargalos.
  - **Tech Writer:** Geração de documentação técnica padrão enterprise.

### Persistência Local
- **Sessões Salvas:** Projetos e históricos de chat são salvos via **IndexedDB** no navegador.
- **Favoritos:** Salve insights valiosos para referência futura.

## Como Executar

### Pré-requisitos
- Node.js 18+
- Uma chave de API do Google Gemini (obtenha em [Google AI Studio](https://aistudio.google.com/)).

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/project-unifier-ai.git
   cd project-unifier-ai
   ```

2. Instale as dependências:
   ```bash
   npm install
   # ou
   yarn install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env.local` na raiz do projeto:
   ```env
   GEMINI_API_KEY=sua_chave_api_aqui
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

5. Acesse `http://localhost:3000`.

## Arquitetura do Projeto

O projeto segue uma arquitetura moderna baseada em React 19 e Vite:

*   **`services/geminiService.ts`**: Camada de abstração do SDK `@google/genai`. Gerencia a configuração de modelos, budgets de pensamento e construção de prompts do sistema.
*   **`hooks/useProjectManager.ts`**: Gerencia o estado global da aplicação, interagindo com o `lib/storage.ts` (IndexedDB) para persistência de sessões e com o sistema de arquivos.
*   **`components/MarkdownRenderer.tsx`**: Componente complexo responsável por renderizar o output da IA, incluindo *syntax highlighting* (Prism.js) e diagramas (Mermaid), além de sanitização de HTML.
*   **`lib/utils.ts`**: Utilitários para processamento de arquivos, conversão Base64 e construção de árvores de diretórios.

## Privacidade e Segurança

*   **Processamento Local:** A leitura e filtragem dos arquivos ocorrem inteiramente no seu navegador.
*   **Envio de Dados:** O conteúdo dos arquivos é enviado para a API do Google **apenas** quando você solicita uma análise (clica em enviar ou seleciona um template).
*   **Sanitização:** Todas as respostas da IA passam pelo `DOMPurify` antes de serem renderizadas para prevenir ataques XSS.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir Issues ou Pull Requests para melhorar.
