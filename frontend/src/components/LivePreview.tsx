import React, { useMemo, useState } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  ExternalLink,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';

interface LivePreviewProps {
  code: string;
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingSnippet?: string;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  code,
  isLoading,
  isStreaming,
  streamingSnippet,
}) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [themeBackdrop, setThemeBackdrop] = useState<'dark' | 'light'>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const srcDoc = useMemo(() => {
    let cleanHtml = (code || '').trim();

    // Strip markdown code block fences if any slipped through
    if (cleanHtml.startsWith('```')) {
      cleanHtml = cleanHtml.replace(/^```[a-zA-Z]*\n?/gm, '').replace(/```$/gm, '').trim();
    }

    // Convert React className to HTML class so Tailwind CDN works
    cleanHtml = cleanHtml.replace(/\bclassName=/g, 'class=');

    // Remove React event handlers and JSX arrow functions that leak text in standard HTML
    cleanHtml = cleanHtml.replace(/\s*on[A-Z][a-zA-Z]*=\{[^}]*\}/g, '');
    cleanHtml = cleanHtml.replace(/\(?e\)?\s*=>\s*e\.preventDefault\(\)\s*\}?>?/g, '');
    cleanHtml = cleanHtml.replace(/\be\.preventDefault\(\)[^<]*/g, '');

    // Convert JSX curly-bracket attributes like value={"test"} to value="test"
    cleanHtml = cleanHtml.replace(/=\{([^{}]+)\}/g, '="$1"');

    // Prevent any runaway location.reload scripts
    cleanHtml = cleanHtml.replace(/location\.reload\(\)/gi, 'void(0)');

    const renderedBody =
      cleanHtml ||
      '<div class="flex items-center justify-center min-h-screen text-slate-500 font-mono text-sm">Awaiting Wireframe Generation...</div>';

    const bodyBgClass = themeBackdrop === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
    }
    /* Safeguard: Prevent whole containers or pages from blinking */
    body > .animate-pulse,
    body > div > .animate-pulse {
      animation-duration: 4s !important;
    }
  </style>
</head>
<body class="${bodyBgClass} min-h-screen transition-colors duration-200">
  ${renderedBody}
  <script>
    if (window.lucide) {
      window.lucide.createIcons();
    }
    window.addEventListener('load', () => {
      if (window.lucide) window.lucide.createIcons();
    });
  </script>
</body>
</html>`;
  }, [code, refreshKey, themeBackdrop]);

  const deviceWidthClass = {
    desktop: 'w-full',
    tablet: 'w-[768px] max-w-full',
    mobile: 'w-[375px] max-w-full',
  }[device];

  const handleOpenNewTab = () => {
    const blob = new Blob([srcDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const isBusy = isLoading || isStreaming;

  return (
    <div
      className={`flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl backdrop-blur-md ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-slate-950' : ''
      }`}
    >
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-800/80 bg-slate-950/70">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5 mr-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          </div>
          <span className="text-xs font-semibold text-slate-300">Live Component Sandbox</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            Tailwind CDN
          </span>
          {isStreaming && (
            <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Streaming Gemma 4 Tokens...</span>
            </span>
          )}
        </div>

        {/* Viewport switcher */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded-lg text-xs transition-colors flex items-center space-x-1 ${
              device === 'desktop'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Desktop View (100% Fluid)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline">Desktop</span>
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded-lg text-xs transition-colors flex items-center space-x-1 ${
              device === 'tablet'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline">768px</span>
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded-lg text-xs transition-colors flex items-center space-x-1 ${
              device === 'mobile'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mobile View (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline">375px</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1.5">
          {/* Backdrop theme switch */}
          <button
            type="button"
            onClick={() => setThemeBackdrop((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title={`Switch to ${themeBackdrop === 'dark' ? 'Light' : 'Dark'} Sandbox Backdrop`}
          >
            {themeBackdrop === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
            )}
          </button>

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Reset Micro-App State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleOpenNewTab}
            disabled={!code}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition-colors"
            title="Open in new window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Presentation'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div
        className={`relative flex-1 p-4 flex items-center justify-center overflow-auto min-h-[480px] transition-colors ${
          themeBackdrop === 'dark' ? 'bg-slate-950/90' : 'bg-slate-200/90'
        }`}
      >
        {/* Steady, High-Tech Generation HUD (Keeps iframe static without blinking) */}
        {isBusy && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20"></div>
              <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Gemma 4 is Synthesizing UI...
              </h3>
              <p className="text-xs text-slate-400">
                Recognizing visual elements, brand semantics, and assembling production components
              </p>
            </div>
            {streamingSnippet && (
              <div className="w-full max-w-md p-3 rounded-xl bg-slate-900/95 border border-slate-800 text-left font-mono text-[11px] text-indigo-300 overflow-hidden shadow-2xl">
                <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] uppercase tracking-wider mb-1.5 border-b border-slate-800/80 pb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Synthesizing Markup Tokens</span>
                </div>
                <div className="truncate opacity-80">
                  {streamingSnippet.slice(-120)}
                </div>
              </div>
            )}
          </div>
        )}

        <div
          className={`${deviceWidthClass} h-full transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border ${
            themeBackdrop === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-300 bg-white'
          } flex`}
        >
          <iframe
            key={refreshKey}
            srcDoc={srcDoc}
            title="Live Wireframe Render"
            className="w-full h-full border-0 rounded-xl bg-transparent"
            sandbox="allow-scripts allow-modals"
          />
        </div>
      </div>
    </div>
  );
};
