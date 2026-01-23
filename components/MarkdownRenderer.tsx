
import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import MermaidFullscreenModal from './MermaidFullscreenModal';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Utilitários para Base64 seguros com UTF-8
const utf8ToB64 = (str: string) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
const b64ToUtf8 = (str: string) => decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreenCode, setFullscreenCode] = useState<string | null>(null);

  useEffect(() => {
    const renderContent = async () => {
      if (!containerRef.current) return;

      // 1. Highlight standard code blocks with Prism
      if ((window as any).Prism) {
        (window as any).Prism.highlightAllUnder(containerRef.current);
      }

      // 2. Render Mermaid diagrams in main container
      const mermaidElements = containerRef.current.querySelectorAll('.mermaid-viewer:not([data-processed="true"])');
      if (mermaidElements.length > 0 && (window as any).mermaid) {
        try {
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
    
    // Copy Button Logic
    const copyBtn = target.closest('.copy-code-btn');
    if (copyBtn) {
      const code = copyBtn.getAttribute('data-code');
      if (code) {
        try {
          navigator.clipboard.writeText(b64ToUtf8(code)).then(() => {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span class="text-emerald-500 font-bold">Copiado!</span>';
            setTimeout(() => { copyBtn.innerHTML = originalText; }, 2000);
          });
        } catch (err) {
          console.error("Erro ao decodificar código para cópia:", err);
        }
      }
      return;
    }

    // Mermaid Toggle Logic
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
      return;
    }

    // Expand Logic
    const expandBtn = target.closest('.mermaid-expand');
    if (expandBtn) {
      const code = expandBtn.getAttribute('data-mermaid-code');
      if (code) {
        try {
          setFullscreenCode(b64ToUtf8(code));
        } catch (err) {
          console.error("Erro ao decodificar código Mermaid:", err);
        }
      }
    }
  };

  const renderer = new marked.Renderer();

  renderer.code = function(codeOrToken: any, language?: string) {
    let code = '';
    let lang = language;

    if (typeof codeOrToken === 'object' && codeOrToken !== null) {
      code = codeOrToken.text || '';
      lang = codeOrToken.lang || lang;
    } else {
      code = codeOrToken || '';
    }

    const isMermaid = lang === 'mermaid';
    const base64Code = utf8ToB64(code);

    if (isMermaid) {
      return `
        <div class="mermaid-container show-viz my-6 group/mermaid">
          <div class="flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-white/10 rounded-t-xl backdrop-blur-md">
            <div class="flex items-center gap-3">
              <span class="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Diagrama Arquitetural</span>
              <button class="mermaid-expand p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-md transition-all" data-mermaid-code="${base64Code}" title="Expandir para tela cheia">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" /></svg>
              </button>
            </div>
            <div class="flex bg-black/40 p-1 rounded-lg border border-white/5">
              <button class="mermaid-toggle px-3 py-1 rounded text-[9px] font-bold uppercase transition-all hover:text-white" data-mode="viz">Visualização</button>
              <button class="mermaid-toggle px-3 py-1 rounded text-[9px] font-bold uppercase transition-all hover:text-white" data-mode="code">Código Fonte</button>
            </div>
          </div>
          <div class="mermaid-viewer bg-[#0d0e12] p-8 border-x border-b border-white/10 rounded-b-xl flex justify-center items-center min-h-[200px] overflow-hidden">
            ${code}
          </div>
          <div class="mermaid-code">
            <div class="code-block-wrapper !mt-0 !rounded-t-none border-t-0">
              <div class="code-block-header !bg-black/20">
                <span class="text-[10px] font-mono text-slate-500 uppercase">mermaid source</span>
                <button class="copy-code-btn text-slate-500 hover:text-white transition-colors" data-code="${base64Code}">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
              </div>
              <pre class="!bg-transparent !p-4"><code class="language-mermaid">${code}</code></pre>
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
    ADD_TAGS: ['svg', 'use', 'path', 'rect', 'circle', 'g', 'foreignObject'],
    ADD_ATTR: ['d', 'viewBox', 'fill', 'stroke', 'stroke-width', 'transform']
  });

  return (
    <>
      <div 
        ref={containerRef}
        onClick={handleContainerClick}
        className={`prose prose-invert max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <MermaidFullscreenModal 
        isOpen={!!fullscreenCode}
        onClose={() => setFullscreenCode(null)}
        code={fullscreenCode || ''}
      />
    </>
  );
};

export default MarkdownRenderer;
