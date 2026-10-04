import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Code,
  Eye,
  Sliders,
  AlertCircle,
  Layers,
  PenTool,
  UploadCloud,
  Camera,
  MessageSquarePlus,
  RotateCcw,
} from 'lucide-react';
import { Uploader } from './components/Uploader';
import { CanvasDrawer } from './components/CanvasDrawer';
import { CameraSnap } from './components/CameraSnap';
import { LivePreview } from './components/LivePreview';
import { CodeViewer } from './components/CodeViewer';

export type StylePreset = 'shadcn' | 'tailwind' | 'material' | 'cyberpunk';
export type InputMode = 'draw' | 'snap' | 'upload';

interface StyleOption {
  id: StylePreset;
  name: string;
  tagline: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'shadcn',
    name: 'Shadcn/UI Modern',
    tagline: 'Dark zinc & subtle focus rings',
  },
  {
    id: 'tailwind',
    name: 'Tailwind Clean',
    tagline: 'Slate & vibrant indigo gradients',
  },
  {
    id: 'material',
    name: 'Material Accent',
    tagline: 'Emerald & teal elevations',
  },
  {
    id: 'cyberpunk',
    name: 'Dark Cyberpunk',
    tagline: 'Neon cyan & fuchsia glow',
  },
];

export const App: React.FC = () => {
  const [inputMode, setInputMode] = useState<InputMode>('draw');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detectedSampleType, setDetectedSampleType] = useState<'napkin' | 'whiteboard' | 'card'>('napkin');
  const [activeStyle, setActiveStyle] = useState<StylePreset>('shadcn');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingSnippet, setStreamingSnippet] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview');

  // Multi-Turn Refinement & History
  const [refineText, setRefineText] = useState<string>('');
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [historyStack, setHistoryStack] = useState<string[]>([]);

  const handleLoadSample = async (sampleType: 'napkin' | 'whiteboard' | 'card' = 'napkin') => {
    const sampleMap = {
      napkin: { path: '/napkin_login.jpg', name: 'napkin_login.jpg', type: 'image/jpeg' },
      whiteboard: { path: '/whiteboard_saas.jpg', name: 'whiteboard_saas.jpg', type: 'image/jpeg' },
      card: { path: '/sample_wireframe.png', name: 'sample_wireframe.png', type: 'image/png' },
    };

    const selected = sampleMap[sampleType] || sampleMap.napkin;
    setPreviewUrl(selected.path);
    setDetectedSampleType(sampleType);
    setInputMode('upload');

    try {
      const response = await fetch(selected.path);
      const blob = await response.blob();
      const file = new File([blob], selected.name, { type: selected.type });
      setSelectedFile(file);
      setErrorMessage(null);
    } catch {
      // previewUrl is still valid
    }
  };

  const handleCanvasExport = (file: File, dataUrl: string) => {
    setSelectedFile(file);
    setPreviewUrl(dataUrl);
    setDetectedSampleType('card');
    setErrorMessage(null);
  };

  const handleCameraCapture = (file: File, dataUrl: string) => {
    setSelectedFile(file);
    setPreviewUrl(dataUrl);
    setDetectedSampleType('napkin');
    setErrorMessage(null);
  };

  const handleQuickDemo = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`http://localhost:8000/api/backup-sample?sample_type=napkin&style=${activeStyle}`);
      const data = await res.json();
      setGeneratedCode(data.code);
      setPreviewUrl('/napkin_login.jpg');
      setInputMode('upload');
      setActiveView('preview');
      setHistoryStack([]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Could not load instant demo sample.');
    } finally {
      setIsLoading(false);
    }
  };

  // Live Streaming Generation using Server-Sent Events (SSE)
  const handleGenerate = async () => {
    if (!selectedFile && !previewUrl) {
      setErrorMessage('Please sketch, snap, or upload a wireframe first, or use a 1-click sample benchmark.');
      return;
    }

    setIsLoading(true);
    setIsStreaming(true);
    setErrorMessage(null);

    const formData = new FormData();
    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    formData.append('style', activeStyle);
    formData.append('sample_type', detectedSampleType);

    try {
      const res = await fetch('http://localhost:8000/api/stream-convert', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server returned error status ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let streamedMarkup = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const payload = JSON.parse(line.slice(6));
                if (payload.type === 'chunk' && payload.text) {
                  streamedMarkup += payload.text;
                  setStreamingSnippet(streamedMarkup);
                } else if (payload.type === 'done' && payload.code) {
                  setGeneratedCode(payload.code);
                  setStreamingSnippet('');
                  setHistoryStack([]);
                } else if (payload.type === 'error') {
                  throw new Error(payload.detail || 'Streaming generation error');
                }
              } catch {}
            }
          }
        }
      }

      setActiveView('preview');
    } catch (err: any) {
      console.warn('Streaming error, falling back to standard API convert:', err);
      try {
        const fallbackRes = await fetch('http://localhost:8000/api/convert', {
          method: 'POST',
          body: formData,
        });
        const data = await fallbackRes.json();
        setGeneratedCode(data.code);
        setStreamingSnippet('');
        setHistoryStack([]);
        setActiveView('preview');
      } catch (fallbackErr: any) {
        setErrorMessage(fallbackErr.message || 'Failed to generate UI with Gemma 4.');
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingSnippet('');
    }
  };

  // Multi-Turn UI Refinement ("Chat to Edit") Handler
  const handleRefineUI = async (instructionToUse?: string) => {
    const instruction = (instructionToUse || refineText).trim();
    if (!instruction || !generatedCode) return;

    setIsRefining(true);
    setIsStreaming(true);
    setErrorMessage(null);

    // Save current code to history stack for 1-click revert
    setHistoryStack((prev) => [...prev, generatedCode]);

    const formData = new FormData();
    formData.append('previous_code', generatedCode);
    formData.append('instruction', instruction);
    formData.append('style', activeStyle);

    try {
      const res = await fetch('http://localhost:8000/api/stream-refine', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server returned error status ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let streamedMarkup = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const payload = JSON.parse(line.slice(6));
                if (payload.type === 'chunk' && payload.text) {
                  streamedMarkup += payload.text;
                  setStreamingSnippet(streamedMarkup);
                } else if (payload.type === 'done' && payload.code) {
                  setGeneratedCode(payload.code);
                  setStreamingSnippet('');
                } else if (payload.type === 'error') {
                  throw new Error(payload.detail || 'Refinement error');
                }
              } catch {}
            }
          }
        }
      }

      setRefineText('');
      setActiveView('preview');
    } catch (err: any) {
      console.warn('Streaming refinement error, falling back to standard API refine:', err);
      try {
        const fallbackRes = await fetch('http://localhost:8000/api/refine', {
          method: 'POST',
          body: formData,
        });
        const data = await fallbackRes.json();
        setGeneratedCode(data.code);
        setStreamingSnippet('');
        setRefineText('');
        setActiveView('preview');
      } catch (fallbackErr: any) {
        setErrorMessage(fallbackErr.message || 'Failed to refine UI with Gemma 4.');
      }
    } finally {
      setIsRefining(false);
      setIsStreaming(false);
      setStreamingSnippet('');
    }
  };

  const handleUndoRefinement = () => {
    if (historyStack.length === 0) return;
    const previousCode = historyStack[historyStack.length - 1];
    setGeneratedCode(previousCode);
    setHistoryStack((prev) => prev.slice(0, prev.length - 1));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Hackathon Tag */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                Wire2React
              </span>
              <p className="text-[11px] text-slate-400">Gemma 4 Intent Synthesis • React Hyderabad Track</p>
            </div>
          </div>

          {/* Quick Demo Trigger (Zero-Setup Fail-Safe) */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleQuickDemo}
              disabled={isLoading || isRefining}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 hover:scale-[1.02]"
              title="Instant zero-latency judge demonstration"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Instant Benchmark Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout (50/50 Split Screen) */}
      <main className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Drawing & Input Workspace (50% Width) */}
        <div className="flex flex-col space-y-4 h-full">
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md shadow-xl flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-slate-200">Wireframe Input</h2>
              </div>

              {/* 3-Mode Switcher: Draw | Snap (Camera) | Upload */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setInputMode('draw')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    inputMode === 'draw'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Interactive Whiteboard Draw Mode with UI Stencils"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Draw</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('snap')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    inputMode === 'snap'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Snap Physical Napkin / Whiteboard with Camera"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Snap (Camera)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    inputMode === 'upload'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Upload / Drop file or use Benchmark Napkins"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload / Samples</span>
                </button>
              </div>
            </div>

            {/* Active Workspace View */}
            <div className="w-full">
              {inputMode === 'draw' ? (
                <CanvasDrawer onCanvasExport={handleCanvasExport} disabled={isLoading || isRefining} />
              ) : inputMode === 'snap' ? (
                <CameraSnap onCapture={handleCameraCapture} disabled={isLoading || isRefining} />
              ) : (
                <Uploader
                  selectedFile={selectedFile}
                  previewUrl={previewUrl}
                  onFileSelect={(file, url) => {
                    setSelectedFile(file);
                    setPreviewUrl(url);
                    setErrorMessage(null);
                  }}
                  onLoadSample={handleLoadSample}
                  disabled={isLoading || isRefining}
                />
              )}
            </div>

            {/* Bottom Controls: Design System Adapter + Synthesize Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center space-x-2">
                <Sliders className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-xs font-medium text-slate-400">Design System:</span>
                <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
                  {STYLE_OPTIONS.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setActiveStyle(style.id)}
                      disabled={isLoading || isRefining}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        activeStyle === style.id
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title={style.tagline}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Trigger */}
              <button
                onClick={handleGenerate}
                disabled={isLoading || isRefining || (!selectedFile && !previewUrl)}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center space-x-2 group hover:scale-[1.01]"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Gemma 4 is Synthesizing UI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-200 group-hover:rotate-12 transition-transform" />
                    <span>Synthesize Live React UI</span>
                  </>
                )}
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Output Column (50% Width) */}
        <div className="flex flex-col space-y-4 h-full">
          {/* View Tab Toggle: Live Sandbox | JSX / Markup */}
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
                <span>JSX / TSX Export</span>
              </button>
            </div>
          </div>

          {/* Render Active View Container */}
          <div className="flex-1 min-h-[580px] sm:min-h-[640px] lg:min-h-[700px]">
            {activeView === 'preview' ? (
              <LivePreview
                code={generatedCode}
                isLoading={isLoading || isRefining}
                isStreaming={isStreaming}
                streamingSnippet={streamingSnippet}
              />
            ) : (
              <CodeViewer code={generatedCode} styleName={activeStyle} />
            )}
          </div>

          {/* Multi-Turn UI Refinement ("Chat to Edit") Bar */}
          {generatedCode && (
            <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md shadow-xl flex flex-col space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquarePlus className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Multi-Turn UI Refinement ("Chat to Edit")
                  </span>
                </div>
                {historyStack.length > 0 && (
                  <button
                    type="button"
                    onClick={handleUndoRefinement}
                    disabled={isRefining}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center space-x-1 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20"
                    title="Undo last refinement and restore prior version"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Revert ({historyStack.length})</span>
                  </button>
                )}
              </div>

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 mr-1">Quick Tweaks:</span>
                {[
                  '+ Add Search Bar',
                  '🎨 Emerald Accent Palette',
                  '📱 Responsive Mobile Menu',
                  '✨ Add 3-Column Metrics',
                  '⚡ Dark Cyber Glow',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleRefineUI(chip)}
                    disabled={isRefining || isLoading}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-medium transition-all hover:scale-[1.02] disabled:opacity-40"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Custom prompt input & action */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRefineUI();
                }}
                className="flex items-center gap-2 pt-1"
              >
                <input
                  type="text"
                  value={refineText}
                  onChange={(e) => setRefineText(e.target.value)}
                  placeholder="e.g. 'Make the submit button emerald with an arrow icon and add a search filter in the navbar'..."
                  disabled={isRefining || isLoading}
                  className="flex-1 px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  disabled={isRefining || isLoading || !refineText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 disabled:opacity-40 transition-all flex items-center space-x-1.5 shrink-0"
                >
                  {isRefining ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Refining...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Refine UI</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
