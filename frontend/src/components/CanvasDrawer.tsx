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
  Move,
  Check,
  X,
  Type,
} from 'lucide-react';

export type DrawTool = 'pen' | 'eraser' | 'rectangle' | 'line' | 'circle' | 'move';
export type StencilType = 'navbar' | 'card' | 'button' | 'input' | 'avatar' | 'metric';

interface CanvasDrawerProps {
  onCanvasExport: (file: File, dataUrl: string) => void;
  disabled?: boolean;
}

interface StencilConfig {
  title: string;
  width: number;
  height: number;
  icon: React.ComponentType<{ className?: string }>;
}

interface ActiveStencil {
  type: StencilType;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FloatingSelection {
  x: number;
  y: number;
  w: number;
  h: number;
  origX: number;
  origY: number;
  imgData: ImageData;
}

const STENCIL_CONFIGS: Record<StencilType, StencilConfig> = {
  navbar: { title: 'Navbar Header', width: 1240, height: 56, icon: Layout },
  card: { title: 'Feature Card', width: 300, height: 340, icon: CreditCard },
  button: { title: 'CTA Button', width: 190, height: 48, icon: Square },
  input: { title: 'Input Field', width: 320, height: 56, icon: Type },
  avatar: { title: 'User Avatar', width: 90, height: 100, icon: User },
  metric: { title: 'Metric Card', width: 240, height: 130, icon: TrendingUp },
};

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

/**
 * Universal vector renderer for wireframe stencils on any 2D canvas context.
 */
function drawStencilOnContext(
  ctx: CanvasRenderingContext2D,
  type: StencilType,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  strokeWidth: number
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(strokeWidth, 2);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';

  if (type === 'navbar') {
    ctx.strokeRect(x, y, w, h);
    // Logo icon block
    ctx.strokeRect(x + 20, y + 12, 32, 32);
    ctx.fillText('LOGO', x + 65, y + 34);
    ctx.font = '13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Home    Features    Docs    Pricing', x + 160, y + 34);
    const btnW = 90;
    const btnX = x + w - btnW - 20;
    ctx.strokeRect(btnX, y + 12, btnW, 32);
    ctx.fillText('Sign In', btnX + 22, y + 33);
  } else if (type === 'button') {
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, 12);
    } else {
      ctx.strokeRect(x, y, w, h);
    }
    ctx.stroke();
    ctx.fillText('✦  Click Action', x + (w - 120) / 2, y + h / 2 + 5);
  } else if (type === 'input') {
    ctx.font = '13px "Plus Jakarta Sans", sans-serif';
    const hasRoomAbove = y >= 20;
    const labelY = hasRoomAbove ? y - 8 : y + 12;
    const boxY = hasRoomAbove ? y : y + 18;
    const boxH = hasRoomAbove ? h : h - 18;

    ctx.fillText('Email Address', x, labelY);
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, boxY, w, boxH, 10);
    } else {
      ctx.strokeRect(x, boxY, w, boxH);
    }
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.fillText('name@company.com', x + 16, boxY + boxH / 2 + 5);
  } else if (type === 'card') {
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, 16);
    } else {
      ctx.strokeRect(x, y, w, h);
    }
    ctx.stroke();

    // Image hero section
    const imgH = 130;
    ctx.strokeRect(x + 16, y + 16, w - 32, imgH);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('[ Image / Graphic ]', x + (w - 140) / 2, y + 16 + imgH / 2 + 5);

    // Title header
    ctx.fillStyle = color;
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Feature Header', x + 20, y + 185);

    // Body skeleton lines
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 210);
    ctx.lineTo(x + w - 40, y + 210);
    ctx.moveTo(x + 20, y + 230);
    ctx.lineTo(x + w - 70, y + 230);
    ctx.stroke();

    // CTA button inside card
    const btnY = y + h - 54;
    ctx.strokeRect(x + 20, btnY, w - 40, 38);
    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Learn More →', x + (w - 100) / 2, btnY + 24);
  } else if (type === 'avatar') {
    const cx = x + w / 2;
    const cy = y + h / 2 - 12;
    const r = Math.min(w, h) * 0.36;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Inner head
    ctx.beginPath();
    ctx.arc(cx, cy - 8, r * 0.42, 0, Math.PI * 2);
    ctx.stroke();

    // Inner shoulders
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.82, r * 0.7, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('User Profile', cx - 32, y + h - 4);
  } else if (type === 'metric') {
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

    ctx.fillStyle = color;
    ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('$48,250', x + 20, y + 70);

    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText('▲ +14.8% vs last month', x + 20, y + 102);
  }

  ctx.restore();
}

