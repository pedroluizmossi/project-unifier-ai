
import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderContent = async () => {
      if (!containerRef.current) return;

      // 1. Highlight standard code blocks with Prism
      if ((window as any).Prism) {
        (window as any).Prism.highlightAllUnder(containerRef.current);
      }

      // 2. Render Mermaid diagrams
      const mermaidElements = containerRef.current.querySelectorAll('.mermaid-viewer:not([data-processed="true"])');
      if (mermaidElements.length > 0 && (window as any).mermaid) {
        try {
          // Pequeno delay para garantir que o DOM está pronto e o Mermaid carregado
          await new Promise(resolve => setTimeout(resolve, 50));
          await (window as any).mermaid.run({
            nodes: Array.from(mermaidElements)
          });
          mermaidElements.forEach(el => el.setAttribute('data-processed', 'true'));
        } catch (err) {
          console.error("Mermaid execution error:", err);
        }
      }
    };

    renderContent();
  }, [content]);

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    const copyBtn = target.closest('.copy-code-btn');
    if (copyBtn) {
      const code = copyBtn.getAttribute('data-code');
      if (code) {
        navigator.clipboard.writeText(atob(code)).then(() => {
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = '<span class="text-emerald-500 font-bold">Copiado!</span>';
          setTimeout(() => { copyBtn.innerHTML = originalText; }, 2000);
        });
      }
      return;
    }

    const toggleBtn = target.closest('.mermaid-toggle');
    if (toggleBtn) {
      const mode = toggleBtn.getAttribute('data-mode');
      const container = toggleBtn.closest('.mermaid-container');
      if (container) {
        if (mode === 'code') {
          container.classList.remove('show-viz');
          container.classList.add('show-code');
        } else {
          container.classList.remove('show-code');
          container.classList.add('show-viz');
        }
      }
    }
  };

  const renderer = new marked.Renderer();

  // Assinatura robusta para lidar com mudanças de API do marked
  renderer.code = function(codeOrToken: any, language?: string) {
    let code = '';
    let lang = language;

    // Detecta se é o novo formato de token (objeto) ou o antigo (posicional)
    if (typeof codeOrToken === 'object' && codeOrToken !== null) {
      code = codeOrToken.text || '';
      lang = codeOrToken.lang || lang;
    } else {
      code = codeOrToken || '';
    }

    const isMermaid = lang === 'mermaid';
    const base64Code = btoa(unescape(encodeURIComponent(code)));

    if (isMermaid) {
      return `
        <div class="mermaid-container show-viz my-6">
          <div class="flex items-center justify-between px-4 py-2 bg-slate-900/80 border border-white/5 rounded-t-xl">
            <span class="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Diagrama Mermaid</span>
            <div class="flex bg-black/40 p-1 rounded-lg border border-white/5">
              <button class="mermaid-toggle px-2 py-1 rounded text-[9px] font-bold uppercase transition-all hover:text-white" data-mode="viz">Visualização</button>
              <button class="mermaid-toggle px-2 py-1 rounded text-[9px] font-bold uppercase transition-all hover:text-white" data-mode="code">Código</button>
            </div>
          </div>
          <div class="mermaid-viewer bg-[#16171d] p-8 border-x border-b border-white/5 rounded-b-xl flex justify-center">
            ${code}
          </div>
          <div class="mermaid-code hidden">
            <div class="code-block-wrapper !mt-0 !rounded-t-none">
              <div class="code-block-header">
                <span class="text-[10px] font-mono text-slate-500 uppercase">mermaid source</span>
                <button class="copy-code-btn text-slate-500 hover:text-white transition-colors" data-code="${base64Code}">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
              </div>
              <pre><code>${code}</code></pre>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="text-[10px] font-mono text-slate-500 uppercase">${lang || 'text'}</span>
          <button class="copy-code-btn text-slate-500 hover:text-white transition-colors flex items-center gap-1.5" data-code="${base64Code}">
            <span class="text-[9px] font-bold uppercase tracking-widest">Copy</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </button>
        </div>
        <pre class="language-${lang || 'text'}"><code>${code}</code></pre>
      </div>
    `;
  };

  const html = DOMPurify.sanitize(marked.parse(content, { renderer }) as string, {
    ADD_TAGS: ['svg', 'use', 'path', 'rect', 'circle', 'g', 'foreignObject'], // Permitir tags que o Mermaid pode injetar
    ADD_ATTR: ['d', 'viewBox', 'fill', 'stroke', 'stroke-width', 'transform']
  });

  return (
    <div 
      ref={containerRef}
      onClick={handleContainerClick}
      className={`prose prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownRenderer;
