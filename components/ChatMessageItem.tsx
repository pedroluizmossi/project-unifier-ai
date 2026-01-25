
import React, { useState } from 'react';
import { ChatMessage, FileInfo } from '../types';
import { animated } from 'react-spring';
import { CopyIcon, GeminiSparkle, FileIcon, CheckIcon } from './Icons';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatMessageItemProps {
  message: ChatMessage;
  style: any;
  onFavorite?: (content: string) => void;
  isFavorite?: boolean;
  files?: FileInfo[];
  onApplyChange?: (path: string, newContent: string) => void;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, style, onFavorite, isFavorite, files, onApplyChange }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleGlobalCopy = () => {
    navigator.clipboard.writeText(message.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
            files={files}
            onApplyChange={onApplyChange}
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
          {!isUser && onFavorite && (
            <button 
              onClick={() => onFavorite(message.text)} 
              className={`p-1 rounded hover:bg-white/5 transition-colors ${isFavorite ? 'text-amber-400' : 'text-slate-500 hover:text-white'}`} 
              title={isFavorite ? 'Remover dos Favoritos' : 'Salvar nos Favoritos'}
            >
              <svg className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </animated.div>
  );
};

export default ChatMessageItem;
