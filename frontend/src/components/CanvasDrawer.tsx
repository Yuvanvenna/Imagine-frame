import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Pen,
  Eraser,
  Square,
  Minus,
  Circle,
  Undo2,
  Redo2,
  Trash2,
  Grid3X3,
  Download,
  Palette,
  Stamp,
  Layout,
  CreditCard,
  User,
  TrendingUp,
} from 'lucide-react';

export type DrawTool = 'pen' | 'eraser' | 'rectangle' | 'line' | 'circle';

interface CanvasDrawerProps {
  onCanvasExport: (file: File, dataUrl: string) => void;
  disabled?: boolean;
}

const INK_COLORS = [
  { name: 'Charcoal', value: '#1e293b' },
  { name: 'Blue Ink', value: '#2563eb' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Emerald', value: '#059669' },
];

const BRUSH_SIZES = [
  { label: 'Fine', value: 3 },
  { label: 'Medium', value: 6 },
  { label: 'Bold', value: 12 },
];

export const CanvasDrawer: React.FC<CanvasDrawerProps> = ({ onCanvasExport, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeTool, setActiveTool] = useState<DrawTool>('pen');
  const [activeColor, setActiveColor] = useState<string>('#1e293b');
  const [brushSize, setBrushSize] = useState<number>(6);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [startY, setStartY] = useState<number>(0);

  // High-visibility cursor tracking
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Undo / Redo history
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(-1);
  const snapshotRef = useRef<ImageData | null>(null);

  // Initialize canvas with white paper background
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Fill white paper background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial state to history
    const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialData]);
    setHistoryStep(0);
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const saveStateToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(currentData);
    if (newHistory.length > 30) newHistory.shift(); // limit history size

    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
    exportCurrentDrawing();
  };

  const exportCurrentDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'hand_drawn_wireframe.png', { type: 'image/png' });
        const dataUrl = canvas.toDataURL('image/png');
        onCanvasExport(file, dataUrl);
      }
    }, 'image/png');
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.putImageData(history[newStep], 0, 0);
      setHistoryStep(newStep);
      exportCurrentDrawing();
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.putImageData(history[newStep], 0, 0);
      setHistoryStep(newStep);
      exportCurrentDrawing();
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveStateToHistory();
  };

  const stampStencil = (type: 'navbar' | 'button' | 'input' | 'card' | 'avatar' | 'metric') => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.strokeStyle = activeColor;
    ctx.fillStyle = activeColor;
    ctx.lineWidth = brushSize > 3 ? brushSize : 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (type === 'navbar') {
      const topY = 40;
      const w = canvas.width - 100;
      const x = 50;
      ctx.strokeRect(x, topY, w, 56);
      ctx.strokeRect(x + 20, topY + 12, 32, 32);
      ctx.fillText('LOGO', x + 65, topY + 34);
      ctx.font = '13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Home    Features    Docs    Pricing', x + 160, topY + 34);
      const btnW = 90;
      const btnX = x + w - btnW - 20;
      ctx.strokeRect(btnX, topY + 12, btnW, 32);
      ctx.fillText('Sign In', btnX + 22, topY + 33);
    } else if (type === 'button') {
      const w = 180;
      const h = 48;
      const x = cx - w / 2;
      const y = cy - h / 2;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, w, h, 12);
      } else {
        ctx.strokeRect(x, y, w, h);
      }
      ctx.stroke();
      ctx.fillText('✦  Click Action', x + 35, y + 29);
    } else if (type === 'input') {
      const w = 320;
      const h = 50;
      const x = cx - w / 2;
      const y = cy - h / 2;
      ctx.font = '13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Email Address', x, y - 10);
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, w, h, 10);
      } else {
        ctx.strokeRect(x, y, w, h);
      }
      ctx.stroke();
      ctx.fillStyle = '#64748b';
      ctx.fillText('name@company.com', x + 20, y + 30);
    } else if (type === 'card') {
      const w = 300;
      const h = 340;
      const x = cx - w / 2;
      const y = cy - h / 2;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, w, h, 16);
      } else {
        ctx.strokeRect(x, y, w, h);
      }
      ctx.stroke();
      ctx.strokeRect(x + 16, y + 16, w - 32, 130);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('[ Image / Graphic ]', x + 80, y + 85);
      ctx.fillStyle = activeColor;
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Feature Header', x + 20, y + 180);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 20, y + 205);
      ctx.lineTo(x + w - 40, y + 205);
      ctx.moveTo(x + 20, y + 225);
      ctx.lineTo(x + w - 70, y + 225);
      ctx.stroke();
      ctx.strokeRect(x + 20, y + 265, w - 40, 42);
      ctx.fillText('Learn More →', x + 85, y + 292);
    } else if (type === 'avatar') {
      const r = 36;
      ctx.beginPath();
      ctx.arc(cx, cy - 10, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy - 18, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy + 22, 24, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('User Profile', cx - 32, cy + 50);
    } else if (type === 'metric') {
      const w = 240;
      const h = 130;
      const x = cx - w / 2;
      const y = cy - h / 2;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, w, h, 14);
      } else {
        ctx.strokeRect(x, y, w, h);
      }
      ctx.stroke();
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('TOTAL REVENUE', x + 20, y + 32);
      ctx.fillStyle = activeColor;
      ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('$48,250', x + 20, y + 70);
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#10b981';
      ctx.fillText('▲ +14.8% vs last month', x + 20, y + 102);
    }

    ctx.restore();
    saveStateToHistory();
  };

  // Get coordinates relative to canvas internal resolution
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const updateCursorPosition = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getCoordinates(e);
    setIsDrawing(true);
    setStartX(x);
    setStartY(y);
    updateCursorPosition(e);

    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (activeTool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = brushSize * 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (activeTool === 'pen') {
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    updateCursorPosition(e);
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    if (activeTool === 'pen') {
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (activeTool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = brushSize * 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (activeTool === 'rectangle') {
        const width = x - startX;
        const height = y - startY;
        ctx.strokeRect(startX, startY, width, height);
      } else if (activeTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (activeTool === 'circle') {
        const radiusX = Math.abs(x - startX) / 2;
        const radiusY = Math.abs(y - startY) / 2;
        const centerX = startX + (x - startX) / 2;
        const centerY = startY + (y - startY) / 2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    setIsDrawing(false);
    saveStateToHistory();
  };

  const handleDownloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wireframe-sketch.png';
    a.click();
  };

  // Ultra-visible dual-tone SVG cursor: thick black border, bright white core, colored center
  const customCursorStyle = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath stroke='%23000000' stroke-width='4' stroke-linecap='round' d='M14 2v24M2 14h24'/%3E%3Cpath stroke='%23ffffff' stroke-width='2' stroke-linecap='round' d='M14 2v24M2 14h24'/%3E%3Ccircle cx='14' cy='14' r='4.5' fill='%236366f1' stroke='%23000000' stroke-width='1.5'/%3E%3C/svg%3E") 14 14, crosshair`;

  return (
    <div className="flex flex-col space-y-3 h-full">
      {/* Drawing Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs shadow-md">
        {/* Tool selectors */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTool('pen')}
            className={`p-1.5 rounded-md transition-all ${
              activeTool === 'pen'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Pen (Freehand Drawing)"
          >
            <Pen className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('eraser')}
            className={`p-1.5 rounded-md transition-all ${
              activeTool === 'eraser'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />
          <button
            type="button"
            onClick={() => setActiveTool('rectangle')}
            className={`p-1.5 rounded-md transition-all ${
              activeTool === 'rectangle'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Rectangle (Cards / Buttons / Windows)"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('line')}
            className={`p-1.5 rounded-md transition-all ${
              activeTool === 'line'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Straight Line (Dividers / Text lines)"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('circle')}
            className={`p-1.5 rounded-md transition-all ${
              activeTool === 'circle'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Circle / Oval (Avatars / Badges)"
          >
            <Circle className="w-4 h-4" />
          </button>
        </div>

        {/* Color Palette */}
        {activeTool !== 'eraser' && (
          <div className="flex items-center space-x-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800/80">
            <Palette className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
            {INK_COLORS.map((col) => (
              <button
                key={col.value}
                type="button"
                onClick={() => setActiveColor(col.value)}
                style={{ backgroundColor: col.value }}
                className={`w-4 h-4 rounded-full transition-transform ${
                  activeColor === col.value
                    ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 scale-110'
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                title={col.name}
              />
            ))}
          </div>
        )}

        {/* Brush Size */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800/80">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size.value}
              type="button"
              onClick={() => setBrushSize(size.value)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                brushSize === size.value
                  ? 'bg-slate-800 text-indigo-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {size.label}
            </button>
          ))}
        </div>

        {/* History & Canvas Actions */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyStep <= 0}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyStep >= history.length - 1}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 transition-colors"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg transition-colors ${
              showGrid
                ? 'text-indigo-400 bg-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Toggle Dot Grid"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDownloadDrawing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Download Sketch as PNG"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            title="Clear Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick UI Stencils & Stamps Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs shadow-md">
        <div className="flex items-center space-x-1.5 mr-1 text-slate-400 font-medium">
          <Stamp className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px]">Wireframe Stencils:</span>
        </div>
        <button
          type="button"
          onClick={() => stampStencil('navbar')}
          disabled={disabled}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-medium transition-all hover:scale-[1.02]"
          title="Stamp Navbar Header"
        >
          <Layout className="w-3 h-3 text-indigo-400" />
          <span>+ Navbar</span>
        </button>
        <button
          type="button"
          onClick={() => stampStencil('card')}
          disabled={disabled}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-medium transition-all hover:scale-[1.02]"
          title="Stamp Feature Card"
        >
          <CreditCard className="w-3 h-3 text-indigo-400" />
          <span>+ Card</span>
        </button>
        <button
          type="button"
          onClick={() => stampStencil('button')}
          disabled={disabled}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-medium transition-all hover:scale-[1.02]"
          title="Stamp CTA Button"
        >
          <span className="text-indigo-400 font-bold text-xs">[ ]</span>
          <span>+ Button</span>
        </button>
        <button
          type="button"
          onClick={() => stampStencil('input')}
          disabled={disabled}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-medium transition-all hover:scale-[1.02]"
          title="Stamp Form Input Box"
        >
          <span className="text-indigo-400 font-bold text-xs">⌨</span>
          <span>+ Input</span>
        </button>
        <button
          type="button"
          onClick={() => stampStencil('avatar')}
          disabled={disabled}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-medium transition-all hover:scale-[1.02]"
          title="Stamp User Avatar"
        >
          <User className="w-3 h-3 text-indigo-400" />
          <span>+ Avatar</span>
        </button>
        <button
          type="button"
          onClick={() => stampStencil('metric')}
          disabled={disabled}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-medium transition-all hover:scale-[1.02]"
          title="Stamp Metric Stat Card"
        >
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          <span>+ Metric</span>
        </button>
      </div>

      {/* Expansive Drawing Canvas Board (Takes full height) */}
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-white select-none flex-1 min-h-[520px] sm:min-h-[580px] lg:min-h-[640px]"
        onPointerLeave={() => setCursorPos(null)}
      >
        {/* Subtle Engineering Dot Grid Overlay */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.25]"
            style={{
              backgroundImage: 'radial-gradient(#475569 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px',
            }}
          />
        )}

        {/* High-Resolution Drawing Canvas */}
        <canvas
          ref={canvasRef}
          width={1400}
          height={920}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerEnter={updateCursorPosition}
          className="w-full h-full touch-none block"
          style={{
            cursor: customCursorStyle,
            imageRendering: 'crisp-edges',
          }}
        />

        {/* Interactive Brush Reticle Overlay (Always 100% visible) */}
        {cursorPos && (
          <div
            className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 transition-none"
            style={{
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y}px`,
            }}
          >
            {activeTool === 'pen' ? (
              <div
                className="rounded-full border-2 border-slate-950 ring-2 ring-white shadow-xl flex items-center justify-center"
                style={{
                  width: `${Math.max(brushSize * 2.2, 12)}px`,
                  height: `${Math.max(brushSize * 2.2, 12)}px`,
                  backgroundColor: `${activeColor}40`,
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-950 ring-1 ring-white" />
              </div>
            ) : activeTool === 'eraser' ? (
              <div
                className="rounded-lg border-2 border-rose-600 bg-rose-500/25 ring-2 ring-white shadow-xl flex items-center justify-center"
                style={{
                  width: `${brushSize * 4}px`,
                  height: `${brushSize * 4}px`,
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600 ring-1 ring-white" />
              </div>
            ) : (
              <div className="relative w-6 h-6 flex items-center justify-center">
                <div className="w-full h-[2px] bg-slate-950 ring-1 ring-white shadow-sm" />
                <div className="h-full w-[2px] bg-slate-950 ring-1 ring-white shadow-sm absolute" />
                <div className="w-2 h-2 rounded-full border border-slate-950 bg-indigo-500 ring-1 ring-white absolute" />
              </div>
            )}
          </div>
        )}

        {/* Floating Canvas Status Badge */}
        <div className="absolute bottom-3 right-3 pointer-events-none flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 text-xs text-slate-300 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium">Interactive Canvas (1400×920)</span>
        </div>
      </div>
    </div>
  );
};
