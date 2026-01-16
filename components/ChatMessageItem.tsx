
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

  const handleCopy = (type: 'md' | 'text') => {
    let content = message.text;
    
    if (type === 'text') {
      // Basic strip tags for plain text copy
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
    <animated.div style={style} className={`flex w-full group ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative max-w-[85%] rounded-3xl p-5 shadow-sm transition-all ${
        message.role === 'user' 
          ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm' 
          : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm hover:border-slate-600'
      }`}>
        
        {/* Hover Actions (Copy) */}
        <div className={`absolute -top-3 ${message.role === 'user' ? 'left-0' : 'right-0'} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
          <button 
            onClick={() => handleCopy('md')}
            className="bg-slate-900 border border-slate-700 text-slate-400 hover:text-white text-[10px] px-2 py-1 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-md"
            title="Copiar Markdown (Original)"
          >
            {copied === 'md' ? '✅' : '📋 MD'}
          </button>
          <button 
            onClick={() => handleCopy('text')}
            className="bg-slate-900 border border-slate-700 text-slate-400 hover:text-white text-[10px] px-2 py-1 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-md"
            title="Copiar Texto Puro"
          >
             {copied === 'text' ? '✅' : '📝 Txt'}
          </button>
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-white/10">
            {message.attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 bg-black/20 rounded-lg py-1 px-3 text-xs">
                 <span>📄</span>
                 <span className="truncate max-w-[150px]">{att.name}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Content */}
        <div className="prose prose-invert prose-sm max-w-none leading-relaxed break-words">
           <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(message.text) as string) }} />
        </div>
        
        {/* Timestamp */}
        <div className={`text-[10px] mt-2 opacity-50 font-mono text-right ${message.role === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </animated.div>
  );
};

export default ChatMessageItem;
