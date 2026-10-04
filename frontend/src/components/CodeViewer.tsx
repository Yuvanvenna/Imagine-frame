import React, { useState, useMemo } from 'react';
import { Copy, Check, Download, Code2, FileCode, Layers } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  styleName?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, styleName }) => {
  const [copied, setCopied] = useState(false);
  const [outputMode, setOutputMode] = useState<'html' | 'tsx'>('tsx');

  // Convert raw HTML with Tailwind into a production-ready React TSX component
  const tsxCode = useMemo(() => {
    if (!code) return '';

    let clean = code.trim();
    // Strip markdown code fences if present
    clean = clean.replace(/^```[a-zA-Z]*\n?/gm, '').replace(/```$/gm, '').trim();

    // Extract inline <script> contents to remove from JSX
    clean = clean.replace(/<script[\s\S]*?<\/script>/gi, '').trim();

    // Find all Lucide icons used (e.g. data-lucide="arrow-right")
    const iconRegex = /data-lucide=["']([a-zA-Z0-9-]+)["']/g;
    const iconsFound = new Set<string>();
    let match;
    while ((match = iconRegex.exec(clean)) !== null) {
      if (match[1]) {
        // Convert kebab-case to PascalCase (e.g. check-circle -> CheckCircle)
        const pascalName = match[1]
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join('');
        iconsFound.add(pascalName);
      }
    }

    // Replace <i data-lucide="icon-name" class="..."></i> with <IconName className="..." />
    clean = clean.replace(
      /<i\s+[^>]*data-lucide=["']([a-zA-Z0-9-]+)["'][^>]*(?:class=["']([^"']*)["'])?[^>]*><\/i>/gi,
      (_, iconName, classNames) => {
        const pascal = iconName
          .split('-')
          .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
          .join('');
        return classNames ? `<${pascal} className="${classNames}" />` : `<${pascal} />`;
      }
    );

    // Replace remaining <i data-lucide="..."> tags
    clean = clean.replace(
      /<i\s+data-lucide=["']([a-zA-Z0-9-]+)["']\s*><\/i>/gi,
      (_, iconName) => {
        const pascal = iconName
          .split('-')
          .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
          .join('');
        return `<${pascal} />`;
      }
    );

    // Replace class= with className=
    clean = clean.replace(/\bclass=/g, 'className=');

    // Replace for= with htmlFor=
    clean = clean.replace(/\bfor=/g, 'htmlFor=');

    // Close common unclosed void tags in HTML
    clean = clean.replace(/<(input|img|br|hr)([^>]*?)(?<!\/)>/gi, '<$1$2 />');

    // Convert component name
    const componentName = styleName
      ? styleName.charAt(0).toUpperCase() + styleName.slice(1) + 'UI'
      : 'WireframeComponent';

    const lucideImports =
      iconsFound.size > 0
        ? `import { ${Array.from(iconsFound).join(', ')} } from 'lucide-react';\n`
        : '';

    return `import React, { useState } from 'react';
${lucideImports}
export default function ${componentName}() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAction = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
${clean
  .split('\n')
  .map((line) => '    ' + line)
  .join('\n')}
  );
}
`;
  }, [code, styleName]);

  const displayedCode = outputMode === 'tsx' ? tsxCode : code;

  const handleCopy = async () => {
    if (!displayedCode) return;
    try {
      await navigator.clipboard.writeText(displayedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = displayedCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!displayedCode) return;
    const isTsx = outputMode === 'tsx';
    const blob = new Blob([displayedCode], {
      type: isTsx ? 'text/typescript' : 'text/html',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wire2react-${styleName || 'component'}.${isTsx ? 'tsx' : 'html'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-800/80 bg-slate-950/70">
        <div className="flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-300">Generated Code</span>

          {/* Toggle between React TSX and HTML */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 ml-2">
            <button
              type="button"
              onClick={() => setOutputMode('tsx')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                outputMode === 'tsx'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Export as production React component with lucide-react imports"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>React (TSX)</span>
            </button>
            <button
              type="button"
              onClick={() => setOutputMode('html')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                outputMode === 'html'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Export as standalone HTML with Tailwind CDN"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>HTML Sandbox</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownload}
            disabled={!displayedCode}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors border border-slate-700"
            title={`Download ${outputMode === 'tsx' ? '.tsx' : '.html'} file`}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export .{outputMode}</span>
          </button>
          <button
            onClick={handleCopy}
            disabled={!displayedCode}
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
                <span>Copy {outputMode.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Text Area */}
      <div className="relative flex-1 p-4 bg-slate-950 overflow-auto font-mono text-xs text-slate-300 leading-relaxed">
        {displayedCode ? (
          <pre className="whitespace-pre-wrap break-all select-all font-mono">
            <code>{displayedCode}</code>
          </pre>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-600 font-mono">
            No code generated yet. Sketch or upload a wireframe to generate!
          </div>
        )}
      </div>
    </div>
  );
};
