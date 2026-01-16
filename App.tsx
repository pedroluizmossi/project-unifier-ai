
import React, { useState, useMemo, useRef } from 'react';
import { ProcessorStatus, FileInfo, OutputFormat, AppMode } from './types';
import { 
  collectFileHandles, 
  processFile, 
  processFileList,
  generateOutput, 
  calculateTokens,
  formatBytes 
} from './lib/utils';
import { DEFAULT_IGNORE, ANALYSIS_TEMPLATES } from './constants';
import { performProjectAnalysis } from './services/geminiService';
import AIAnalysisPanel from './components/AIAnalysisPanel';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('project');
  const [isProcessing, setIsProcessing] = useState(false);
  const [directoryName, setDirectoryName] = useState<string | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('markdown');
  const [showAI, setShowAI] = useState(false);
  const [maxFileSize, setMaxFileSize] = useState(500);
  const [diffContent, setDiffContent] = useState('');
  
  // Modal & Filtering
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [langFilter, setLangFilter] = useState('all');

  // Dashboard AI Summary
  const [projectSummary, setProjectSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    files.forEach(f => { if (f.language) langs.add(f.language); });
    return Array.from(langs).sort();
  }, [files]);

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchesSearch = f.path.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLang = langFilter === 'all' || f.language === langFilter;
      return matchesSearch && matchesLang;
    });
  }, [files, searchTerm, langFilter]);

  const toggleFileSelection = (path: string) => {
    setFiles(prev => prev.map(f => 
      f.path === path ? { ...f, selected: !f.selected } : f
    ));
  };

  const handleBulkAction = (action: 'select_filtered' | 'deselect_filtered' | 'all' | 'none') => {
    setFiles(prev => prev.map(f => {
      const isVisible = filteredFiles.some(ff => ff.path === f.path);
      if (action === 'select_filtered' && isVisible) return { ...f, selected: f.type === 'text_file' };
      if (action === 'deselect_filtered' && isVisible) return { ...f, selected: false };
      if (action === 'all') return { ...f, selected: f.type === 'text_file' };
      if (action === 'none') return { ...f, selected: false };
      return f;
    }));
  };

  const stats = useMemo<ProcessorStatus>(() => {
    const selectedFiles = files.filter(f => f.selected && f.type === 'text_file');
    const content = generateOutput(directoryName || 'Project', files, outputFormat);
    return {
      text: selectedFiles.length,
      binary: files.filter(f => f.type === 'binary_file').length,
      large: files.filter(f => f.type === 'large_file').length,
      tokens: calculateTokens(content),
      files: files.map(f => ({ name: f.path, size: Math.round(f.size_kb * 1024) }))
    };
  }, [files, directoryName, outputFormat]);

  const outputContent = useMemo(() => {
    return generateOutput(directoryName || 'Project', files, outputFormat);
  }, [files, directoryName, outputFormat]);

  const handleSelectDirectory = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const handle = await (window as any).showDirectoryPicker();
        setIsProcessing(true);
        setDirectoryName(handle.name);
        const handles = await collectFileHandles(handle, DEFAULT_IGNORE);
        const results = await Promise.all(handles.map(h => processFile(h.handle, h.path, maxFileSize)));
        setFiles(results.filter((f): f is FileInfo => f !== null));
        setProjectSummary(''); // Reset summary on new project
      } catch (err: any) {
        if (err.name !== 'AbortError') fileInputRef.current?.click();
      } finally {
        setIsProcessing(false);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleLegacyFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setIsProcessing(true);
    const firstPath = fileList[0].webkitRelativePath;
    setDirectoryName(firstPath ? firstPath.split('/')[0] : 'Project');
    try {
      const results = await processFileList(fileList, DEFAULT_IGNORE, maxFileSize);
      setFiles(results);
      setProjectSummary('');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const generateProjectSummary = async () => {
    if (!outputContent) return;
    setIsGeneratingSummary(true);
    setProjectSummary('');
    try {
      const prompt = "Analise brevemente este projeto. Identifique: 1. Stack Tecnológica Principal, 2. Padrão Arquitetural, 3. Principais Funcionalidades e 4. Sugestão imediata de melhoria. Seja conciso e use Markdown.";
      const result = await performProjectAnalysis(outputContent, prompt);
      setProjectSummary(result);
    } catch (err: any) {
      setProjectSummary("⚠️ Falha ao gerar resumo. Verifique sua conexão ou limite de tokens.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([outputContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${directoryName || 'project'}_unified.${outputFormat === 'markdown' ? 'md' : outputFormat === 'json' ? 'json' : 'xml'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderSummaryHtml = () => {
    if (!projectSummary) return null;
    const rawHtml = marked.parse(projectSummary);
    return { __html: DOMPurify.sanitize(rawHtml as string) };
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <input type="file" ref={fileInputRef} onChange={handleLegacyFileChange} className="hidden" {...({ webkitdirectory: "", directory: "" } as any)} />

      {/* Sidebar */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col p-5 space-y-6 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-lg italic shadow-lg shadow-indigo-600/30">U</div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight leading-none">Unifier AI</h1>
            <p className="text-slate-500 text-[8px] mt-1 uppercase tracking-widest font-black">Architecture Studio</p>
          </div>
        </div>

        <div className="flex bg-slate-800 p-1 rounded-xl">
           <button onClick={() => setAppMode('project')} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${appMode === 'project' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Projeto</button>
           <button onClick={() => setAppMode('mr_analysis')} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${appMode === 'mr_analysis' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Diff/MR</button>
        </div>

        <div className="flex-1 flex flex-col min-h-0 space-y-5">
          {appMode === 'project' ? (
            <>
              <div className="space-y-3">
                <button onClick={handleSelectDirectory} disabled={isProcessing} className="group w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 active:scale-95">
                  {isProcessing ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>📂 Abrir Código</>}
                </button>
                
                <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/50 space-y-3">
                   <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Formato de Exportação</label>
                    <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value as OutputFormat)} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg text-[10px] py-2 px-3 text-slate-300 outline-none focus:ring-1 focus:ring-indigo-600 transition-all font-bold">
                      <option value="markdown">Markdown Unificado</option>
                      <option value="json">JSON Estruturado</option>
                      <option value="xml">XML Schema</option>
                    </select>
                  </div>
                </div>
              </div>

              {files.length > 0 && (
                <div className="flex-1 flex flex-col min-h-0 bg-indigo-600/5 border border-indigo-500/10 rounded-2xl p-4 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-white uppercase tracking-widest">Espaço de Trabalho</p>
                      <p className="text-[10px] text-indigo-400 font-mono font-bold">{stats.text} de {files.length} ativos</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-700 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                  >
                    🔍 Explorador Avançado
                  </button>

                  <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-2 overflow-y-auto scrollbar-hide">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-2">Linguagens Detectadas</p>
                    <div className="flex flex-wrap gap-1.5">
                       {availableLanguages.map(lang => (
                         <span key={lang} className="px-2 py-0.5 bg-slate-800 rounded text-[8px] font-bold text-slate-400 uppercase">{lang}</span>
                       ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4 h-full flex flex-col">
               <div className="flex-1 flex flex-col space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Patch Git / Diff</label>
                  <textarea 
                    value={diffContent}
                    onChange={(e) => setDiffContent(e.target.value)}
                    placeholder="Cole aqui as mudanças..."
                    className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-[10px] font-mono text-indigo-300 focus:ring-2 focus:ring-indigo-600 outline-none resize-none shadow-inner scrollbar-hide"
                  />
               </div>
            </div>
          )}
        </div>

        {directoryName && (
          <div className="pt-4 border-t border-slate-800">
            <div className="bg-indigo-950/20 rounded-xl p-3 border border-indigo-500/10 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Contexto de IA</span>
                <span className="text-xs text-indigo-400 font-black">{stats.tokens.toLocaleString()} tokens</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${showAI ? 'mr-[500px]' : ''}`}>
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,1)]"></div>
             <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-widest truncate max-w-xs">
              {appMode === 'project' ? (directoryName || 'Aguardando Código') : 'Análise Diferencial'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
             <button
              onClick={() => setShowAI(!showAI)}
              disabled={!files.some(f => f.selected)}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 disabled:opacity-30 ${showAI ? 'bg-indigo-600 border-indigo-500 text-white shadow-2xl scale-105' : 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/10'}`}
            >
              <span>✨</span> Deep Insight
            </button>
            <button onClick={handleDownload} disabled={!files.some(f => f.selected)} className="flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl active:scale-95 disabled:opacity-30">
              📁 Baixar Contexto
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-950 p-8 scrollbar-hide">
          {files.length > 0 ? (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
              
              {/* Project Dashboard - NEW */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                     <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                     Painel de Controle do Projeto
                   </h3>
                   {!projectSummary && !isGeneratingSummary && (
                     <button 
                       onClick={generateProjectSummary}
                       className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 px-4 py-1.5 rounded-full transition-all bg-indigo-500/5"
                     >
                       ⚡ Gerar Raio-X com IA
                     </button>
                   )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-[2rem] shadow-xl group hover:border-indigo-500/30 transition-all">
                      <div className="text-indigo-500 text-xl mb-3">📁</div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Arquivos</p>
                      <p className="text-2xl font-black text-white">{files.length}</p>
                   </div>
                   <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-[2rem] shadow-xl group hover:border-indigo-500/30 transition-all">
                      <div className="text-indigo-500 text-xl mb-3">⚖️</div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Peso Total</p>
                      <p className="text-2xl font-black text-indigo-400 font-mono">{formatBytes(files.reduce((acc, f) => acc + (f.size_kb * 1024), 0))}</p>
                   </div>
                   <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-[2rem] shadow-xl group hover:border-indigo-500/30 transition-all">
                      <div className="text-indigo-500 text-xl mb-3">⚡</div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Linguagens</p>
                      <p className="text-2xl font-black text-white">{availableLanguages.length}</p>
                   </div>
                   <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-[2rem] shadow-xl group hover:border-indigo-500/30 transition-all">
                      <div className="text-indigo-500 text-xl mb-3">🤖</div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tokens Ativos</p>
                      <p className="text-2xl font-black text-white font-mono">{stats.tokens.toLocaleString()}</p>
                   </div>
                </div>

                {/* AI Summary Card - THE HEART OF THE DASHBOARD */}
                <div className="relative group">
                  <div className={`bg-indigo-950/10 border ${isGeneratingSummary ? 'border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] animate-pulse' : 'border-indigo-500/20'} rounded-[2.5rem] p-10 transition-all duration-700 min-h-[160px]`}>
                    {!projectSummary && !isGeneratingSummary ? (
                       <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                          <div className="text-4xl">🧠</div>
                          <div>
                            <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Resumo Executivo Pendente</p>
                            <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">Clique no botão acima para que a IA analise a arquitetura macro do seu projeto.</p>
                          </div>
                       </div>
                    ) : isGeneratingSummary ? (
                       <div className="flex flex-col items-center justify-center space-y-6">
                          <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">Lendo padrões de código...</p>
                       </div>
                    ) : (
                       <div className="animate-in fade-in duration-1000">
                          <div className="flex items-center justify-between mb-8">
                             <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                Raio-X do Sistema (Insights do Gemini)
                             </h4>
                             <button onClick={generateProjectSummary} className="text-[8px] font-black text-slate-600 hover:text-indigo-400 uppercase transition-all">🔄 Recalcular</button>
                          </div>
                          <div className="prose prose-invert prose-indigo max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={renderSummaryHtml()!} />
                       </div>
                    )}
                  </div>
                </div>

                {/* Quick Action Tiles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {ANALYSIS_TEMPLATES.slice(1, 4).map(tmpl => (
                     <button 
                       key={tmpl.id}
                       onClick={() => { setShowAI(true); }}
                       className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl hover:border-indigo-500/40 hover:bg-slate-900/60 transition-all text-left group"
                     >
                       <div className="text-2xl mb-4 group-hover:scale-110 transition-transform">{tmpl.icon}</div>
                       <p className="text-xs font-black text-white mb-1 uppercase tracking-tight">{tmpl.name}</p>
                       <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{tmpl.description}</p>
                     </button>
                   ))}
                </div>
              </div>

              {appMode === 'mr_analysis' && diffContent && (
                <div className="bg-indigo-950/10 border border-indigo-500/20 rounded-[2rem] p-8 shadow-2xl mt-12">
                  <h3 className="text-xs font-black text-indigo-400 mb-5 flex items-center gap-3 uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                    Mudanças Propostas (Patch)
                  </h3>
                  <pre className="text-[11px] font-mono text-indigo-200/60 overflow-x-auto bg-black/40 p-6 rounded-2xl border border-white/5 shadow-inner leading-relaxed">
                    {diffContent}
                  </pre>
                </div>
              )}
              
              {/* Context Preview - Repurposed as Code Viewer */}
              <div className="bg-slate-900/30 rounded-[2.5rem] border border-slate-800 shadow-3xl overflow-hidden backdrop-blur-md mt-12">
                <div className="bg-slate-800/30 px-8 py-4 flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black">contexto_unificado.{outputFormat}</span>
                  </div>
                  <button onClick={handleDownload} className="text-[9px] font-black text-indigo-500 hover:underline uppercase">Exportar para IA Local</button>
                </div>
                <pre className="p-10 text-[11px] font-mono text-slate-400 whitespace-pre-wrap leading-relaxed max-h-[800px] overflow-y-auto scrollbar-hide">
                  {outputContent}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-8 text-center animate-in fade-in duration-700">
              <div className="relative">
                 <div className="w-44 h-44 rounded-[4rem] bg-slate-900 flex items-center justify-center text-7xl shadow-3xl border border-slate-800 relative group overflow-hidden">
                    <span className="group-hover:scale-125 transition-transform duration-700">🚀</span>
                    <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 </div>
                 <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-[1.5rem] bg-indigo-600 border-4 border-slate-950 flex items-center justify-center text-3xl shadow-2xl animate-bounce">✨</div>
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl text-white font-black tracking-tighter">Unifier Engine Pro</h3>
                <p className="text-xs text-slate-500 max-w-[340px] leading-relaxed mx-auto font-medium uppercase tracking-widest">A ponte definitiva entre seu código local e o Gemini 3 Pro</p>
              </div>
              <div className="pt-4">
                 <button onClick={handleSelectDirectory} className="px-12 py-5 bg-white text-black rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all active:scale-95 flex items-center gap-3">
                    Carregar Workspace
                    <span className="text-xl">📁</span>
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Panel */}
      {showAI && (
        <div className="fixed top-0 right-0 w-[500px] h-full z-20 shadow-[-30px_0_60px_rgba(0,0,0,0.8)] border-l border-slate-800">
          <AIAnalysisPanel 
            context={outputContent} 
            diffContext={appMode === 'mr_analysis' ? diffContent : undefined}
            onClose={() => setShowAI(false)} 
          />
        </div>
      )}

      {/* Advanced File Explorer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 w-full max-w-6xl max-h-[92vh] rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-10 border-b border-slate-800 flex items-center justify-between bg-slate-800/20">
              <div className="flex items-center gap-8 flex-1">
                 <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600/10 flex items-center justify-center text-4xl border border-indigo-500/20">🔍</div>
                 <div>
                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Workspace Navigator</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Gestão Seletiva de Contexto • {files.length} arquivos totais</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-4 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all"
              >
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-10 bg-slate-900/50 border-b border-slate-800 flex flex-wrap gap-8 items-end">
               <div className="flex-1 min-w-[350px] space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Filtro Global</label>
                  <div className="relative">
                     <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 text-2xl">🔍</span>
                     <input 
                       type="text" 
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       placeholder="Nome de arquivo ou diretório..."
                       className="w-full bg-slate-800 border-none rounded-[1.5rem] py-5 pl-16 pr-8 text-base text-white focus:ring-2 focus:ring-indigo-600 transition-all outline-none shadow-inner"
                     />
                  </div>
               </div>
               
               <div className="w-64 space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tecnologia</label>
                  <select 
                    value={langFilter}
                    onChange={(e) => setLangFilter(e.target.value)}
                    className="w-full bg-slate-800 border-none rounded-[1.5rem] py-5 px-8 text-sm text-white focus:ring-2 focus:ring-indigo-600 transition-all outline-none font-bold"
                  >
                    <option value="all">Todas</option>
                    {availableLanguages.map(lang => (
                      <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                    ))}
                  </select>
               </div>

               <div className="flex gap-4">
                  <button onClick={() => handleBulkAction('select_filtered')} className="px-8 py-5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest border border-indigo-600/30 transition-all">Ativar Filtrados</button>
                  <button onClick={() => handleBulkAction('deselect_filtered')} className="px-8 py-5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest border border-slate-700 transition-all">Limpar Tudo</button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 bg-slate-950/30 scrollbar-hide">
               {filteredFiles.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   {filteredFiles.map((file) => (
                     <div 
                       key={file.path}
                       onClick={() => file.type === 'text_file' && toggleFileSelection(file.path)}
                       className={`group flex items-center gap-5 p-6 rounded-[2rem] border cursor-pointer transition-all ${
                         file.selected 
                         ? 'bg-indigo-600/10 border-indigo-500 shadow-xl' 
                         : 'bg-slate-800/20 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                       }`}
                     >
                       <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                         file.selected 
                         ? 'bg-indigo-600 border-indigo-500 scale-125 shadow-lg' 
                         : 'border-slate-700 bg-slate-900 group-hover:border-slate-500'
                       }`}>
                         {file.selected && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                       </div>
                       
                       <div className="flex-1 min-w-0">
                          <p className={`text-xs truncate font-black tracking-tight ${file.selected ? 'text-white' : 'text-slate-400'}`}>{file.path.split('/').pop()}</p>
                          <p className="text-[9px] text-slate-500 truncate mt-1 font-mono font-bold uppercase tracking-tighter">{file.path}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center py-32 text-center space-y-6 opacity-30 animate-pulse">
                    <div className="text-8xl">🏜️</div>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Nenhum arquivo encontrado</p>
                 </div>
               )}
            </div>

            <div className="p-12 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between backdrop-blur-2xl">
               <div className="flex gap-16">
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Workspace Load</p>
                     <p className="text-3xl font-black text-white">{files.filter(f => f.selected).length} <span className="text-sm font-bold opacity-30">ARQUIVOS</span></p>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carga Proporcional</p>
                     <p className="text-3xl font-black text-indigo-400">{calculateTokens(generateOutput('', files, 'markdown')).toLocaleString()} <span className="text-sm font-bold opacity-30">TOKENS</span></p>
                  </div>
               </div>
               
               <button 
                 onClick={() => setIsModalOpen(false)}
                 className="px-16 py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-2xl shadow-indigo-600/40 active:scale-95 border-b-4 border-indigo-800"
               >
                 Confirmar Workspace
               </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default App;
