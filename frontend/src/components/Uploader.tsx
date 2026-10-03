import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, X } from 'lucide-react';

interface UploaderProps {
  selectedFile: File | null;
  previewUrl: string | null;
  onFileSelect: (file: File | null, url: string | null) => void;
  onLoadSample: () => void;
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
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {previewUrl ? (
        <div className="relative group rounded-2xl border border-slate-700/80 bg-slate-900/60 p-3 overflow-hidden shadow-lg backdrop-blur-sm">
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
            <img
              src={previewUrl}
              alt="Wireframe preview"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="mt-3 flex items-center justify-between px-1">
            <div className="flex items-center space-x-2 text-xs text-slate-300 truncate max-w-[200px]">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">{selectedFile?.name || 'sample_wireframe.png'}</span>
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
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
              : 'border-slate-700 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/80'
          }`}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
            <UploadCloud className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-200">
            Drop your wireframe or napkin sketch
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            PNG, JPG, or WEBP up to 10MB
          </p>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-xs text-slate-500 font-mono">or click to browse</span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLoadSample();
              }}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Use Sample Sketch
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
