
import React, { useState } from 'react';
import { DiffFile } from '../types';
import * as Diff from 'diff'; // Usando a biblioteca do importmap

interface DiffViewerProps {
  diffFile: DiffFile;
  viewMode: 'split' | 'unified';
  onAnalyze: (prompt: string) => void;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ diffFile, viewMode, onAnalyze }) => {
  
  const getLanguage = (filename: string) => filename.split('.').pop() || 'text';

  const renderSplitView = () => {
    let oldLineNum = 0;
    let newLineNum = 0;

    return diffFile.hunks.map((hunk, hunkIdx) => {
      oldLineNum = hunk.oldStart;
      newLineNum = hunk.newStart;

      return (
        <div key={hunkIdx} className="mb-4 border border-white/5 rounded-lg overflow-hidden">
           {/* Hunk Header */}
           <div className="bg-[#1e1e24] px-4 py-1 text-[10px] font-mono text-slate-500 border-b border-white/5 flex justify-between items-center">
              <span>@@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@</span>
              <button 
                onClick={() => onAnalyze(`Analise este trecho de mudança no arquivo ${diffFile.newFileName} e verifique por bugs ou problemas de segurança:\n\n\`\`\`${getLanguage(diffFile.newFileName)}\n${hunk.lines.join('\n')}\n\`\`\``)}
                className="text-[9px] text-indigo-400 hover:text-white uppercase font-bold flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity"
              >
                <span>⚡</span> Analisar Trecho
              </button>
           </div>

           <table className="w-full border-collapse">
             <tbody>
               {hunk.lines.map((line, lineIdx) => {
                 const type = line.startsWith('+') ? 'add' : line.startsWith('-') ? 'del' : 'normal';
                 const content = line.substring(1);
                 
                 let leftNum: number | string = '';
                 let rightNum: number | string = '';
                 let leftContent = '';
                 let rightContent = '';
                 let rowClass = '';

                 if (type === 'normal') {
                   leftNum = oldLineNum++;
                   rightNum = newLineNum++;
                   leftContent = content;
                   rightContent = content;
                   rowClass = 'bg-transparent text-slate-400';
                 } else if (type === 'del') {
                   leftNum = oldLineNum++;
                   leftContent = content;
                   rowClass = 'bg-red-500/10 text-red-300';
                 } else if (type === 'add') {
                   rightNum = newLineNum++;
                   rightContent = content;
                   rowClass = 'bg-emerald-500/10 text-emerald-300';
                 }

                 // Split view logic is complex for standard output, simplifying to table rows
                 // For true split view, we need to align deletions and additions. 
                 // Simple approach: Render full row, splitting cells.

                 return (
                   <tr key={lineIdx} className={`text-[11px] font-mono leading-tight hover:bg-white/5`}>
                     {/* Left Side */}
                     <td className={`w-10 text-right pr-2 select-none text-slate-600 border-r border-white/5 bg-black/20 ${type === 'add' ? 'bg-transparent' : ''}`}>{type !== 'add' ? leftNum : ''}</td>
                     <td className={`w-1/2 whitespace-pre-wrap break-all px-2 ${type === 'del' ? 'bg-red-900/20' : ''}`}>{type !== 'add' ? leftContent : ''}</td>
                     
                     {/* Right Side */}
                     <td className={`w-10 text-right pr-2 select-none text-slate-600 border-r border-white/5 border-l bg-black/20 ${type === 'del' ? 'bg-transparent' : ''}`}>{type !== 'del' ? rightNum : ''}</td>
                     <td className={`w-1/2 whitespace-pre-wrap break-all px-2 ${type === 'add' ? 'bg-emerald-900/20' : ''}`}>{type !== 'del' ? rightContent : ''}</td>
                   </tr>
                 );
               })}
             </tbody>
           </table>
        </div>
      );
    });
  };

  const renderUnifiedView = () => {
    let oldLineNum = 0;
    let newLineNum = 0;

    return diffFile.hunks.map((hunk, hunkIdx) => {
      oldLineNum = hunk.oldStart;
      newLineNum = hunk.newStart;

      return (
        <div key={hunkIdx} className="mb-4 border border-white/5 rounded-lg overflow-hidden">
           <div className="bg-[#1e1e24] px-4 py-1 text-[10px] font-mono text-slate-500 border-b border-white/5 flex justify-between items-center">
              <span>@@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@</span>
              <button 
                onClick={() => onAnalyze(`Analise este hunk do arquivo ${diffFile.newFileName}:\n\`\`\`\n${hunk.lines.join('\n')}\n\`\`\``)}
                className="text-[9px] text-indigo-400 hover:text-white uppercase font-bold"
              >
                 ⚡ IA Check
              </button>
           </div>
           {hunk.lines.map((line, lineIdx) => {
             const type = line.startsWith('+') ? 'add' : line.startsWith('-') ? 'del' : 'normal';
             if (type === 'normal') { oldLineNum++; newLineNum++; }
             if (type === 'del') { oldLineNum++; }
             if (type === 'add') { newLineNum++; }

             const bgClass = type === 'add' ? 'bg-emerald-900/20' : type === 'del' ? 'bg-red-900/20' : '';
             const textClass = type === 'add' ? 'text-emerald-300' : type === 'del' ? 'text-red-300' : 'text-slate-400';

             return (
               <div key={lineIdx} className={`flex text-[11px] font-mono hover:bg-white/5 ${bgClass} ${textClass}`}>
                  <div className="w-10 text-right pr-2 select-none opacity-50 border-r border-white/5">{type !== 'add' ? oldLineNum - (type === 'normal' ? 0 : 1) : ''}</div>
                  <div className="w-10 text-right pr-2 select-none opacity-50 border-r border-white/5">{type !== 'del' ? newLineNum - (type === 'normal' ? 0 : 1) : ''}</div>
                  <div className="w-6 text-center select-none opacity-50">{line[0] === '\\' ? ' ' : line[0]}</div>
                  <div className="flex-1 whitespace-pre-wrap break-all">{line.substring(1)}</div>
               </div>
             );
           })}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
       <div className="p-4 border-b border-white/5 bg-[#13141c] flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg text-lg ${diffFile.type === 'add' ? 'bg-emerald-500/10 text-emerald-400' : diffFile.type === 'delete' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                {diffFile.type === 'add' ? '✚' : diffFile.type === 'delete' ? '✖' : '✎'}
             </div>
             <div>
                <h3 className="text-sm font-bold text-slate-200 font-mono">{diffFile.newFileName === '/dev/null' ? diffFile.oldFileName : diffFile.newFileName}</h3>
                <div className="flex gap-3 text-[10px] font-mono">
                   <span className="text-emerald-400">+{diffFile.additions}</span>
                   <span className="text-red-400">-{diffFile.deletions}</span>
                </div>
             </div>
          </div>
          
          <button 
             onClick={() => onAnalyze(`Faça uma auditoria de segurança e qualidade completa no arquivo ${diffFile.newFileName} baseado nestas mudanças.`)}
             className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
             <span>🛡️</span>
             Auditar Arquivo
          </button>
       </div>

       <div className="flex-1 overflow-y-auto p-4 scrollbar-hide bg-[#0f1117]">
          {viewMode === 'split' ? renderSplitView() : renderUnifiedView()}
       </div>
    </div>
  );
};

export default DiffViewer;