export const CanvasDrawer: React.FC<CanvasDrawerProps> = ({ onCanvasExport, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeTool, setActiveTool] = useState<DrawTool>('pen');
  const [activeColor, setActiveColor] = useState<string>('#1e293b');
  const [brushSize, setBrushSize] = useState<number>(6);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [startY, setStartY] = useState<number>(0);

  // Stencil states
  const [armedStencil, setArmedStencil] = useState<StencilType | null>(null);
  const [activeStencil, setActiveStencil] = useState<ActiveStencil | null>(null);

  // Move / Marquee tool state
  const [floatingSelection, setFloatingSelection] = useState<FloatingSelection | null>(null);
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  // Dragging refs
  const isDraggingStencilRef = useRef<boolean>(false);
  const isDraggingSelectionRef = useRef<boolean>(false);
  const isMarqueeSelectingRef = useRef<boolean>(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);

  // Cursor tracking
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; clientX: number; clientY: number } | null>(null);

  // Undo / Redo history
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(-1);
  const snapshotRef = useRef<ImageData | null>(null);

  // Coordinate mapping
  const getCanvasCoordinates = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * scaleY)),
    };
  }, []);

  const updateCursorPosition = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      clientX: e.clientX,
      clientY: e.clientY,
    });
  };

  const exportCurrentDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'hand_drawn_wireframe.png', { type: 'image/png' });
        const dataUrl = canvas.toDataURL('image/png');
        onCanvasExport(file, dataUrl);
      }
    }, 'image/png');
  }, [onCanvasExport]);

  const saveStateToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(currentData);
    if (newHistory.length > 30) newHistory.shift();

    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
    exportCurrentDrawing();
  }, [history, historyStep, exportCurrentDrawing]);

  // Initialize canvas with white paper background
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialData]);
    setHistoryStep(0);
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  // Commit the active movable stencil onto the main canvas
  const commitActiveStencil = useCallback(() => {
    if (!activeStencil) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawStencilOnContext(
      ctx,
      activeStencil.type,
      activeStencil.x,
      activeStencil.y,
      activeStencil.width,
      activeStencil.height,
      activeColor,
      brushSize
    );

    setActiveStencil(null);
    saveStateToHistory();
  }, [activeStencil, activeColor, brushSize, saveStateToHistory]);

  const handleCancelActiveStencil = useCallback(() => {
    setActiveStencil(null);
  }, []);

  const handleCenterActiveStencil = useCallback(() => {
    if (!activeStencil) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const x = Math.round((canvas.width - activeStencil.width) / 2);
    const y = Math.round((canvas.height - activeStencil.height) / 2);
    setActiveStencil({ ...activeStencil, x, y });
  }, [activeStencil]);

  // Center an armed stencil directly
  const handleCenterArmedStencil = useCallback(() => {
    if (!armedStencil) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cfg = STENCIL_CONFIGS[armedStencil];
    const x = Math.round((canvas.width - cfg.width) / 2);
    const y = Math.round((canvas.height - cfg.height) / 2);

    setActiveStencil({
      type: armedStencil,
      x,
      y,
      width: cfg.width,
      height: cfg.height,
    });
    setArmedStencil(null);
  }, [armedStencil]);

  // Commit a floating selection from the move tool
  const commitFloatingSelection = useCallback(() => {
    if (!floatingSelection) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.putImageData(floatingSelection.imgData, floatingSelection.x, floatingSelection.y);
    setFloatingSelection(null);
    saveStateToHistory();
  }, [floatingSelection, saveStateToHistory]);

  const revertFloatingSelection = useCallback(() => {
    if (!floatingSelection) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.putImageData(floatingSelection.imgData, floatingSelection.origX, floatingSelection.origY);
    setFloatingSelection(null);
  }, [floatingSelection]);

  // Arm or toggle stencil placement
  const toggleStencilMode = (type: StencilType) => {
    if (disabled) return;

    if (activeStencil) {
      commitActiveStencil();
    }
    if (floatingSelection) {
      commitFloatingSelection();
    }

    if (armedStencil === type) {
      setArmedStencil(null);
    } else {
      setArmedStencil(type);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (armedStencil) {
          setArmedStencil(null);
        } else if (activeStencil) {
          handleCancelActiveStencil();
        } else if (floatingSelection) {
          revertFloatingSelection();
        }
      } else if (e.key === 'Enter') {
        if (activeStencil) {
          commitActiveStencil();
        } else if (floatingSelection) {
          commitFloatingSelection();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [armedStencil, activeStencil, floatingSelection, commitActiveStencil, handleCancelActiveStencil, commitFloatingSelection, revertFloatingSelection]);

  // Synchronous Overlay Rendering for High-DPI preview and bounding boxes
  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // 1. Draw Armed Stencil Preview tracking cursor
    if (armedStencil && cursorPos && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = overlay.width / rect.width;
      const scaleY = overlay.height / rect.height;
      const mouseCanvasX = (cursorPos.clientX - rect.left) * scaleX;
      const mouseCanvasY = (cursorPos.clientY - rect.top) * scaleY;

      const cfg = STENCIL_CONFIGS[armedStencil];
      const x = Math.round(Math.max(10, Math.min(overlay.width - cfg.width - 10, mouseCanvasX - cfg.width / 2)));
      const y = Math.round(Math.max(10, Math.min(overlay.height - cfg.height - 10, mouseCanvasY - cfg.height / 2)));

      ctx.save();
      ctx.globalAlpha = 0.8;
      drawStencilOnContext(ctx, armedStencil, x, y, cfg.width, cfg.height, activeColor, brushSize);

      // Dashed vibrant placement boundary
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x - 4, y - 4, cfg.width + 8, cfg.height + 8);

      // Target Corner Grips
      ctx.fillStyle = '#6366f1';
      const sz = 8;
      ctx.fillRect(x - 5, y - 5, sz, sz);
      ctx.fillRect(x + cfg.width + 3 - sz, y - 5, sz, sz);
      ctx.fillRect(x - 5, y + cfg.height + 3 - sz, sz, sz);
      ctx.fillRect(x + cfg.width + 3 - sz, y + cfg.height + 3 - sz, sz, sz);

      // Badge pill
      const badgeY = Math.max(12, y - 30);
      ctx.fillStyle = '#4f46e5';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, badgeY, 175, 24, 6);
      } else {
        ctx.fillRect(x, badgeY, 175, 24);
      }
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`📍 Click to Place ${cfg.title}`, x + 8, badgeY + 16);

      ctx.restore();
    }

    // 2. Draw Active Movable Stencil
    if (activeStencil) {
      const { x, y, width: w, height: h, type } = activeStencil;
      const cfg = STENCIL_CONFIGS[type];

      ctx.save();
      // Render wireframe
      drawStencilOnContext(ctx, type, x, y, w, h, activeColor, brushSize);

      // Selection Frame
      ctx.setLineDash([8, 5]);
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x - 6, y - 6, w + 12, h + 12);

      // 4 Corner Grip Handles
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 2;
      const handleSz = 10;
      const corners = [
        { cx: x - 6, cy: y - 6 },
        { cx: x + w + 6, cy: y - 6 },
        { cx: x - 6, cy: y + h + 6 },
        { cx: x + w + 6, cy: y + h + 6 },
      ];
      corners.forEach((c) => {
        ctx.fillRect(c.cx - handleSz / 2, c.cy - handleSz / 2, handleSz, handleSz);
        ctx.strokeRect(c.cx - handleSz / 2, c.cy - handleSz / 2, handleSz, handleSz);
      });

      // Top Tag
      const tagW = 160;
      const tagH = 24;
      const tagY = y - 34 > 8 ? y - 34 : y + h + 12;
      ctx.fillStyle = '#4f46e5';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x - 6, tagY, tagW, tagH, 6);
      } else {
        ctx.fillRect(x - 6, tagY, tagW, tagH);
      }
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`✥ Drag: ${cfg.title}`, x + 4, tagY + 16);

      ctx.restore();
    }

    // 3. Draw Floating Selection (Move Tool)
    if (floatingSelection) {
      const { x, y, w, h, imgData } = floatingSelection;
      ctx.save();
      ctx.putImageData(imgData, x, y);

      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);

      const tagY = Math.max(10, y - 26);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(x - 2, tagY, 130, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('✥ Drag Selection', x + 6, tagY + 15);

      ctx.restore();
    }

    // 4. Draw Active Marquee Box
    if (marquee) {
      const selX = Math.min(marquee.startX, marquee.currentX);
      const selY = Math.min(marquee.startY, marquee.currentY);
      const selW = Math.abs(marquee.currentX - marquee.startX);
      const selH = Math.abs(marquee.currentY - marquee.startY);

      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.fillRect(selX, selY, selW, selH);
      ctx.strokeRect(selX, selY, selW, selH);
      ctx.restore();
    }
  }, [armedStencil, activeStencil, floatingSelection, marquee, cursorPos, activeColor, brushSize]);

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
    setActiveStencil(null);
    setArmedStencil(null);
    setFloatingSelection(null);
    saveStateToHistory();
  };

  // Pointer interactions on canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    const canvasPos = getCanvasCoordinates(e);
    updateCursorPosition(e);

    // 1. If a stencil was armed: drop it right where the user clicked
    if (armedStencil) {
      const cfg = STENCIL_CONFIGS[armedStencil];
      const x = Math.round(Math.max(10, Math.min(canvas.width - cfg.width - 10, canvasPos.x - cfg.width / 2)));
      const y = Math.round(Math.max(10, Math.min(canvas.height - cfg.height - 10, canvasPos.y - cfg.height / 2)));

      setActiveStencil({
        type: armedStencil,
        x,
        y,
        width: cfg.width,
        height: cfg.height,
      });
      setArmedStencil(null);

      // Seamlessly start dragging immediately in case the user clicked & dragged
      isDraggingStencilRef.current = true;
      dragOffsetRef.current = { x: canvasPos.x - x, y: canvasPos.y - y };
      return;
    }

    // 2. If an active stencil is being positioned
    if (activeStencil) {
      const pad = 14;
      const isInside =
        canvasPos.x >= activeStencil.x - pad &&
        canvasPos.x <= activeStencil.x + activeStencil.width + pad &&
        canvasPos.y >= activeStencil.y - pad &&
        canvasPos.y <= activeStencil.y + activeStencil.height + pad;

      if (isInside) {
        isDraggingStencilRef.current = true;
        dragOffsetRef.current = { x: canvasPos.x - activeStencil.x, y: canvasPos.y - activeStencil.y };
        return;
      } else {
        // Clicked outside -> Commit stencil to canvas
        commitActiveStencil();
        return;
      }
    }

    // 3. If Move Tool is active
    if (activeTool === 'move') {
      if (floatingSelection) {
        const isInside =
          canvasPos.x >= floatingSelection.x &&
          canvasPos.x <= floatingSelection.x + floatingSelection.w &&
          canvasPos.y >= floatingSelection.y &&
          canvasPos.y <= floatingSelection.y + floatingSelection.h;

        if (isInside) {
          isDraggingSelectionRef.current = true;
          dragOffsetRef.current = { x: canvasPos.x - floatingSelection.x, y: canvasPos.y - floatingSelection.y };
          return;
        } else {
          commitFloatingSelection();
          return;
        }
      } else {
        // Start marquee selection
        isMarqueeSelectingRef.current = true;
        marqueeStartRef.current = { x: canvasPos.x, y: canvasPos.y };
        setMarquee({ startX: canvasPos.x, startY: canvasPos.y, currentX: canvasPos.x, currentY: canvasPos.y });
        return;
      }
    }

    // 4. Standard Freehand or Shape Drawing
    setIsDrawing(true);
    setStartX(canvasPos.x);
    setStartY(canvasPos.y);

    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(canvasPos.x, canvasPos.y);

    if (activeTool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = brushSize * 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(canvasPos.x, canvasPos.y);
      ctx.stroke();
    } else if (activeTool === 'pen') {
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(canvasPos.x, canvasPos.y);
      ctx.stroke();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    updateCursorPosition(e);
    if (disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasPos = getCanvasCoordinates(e);

    // 1. Dragging Active Stencil
    if (isDraggingStencilRef.current && activeStencil) {
      const newX = Math.round(Math.max(0, Math.min(canvas.width - activeStencil.width, canvasPos.x - dragOffsetRef.current.x)));
      const newY = Math.round(Math.max(0, Math.min(canvas.height - activeStencil.height, canvasPos.y - dragOffsetRef.current.y)));
      setActiveStencil({ ...activeStencil, x: newX, y: newY });
      return;
    }

    // 2. Dragging Move Selection
    if (isDraggingSelectionRef.current && floatingSelection) {
      const newX = Math.round(Math.max(0, Math.min(canvas.width - floatingSelection.w, canvasPos.x - dragOffsetRef.current.x)));
      const newY = Math.round(Math.max(0, Math.min(canvas.height - floatingSelection.h, canvasPos.y - dragOffsetRef.current.y)));
      setFloatingSelection({ ...floatingSelection, x: newX, y: newY });
      return;
    }

    // 3. Dragging Marquee Box
    if (isMarqueeSelectingRef.current && marqueeStartRef.current) {
      setMarquee({
        startX: marqueeStartRef.current.x,
        startY: marqueeStartRef.current.y,
        currentX: canvasPos.x,
        currentY: canvasPos.y,
      });
      return;
    }

    // 4. Standard Freehand or Shape Drawing
    if (!isDrawing) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'pen') {
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(canvasPos.x, canvasPos.y);
      ctx.stroke();
    } else if (activeTool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = brushSize * 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(canvasPos.x, canvasPos.y);
      ctx.stroke();
    } else if (snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (activeTool === 'rectangle') {
        const width = canvasPos.x - startX;
        const height = canvasPos.y - startY;
        ctx.strokeRect(startX, startY, width, height);
      } else if (activeTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(canvasPos.x, canvasPos.y);
        ctx.stroke();
      } else if (activeTool === 'circle') {
        const radiusX = Math.abs(canvasPos.x - startX) / 2;
        const radiusY = Math.abs(canvasPos.y - startY) / 2;
        const centerX = startX + (canvasPos.x - startX) / 2;
        const centerY = startY + (canvasPos.y - startY) / 2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }

    if (isDraggingStencilRef.current) {
      isDraggingStencilRef.current = false;
      return;
    }

    if (isDraggingSelectionRef.current) {
      isDraggingSelectionRef.current = false;
      return;
    }

    if (isMarqueeSelectingRef.current) {
      isMarqueeSelectingRef.current = false;
      if (marquee && canvas) {
        const selX = Math.round(Math.min(marquee.startX, marquee.currentX));
        const selY = Math.round(Math.min(marquee.startY, marquee.currentY));
        const selW = Math.round(Math.abs(marquee.currentX - marquee.startX));
        const selH = Math.round(Math.abs(marquee.currentY - marquee.startY));

        if (selW > 15 && selH > 15) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            const imgData = ctx.getImageData(selX, selY, selW, selH);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(selX, selY, selW, selH);

            setFloatingSelection({
              x: selX,
              y: selY,
              w: selW,
              h: selH,
              origX: selX,
              origY: selY,
              imgData,
            });
          }
        }
      }
      setMarquee(null);
      return;
    }

    if (isDrawing) {
      setIsDrawing(false);
      saveStateToHistory();
    }
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

  // Cursor style calculation
  const getCanvasCursorStyle = () => {
    if (armedStencil) return 'crosshair';
    if (activeStencil) return isDraggingStencilRef.current ? 'grabbing' : 'grab';
    if (activeTool === 'move') {
      if (floatingSelection) return isDraggingSelectionRef.current ? 'grabbing' : 'grab';
      return 'crosshair';
    }
    if (activeTool === 'eraser' || activeTool === 'rectangle' || activeTool === 'line' || activeTool === 'circle') {
      return 'crosshair';
    }
    return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath stroke='%23000000' stroke-width='4' stroke-linecap='round' d='M14 2v24M2 14h24'/%3E%3Cpath stroke='%23ffffff' stroke-width='2' stroke-linecap='round' d='M14 2v24M2 14h24'/%3E%3Ccircle cx='14' cy='14' r='4.5' fill='%236366f1' stroke='%23000000' stroke-width='1.5'/%3E%3C/svg%3E") 14 14, crosshair`;
  };

  return (
    <div className="flex flex-col space-y-3 h-full">
      {/* Drawing Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs shadow-md">
        {/* Tool selectors */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              if (activeStencil) commitActiveStencil();
              if (floatingSelection) commitFloatingSelection();
              setActiveTool('pen');
            }}
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
            onClick={() => {
              if (activeStencil) commitActiveStencil();
              if (floatingSelection) commitFloatingSelection();
              setActiveTool('eraser');
            }}
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
            onClick={() => {
              if (activeStencil) commitActiveStencil();
              if (floatingSelection) commitFloatingSelection();
              setActiveTool('rectangle');
            }}
            className={`p-1.5 rounded-md transition-all ${
              activeTool === 'rectangle'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Rectangle (Cards / Windows)"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (activeStencil) commitActiveStencil();
              if (floatingSelection) commitFloatingSelection();
              setActiveTool('line');
            }}
            className={`p-1.5 rounded-md transition-all ${
              activeTool === 'line'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Straight Line (Dividers / Underlines)"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (activeStencil) commitActiveStencil();
              if (floatingSelection) commitFloatingSelection();
              setActiveTool('circle');
            }}
            className={`p-1.5 rounded-md transition-all ${
              activeTool === 'circle'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Circle / Oval (Badges / Logos)"
          >
            <Circle className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />
          <button
            type="button"
            onClick={() => {
              if (activeStencil) commitActiveStencil();
              setActiveTool('move');
            }}
            className={`p-1.5 rounded-md transition-all ${
              activeTool === 'move'
                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Select & Move (Marquee drag any area to reposition it)"
          >
            <Move className="w-4 h-4" />
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
            title="Redo (Ctrl+Y)"
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

      {/* Wireframe Stencils Toolbar with Active State */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs shadow-md">
        <div className="flex items-center space-x-1.5 mr-1 text-slate-400 font-medium">
          <Stamp className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px]">Wireframe Stencils:</span>
        </div>

        {(Object.keys(STENCIL_CONFIGS) as StencilType[]).map((type) => {
          const cfg = STENCIL_CONFIGS[type];
          const Icon = cfg.icon;
          const isArmed = armedStencil === type;
          const isActive = activeStencil?.type === type;
          const isSelected = isArmed || isActive;

          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleStencilMode(type)}
              disabled={disabled}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white border border-indigo-400 ring-2 ring-indigo-400/50 shadow-md scale-[1.03]'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:scale-[1.02]'
              }`}
              title={`${cfg.title} - Click then click anywhere on canvas to place`}
            >
              <Icon className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
              <span>{`+ ${cfg.title.split(' ')[0]}`}</span>
              {isSelected && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </button>
          );
        })}

        <span className="ml-auto text-[11px] text-slate-500 hidden sm:inline">
          💡 Click a stencil, then click anywhere on the canvas to place and position it.
        </span>
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

        {/* High-Resolution Main Drawing Canvas */}
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
            cursor: getCanvasCursorStyle(),
            imageRendering: 'crisp-edges',
          }}
        />

        {/* High-Resolution Stencil & Selection Overlay Canvas */}
        <canvas
          ref={overlayCanvasRef}
          width={1400}
          height={920}
          className="absolute inset-0 w-full h-full pointer-events-none z-20 block"
          style={{
            imageRendering: 'crisp-edges',
          }}
        />

        {/* Interactive Floating Status HUD when Armed */}
        {armedStencil && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-2.5 px-4 py-2 rounded-full bg-slate-900/95 border border-indigo-500/70 shadow-2xl backdrop-blur-md text-xs text-white animate-in fade-in slide-in-from-top-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
            <span className="font-medium text-slate-200">
              Click anywhere on canvas to place <strong className="text-indigo-400 font-semibold">{STENCIL_CONFIGS[armedStencil].title}</strong>
            </span>
            <div className="w-[1px] h-3.5 bg-slate-700 mx-1" />
            <button
              type="button"
              onClick={handleCenterArmedStencil}
              className="px-2.5 py-1 rounded bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-200 font-semibold text-[11px] transition-colors"
              title="Place directly in the center of the canvas"
            >
              Center Canvas
            </button>
            <button
              type="button"
              onClick={() => setArmedStencil(null)}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] transition-colors"
              title="Cancel placement (Esc)"
            >
              Cancel (Esc)
            </button>
          </div>
        )}

        {/* Interactive Floating Status HUD when Active & Movable */}
        {activeStencil && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-2.5 px-4 py-2 rounded-full bg-slate-900/95 border border-emerald-500/70 shadow-2xl backdrop-blur-md text-xs text-white animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center text-emerald-400 font-semibold">
              <Check className="w-3.5 h-3.5 mr-1" />
              <span>Positioning {STENCIL_CONFIGS[activeStencil.type].title}</span>
            </div>
            <span className="text-slate-400 text-[11px] hidden sm:inline">(Drag box on canvas to move)</span>
            <div className="w-[1px] h-3.5 bg-slate-700 mx-1" />
            <button
              type="button"
              onClick={commitActiveStencil}
              className="flex items-center space-x-1 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shadow-md transition-all hover:scale-105"
              title="Lock stencil into canvas (Enter)"
            >
              <Check className="w-3 h-3" />
              <span>Done (Enter)</span>
            </button>
            <button
              type="button"
              onClick={handleCenterActiveStencil}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
              title="Center stencil on canvas"
            >
              Center
            </button>
            <button
              type="button"
              onClick={handleCancelActiveStencil}
              className="p-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
              title="Discard stencil (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Interactive Floating Status HUD for Move Tool */}
        {floatingSelection && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-2.5 px-4 py-2 rounded-full bg-slate-900/95 border border-blue-500/70 shadow-2xl backdrop-blur-md text-xs text-white animate-in fade-in slide-in-from-top-2">
            <Move className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-slate-200">Drag selection to move</span>
            <div className="w-[1px] h-3.5 bg-slate-700 mx-1" />
            <button
              type="button"
              onClick={commitFloatingSelection}
              className="flex items-center space-x-1 px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] shadow-md transition-all hover:scale-105"
              title="Lock to new position (Enter)"
            >
              <Check className="w-3 h-3" />
              <span>Apply (Enter)</span>
            </button>
            <button
              type="button"
              onClick={revertFloatingSelection}
              className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
              title="Revert to original position (Esc)"
            >
              Revert (Esc)
            </button>
          </div>
        )}

        {/* Interactive Brush Reticle Overlay when drawing */}
        {cursorPos && !armedStencil && !activeStencil && !floatingSelection && activeTool !== 'move' && (
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
          <span className="font-medium">
            {activeTool === 'move'
              ? 'Move Tool (Drag marquee to reposition)'
              : armedStencil
              ? `Placing ${STENCIL_CONFIGS[armedStencil].title}`
              : activeStencil
              ? `Positioning ${STENCIL_CONFIGS[activeStencil.type].title}`
              : 'Interactive Canvas (1400×920)'}
          </span>
        </div>
      </div>
    </div>
  );
};
