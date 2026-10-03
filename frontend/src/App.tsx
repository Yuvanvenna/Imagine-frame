import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Code,
  Eye,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  Flame,
} from 'lucide-react';
import { Uploader } from './components/Uploader';
import { LivePreview } from './components/LivePreview';
import { CodeViewer } from './components/CodeViewer';

type StylePreset = 'modern' | 'cyberpunk' | 'minimalist';

interface StyleOption {
  id: StylePreset;
  name: string;
  tagline: string;
  badgeClass: string;
  borderClass: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'modern',
    name: 'Modern Clean',
    tagline: 'Slate & Indigo soft palette',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    borderClass: 'border-indigo-500/50 bg-indigo-500/10',
  },
  {
    id: 'cyberpunk',
    name: 'Dark Cyberpunk',
    tagline: 'Neon cyan & fuchsia accents',
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    borderClass: 'border-cyan-500/50 bg-cyan-500/10',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    tagline: 'Monochrome stark contrast',
    badgeClass: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    borderClass: 'border-slate-400/50 bg-slate-500/10',
  },
];

export const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeStyle, setActiveStyle] = useState<StylePreset>('modern');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [modelUsed, setModelUsed] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview');
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  // Check backend server health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/health');
        if (res.ok) {
          const data = await res.json();
          setServerOnline(true);
          setModelUsed(data.target_model || 'gemma-4-26b-a4b-it');
        } else {
          setServerOnline(false);
        }
      } catch {
        setServerOnline(false);
      }
    };
    checkHealth();
  }, []);

  const handleLoadSample = async () => {
    setPreviewUrl('/sample_wireframe.png');
    // Fetch file as blob to populate selectedFile
    try {
      const response = await fetch('/sample_wireframe.png');
      const blob = await response.blob();
      const file = new File([blob], 'sample_wireframe.png', { type: 'image/png' });
      setSelectedFile(file);
    } catch {
      // previewUrl is still set
    }
  };

  const handleLoadBackupInstantly = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`http://localhost:8000/api/backup-sample?style=${activeStyle}`);
      const data = await res.json();
      setGeneratedCode(data.code);
      setModelUsed(data.model);
      setActiveView('preview');
    } catch {
      // In case server fails, fallback in frontend directly
      setGeneratedCode(
        `<div class="min-h-screen bg-slate-900 text-slate-100 p-8 flex items-center justify-center">
          <div class="max-w-xl p-8 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl text-center space-y-4">
            <h2 class="text-2xl font-bold text-white">Wire2React Demo Component</h2>
            <p class="text-sm text-slate-400">Rendered via Gemma 4 Multimodal Synthesis Engine</p>
            <button class="px-6 py-2.5 bg-indigo-600 rounded-xl font-medium text-white shadow-lg shadow-indigo-500/30">Explore Demo</button>
          </div>
        </div>`
      );
      setModelUsed('backup-local-cache');
      setActiveView('preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile && !previewUrl) {
      setErrorMessage('Please select or drop a wireframe image first, or use a sample.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    formData.append('style', activeStyle);

    try {
      const res = await fetch('http://localhost:8000/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned error status ${res.status}`);
      }

      const data = await res.json();
      setGeneratedCode(data.code);
      setModelUsed(data.model);
      setActiveView('preview');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to generate UI with Gemma 4.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Hackathon Tag */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                  Wire2React
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                  <Flame className="w-2.5 h-2.5 text-amber-400" />
                  Hacktoberfest 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Sketch to React with Gemma 4</p>
            </div>
          </div>

          {/* Model & Backend Status */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400 font-mono">Model:</span>
              <span className="font-semibold text-slate-200 font-mono">gemma-4-26b-a4b-it</span>
            </div>

            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  serverOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              ></span>
              <span className="text-slate-300">
                {serverOnline ? 'FastAPI Ready' : 'Backend Offline'}
              </span>
            </div>

            {/* Instant Fail-Safe Demo Button */}
            <button
              onClick={handleLoadBackupInstantly}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all hover:scale-105 shadow-sm"
              title="Instant 1-click demo without network delay"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant Judge Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Column (Width 4/12) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          {/* Section: Upload Wireframe */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-slate-200">1. Wireframe Sketch</h2>
              </div>
              <span className="text-xs text-slate-500">Visual Input</span>
            </div>

            <Uploader
              selectedFile={selectedFile}
              previewUrl={previewUrl}
              onFileSelect={(file, url) => {
                setSelectedFile(file);
                setPreviewUrl(url);
                setErrorMessage(null);
              }}
              onLoadSample={handleLoadSample}
              disabled={isLoading}
            />
          </div>

          {/* Section: Style Selector */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-slate-200">2. Preset Style Switcher</h2>
              </div>
              <span className="text-xs text-slate-500 font-mono">Tailwind Theme</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setActiveStyle(style.id)}
                  disabled={isLoading}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    activeStyle === style.id
                      ? style.borderClass
                      : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/70'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-200">{style.name}</span>
                      {activeStyle === style.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{style.tagline}</p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${style.badgeClass}`}>
                    {style.id}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="space-y-3">
            <button
              onClick={handleGenerate}
              disabled={isLoading || (!selectedFile && !previewUrl)}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center space-x-2 group hover:scale-[1.01]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing with Gemma 4...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200 group-hover:rotate-12 transition-transform" />
                  <span>Synthesize Live React Component</span>
                </>
              )}
            </button>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Output Column (Width 7/12) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* View Tab Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveView('preview')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeView === 'preview'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Sandbox</span>
              </button>
              <button
                onClick={() => setActiveView('code')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeView === 'code'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>JSX / Markup</span>
              </button>
            </div>

            {modelUsed && (
              <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                <span>Synthesized via: {modelUsed}</span>
              </div>
            )}
          </div>

          {/* Render Active View Container */}
          <div className="flex-1 min-h-[580px]">
            {activeView === 'preview' ? (
              <LivePreview code={generatedCode} isLoading={isLoading} />
            ) : (
              <CodeViewer code={generatedCode} modelUsed={modelUsed} styleName={activeStyle} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
