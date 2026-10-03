import React, { useState } from 'react';
import { Copy, Check, Download, Code2 } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  modelUsed?: string;
  styleName?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, modelUsed, styleName }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback copy
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!code) return;
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wire2react-${styleName || 'component'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-950/70">
        <div className="flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-300">Generated Markup</span>
          {modelUsed && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {modelUsed}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownload}
            disabled={!code}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors border border-slate-700"
            title="Download Code"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={handleCopy}
            disabled={!code}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              copied
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 shadow-lg shadow-indigo-600/30'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Text Area */}
      <div className="relative flex-1 p-4 bg-slate-950 overflow-auto font-mono text-xs text-slate-300 leading-relaxed">
        {code ? (
          <pre className="whitespace-pre-wrap break-all select-all font-mono">
            <code>{code}</code>
          </pre>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-600 font-mono">
            No code generated yet. Upload a wireframe and click Generate!
          </div>
        )}
      </div>
    </div>
  );
};
