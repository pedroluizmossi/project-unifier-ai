
import React, { useState, useRef, useEffect } from 'react';
import { OutputFormat } from '../types';

interface HeaderProps {
  directoryName: string | null;
  hasFiles: boolean;
  onExport: (format: OutputFormat) => void;
}

const Header: React.FC<HeaderProps> = ({ directoryName, hasFiles, onExport }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportClick = (format: OutputFormat) => {
    onExport(format);
    setIsDropdownOpen(false);
  };

  return (
    <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950 sticky top-0 z-10">
      <div className="flex items-center gap-3">
         <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,1)]"></div>
         <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-widest truncate max-w-[200px]">
          {directoryName || 'Workspace Vazia'}
        </h2>
      </div>
      
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
          disabled={!hasFiles} 
          className={`flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-slate-700 ${!hasFiles ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-700 hover:text-white active:scale-95'}`}
        >
          Exportar 📁
          <svg className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </button>

        {isDropdownOpen && hasFiles && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#1e1e24] border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="p-2 space-y-1">
              <ExportOption 
                label="Markdown (.md)" 
                icon="📝" 
                onClick={() => handleExportClick('markdown')} 
              />
              <ExportOption 
                label="JSON Data (.json)" 
                icon="📋" 
                onClick={() => handleExportClick('json')} 
              />
              <ExportOption 
                label="XML Strict (.xml)" 
                icon="⚙️" 
                onClick={() => handleExportClick('xml')} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ExportOption = ({ label, icon, onClick }: { label: string, icon: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/5 rounded-lg group transition-colors"
  >
    <span className="text-sm group-hover:scale-110 transition-transform">{icon}</span>
    <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider">{label}</span>
  </button>
);

export default Header;
