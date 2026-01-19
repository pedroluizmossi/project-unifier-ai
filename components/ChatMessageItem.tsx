
import React, { useState } from 'react';
import { ChatMessage } from '../types';
import { animated } from 'react-spring';
import { CopyIcon, GeminiSparkle, FileIcon } from './Icons';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatMessageItemProps {
  message: ChatMessage;
  style: any;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, style }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleGlobalCopy = () => {
    navigator.clipboard.writeText(message.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <animated.div style={style} className={`flex w-full group mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
      
      <div className={`relative max-w-[95%] md:max-w-[85%] transition-all`}>
        {/* Header da Mensagem (Modelo) */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-2 ml-1">
             <GeminiSparkle className="w-5 h-5" />
             <span className="text-xs font-bold text-slate-300">Gemini</span>
          </div>
        )}

        <div className={`
          relative p-5 text-sm md:text-base leading-relaxed
          ${isUser 
            ? 'bg-[#2d2e35] text-slate-100 rounded-[24px] rounded-tr-md shadow-lg border border-white/5' 
            : 'text-slate-200 pl-0 pt-0' 
          }
        `}>
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 pb-2 border-b border-white/10">
              {message.attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-2 bg-black/30 rounded-lg py-1 px-3 text-xs border border-white/5 text-slate-300">
                   <FileIcon className="w-3.5 h-3.5 opacity-70" />
                   <span className="truncate max-w-[150px] font-medium">{att.name}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Advanced Markdown Content */}
          <MarkdownRenderer 
            content={message.text} 
            className={`${!isUser ? 'prose-headings:text-indigo-300 prose-a:text-indigo-400' : ''}`}
          />
        </div>

        {/* Action Bar */}
        <div className={`flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isUser ? 'justify-end pr-1' : 'justify-start pl-0'}`}>
          <button onClick={handleGlobalCopy} className="text-slate-500 hover:text-white p-1 rounded hover:bg-white/5 transition-colors" title="Copiar Tudo">
             {copied ? (
               <span className="text-emerald-500 text-[10px] font-bold px-1">Copiado</span>
             ) : (
               <CopyIcon className="w-4 h-4" />
             )}
          </button>
        </div>
      </div>
    </animated.div>
  );
};

export default ChatMessageItem;
