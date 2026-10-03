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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview');

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
      setIntentAnalysis(data.intent_analysis);
      setPreviewUrl('/napkin_login.jpg');
      setInputMode('upload');
      setActiveView('preview');
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Could not load instant demo sample.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile && !previewUrl) {
      setErrorMessage('Please sketch, snap, or upload a wireframe first, or use a 1-click sample benchmark.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    formData.append('style', activeStyle);
    formData.append('sample_type', detectedSampleType);

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
      if (data.intent_analysis) {
        setIntentAnalysis(data.intent_analysis);
      }
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
              disabled={isLoading}
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
                  title="Interactive Whiteboard Draw Mode"
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
                <CanvasDrawer onCanvasExport={handleCanvasExport} disabled={isLoading} />
              ) : inputMode === 'snap' ? (
                <CameraSnap onCapture={handleCameraCapture} disabled={isLoading} />
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
                  disabled={isLoading}
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
                      disabled={isLoading}
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
                disabled={isLoading || (!selectedFile && !previewUrl)}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center space-x-2 group hover:scale-[1.01]"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Gemma 4 is Inferring Intent...</span>
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
          {/* View Tab Toggle: Live Sandbox | Intent Architecture | JSX / Markup */}
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
                onClick={() => setActiveView('intent')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeView === 'intent'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Intent Architecture</span>
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
          </div>

          {/* Render Active View Container */}
          <div className="flex-1 min-h-[640px] sm:min-h-[700px] lg:min-h-[760px]">
            {activeView === 'preview' ? (
              <LivePreview code={generatedCode} isLoading={isLoading} />
            ) : activeView === 'intent' ? (
              <IntentInspector styleName={activeStyle} code={generatedCode} analysis={intentAnalysis} />
            ) : (
              <CodeViewer code={generatedCode} styleName={activeStyle} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
