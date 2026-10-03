import React, { useMemo, useState } from 'react';
import { Monitor, Tablet, Smartphone, RotateCcw, ExternalLink } from 'lucide-react';

interface LivePreviewProps {
  code: string;
  isLoading?: boolean;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ code, isLoading }) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);

  const srcDoc = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  ${code || '<div class="flex items-center justify-center min-h-screen text-slate-500 font-mono text-sm">Awaiting Wireframe Generation...</div>'}
</body>
</html>`;
  }, [code, refreshKey]);

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

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-950/70">
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
        </div>

        {/* Viewport switcher */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              device === 'desktop'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Desktop View"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              device === 'tablet'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              device === 'mobile'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mobile View (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Reload Sandbox"
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
        </div>
      </div>

      {/* Frame Container */}
      <div className="relative flex-1 bg-slate-950/80 p-4 flex items-center justify-center overflow-auto min-h-[480px]">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20"></div>
              <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Gemma 4 is synthesizing UI...</p>
              <p className="text-xs text-indigo-400 font-mono mt-1">Applying visual reasoning & Tailwind rules</p>
            </div>
          </div>
        )}

        <div
          className={`${deviceWidthClass} h-full transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 flex`}
        >
          <iframe
            key={refreshKey}
            srcDoc={srcDoc}
            title="Live Wireframe Render"
            className="w-full h-full border-0 rounded-xl bg-slate-950"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  );
};
