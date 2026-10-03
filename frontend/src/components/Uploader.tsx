import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, X, Coffee, Presentation, LayoutGrid } from 'lucide-react';

interface UploaderProps {
  selectedFile: File | null;
  previewUrl: string | null;
  onFileSelect: (file: File | null, url: string | null) => void;
  onLoadSample: (sampleType?: 'napkin' | 'whiteboard' | 'card') => void;
  disabled?: boolean;
}

export const Uploader: React.FC<UploaderProps> = ({
  selectedFile,
  previewUrl,
  onFileSelect,
  onLoadSample,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        onFileSelect(file, url);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      onFileSelect(file, url);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null, null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {previewUrl ? (
        <div className="relative group rounded-2xl border border-slate-700/80 bg-slate-900/60 p-3 overflow-hidden shadow-lg backdrop-blur-sm min-h-[460px] flex flex-col justify-between">
          <div className="relative flex-1 w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
            <img
              src={previewUrl}
              alt="Wireframe preview"
              className="max-h-[500px] w-full object-contain"
            />
          </div>
          <div className="mt-3 flex items-center justify-between px-1">
            <div className="flex items-center space-x-2 text-xs text-slate-300 truncate max-w-[280px]">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">{selectedFile?.name || 'Selected Wireframe Blueprint'}</span>
            </div>
            <button
              onClick={handleClear}
              disabled={disabled}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 min-h-[340px] flex flex-col items-center justify-center ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
              : 'border-slate-700 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/80'
          }`}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform shadow-lg">
            <UploadCloud className="h-7 w-7" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-200">
            Drop your physical napkin or whiteboard photo
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            PNG, JPG, or WEBP up to 10MB
          </p>

          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-xs text-indigo-400 font-mono">or click to browse local files</span>
          </div>
        </div>
      )}

      {/* 1-Click Physical Napkin & Whiteboard Presets */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Zero-Setup Judge Benchmarks
          </span>
          <span className="text-[10px] text-indigo-400 font-medium">1-Click Load</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Napkin Login */}
          <button
            type="button"
            onClick={() => onLoadSample('napkin')}
            disabled={disabled}
            className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 transition-all text-left group"
          >
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
              <Coffee className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 group-hover:text-white">Coffee Napkin</p>
              <p className="text-[10px] text-slate-400 truncate">Login Auth Blueprint</p>
            </div>
          </button>

          {/* Whiteboard Metrics */}
          <button
            type="button"
            onClick={() => onLoadSample('whiteboard')}
            disabled={disabled}
            className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 transition-all text-left group"
          >
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <Presentation className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 group-hover:text-white">Whiteboard</p>
              <p className="text-[10px] text-slate-400 truncate">Analytics Dashboard</p>
            </div>
          </button>

          {/* Digital Wireframe */}
          <button
            type="button"
            onClick={() => onLoadSample('card')}
            disabled={disabled}
            className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 transition-all text-left group"
          >
            <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
              <LayoutGrid className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 group-hover:text-white">Digital Sketch</p>
              <p className="text-[10px] text-slate-400 truncate">Card Grid & Actions</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
