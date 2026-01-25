
import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import MermaidFullscreenModal from './MermaidFullscreenModal';
import { FileInfo } from '../types';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  files?: FileInfo[];
  onApplyChange?: (path: string, newContent: string) => void;
}

const utf8ToB64 = (str: string) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
const b64ToUtf8 = (str: string) => decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "", files, onApplyChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreenCode, setFullscreenCode] = useState<string | null>(null);

  useEffect(() => {
    const renderContent = async () => {
      if (!containerRef.current) return;
      if ((window as any).Prism) (window as any).Prism.highlightAllUnder(containerRef.current);
      const mermaidElements = containerRef.current.querySelectorAll('.mermaid-viewer:not([data-processed="true"])');
      if (mermaidElements.length > 0 && (window as any).mermaid) {
        try {
          await new Promise(resolve => setTimeout(resolve, 50));
          await (window as any).mermaid.run({ nodes: Array.from(mermaidElements) });
          mermaidElements.forEach(el => el.setAttribute('data-processed', 'true'));
        } catch (err) { console.error("Mermaid execution error:", err); }
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
        navigator.clipboard.writeText(b64ToUtf8(code)).then(() => {
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = '<span class="text-emerald-500 font-bold">Copiado!</span>';
          setTimeout(() => { copyBtn.innerHTML = originalText; }, 2000);
        });
      }
      return;
    }

    const applyBtn = target.closest('.apply-change-btn');
    if (applyBtn && onApplyChange) {
      const code = applyBtn.getAttribute('data-code');
      const path = applyBtn.getAttribute('data-path');
      if (code && path) onApplyChange(path, b64ToUtf8(code));
      return;
    }

    const toggleBtn = target.closest('.mermaid-toggle');
    if (toggleBtn) {
      const mode = toggleBtn.getAttribute('data-mode');
      const container = toggleBtn.closest('.mermaid-container');
      if (container) {
        if (mode === 'code') { container.classList.remove('show-viz'); container.classList.add('show-code'); }
        else { container.classList.remove('show-code'); container.classList.add('show-viz'); }
      }
      return;
    }

    const expandBtn = target.closest('.mermaid-expand');
    if (expandBtn) {
      const code = expandBtn.getAttribute('data-mermaid-code');
      if (code) setFullscreenCode(b64ToUtf8(code));
    }
  };

  const renderer = new marked.Renderer();

  renderer.code = function(codeOrToken: any, language?: string) {
    let code = typeof codeOrToken === 'object' ? (codeOrToken.text || '') : (codeOrToken || '');
    let lang = typeof codeOrToken === 'object' ? (codeOrToken.lang || language) : language;
    const isMermaid = lang === 'mermaid';
    const base64Code = utf8ToB64(code);

    if (isMermaid) {
      return `
        <div class="mermaid-container show-viz my-6 group/mermaid">
          <div class="flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-white/10 rounded-t-xl backdrop-blur-md">
            <div class="flex items-center gap-3">
              <span class="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Diagrama Arquitetural</span>
              <button class="mermaid-expand p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-md transition-all" data-mermaid-code="${base64Code}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" /></svg>
              </button>
            </div>
            <div class="flex bg-black/40 p-1 rounded-lg border border-white/5">
              <button class="mermaid-toggle px-3 py-1 rounded text-[9px] font-bold uppercase transition-all hover:text-white" data-mode="viz">Visualização</button>
              <button class="mermaid-toggle px-3 py-1 rounded text-[9px] font-bold uppercase transition-all hover:text-white" data-mode="code">Código Fonte</button>
            </div>
          </div>
          <div class="mermaid-viewer bg-[#0d0e12] p-8 border-x border-b border-white/10 rounded-b-xl flex justify-center items-center min-h-[200px] overflow-hidden">${code}</div>
          <div class="mermaid-code">
            <div class="code-block-wrapper !mt-0 !rounded-t-none border-t-0">
              <div class="code-block-header !bg-black/20">
                <span class="text-[10px] font-mono text-slate-500 uppercase">mermaid source</span>
              </div>
              <pre class="!bg-transparent !p-4"><code class="language-mermaid">${code}</code></pre>
            </div>
          </div>
        </div>
      `;
    }

    // EXTRAÇÃO DE CAMINHO AVANÇADA
    const lines = code.split('\n');
    let filePath: string | null = null;
    
    if (files && files.length > 0) {
      // Analisa as primeiras 5 linhas em busca de padrões de caminho
      for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i].trim();
        // Regex aprimorada: Captura após comentário, ou após "File:", "Path:", ou linha que parece um caminho
        const match = line.match(/(?:(?:\/\/|#|<!--|--|;|\*|\/\*)\s*)?(?:(?:File|Path|Arquivo):\s*)?([a-zA-Z0-9_\-\/.\\]+\.[a-zA-Z0-9]+)/i);
        
        if (match && match[1]) {
          const rawPath = match[1].trim()
            .replace(/^[\\\/.\/]+/, '') // Remove ./ ou / iniciais
            .replace(/\\/g, '/')       // Normaliza backslashes
            .toLowerCase();
          
          // Busca o arquivo no projeto usando Suffix Match robusto
          const found = files.find(f => {
            const fPath = f.path.toLowerCase().replace(/\\/g, '/').replace(/^[\\\/]+/, '');
            return fPath === rawPath || fPath.endsWith(rawPath) || rawPath.endsWith(fPath);
          });

          if (found) {
            filePath = found.path;
            break;
          }
        }
      }
    }

    let applyButtonHtml = '';
    if (filePath && onApplyChange) {
      applyButtonHtml = `
        <button class="apply-change-btn flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400 rounded-md transition-all shadow-xl shadow-indigo-600/30 uppercase text-[10px] font-black tracking-widest animate-in fade-in zoom-in" data-code="${base64Code}" data-path="${filePath}">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
          Aplicar Correção
        </button>
      `;
    }

    return `
      <div class="code-block-wrapper group">
        <div class="code-block-header">
          <div class="flex items-center gap-3 min-w-0">
             <span class="text-[10px] font-mono text-slate-500 uppercase flex-shrink-0">${lang || 'text'}</span>
             ${filePath ? `
               <div class="flex items-center gap-2 border-l border-white/10 pl-3 min-w-0">
                 <span class="text-[10px] text-indigo-400 font-mono font-bold truncate" title="${filePath}">${filePath}</span>
               </div>
             ` : ''}
          </div>
          <div class="flex items-center gap-3">
            ${applyButtonHtml}
            <button class="copy-code-btn text-slate-500 hover:text-white transition-colors flex items-center gap-1.5" data-code="${base64Code}">
              <span class="text-[9px] font-bold uppercase tracking-widest">Copy</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
          </div>
        </div>
        <pre class="language-${lang || 'text'}"><code>${code}</code></pre>
      </div>
    `;
  };

  const html = DOMPurify.sanitize(marked.parse(content, { renderer }) as string, {
    ADD_TAGS: ['svg', 'use', 'path', 'rect', 'circle', 'g', 'foreignObject', 'button', 'div', 'span'],
    ADD_ATTR: ['d', 'viewBox', 'fill', 'stroke', 'stroke-width', 'transform', 'data-code', 'data-mode', 'data-mermaid-code', 'data-path', 'title']
  });

  return (
    <>
      <div ref={containerRef} onClick={handleContainerClick} className={`prose prose-invert max-w-none ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
      <MermaidFullscreenModal isOpen={!!fullscreenCode} onClose={() => setFullscreenCode(null)} code={fullscreenCode || ''} />
    </>
  );
};

export default MarkdownRenderer;
