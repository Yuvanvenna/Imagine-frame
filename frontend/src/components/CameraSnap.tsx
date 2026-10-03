import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CameraSnapProps {
  onCapture: (file: File, dataUrl: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export const CameraSnap: React.FC<CameraSnapProps> = ({ onCapture, disabled }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    setIsInitializing(true);
    setCameraError(null);

    // Stop existing stream if running
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsInitializing(false);
    } catch (err: any) {
      console.warn('Camera request failed with facingMode, falling back to basic video', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play();
        }
        setIsInitializing(false);
      } catch (fallbackErr: any) {
        setCameraError(
          fallbackErr.message || 'Camera permission denied or no camera device found on this system.'
        );
        setIsInitializing(false);
      }
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const takePhoto = () => {
    if (!videoRef.current || disabled) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'napkin_snap.jpg', { type: 'image/jpeg' });
        setCapturedPreview(dataUrl);
        onCapture(file, dataUrl);
      }
    }, 'image/jpeg');
  };

  const retakePhoto = () => {
    setCapturedPreview(null);
  };

  return (
    <div className="relative rounded-2xl border-2 border-slate-700/80 bg-slate-950 overflow-hidden shadow-2xl flex flex-col items-center justify-center min-h-[520px] sm:min-h-[580px] lg:min-h-[640px]">
      {cameraError ? (
        <div className="p-8 text-center max-w-md space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Camera Unavailable</h3>
            <p className="text-xs text-slate-400 mt-1">{cameraError}</p>
          </div>
          <p className="text-xs text-slate-500">
            Tip: You can use the <strong>Upload</strong> tab to select the authentic Napkin or Whiteboard photos, or use the <strong>Draw</strong> canvas!
          </p>
        </div>
      ) : capturedPreview ? (
        /* Preview of snapped photo */
        <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
          <div className="relative max-h-[520px] w-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
            <img src={capturedPreview} alt="Snapped Napkin" className="w-full h-full object-contain" />
            <div className="absolute top-3 left-3 flex items-center space-x-2 bg-emerald-500/90 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Napkin Sketch Snapped</span>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-3">
            <button
              type="button"
              onClick={retakePhoto}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retake Photo</span>
            </button>
          </div>
        </div>
      ) : (
        /* Live Viewfinder */
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover min-h-[520px] sm:min-h-[580px] lg:min-h-[640px]"
          />

          {isInitializing && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Initializing camera stream...</p>
            </div>
          )}

          {/* Guide Reticle Overlay */}
          <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-indigo-400/50 rounded-2xl pointer-events-none flex flex-col justify-between p-4 shadow-inner">
            <div className="flex justify-between items-start">
              <span className="bg-slate-950/80 text-indigo-300 text-[11px] px-2.5 py-1 rounded-md font-mono border border-indigo-500/30">
                Align napkin or whiteboard sketch
              </span>
              <button
                type="button"
                onClick={toggleFacingMode}
                className="pointer-events-auto p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
                title="Switch Camera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center">
              <span className="bg-slate-950/80 text-slate-400 text-[11px] px-3 py-1 rounded-full border border-slate-800">
                Hold still • Gemma 4 infers intent from crooked lines
              </span>
            </div>
          </div>

          {/* Shutter Trigger Button */}
          <div className="absolute bottom-6 inset-x-0 flex items-center justify-center z-20">
            <button
              type="button"
              onClick={takePhoto}
              disabled={disabled || isInitializing}
              className="group p-1.5 rounded-full bg-slate-950/80 border border-white/20 backdrop-blur-md shadow-2xl transition-transform active:scale-90"
              title="Snap Photo"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/40 group-hover:scale-105 transition-transform">
                <Camera className="w-7 h-7 text-white" />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
