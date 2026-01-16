
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
    <animated.div style={style} className={`flex w-full group mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
      
      <div className={`relative max-w-[90%] md:max-w-[80%] transition-all`}>
        {/* Nome (apenas User se quiser, mas Gemini style geralmente é limpo) */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-2 ml-1">
             <div className="w-5 h-5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-[10px] text-white">✦</div>
             <span className="text-xs font-bold text-slate-300">Gemini</span>
          </div>
        )}

        <div className={`
          relative p-5 text-sm md:text-base leading-relaxed
          ${isUser 
            ? 'bg-[#2d2e35] text-slate-100 rounded-[24px] rounded-tr-md shadow-lg border border-white/5' 
            : 'text-slate-200 pl-0 pt-0' /* Modelo sem fundo */
          }
        `}>
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 pb-2 border-b border-white/10">
              {message.attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-2 bg-black/30 rounded-lg py-1 px-3 text-xs border border-white/5 text-slate-300">
                   <span className="text-sm">📄</span>
                   <span className="truncate max-w-[150px] font-medium">{att.name}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Content */}
          <div className={`prose prose-invert prose-p:leading-7 prose-pre:rounded-xl prose-pre:bg-[#16171d] prose-pre:border prose-pre:border-white/5 ${!isUser ? 'prose-headings:text-indigo-300 prose-a:text-indigo-400' : ''} max-w-none break-words`}>
             <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(message.text) as string) }} />
          </div>
        </div>

        {/* Action Bar */}
        <div className={`flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isUser ? 'justify-end pr-1' : 'justify-start pl-0'}`}>
          <button onClick={() => handleCopy('md')} className="text-slate-500 hover:text-white p-1 rounded hover:bg-white/5 transition-colors" title="Copiar Markdown">
             {copied === 'md' ? <span className="text-emerald-500 text-[10px] font-bold">Copiado</span> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
          </button>
        </div>
      </div>
    </animated.div>
  );
};

export default ChatMessageItem;
