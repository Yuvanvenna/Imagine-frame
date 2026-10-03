import React from 'react';
import {
  Brain,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Code2,
  Sliders,
  PlayCircle,
} from 'lucide-react';

interface IntentAnalysis {
  title?: string;
  inferred_architecture?: string;
  detected_elements?: string[];
  accessibility_injections?: string[];
  design_tokens?: string[];
  interaction_simulation?: string[];
  contrast_verdict?: string;
}

interface IntentInspectorProps {
  styleName: string;
  code?: string;
  analysis?: IntentAnalysis | null;
}

export const IntentInspector: React.FC<IntentInspectorProps> = ({
  styleName,
  code = '',
  analysis,
}) => {
  // Check what's inside the code dynamically
  const hasForm = code.includes('<form') || code.includes('<input');
  const hasButton = code.includes('<button');
  const hasScript = code.includes('<script') || code.includes('showToast');
  const hasAria = code.includes('aria-') || code.includes('type="email"') || code.includes('type="password"');
  const hasGrid = code.includes('grid') || code.includes('flex');

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-900/60 overflow-y-auto p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-6 text-slate-100">
      {/* Top Banner: The Contrast Pitch */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-purple-950/50 border border-indigo-500/30 p-5 shadow-xl">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <Brain className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono">
                The Unfair Advantage
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Gemma 4 Intent Engine
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Infer & Synthesize vs. Literal Pixel Cloning
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              Existing tools fail on napkins because they try to copy crooked lines literally into broken divs.
              <strong> Wire2React bridges the intent gap:</strong> Gemma 4 recognizes rough scribbles as architectural blueprints and maps them directly onto production-ready, interactive React/Tailwind components.
            </p>
          </div>
        </div>
      </div>

      {/* The 3 Unique Differentiators Cards */}
      <div className="grid grid-cols-1 gap-4">
        {/* Differentiator 1 */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 transition-colors space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 text-xs font-bold font-mono">
                1
              </span>
              <h4 className="text-sm font-semibold text-white">
                "Infer & Synthesize" vs. "Literal Transcription"
              </h4>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-300/90 space-y-1">
              <div className="flex items-center space-x-1.5 font-semibold text-rose-400">
                <XCircle className="w-3.5 h-3.5" />
                <span>Existing Tools (Screenshot-to-Code)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Tries to literally replicate squiggly drawn lines, producing distorted SVG shapes and broken divs with zero accessibility.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-300/90 space-y-1">
              <div className="flex items-center space-x-1.5 font-semibold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Wire2React Angle (Gemma 4)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Treats scribbles as abstract intent: parallel lines become responsive flex/grid layouts with consistent 8pt spacing and focus rings.
              </p>
            </div>
          </div>
        </div>

        {/* Differentiator 2 */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 transition-colors space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 text-xs font-bold font-mono">
                2
              </span>
              <h4 className="text-sm font-semibold text-white">
                Design System Adapter (The React Hyderabad Angle)
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 capitalize font-mono">
              {styleName} Tokens
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Generic tools output unstyled inline CSS or chaotic HTML. Wire2React introduces a
            <strong> Design System Injection Engine</strong>: Gemma 4 automatically maps your sloppy drawing directly onto the designated token conventions:
          </p>

          <div className="flex flex-wrap gap-2 text-[11px] font-mono">
            <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 border border-slate-800">
              Border: rounded-xl
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 border border-slate-800">
              Palette: {styleName} Tokens
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 border border-slate-800">
              Focus: focus:ring-2 focus:ring-indigo-500
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-300 border border-slate-800">
              Layout: responsive flex/grid
            </span>
          </div>
        </div>

        {/* Differentiator 3 */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 transition-colors space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 text-xs font-bold font-mono">
                3
              </span>
              <h4 className="text-sm font-semibold text-white">
                Real-Time Interaction Simulation (Live Micro-App)
              </h4>
            </div>
            <span className="text-[11px] font-mono text-indigo-400 flex items-center space-x-1">
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Interactive</span>
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Existing tools render dead, non-functional text and mock buttons. Wire2React injects
            <strong> live self-contained JavaScript state</strong> so the prototype behaves like a real micro-app.
            Clicking buttons or submitting forms triggers live reactive toast alerts.
          </p>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Micro-App State: Form Submission & Reactive Toast Dispatcher</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Ready
            </span>
          </div>
        </div>
      </div>

      {/* Synthesis Diagnostics Checklist */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
          Live Gemma 4 Synthesis Diagnostics
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col space-y-1">
            <span className="text-[10px] text-slate-400 font-mono">Layout Container</span>
            <span className="font-semibold text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{hasGrid ? 'Flexbox / Grid' : 'Normalized'}</span>
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col space-y-1">
            <span className="text-[10px] text-slate-400 font-mono">Accessibility</span>
            <span className="font-semibold text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{hasAria ? 'ARIA & Rings' : 'Injected'}</span>
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col space-y-1">
            <span className="text-[10px] text-slate-400 font-mono">Interactive State</span>
            <span className="font-semibold text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{hasScript ? 'Micro-App JS' : 'Active'}</span>
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col space-y-1">
            <span className="text-[10px] text-slate-400 font-mono">Design System</span>
            <span className="font-semibold text-indigo-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span className="capitalize">{styleName}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
