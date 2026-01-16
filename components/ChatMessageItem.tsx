
import React, { useState } from 'react';
import { ChatMessage } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { animated } from 'react-spring';

interface ChatMessageItemProps {
  message: ChatMessage;
  style: any;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, style }) => {
  const [copied, setCopied] = useState<'md' | 'text' | null>(null);
  const isUser = message.role === 'user';

  const handleCopy = (type: 'md' | 'text') => {
    let content = message.text;
    
    if (type === 'text') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = marked.parse(message.text) as string;
      content = tempDiv.innerText;
    }

    navigator.clipboard.writeText(content).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <animated.div style={style} className={`flex w-full group mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      
      {/* Avatar do Modelo (Apenas se não for user) */}
      {!isUser && (
        <div className="flex-shrink-0 mr-4 mt-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          </div>
        </div>
      )}

      <div className={`relative max-w-[85%] md:max-w-[75%] transition-all`}>
        
        {/* Nome do Remetente (Opcional, estilo Gemini geralmente oculta para limpar a UI) */}
        {!isUser && <div className="text-[10px] font-bold text-slate-400 mb-1 ml-1 uppercase tracking-wider">Gemini</div>}

        <div className={`
          relative p-4 md:p-5 text-sm md:text-base leading-relaxed overflow-hidden
          ${isUser 
            ? 'bg-[#2d2e35] text-slate-100 rounded-[2rem] rounded-tr-sm shadow-md' 
            : 'text-slate-200 pl-0 pt-0' /* Modelo sem fundo, texto direto */
          }
        `}>
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 pb-2 border-b border-white/5">
              {message.attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-2 bg-black/20 rounded-lg py-1.5 px-3 text-xs border border-white/5">
                   <span className="text-base">📄</span>
                   <span className="truncate max-w-[150px] font-medium opacity-80">{att.name}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Content */}
          <div className={`prose prose-invert prose-p:leading-7 prose-pre:rounded-xl prose-pre:bg-[#1e1e24] prose-pre:border prose-pre:border-slate-800 ${!isUser ? 'prose-headings:text-indigo-300 prose-a:text-indigo-400' : ''} max-w-none break-words`}>
             <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(message.text) as string) }} />
          </div>
        </div>

        {/* Action Bar (Copy / Time) */}
        <div className={`flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isUser ? 'justify-end pr-2' : 'justify-start pl-0'}`}>
          <button 
            onClick={() => handleCopy('md')}
            className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-full hover:bg-slate-800/50 transition-colors"
            title="Copiar Markdown"
          >
             {copied === 'md' ? <span className="text-emerald-500 text-xs font-bold">Copiado!</span> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
          </button>
          
          {!isUser && (
             <button 
               onClick={() => handleCopy('text')}
               className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-full hover:bg-slate-800/50 transition-colors"
               title="Copiar Texto Puro"
             >
                {copied === 'text' ? <span className="text-emerald-500 text-xs font-bold">Copiado!</span> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
             </button>
          )}

          <span className="text-[10px] text-slate-600 font-mono ml-2">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </animated.div>
  );
};

export default ChatMessageItem;
